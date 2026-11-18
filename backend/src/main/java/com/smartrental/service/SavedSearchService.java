package com.smartrental.service;

import com.smartrental.entity.Property;
import com.smartrental.entity.SavedSearch;
import com.smartrental.exception.ApiException;
import com.smartrental.repository.PropertyRepository;
import com.smartrental.repository.SavedSearchRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/** Saved searches and "new home matches your search" alerts. */
@Service
public class SavedSearchService {

    private static final Logger log = LoggerFactory.getLogger(SavedSearchService.class);
    public static final int MAX_PER_USER = 20;

    private final SavedSearchRepository searches;
    private final PropertyRepository properties;
    private final NotificationService notifications;

    public SavedSearchService(SavedSearchRepository searches, PropertyRepository properties, NotificationService notifications) {
        this.searches = searches;
        this.properties = properties;
        this.notifications = notifications;
    }

    public List<SavedSearch> mine(String userId) {
        List<SavedSearch> list = searches.findByUserIdOrderByCreatedAtDesc(userId);
        List<Property> available = properties.findByIsAvailableTrue();
        list.forEach(s -> s.setMatchCount((int) available.stream().filter(p -> matches(s, p)).count()));
        return list;
    }

    @Transactional
    public SavedSearch create(String userId, Map<String, Object> body) {
        if (searches.countByUserId(userId) >= MAX_PER_USER) {
            throw ApiException.badRequest("You can keep up to " + MAX_PER_USER + " saved searches. Delete one first.");
        }
        SavedSearch s = new SavedSearch();
        s.setId(NotificationService.newId("srch"));
        s.setUserId(userId);
        apply(s, body);
        if (s.getName() == null || s.getName().isBlank()) s.setName(describe(s));
        SavedSearch saved = searches.save(s);
        saved.setMatchCount((int) properties.findByIsAvailableTrue().stream().filter(p -> matches(saved, p)).count());
        return saved;
    }

    @Transactional
    public SavedSearch update(String userId, String id, Map<String, Object> body) {
        SavedSearch s = own(userId, id);
        if (body.containsKey("alertsEnabled")) s.setAlertsEnabled(Boolean.TRUE.equals(body.get("alertsEnabled")));
        if (body.get("name") instanceof String n && !n.isBlank()) s.setName(n.trim().length() > 120 ? n.trim().substring(0, 120) : n.trim());
        return searches.save(s);
    }

    @Transactional
    public void delete(String userId, String id) {
        searches.delete(own(userId, id));
    }

    private SavedSearch own(String userId, String id) {
        SavedSearch s = searches.findById(id).orElseThrow(() -> ApiException.notFound("Saved search"));
        if (!s.getUserId().equals(userId)) throw ApiException.forbidden();
        return s;
    }

    /** Called when a listing is published or becomes available again. Notifies each matching search once per home. */
    @Transactional
    public int onListingAvailable(Property p) {
        if (p == null || !Boolean.TRUE.equals(p.getIsAvailable())) return 0;
        int sent = 0;
        for (SavedSearch s : searches.findByAlertsEnabledTrue()) {
            if (s.getUserId().equals(p.getLandlordId()) || !matches(s, p)) continue;
            String price = String.format("%,.0f", p.getMonthlyRent());
            boolean created = notifications.notify(s.getUserId(), "SEARCH_MATCH",
                    "New home for “" + s.getName() + "”",
                    p.getTitle() + " in " + p.getLocationSector() + " · " + price + " RWF/month · " + p.getBedrooms() + " bed",
                    "/properties/" + p.getId(), true, "SEARCH:" + s.getId() + ":" + p.getId());
            if (created) {
                s.setLastAlertAt(LocalDateTime.now());
                searches.save(s);
                sent++;
            }
        }
        if (sent > 0) log.info("Saved-search alerts for {}: {}", p.getId(), sent);
        return sent;
    }

    // ------------------------------------------------------------------ matching

    public static boolean matches(SavedSearch s, Property p) {
        if (!Boolean.TRUE.equals(p.getIsAvailable())) return false;
        double rent = p.getMonthlyRent() == null ? 0 : p.getMonthlyRent();
        if (s.getMaxRent() != null && rent > s.getMaxRent()) return false;
        if (s.getMinRent() != null && rent < s.getMinRent()) return false;
        if (s.getMinBedrooms() != null && (p.getBedrooms() == null || p.getBedrooms() < s.getMinBedrooms())) return false;
        if (s.getPropertyType() != null && !s.getPropertyType().equalsIgnoreCase(p.getPropertyType())) return false;
        if (Boolean.TRUE.equals(s.getFurnished()) && !Boolean.TRUE.equals(p.getIsFurnished())) return false;
        if (Boolean.TRUE.equals(s.getParking()) && !Boolean.TRUE.equals(p.getHasParking())) return false;
        List<String> sectors = csv(s.getSectors());
        if (!sectors.isEmpty() && sectors.stream().noneMatch(x -> x.equalsIgnoreCase(p.getLocationSector()))) return false;
        String amenities = p.getAmenities() == null ? "" : p.getAmenities().toLowerCase();
        for (String a : csv(s.getAmenities())) {
            String key = a.toLowerCase().split("[\\s/&]+")[0];
            if (!amenities.contains(key)) return false;
        }
        return true;
    }

    private static List<String> csv(String s) {
        if (s == null || s.isBlank()) return List.of();
        return Arrays.stream(s.split(",")).map(String::trim).filter(x -> !x.isEmpty()).toList();
    }

    private static String describe(SavedSearch s) {
        List<String> parts = new ArrayList<>();
        if (s.getMinBedrooms() != null && s.getMinBedrooms() > 0) parts.add(s.getMinBedrooms() + "+ bed");
        parts.add(s.getPropertyType() == null ? "homes" : s.getPropertyType().toLowerCase() + "s");
        List<String> where = csv(s.getSectors());
        if (!where.isEmpty()) parts.add("in " + String.join(", ", where));
        else if (s.getDistrict() != null) parts.add("in " + s.getDistrict());
        else if (s.getProvince() != null) parts.add("in " + s.getProvince());
        if (s.getMaxRent() != null) parts.add("under " + String.format("%,.0f", s.getMaxRent()) + " RWF");
        String d = String.join(" ", parts);
        return d.substring(0, 1).toUpperCase() + d.substring(1);
    }

    private static void apply(SavedSearch s, Map<String, Object> b) {
        s.setName(str(b.get("name")));
        Object sectors = b.get("sectors");
        if (sectors instanceof Collection<?> c) {
            s.setSectors(c.stream().map(Object::toString).map(String::trim).filter(x -> !x.isEmpty()).limit(15).collect(Collectors.joining(",")));
        } else {
            s.setSectors(str(sectors));
        }
        s.setProvince(str(b.get("province")));
        s.setDistrict(str(b.get("district")));
        String type = str(b.get("propertyType"));
        s.setPropertyType(type == null ? null : type.toUpperCase());
        s.setMinRent(pos(b.get("minRent")));
        Double max = pos(b.get("maxRent"));
        s.setMaxRent(max != null && max >= 2_000_000 ? null : max); // the UI's "any price" sentinel
        Double beds = pos(b.get("minBedrooms"));
        s.setMinBedrooms(beds == null || beds == 0 ? null : beds.intValue());
        s.setFurnished(Boolean.TRUE.equals(b.get("furnished")) ? Boolean.TRUE : null);
        s.setParking(Boolean.TRUE.equals(b.get("parking")) ? Boolean.TRUE : null);
        Object amen = b.get("amenities");
        if (amen instanceof Collection<?> c) s.setAmenities(c.stream().map(Object::toString).limit(15).collect(Collectors.joining(",")));
        s.setAlertsEnabled(!Boolean.FALSE.equals(b.get("alertsEnabled")));
    }

    private static String str(Object o) {
        if (o == null) return null;
        String s = o.toString().trim();
        return s.isEmpty() ? null : s.length() > 120 ? s.substring(0, 120) : s;
    }

    private static Double pos(Object o) {
        if (o == null) return null;
        try {
            double d = o instanceof Number n ? n.doubleValue() : Double.parseDouble(o.toString());
            return d > 0 ? d : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
