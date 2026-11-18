package com.smartrental.controller;

import com.smartrental.entity.Property;
import com.smartrental.entity.User;
import com.smartrental.entity.ViewingRequest;
import com.smartrental.exception.ApiException;
import com.smartrental.repository.PropertyRepository;
import com.smartrental.repository.UserRepository;
import com.smartrental.security.AuthUser;
import com.smartrental.security.CurrentUser;
import com.smartrental.service.NotificationService;
import com.smartrental.service.ViewingRequestService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/viewing-requests")
public class ViewingRequestController {

    private final ViewingRequestService requestService;
    private final NotificationService notifications;
    private final PropertyRepository properties;
    private final UserRepository users;

    public ViewingRequestController(ViewingRequestService requestService, NotificationService notifications,
                                    PropertyRepository properties, UserRepository users) {
        this.requestService = requestService;
        this.notifications = notifications;
        this.properties = properties;
        this.users = users;
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<ViewingRequest>> getTenantRequests(@PathVariable String tenantId) {
        CurrentUser.requireSelfOrAdmin(tenantId);
        return ResponseEntity.ok(requestService.getRequestsByTenant(tenantId));
    }

    @GetMapping("/landlord/{landlordId}")
    public ResponseEntity<List<ViewingRequest>> getLandlordRequests(@PathVariable String landlordId) {
        CurrentUser.requireSelfOrAdmin(landlordId);
        return ResponseEntity.ok(requestService.getRequestsByLandlord(landlordId));
    }

    @PostMapping
    public ResponseEntity<ViewingRequest> createRequest(@RequestBody ViewingRequest req) {
        AuthUser user = CurrentUser.get();
        Property property = properties.findById(req.getPropertyId() == null ? "" : req.getPropertyId())
                .orElseThrow(() -> ApiException.notFound("Property"));
        if (user.id().equals(property.getLandlordId())) throw ApiException.badRequest("You can’t book a viewing of your own listing");
        if (req.getRequestedDate() == null || req.getRequestedTimeSlot() == null) {
            throw ApiException.badRequest("Choose a date and a time slot");
        }
        User me = users.findById(user.id()).orElseThrow(() -> ApiException.notFound("User"));

        req.setId(null);
        req.setTenantId(me.getId());
        req.setTenantName(me.getFullName());
        req.setTenantEmail(me.getEmail());
        if (req.getTenantPhone() == null) req.setTenantPhone(me.getPhoneNumber());
        req.setLandlordId(property.getLandlordId());
        req.setPropertyTitle(property.getTitle());
        req.setPropertyLocation(property.getLocationSector());
        req.setPropertyRent(property.getMonthlyRent());

        ViewingRequest saved = requestService.createViewingRequest(req);
        notifications.notify(property.getLandlordId(), "VIEWING_REQUESTED",
                "New viewing request for “" + property.getTitle() + "”",
                me.getFullName() + " would like to visit on " + saved.getRequestedDate() + " at " + saved.getRequestedTimeSlot() + ".",
                "/landlord?tab=viewings", true);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /** Landlord can set any status; the tenant who booked may only cancel. */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ViewingRequest> updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        ViewingRequest existing = requestService.findById(id);
        AuthUser user = CurrentUser.get();
        String status = ViewingRequestService.normalizeStatus(body.get("status"));
        boolean isLandlord = user.canActFor(existing.getLandlordId());
        boolean isTenantCancelling = user.id().equals(existing.getTenantId()) && "CANCELLED".equals(status);
        if (!isLandlord && !isTenantCancelling) throw ApiException.forbidden();

        ViewingRequest saved = requestService.updateStatus(id, status, isLandlord ? body.get("landlordNote") : null);
        String when = saved.getRequestedDate() + " at " + saved.getRequestedTimeSlot();
        if (isLandlord && !user.id().equals(saved.getTenantId())) {
            String note = saved.getLandlordNote() != null ? " Note from the landlord: " + saved.getLandlordNote() : "";
            switch (status) {
                case "APPROVED" -> notifications.notify(saved.getTenantId(), "VIEWING_UPDATED",
                        "Viewing approved: " + saved.getPropertyTitle(), "See you on " + when + "." + note, "/dashboard", true);
                case "REJECTED" -> notifications.notify(saved.getTenantId(), "VIEWING_UPDATED",
                        "Viewing declined: " + saved.getPropertyTitle(),
                        "The landlord can’t do " + when + "." + note + " Try another time or message them.", "/dashboard", true);
                case "COMPLETED" -> notifications.notify(saved.getTenantId(), "VIEWING_UPDATED",
                        "How was your visit to " + saved.getPropertyTitle() + "?", "Message the landlord if you’d like to move forward.", "/messages", false);
                default -> { }
            }
        } else if (isTenantCancelling) {
            notifications.notify(saved.getLandlordId(), "VIEWING_UPDATED",
                    "Viewing cancelled: " + saved.getPropertyTitle(), saved.getTenantName() + " cancelled the visit on " + when + ".",
                    "/landlord?tab=viewings", true);
        }
        return ResponseEntity.ok(saved);
    }
}
