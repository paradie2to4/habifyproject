package com.smartrental.service;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.core.JsonValue;
import com.anthropic.errors.AnthropicServiceException;
import com.anthropic.errors.RateLimitException;
import com.anthropic.models.beta.messages.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartrental.entity.*;
import com.smartrental.exception.ApiException;
import com.smartrental.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Habify Assist on Claude. Claude answers in plain language and uses tools that read Habify's real
 * listings and the signed-in user's own activity, so it never invents homes or prices.
 */
@Service
public class AssistantService {

    private static final Logger log = LoggerFactory.getLogger(AssistantService.class);
    private static final int MAX_TOOL_ROUNDS = 5;
    private static final int MAX_MESSAGE_CHARS = 2000;
    private static final int MAX_HISTORY = 12;

    private static final String SYSTEM = """
            You are Habify Assist, the assistant inside Habify, a website for renting homes in Rwanda.
            You help tenants find homes, understand prices and neighborhoods, check what they can afford, and use Habify
            (viewings, messages, saved searches, rent payments with MTN MoMo or Airtel Money, repair requests). You also help
            landlords with their listings.

            How to answer:
            - Use the tools for anything about listings, prices or the user's own activity. Never invent homes, prices,
              landlords or availability. If a tool returns nothing, say so and suggest a wider search.
            - Prices are monthly rent in Rwandan francs; write them like "350,000 RWF".
            - When you mention specific homes from a tool result, mention each by its title. The website shows them as cards,
              so don't paste ids or links.
            - A comfortable rent is at most 30% of monthly income; say so when affordability comes up.
            - Keep answers short and friendly: two to five sentences, or a short list. Match the user's language
              (English, French or Kinyarwanda).
            - Habify can't sign leases or move money for people from this chat; explain where in the app to do it.
            - Stay on housing and Habify. For anything else, say briefly that you can only help with homes and Habify.
            """;

    private final PropertyRepository properties;
    private final LeaseRepository leases;
    private final ViewingRequestRepository viewings;
    private final InquiryRepository inquiries;
    private final ObjectMapper json;
    private final String model;
    private final int maxPerHour;
    private final AnthropicClient client;
    private final Map<String, Deque<Instant>> usage = new ConcurrentHashMap<>();

    public AssistantService(PropertyRepository properties, LeaseRepository leases, ViewingRequestRepository viewings,
                            InquiryRepository inquiries, ObjectMapper json,
                            @Value("${app.assistant.api-key:}") String apiKey,
                            @Value("${app.assistant.model:claude-opus-5-5}") String model,
                            @Value("${app.assistant.max-requests-per-hour:30}") int maxPerHour) {
        this.properties = properties;
        this.leases = leases;
        this.viewings = viewings;
        this.inquiries = inquiries;
        this.json = json;
        this.model = model;
        this.maxPerHour = maxPerHour;
        this.client = apiKey == null || apiKey.isBlank() ? null : AnthropicOkHttpClient.builder().apiKey(apiKey.trim()).build();
        if (client == null) log.info("ANTHROPIC_API_KEY not set — the website will use its built-in assistant.");
    }

    public boolean enabled() {
        return client != null;
    }

    public record Turn(String role, String content) {}

    public record Reply(String reply, List<String> homeIds) {}

    // ------------------------------------------------------------------ chat

    public Reply chat(String callerKey, String userId, String userName, List<Turn> history, String propertyId) {
        if (client == null) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "The AI assistant isn’t switched on");
        rateLimit(callerKey);

        List<Turn> turns = clean(history);
        if (turns.isEmpty()) throw ApiException.badRequest("Ask a question first");

        MessageCreateParams.Builder base = MessageCreateParams.builder()
                .model(model)
                .maxTokens(4096L)
                .system(SYSTEM)
                // Chat doesn't need deep reasoning; keep replies quick and cheap
                .outputConfig(BetaOutputConfig.builder().effort(BetaOutputConfig.Effort.LOW).build())
                // System prompt and tools never change, so cache them across requests
                .cacheControl(BetaCacheControlEphemeral.builder().build())
                // If the model declines, let the API retry on a fallback model in the same call
                .addBeta("server-side-fallback-2026-07-01")
                .fallbacks(BetaFallbacksParam.ofDefault());
        tools(userId != null).forEach(base::addTool);

        List<BetaMessageParam> messages = new ArrayList<>();
        for (int i = 0; i < turns.size(); i++) {
            Turn t = turns.get(i);
            String text = t.content();
            if (i == turns.size() - 1) {
                // Per-request context goes into the latest user turn so the cached prefix stays stable
                StringBuilder ctx = new StringBuilder();
                if (userName != null) ctx.append("Signed-in user: ").append(userName.split(" ")[0]).append(". ");
                else ctx.append("The user is not signed in. ");
                if (propertyId != null) properties.findById(propertyId).ifPresent(p ->
                        ctx.append("They are looking at the home “").append(p.getTitle()).append("” (id ").append(p.getId()).append("). "));
                text = "[" + ctx.toString().trim() + "]\n" + text;
            }
            messages.add("assistant".equals(t.role()) ? BetaMessageParam.ofAssistant(text) : BetaMessageParam.ofUser(text));
        }

        LinkedHashSet<String> homeIds = new LinkedHashSet<>();
        try {
            for (int round = 0; round <= MAX_TOOL_ROUNDS; round++) {
                MessageCreateParams.Builder req = base.build().toBuilder();
                messages.forEach(req::addMessage);
                BetaMessage res = client.beta().messages().create(req.build());

                BetaStopReason stop = res.stopReason().orElse(BetaStopReason.END_TURN);
                if (BetaStopReason.REFUSAL.equals(stop)) {
                    return new Reply("I can’t help with that one, but I’m happy to help you find a home or answer questions about Habify.", List.of());
                }
                List<BetaToolUseBlock> calls = res.content().stream().flatMap(b -> b.toolUse().stream()).toList();
                if (!BetaStopReason.TOOL_USE.equals(stop) || calls.isEmpty()) {
                    String text = res.content().stream().flatMap(b -> b.text().stream()).map(BetaTextBlock::text)
                            .collect(Collectors.joining("\n")).trim();
                    if (text.isEmpty()) text = "Sorry, I didn’t catch that. Could you rephrase?";
                    return new Reply(text, homeIds.stream().limit(6).toList());
                }

                // Keep the full assistant turn (tool calls included), then answer every call in one user message
                messages.add(res.toParam());
                List<BetaContentBlockParam> results = new ArrayList<>();
                for (BetaToolUseBlock call : calls) {
                    String output;
                    boolean error = false;
                    try {
                        output = runTool(call.name(), json.readTree(json.writeValueAsString(call._input())), userId, homeIds);
                    } catch (ApiException e) {
                        output = e.getMessage();
                        error = true;
                    } catch (Exception e) {
                        output = "Tool failed: " + e.getMessage();
                        error = true;
                    }
                    results.add(BetaContentBlockParam.ofToolResult(BetaToolResultBlockParam.builder()
                            .toolUseId(call.id()).content(output).isError(error).build()));
                }
                messages.add(BetaMessageParam.ofUserOfContentBlockParams(results));
            }
            return new Reply("That took more steps than I expected. Could you narrow the question down a little?", homeIds.stream().limit(6).toList());
        } catch (RateLimitException e) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "The assistant is busy right now. Please try again in a minute.");
        } catch (AnthropicServiceException e) {
            log.warn("Claude API error {}: {}", e.statusCode(), e.getMessage());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "The assistant couldn’t answer just now. Please try again.");
        }
    }

    private static List<Turn> clean(List<Turn> history) {
        if (history == null) return List.of();
        List<Turn> out = new ArrayList<>();
        for (Turn t : history) {
            if (t == null || t.content() == null || t.content().isBlank()) continue;
            String role = "assistant".equals(t.role()) ? "assistant" : "user";
            String text = t.content().trim();
            if (text.length() > MAX_MESSAGE_CHARS) text = text.substring(0, MAX_MESSAGE_CHARS);
            out.add(new Turn(role, text));
        }
        // Keep the latest turns, starting with a user turn and ending with one
        if (out.size() > MAX_HISTORY) out = out.subList(out.size() - MAX_HISTORY, out.size());
        while (!out.isEmpty() && !"user".equals(out.get(0).role())) out = out.subList(1, out.size());
        if (!out.isEmpty() && !"user".equals(out.get(out.size() - 1).role())) return List.of();
        return out;
    }

    private void rateLimit(String key) {
        Deque<Instant> q = usage.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (q) {
            Instant cutoff = Instant.now().minusSeconds(3600);
            while (!q.isEmpty() && q.peekFirst().isBefore(cutoff)) q.pollFirst();
            if (q.size() >= maxPerHour) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "You’ve asked a lot of questions this hour. Please try again a bit later.");
            }
            q.addLast(Instant.now());
        }
    }

    // ------------------------------------------------------------------ tools

    private static BetaTool tool(String name, String description, Map<String, Object> props, List<String> required) {
        BetaTool.InputSchema.Properties.Builder p = BetaTool.InputSchema.Properties.builder();
        props.forEach((k, v) -> p.putAdditionalProperty(k, JsonValue.from(v)));
        return BetaTool.builder()
                .name(name)
                .description(description)
                .inputSchema(BetaTool.InputSchema.builder().properties(p.build()).required(required).build())
                .build();
    }

    private static List<BetaTool> tools(boolean signedIn) {
        List<BetaTool> list = new ArrayList<>();
        list.add(tool("search_homes",
                "Search available rental homes on Habify. Every filter is optional; leave out what the user didn't ask for. "
                        + "Returns up to 6 best matches with id, title, sector, district, rent, bedrooms, type and key amenities.",
                Map.of(
                        "max_rent", Map.of("type", "number", "description", "Maximum monthly rent in RWF"),
                        "min_rent", Map.of("type", "number", "description", "Minimum monthly rent in RWF"),
                        "min_bedrooms", Map.of("type", "integer", "description", "Minimum number of bedrooms"),
                        "property_type", Map.of("type", "string", "enum", List.of("APARTMENT", "HOUSE", "VILLA", "STUDIO", "TOWNHOUSE", "DUPLEX")),
                        "places", Map.of("type", "array", "items", Map.of("type", "string"),
                                "description", "Neighborhoods, districts or cities, e.g. Kimihurura, Gasabo, Musanze"),
                        "furnished", Map.of("type", "boolean"),
                        "parking", Map.of("type", "boolean"),
                        "amenities", Map.of("type", "array", "items", Map.of("type", "string"),
                                "description", "Must-have features, e.g. generator, water tank, wifi, garden, pool, security")),
                List.of()));
        list.add(tool("get_home",
                "Full details of one home by id: description, all amenities, deposit, size, landlord name, availability.",
                Map.of("home_id", Map.of("type", "string")), List.of("home_id")));
        list.add(tool("area_prices",
                "Rent statistics for a neighborhood or district from Habify's current listings: number of homes, average, lowest and highest rent.",
                Map.of("place", Map.of("type", "string")), List.of("place")));
        list.add(tool("check_affordability",
                "Compare a monthly rent with a monthly income using the 30% rule.",
                Map.of("monthly_income", Map.of("type", "number"), "monthly_rent", Map.of("type", "number")),
                List.of("monthly_income", "monthly_rent")));
        if (signedIn) {
            list.add(tool("my_activity",
                    "The signed-in user's own activity: upcoming viewings, conversations with replies or unread messages, and their lease with rent status.",
                    Map.of(), List.of()));
        }
        return list;
    }

    private String runTool(String name, JsonNode in, String userId, Set<String> homeIds) throws Exception {
        return switch (name) {
            case "search_homes" -> searchHomes(in, homeIds);
            case "get_home" -> getHome(in.path("home_id").asText(), homeIds);
            case "area_prices" -> areaPrices(in.path("place").asText());
            case "check_affordability" -> affordability(in.path("monthly_income").asDouble(), in.path("monthly_rent").asDouble());
            case "my_activity" -> myActivity(userId);
            default -> throw ApiException.badRequest("Unknown tool " + name);
        };
    }

    private static String fmt(Double d) {
        return d == null ? "?" : String.format("%,.0f", d);
    }

    private static boolean placeMatches(Property p, String place) {
        String q = place.toLowerCase().trim();
        if (q.isEmpty()) return true;
        return (p.getLocationSector() != null && p.getLocationSector().toLowerCase().contains(q))
                || (p.getAddress() != null && p.getAddress().toLowerCase().contains(q))
                || (q.equals("kigali") && p.getAddress() != null && p.getAddress().toLowerCase().contains("kigali"));
    }

    private String searchHomes(JsonNode in, Set<String> homeIds) throws Exception {
        Double maxRent = in.hasNonNull("max_rent") ? in.get("max_rent").asDouble() : null;
        Double minRent = in.hasNonNull("min_rent") ? in.get("min_rent").asDouble() : null;
        Integer beds = in.hasNonNull("min_bedrooms") ? in.get("min_bedrooms").asInt() : null;
        String type = in.hasNonNull("property_type") ? in.get("property_type").asText() : null;
        List<String> places = new ArrayList<>();
        in.path("places").forEach(n -> places.add(n.asText()));
        List<String> amenities = new ArrayList<>();
        in.path("amenities").forEach(n -> amenities.add(n.asText().toLowerCase()));
        Boolean furnished = in.hasNonNull("furnished") ? in.get("furnished").asBoolean() : null;
        Boolean parking = in.hasNonNull("parking") ? in.get("parking").asBoolean() : null;

        List<Property> found = properties.findByIsAvailableTrue().stream()
                .filter(p -> maxRent == null || p.getMonthlyRent() <= maxRent)
                .filter(p -> minRent == null || p.getMonthlyRent() >= minRent)
                .filter(p -> beds == null || (p.getBedrooms() != null && p.getBedrooms() >= beds))
                .filter(p -> type == null || type.equalsIgnoreCase(p.getPropertyType()))
                .filter(p -> furnished == null || furnished.equals(Boolean.TRUE.equals(p.getIsFurnished())))
                .filter(p -> !Boolean.TRUE.equals(parking) || Boolean.TRUE.equals(p.getHasParking()))
                .filter(p -> places.isEmpty() || places.stream().anyMatch(pl -> placeMatches(p, pl)))
                .filter(p -> amenities.stream().allMatch(a -> p.getAmenities() != null && p.getAmenities().toLowerCase().contains(a.split(" ")[0])))
                .sorted(Comparator.comparing(Property::getMonthlyRent))
                .limit(6)
                .toList();
        found.forEach(p -> homeIds.add(p.getId()));
        List<Map<String, Object>> rows = found.stream().map(p -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", p.getId());
            m.put("title", p.getTitle());
            m.put("sector", p.getLocationSector());
            m.put("monthly_rent_rwf", p.getMonthlyRent());
            m.put("bedrooms", p.getBedrooms());
            m.put("type", p.getPropertyType());
            m.put("furnished", p.getIsFurnished());
            m.put("amenities", p.getAmenities() == null ? "" : String.join(", ", Arrays.stream(p.getAmenities().split(",")).limit(5).toList()));
            return m;
        }).toList();
        return json.writeValueAsString(Map.of("count", rows.size(), "homes", rows));
    }

    private String getHome(String id, Set<String> homeIds) throws Exception {
        Property p = properties.findById(id).orElseThrow(() -> ApiException.notFound("Home " + id));
        homeIds.add(p.getId());
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("title", p.getTitle());
        m.put("available", p.getIsAvailable());
        m.put("sector", p.getLocationSector());
        m.put("address", p.getAddress());
        m.put("monthly_rent_rwf", p.getMonthlyRent());
        m.put("deposit_rwf", p.getSecurityDeposit());
        m.put("type", p.getPropertyType());
        m.put("bedrooms", p.getBedrooms());
        m.put("bathrooms", p.getBathrooms());
        m.put("size_sqm", p.getSizeSqm());
        m.put("furnished", p.getIsFurnished());
        m.put("parking", p.getHasParking());
        m.put("amenities", p.getAmenities());
        m.put("landlord", p.getLandlordName());
        m.put("description", p.getDescription());
        return json.writeValueAsString(m);
    }

    private String areaPrices(String place) throws Exception {
        List<Property> homes = properties.findByIsAvailableTrue().stream().filter(p -> placeMatches(p, place)).toList();
        if (homes.isEmpty()) return json.writeValueAsString(Map.of("place", place, "count", 0));
        DoubleSummaryStatistics s = homes.stream().mapToDouble(Property::getMonthlyRent).summaryStatistics();
        return json.writeValueAsString(Map.of("place", place, "count", homes.size(),
                "average_rent_rwf", Math.round(s.getAverage()), "lowest_rent_rwf", Math.round(s.getMin()), "highest_rent_rwf", Math.round(s.getMax())));
    }

    private String affordability(double income, double rent) throws Exception {
        if (income <= 0 || rent <= 0) throw ApiException.badRequest("Income and rent must be positive");
        double pct = rent / income * 100;
        String verdict = pct <= 30 ? "comfortable" : pct <= 40 ? "manageable but tight" : pct <= 50 ? "stretched" : "high risk";
        return json.writeValueAsString(Map.of("percent_of_income", Math.round(pct), "verdict", verdict,
                "comfortable_max_rent_rwf", Math.round(income * 0.3), "left_after_rent_rwf", Math.round(income - rent)));
    }

    private String myActivity(String userId) throws Exception {
        if (userId == null) return "{\"signed_in\":false}";
        List<Map<String, Object>> upcoming = viewings.findByTenantIdOrderByCreatedAtDesc(userId).stream()
                .filter(v -> "PENDING".equals(v.getStatus()) || "APPROVED".equals(v.getStatus()))
                .limit(5)
                .map(v -> Map.<String, Object>of("home", v.getPropertyTitle(), "status", v.getStatus(),
                        "when", ViewingCalendarService.pretty(v)))
                .toList();
        List<Map<String, Object>> convos = inquiries.findByTenantIdOrderByCreatedAtDesc(userId).stream().limit(5)
                .map(i -> Map.<String, Object>of("home", i.getPropertyTitle(), "with", Objects.toString(i.getLandlordName(), "landlord"),
                        "landlord_replied", i.getReply() != null))
                .toList();
        List<Map<String, Object>> rent = leases.findByTenantIdOrderByCreatedAtDesc(userId).stream()
                .filter(l -> "ACTIVE".equals(l.getStatus()))
                .map(l -> Map.<String, Object>of("home", l.getPropertyTitle(), "monthly_rent_rwf", l.getMonthlyRent(),
                        "due_day", l.getPaymentDueDay(), "this_month", Objects.toString(l.getPaymentStatus(), "DUE")))
                .toList();
        return json.writeValueAsString(Map.of("viewings", upcoming, "conversations", convos, "leases", rent));
    }
}
