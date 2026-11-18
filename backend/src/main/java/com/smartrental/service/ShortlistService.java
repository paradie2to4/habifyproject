package com.smartrental.service;

import com.smartrental.entity.Property;
import com.smartrental.entity.Shortlist;
import com.smartrental.entity.ShortlistVote;
import com.smartrental.entity.User;
import com.smartrental.exception.ApiException;
import com.smartrental.repository.PropertyRepository;
import com.smartrental.repository.ShortlistRepository;
import com.smartrental.repository.ShortlistVoteRepository;
import com.smartrental.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/** Shareable shortlists and anonymous-but-named voting on them. */
@Service
public class ShortlistService {

    public static final int MAX_HOMES = 20;
    public static final int MAX_LISTS = 20;
    private static final String ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final ShortlistRepository lists;
    private final ShortlistVoteRepository votes;
    private final PropertyRepository properties;
    private final UserRepository users;
    private final NotificationService notifications;
    private final SecureRandom random = new SecureRandom();

    public ShortlistService(ShortlistRepository lists, ShortlistVoteRepository votes, PropertyRepository properties,
                            UserRepository users, NotificationService notifications) {
        this.lists = lists;
        this.votes = votes;
        this.properties = properties;
        this.users = users;
        this.notifications = notifications;
    }

    private String token() {
        StringBuilder sb = new StringBuilder(22);
        for (int i = 0; i < 22; i++) sb.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
        return sb.toString();
    }

    private static List<String> ids(Shortlist s) {
        if (s.getPropertyIds() == null || s.getPropertyIds().isBlank()) return List.of();
        return Arrays.stream(s.getPropertyIds().split(",")).map(String::trim).filter(x -> !x.isEmpty()).toList();
    }

    private String cleanIds(Collection<?> raw) {
        LinkedHashSet<String> unique = raw.stream().map(Object::toString).map(String::trim)
                .filter(x -> !x.isEmpty()).collect(Collectors.toCollection(LinkedHashSet::new));
        if (unique.isEmpty()) throw ApiException.badRequest("Add at least one home to the shortlist");
        if (unique.size() > MAX_HOMES) throw ApiException.badRequest("A shortlist can hold up to " + MAX_HOMES + " homes");
        List<String> existing = unique.stream().filter(properties::existsById).toList();
        if (existing.isEmpty()) throw ApiException.badRequest("None of those homes exist any more");
        return String.join(",", existing);
    }

    private Shortlist own(String ownerId, String id) {
        Shortlist s = lists.findById(id).orElseThrow(() -> ApiException.notFound("Shortlist"));
        if (!s.getOwnerId().equals(ownerId)) throw ApiException.forbidden();
        return s;
    }

    // ---------------------------------------------------------------- owner

    public List<Map<String, Object>> mine(String ownerId) {
        return lists.findByOwnerIdOrderByUpdatedAtDesc(ownerId).stream().map(s -> view(s, true)).toList();
    }

    @Transactional
    public Map<String, Object> create(String ownerId, String title, Collection<?> propertyIds) {
        if (lists.countByOwnerId(ownerId) >= MAX_LISTS) throw ApiException.badRequest("You can keep up to " + MAX_LISTS + " shortlists");
        User owner = users.findById(ownerId).orElseThrow(() -> ApiException.notFound("User"));
        Shortlist s = new Shortlist();
        s.setId(NotificationService.newId("sl"));
        s.setOwnerId(ownerId);
        s.setOwnerName(owner.getFullName());
        s.setTitle(title == null || title.isBlank() ? "Homes we’re considering" : title.trim().substring(0, Math.min(title.trim().length(), 120)));
        s.setShareToken(token());
        s.setPropertyIds(cleanIds(propertyIds));
        return view(lists.save(s), true);
    }

    @Transactional
    public Map<String, Object> update(String ownerId, String id, String title, Collection<?> propertyIds) {
        Shortlist s = own(ownerId, id);
        if (title != null && !title.isBlank()) s.setTitle(title.trim().substring(0, Math.min(title.trim().length(), 120)));
        if (propertyIds != null) s.setPropertyIds(cleanIds(propertyIds));
        s.setUpdatedAt(LocalDateTime.now());
        return view(lists.save(s), true);
    }

    /** New link: anyone holding the old one loses access. */
    @Transactional
    public Map<String, Object> rotateLink(String ownerId, String id) {
        Shortlist s = own(ownerId, id);
        s.setShareToken(token());
        return view(lists.save(s), true);
    }

    @Transactional
    public void delete(String ownerId, String id) {
        Shortlist s = own(ownerId, id);
        votes.deleteByShortlistId(s.getId());
        lists.delete(s);
    }

    // ---------------------------------------------------------------- public

    public Map<String, Object> publicView(String token) {
        return view(byToken(token), false);
    }

    private Shortlist byToken(String token) {
        if (token == null || token.length() < 16) throw ApiException.notFound("Shortlist");
        return lists.findByShareToken(token).orElseThrow(() -> ApiException.notFound("Shortlist"));
    }

    @Transactional
    public Map<String, Object> vote(String token, String propertyId, String voterKey, String voterName, int value, String comment) {
        Shortlist s = byToken(token);
        if (!ids(s).contains(propertyId)) throw ApiException.badRequest("That home isn’t on this shortlist");
        if (voterKey == null || voterKey.length() < 16 || voterKey.length() > 64) throw ApiException.badRequest("Missing voter id");
        String name = voterName == null ? "" : voterName.trim();
        if (name.isEmpty()) throw ApiException.badRequest("Add your name so others know who voted");
        if (name.length() > 60) name = name.substring(0, 60);
        if (value < -1 || value > 1) throw ApiException.badRequest("Vote must be 1, 0 or -1");
        String note = comment == null || comment.isBlank() ? null : comment.trim().substring(0, Math.min(comment.trim().length(), 280));

        boolean firstFromVoter = votes.countByShortlistIdAndVoterKey(s.getId(), voterKey) == 0;
        Optional<ShortlistVote> existing = votes.findByShortlistIdAndPropertyIdAndVoterKey(s.getId(), propertyId, voterKey);
        if (value == 0 && note == null) {
            existing.ifPresent(votes::delete);
        } else {
            ShortlistVote v = existing.orElseGet(() -> {
                ShortlistVote n = new ShortlistVote();
                n.setId(NotificationService.newId("vote"));
                n.setShortlistId(s.getId());
                n.setPropertyId(propertyId);
                n.setVoterKey(voterKey);
                return n;
            });
            v.setVoterName(name);
            v.setValue(value);
            v.setComment(note);
            votes.save(v);
        }
        if (firstFromVoter && value != 0) {
            notifications.notify(s.getOwnerId(), "SHORTLIST_VOTE", name + " is voting on “" + s.getTitle() + "”",
                    "See which homes they like on your Saved page.", "/saved", false,
                    "SL_VOTE:" + s.getId() + ":" + voterKey + ":" + LocalDate.now());
        }
        return view(s, false);
    }

    // ---------------------------------------------------------------- shape

    private Map<String, Object> view(Shortlist s, boolean owner) {
        List<String> order = ids(s);
        Map<String, Property> byId = properties.findAllById(order).stream().collect(Collectors.toMap(Property::getId, p -> p));
        Map<String, List<ShortlistVote>> grouped = votes.findByShortlistIdOrderByCreatedAtAsc(s.getId()).stream()
                .collect(Collectors.groupingBy(ShortlistVote::getPropertyId));

        List<Map<String, Object>> homes = new ArrayList<>();
        for (String id : order) {
            Property p = byId.get(id);
            if (p == null) continue;
            List<ShortlistVote> vs = grouped.getOrDefault(id, List.of());
            Map<String, Object> h = new LinkedHashMap<>();
            h.put("id", p.getId());
            h.put("title", p.getTitle());
            h.put("locationSector", p.getLocationSector());
            h.put("monthlyRent", p.getMonthlyRent());
            h.put("bedrooms", p.getBedrooms());
            h.put("bathrooms", p.getBathrooms());
            h.put("sizeSqm", p.getSizeSqm());
            h.put("propertyType", p.getPropertyType());
            h.put("isAvailable", p.getIsAvailable());
            h.put("image", p.getImages() == null ? null : p.getImages().split(",")[0].trim());
            h.put("up", vs.stream().filter(v -> v.getValue() > 0).count());
            h.put("down", vs.stream().filter(v -> v.getValue() < 0).count());
            // Voter keys are never sent back; each voter's own vote is matched in the browser by hashed key
            h.put("votes", vs.stream().map(v -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("name", v.getVoterName());
                m.put("value", v.getValue());
                m.put("comment", v.getComment());
                m.put("key", Integer.toHexString(v.getVoterKey().hashCode()));
                return m;
            }).toList());
            homes.add(h);
        }
        homes.sort(Comparator.comparingLong((Map<String, Object> h) -> (long) h.get("up") - (long) h.get("down")).reversed());

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("title", s.getTitle());
        out.put("ownerName", s.getOwnerName() == null ? "A Habify user" : s.getOwnerName().split(" ")[0]);
        out.put("homes", homes);
        out.put("voters", grouped.values().stream().flatMap(List::stream).map(ShortlistVote::getVoterKey).distinct().count());
        out.put("updatedAt", s.getUpdatedAt());
        if (owner) {
            out.put("id", s.getId());
            out.put("shareToken", s.getShareToken());
        }
        return out;
    }
}
