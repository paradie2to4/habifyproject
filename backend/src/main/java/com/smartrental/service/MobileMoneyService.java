package com.smartrental.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartrental.entity.Lease;
import com.smartrental.entity.RentPayment;
import com.smartrental.exception.ApiException;
import com.smartrental.repository.LeaseRepository;
import com.smartrental.repository.RentPaymentRepository;
import com.smartrental.security.AuthUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;

/**
 * Rent collection with MTN MoMo (Collections API, request-to-pay) and Airtel Money (Collections API).
 * The tenant approves the charge on their phone; the payment becomes VERIFIED only after the provider
 * confirms success, and the receipt is issued automatically.
 *
 * Configuration (environment):
 *  MTN:    MOMO_MTN_SUBSCRIPTION_KEY, MOMO_MTN_API_USER, MOMO_MTN_API_KEY, MOMO_MTN_TARGET_ENV (sandbox | mtnrwanda),
 *          MOMO_MTN_BASE_URL (default sandbox), MOMO_MTN_CURRENCY (sandbox only accepts EUR; production RWF)
 *  Airtel: AIRTEL_CLIENT_ID, AIRTEL_CLIENT_SECRET, AIRTEL_BASE_URL (default UAT), AIRTEL_COUNTRY (RW), AIRTEL_CURRENCY (RWF)
 *  MOMO_SIMULATE=true approves requests automatically after a few seconds — local testing only, never in production.
 */
@Service
public class MobileMoneyService {

    private static final Logger log = LoggerFactory.getLogger(MobileMoneyService.class);
    public static final String MTN = "MTN";
    public static final String AIRTEL = "AIRTEL";

    private final RentPaymentRepository payments;
    private final LeaseRepository leases;
    private final TenancyService tenancy;
    private final NotificationService notifications;
    private final ObjectMapper json;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    private final String mtnBase, mtnKey, mtnUser, mtnApiKey, mtnEnv, mtnCurrency;
    private final String airtelBase, airtelId, airtelSecret, airtelCountry, airtelCurrency;
    private final boolean simulate;

    public MobileMoneyService(RentPaymentRepository payments, LeaseRepository leases, TenancyService tenancy,
                              NotificationService notifications, ObjectMapper json,
                              @Value("${app.momo.mtn.base-url:https://sandbox.momodeveloper.mtn.com}") String mtnBase,
                              @Value("${app.momo.mtn.subscription-key:}") String mtnKey,
                              @Value("${app.momo.mtn.api-user:}") String mtnUser,
                              @Value("${app.momo.mtn.api-key:}") String mtnApiKey,
                              @Value("${app.momo.mtn.target-env:sandbox}") String mtnEnv,
                              @Value("${app.momo.mtn.currency:EUR}") String mtnCurrency,
                              @Value("${app.momo.airtel.base-url:https://openapiuat.airtel.africa}") String airtelBase,
                              @Value("${app.momo.airtel.client-id:}") String airtelId,
                              @Value("${app.momo.airtel.client-secret:}") String airtelSecret,
                              @Value("${app.momo.airtel.country:RW}") String airtelCountry,
                              @Value("${app.momo.airtel.currency:RWF}") String airtelCurrency,
                              @Value("${app.momo.simulate:false}") boolean simulate) {
        this.payments = payments;
        this.leases = leases;
        this.tenancy = tenancy;
        this.notifications = notifications;
        this.json = json;
        this.mtnBase = mtnBase.replaceAll("/+$", "");
        this.mtnKey = mtnKey;
        this.mtnUser = mtnUser;
        this.mtnApiKey = mtnApiKey;
        this.mtnEnv = mtnEnv;
        this.mtnCurrency = mtnCurrency;
        this.airtelBase = airtelBase.replaceAll("/+$", "");
        this.airtelId = airtelId;
        this.airtelSecret = airtelSecret;
        this.airtelCountry = airtelCountry;
        this.airtelCurrency = airtelCurrency;
        this.simulate = simulate;
        if (simulate) log.warn("MOMO_SIMULATE is on — mobile-money payments are approved automatically. Never enable this in production.");
    }

    public boolean mtnConfigured() {
        return !mtnKey.isBlank() && !mtnUser.isBlank() && !mtnApiKey.isBlank();
    }

    public boolean airtelConfigured() {
        return !airtelId.isBlank() && !airtelSecret.isBlank();
    }

    public Map<String, Object> status() {
        return Map.of(
                "mtn", simulate || mtnConfigured(),
                "airtel", simulate || airtelConfigured(),
                "testMode", simulate || "sandbox".equalsIgnoreCase(mtnEnv) && mtnConfigured());
    }

    // ------------------------------------------------------------------ request

    @Transactional
    public RentPayment requestPayment(AuthUser user, String leaseId, String provider, String rawPhone, Double amount, String period) {
        Lease lease = leases.findById(leaseId == null ? "" : leaseId).orElseThrow(() -> ApiException.notFound("Lease"));
        if (!user.id().equals(lease.getTenantId())) throw ApiException.forbidden();
        if (!"ACTIVE".equals(lease.getStatus())) throw ApiException.badRequest("This lease isn’t active");
        String p = provider == null ? "" : provider.trim().toUpperCase();
        if (!MTN.equals(p) && !AIRTEL.equals(p)) throw ApiException.badRequest("Choose MTN MoMo or Airtel Money");
        boolean ready = simulate || (MTN.equals(p) ? mtnConfigured() : airtelConfigured());
        if (!ready) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, (MTN.equals(p) ? "MTN MoMo" : "Airtel Money") + " payments aren’t set up yet");
        if (amount == null || amount <= 0) throw ApiException.badRequest("Enter an amount");
        if (amount > lease.getMonthlyRent() * 12) throw ApiException.badRequest("That’s more than a year of rent — check the amount");
        if (amount != Math.floor(amount)) throw ApiException.badRequest("Use a whole number of francs");
        String msisdn = normalizePhone(rawPhone, p);
        YearMonth ym;
        try {
            ym = period == null ? YearMonth.now(TenancyService.KIGALI) : YearMonth.parse(period);
        } catch (Exception e) {
            throw ApiException.badRequest("Period must look like 2026-11");
        }

        RentPayment pay = new RentPayment();
        pay.setId(NotificationService.newId("pay"));
        pay.setReceiptNumber("RW-REC-" + TenancyService.today().toString().replace("-", "") + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        pay.setLeaseId(lease.getId());
        pay.setPropertyId(lease.getPropertyId());
        pay.setPropertyTitle(lease.getPropertyTitle());
        pay.setLandlordId(lease.getLandlordId());
        pay.setLandlordName(lease.getLandlordName());
        pay.setTenantId(lease.getTenantId());
        pay.setTenantName(lease.getTenantName());
        pay.setAmountRwf(amount);
        pay.setPaymentMethod(MTN.equals(p) ? "MTN_MOMO" : "AIRTEL_MONEY");
        pay.setPeriod(ym.toString());
        pay.setPaidForMonth(TenancyService.monthLabel(ym));
        pay.setPaymentDate(TenancyService.today().toString());
        pay.setStatus("PENDING");
        pay.setChannel("MOBILE_MONEY");
        pay.setPayerPhone(msisdn);
        pay.setExternalReference(UUID.randomUUID().toString());
        pay.setTransactionReference(pay.getExternalReference());
        pay.setProviderStatus("REQUESTED");
        payments.save(pay);

        String note = "Rent " + pay.getPaidForMonth();
        try {
            if (simulate) {
                log.info("[momo:simulated] request {} {} RWF from {}", p, amount, msisdn);
            } else if (MTN.equals(p)) {
                mtnRequestToPay(pay, msisdn, note);
            } else {
                airtelRequest(pay, msisdn, note);
            }
        } catch (ApiException e) {
            fail(pay, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.warn("Mobile-money request failed: {}", e.getMessage());
            fail(pay, "The payment provider didn’t respond. Please try again.");
            throw new ApiException(HttpStatus.BAD_GATEWAY, "The payment provider didn’t respond. Please try again.");
        }
        return pay;
    }

    /** Rwanda numbers: MTN starts 078/079, Airtel 072/073. Returns 2507XXXXXXXX. */
    public static String normalizePhone(String raw, String provider) {
        if (raw == null) throw ApiException.badRequest("Enter your mobile-money number");
        String digits = raw.replaceAll("[^0-9]", "");
        if (digits.startsWith("250")) digits = digits.substring(3);
        if (digits.startsWith("0")) digits = digits.substring(1);
        if (!digits.matches("7[2389]\\d{7}")) throw ApiException.badRequest("Enter a Rwandan mobile number like 078 123 4567");
        boolean mtn = digits.startsWith("78") || digits.startsWith("79");
        if (MTN.equals(provider) && !mtn) throw ApiException.badRequest("That’s not an MTN number (MTN numbers start with 078 or 079)");
        if (AIRTEL.equals(provider) && mtn) throw ApiException.badRequest("That’s not an Airtel number (Airtel numbers start with 072 or 073)");
        return "250" + digits;
    }

    // ------------------------------------------------------------------ status

    /** Look up the provider's status for a pending request and settle it. */
    @Transactional
    public RentPayment refresh(AuthUser user, String paymentId) {
        RentPayment pay = payments.findById(paymentId).orElseThrow(() -> ApiException.notFound("Payment"));
        if (!user.canActFor(pay.getTenantId()) && !user.canActFor(pay.getLandlordId())) throw ApiException.forbidden();
        return settle(pay);
    }

    @Transactional
    public RentPayment settle(RentPayment pay) {
        if (!"MOBILE_MONEY".equals(pay.getChannel()) || !"REQUESTED".equals(pay.getProviderStatus())) return pay;
        String state;
        try {
            if (simulate) {
                state = pay.getCreatedAt().plusSeconds(6).isBefore(LocalDateTime.now()) ? "SUCCESSFUL" : "PENDING";
            } else if ("MTN_MOMO".equals(pay.getPaymentMethod())) {
                state = mtnStatus(pay.getExternalReference());
            } else {
                state = airtelStatus(pay.getExternalReference());
            }
        } catch (Exception e) {
            log.warn("Status check for {} failed: {}", pay.getId(), e.getMessage());
            return pay;
        }
        if ("SUCCESSFUL".equals(state)) {
            pay.setProviderStatus("SUCCESSFUL");
            pay.setStatus("VERIFIED");
            payments.save(pay);
            tenancy.applyVerifiedPayment(pay);
            String amount = String.format("%,.0f", pay.getAmountRwf());
            notifications.notify(pay.getTenantId(), "PAYMENT", "Paid · receipt " + pay.getReceiptNumber(),
                    amount + " RWF for " + pay.getPaidForMonth() + " was received through "
                            + ("MTN_MOMO".equals(pay.getPaymentMethod()) ? "MTN MoMo" : "Airtel Money") + ".",
                    "/dashboard", true);
            notifications.notify(pay.getLandlordId(), "PAYMENT", pay.getTenantName() + " paid " + amount + " RWF",
                    "Rent for " + pay.getPaidForMonth() + " (“" + pay.getPropertyTitle() + "”) arrived by mobile money. Receipt " + pay.getReceiptNumber() + ".",
                    "/landlord?tab=leases", true);
        } else if ("FAILED".equals(state)) {
            fail(pay, "The payment was declined or cancelled on the phone.");
        } else if (pay.getCreatedAt().plusMinutes(30).isBefore(LocalDateTime.now())) {
            fail(pay, "The payment wasn’t approved within 30 minutes.");
        }
        return pay;
    }

    /** Settle anything still waiting (runs on a schedule, in case the tenant closed the page). */
    @Transactional
    public int settlePending() {
        int n = 0;
        for (RentPayment p : payments.findAll()) {
            if ("MOBILE_MONEY".equals(p.getChannel()) && "REQUESTED".equals(p.getProviderStatus())) {
                settle(p);
                n++;
            }
        }
        return n;
    }

    private void fail(RentPayment pay, String reason) {
        pay.setProviderStatus("FAILED");
        pay.setStatus("FAILED");
        pay.setFailureReason(reason);
        payments.save(pay);
    }

    // ------------------------------------------------------------------ MTN MoMo (Collections)

    private String mtnToken() throws Exception {
        String basic = Base64.getEncoder().encodeToString((mtnUser + ":" + mtnApiKey).getBytes(StandardCharsets.UTF_8));
        HttpResponse<String> res = http.send(HttpRequest.newBuilder(URI.create(mtnBase + "/collection/token/"))
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Basic " + basic)
                .header("Ocp-Apim-Subscription-Key", mtnKey)
                .POST(HttpRequest.BodyPublishers.noBody())
                .build(), HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() >= 300) throw new IllegalStateException("MTN token HTTP " + res.statusCode());
        return json.readTree(res.body()).path("access_token").asText();
    }

    private void mtnRequestToPay(RentPayment pay, String msisdn, String note) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("amount", String.valueOf(pay.getAmountRwf().longValue()));
        body.put("currency", mtnCurrency);
        body.put("externalId", pay.getId());
        body.put("payer", Map.of("partyIdType", "MSISDN", "partyId", msisdn));
        body.put("payerMessage", note);
        body.put("payeeNote", note + " · " + pay.getPropertyTitle());
        HttpResponse<String> res = http.send(HttpRequest.newBuilder(URI.create(mtnBase + "/collection/v1_0/requesttopay"))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Bearer " + mtnToken())
                .header("X-Reference-Id", pay.getExternalReference())
                .header("X-Target-Environment", mtnEnv)
                .header("Ocp-Apim-Subscription-Key", mtnKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)))
                .build(), HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() != 202) {
            log.warn("MTN requesttopay HTTP {}: {}", res.statusCode(), res.body());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "MTN MoMo couldn’t start the payment. Check the number and try again.");
        }
    }

    private String mtnStatus(String reference) throws Exception {
        HttpResponse<String> res = http.send(HttpRequest.newBuilder(URI.create(mtnBase + "/collection/v1_0/requesttopay/" + reference))
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Bearer " + mtnToken())
                .header("X-Target-Environment", mtnEnv)
                .header("Ocp-Apim-Subscription-Key", mtnKey)
                .GET().build(), HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() >= 300) throw new IllegalStateException("MTN status HTTP " + res.statusCode());
        String s = json.readTree(res.body()).path("status").asText("PENDING");
        return switch (s) {
            case "SUCCESSFUL" -> "SUCCESSFUL";
            case "FAILED", "REJECTED", "TIMEOUT" -> "FAILED";
            default -> "PENDING";
        };
    }

    // ------------------------------------------------------------------ Airtel Money (Collections)

    private String airtelToken() throws Exception {
        String body = json.writeValueAsString(Map.of("client_id", airtelId, "client_secret", airtelSecret, "grant_type", "client_credentials"));
        HttpResponse<String> res = http.send(HttpRequest.newBuilder(URI.create(airtelBase + "/auth/oauth2/token"))
                .timeout(Duration.ofSeconds(15))
                .header("Content-Type", "application/json")
                .header("Accept", "*/*")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build(), HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() >= 300) throw new IllegalStateException("Airtel token HTTP " + res.statusCode());
        return json.readTree(res.body()).path("access_token").asText();
    }

    private void airtelRequest(RentPayment pay, String msisdn, String note) throws Exception {
        Map<String, Object> body = Map.of(
                "reference", note,
                "subscriber", Map.of("country", airtelCountry, "currency", airtelCurrency, "msisdn", msisdn.substring(3)),
                "transaction", Map.of("amount", pay.getAmountRwf().longValue(), "country", airtelCountry,
                        "currency", airtelCurrency, "id", pay.getExternalReference()));
        HttpResponse<String> res = http.send(HttpRequest.newBuilder(URI.create(airtelBase + "/merchant/v1/payments/"))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Bearer " + airtelToken())
                .header("X-Country", airtelCountry)
                .header("X-Currency", airtelCurrency)
                .header("Content-Type", "application/json")
                .header("Accept", "*/*")
                .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)))
                .build(), HttpResponse.BodyHandlers.ofString());
        JsonNode node = res.body() == null || res.body().isBlank() ? null : json.readTree(res.body());
        boolean ok = res.statusCode() < 300 && node != null && node.path("status").path("success").asBoolean(false);
        if (!ok) {
            log.warn("Airtel payment HTTP {}: {}", res.statusCode(), res.body());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Airtel Money couldn’t start the payment. Check the number and try again.");
        }
    }

    private String airtelStatus(String reference) throws Exception {
        HttpResponse<String> res = http.send(HttpRequest.newBuilder(URI.create(airtelBase + "/standard/v1/payments/" + reference))
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Bearer " + airtelToken())
                .header("X-Country", airtelCountry)
                .header("X-Currency", airtelCurrency)
                .header("Accept", "*/*")
                .GET().build(), HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() >= 300) throw new IllegalStateException("Airtel status HTTP " + res.statusCode());
        String s = json.readTree(res.body()).path("data").path("transaction").path("status").asText("TIP");
        return switch (s) {
            case "TS" -> "SUCCESSFUL";
            case "TF" -> "FAILED";
            default -> "PENDING"; // TIP = in progress, TA = ambiguous: keep checking, never assume failure
        };
    }
}
