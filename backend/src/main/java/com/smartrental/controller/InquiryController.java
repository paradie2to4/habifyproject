package com.smartrental.controller;

import com.smartrental.entity.Inquiry;
import com.smartrental.entity.InquiryMessage;
import com.smartrental.entity.Property;
import com.smartrental.entity.User;
import com.smartrental.exception.ApiException;
import com.smartrental.repository.PropertyRepository;
import com.smartrental.repository.UserRepository;
import com.smartrental.security.AuthUser;
import com.smartrental.security.CurrentUser;
import com.smartrental.service.ConversationService;
import com.smartrental.service.InquiryService;
import com.smartrental.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

/** Conversations between tenants and landlords. An Inquiry is the thread; messages live under it. */
@RestController
@RequestMapping("/api/inquiries")
public class InquiryController {

    private final InquiryService inquiryService;
    private final ConversationService conversations;
    private final NotificationService notifications;
    private final PropertyRepository properties;
    private final UserRepository users;

    public InquiryController(InquiryService inquiryService, ConversationService conversations,
                             NotificationService notifications, PropertyRepository properties, UserRepository users) {
        this.inquiryService = inquiryService;
        this.conversations = conversations;
        this.notifications = notifications;
        this.properties = properties;
        this.users = users;
    }

    private List<Inquiry> withUnread(List<Inquiry> list, String viewerId) {
        list.forEach(i -> i.setUnreadCount(conversations.unreadFor(i, viewerId)));
        list.sort(Comparator.comparing(Inquiry::getLastMessageAt, Comparator.nullsLast(Comparator.reverseOrder())));
        return list;
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<Inquiry>> getTenantInquiries(@PathVariable String tenantId) {
        AuthUser user = CurrentUser.requireSelfOrAdmin(tenantId);
        return ResponseEntity.ok(withUnread(inquiryService.getInquiriesByTenant(tenantId), user.id()));
    }

    @GetMapping("/landlord/{landlordId}")
    public ResponseEntity<List<Inquiry>> getLandlordInquiries(@PathVariable String landlordId) {
        AuthUser user = CurrentUser.requireSelfOrAdmin(landlordId);
        return ResponseEntity.ok(withUnread(inquiryService.getInquiriesByLandlord(landlordId), user.id()));
    }

    /** Start a conversation about a listing. Landlord and listing details come from the server, not the client. */
    @PostMapping
    public ResponseEntity<Inquiry> createInquiry(@RequestBody Inquiry inquiry) {
        AuthUser user = CurrentUser.get();
        Property property = properties.findById(inquiry.getPropertyId() == null ? "" : inquiry.getPropertyId())
                .orElseThrow(() -> ApiException.notFound("Property"));
        if (user.id().equals(property.getLandlordId())) throw ApiException.badRequest("You can’t message yourself about your own listing");
        if (inquiry.getMessage() == null || inquiry.getMessage().isBlank()) throw ApiException.badRequest("Write a message first");

        User me = users.findById(user.id()).orElseThrow(() -> ApiException.notFound("User"));
        inquiry.setId(null);
        inquiry.setTenantId(me.getId());
        inquiry.setTenantName(me.getFullName());
        inquiry.setTenantEmail(me.getEmail());
        inquiry.setLandlordId(property.getLandlordId());
        inquiry.setLandlordName(property.getLandlordName());
        inquiry.setPropertyTitle(property.getTitle());
        inquiry.setPropertyLocation(property.getLocationSector());
        if (inquiry.getSubject() == null || inquiry.getSubject().isBlank()) inquiry.setSubject("About " + property.getTitle());

        Inquiry saved = inquiryService.createInquiry(inquiry);
        conversations.ensureThread(saved);
        notifications.notify(property.getLandlordId(), "NEW_INQUIRY",
                me.getFullName() + " asked about “" + property.getTitle() + "”",
                saved.getMessage().length() > 160 ? saved.getMessage().substring(0, 157) + "…" : saved.getMessage(),
                "/messages?thread=" + saved.getId(), true);
        saved.setUnreadCount(0L);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<InquiryMessage>> messages(@PathVariable String id) {
        return ResponseEntity.ok(conversations.thread(id, CurrentUser.get()));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<InquiryMessage> send(@PathVariable String id, @RequestBody Map<String, String> body) {
        AuthUser user = CurrentUser.get();
        String name = users.findById(user.id()).map(User::getFullName).orElse(null);
        return ResponseEntity.status(HttpStatus.CREATED).body(conversations.send(id, user, name, body.get("body")));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> read(@PathVariable String id) {
        return ResponseEntity.ok(Map.of("updated", conversations.markRead(id, CurrentUser.get())));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Inquiry> updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        requireLandlordOf(id);
        return ResponseEntity.ok(inquiryService.updateStatus(id, body.get("status")));
    }

    /** Kept for older clients: a reply is now just a message from the landlord. */
    @PatchMapping("/{id}/reply")
    public ResponseEntity<Inquiry> reply(@PathVariable String id, @RequestBody Map<String, String> body) {
        requireLandlordOf(id);
        AuthUser user = CurrentUser.get();
        String name = users.findById(user.id()).map(User::getFullName).orElse(null);
        conversations.send(id, user, name, body.get("reply"));
        return ResponseEntity.ok(inquiryService.findById(id));
    }

    private void requireLandlordOf(String inquiryId) {
        Inquiry inquiry = inquiryService.findById(inquiryId);
        if (!CurrentUser.get().canActFor(inquiry.getLandlordId())) throw ApiException.forbidden();
    }
}
