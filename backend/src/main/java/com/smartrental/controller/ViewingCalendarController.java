package com.smartrental.controller;

import com.smartrental.entity.ViewingAvailability;
import com.smartrental.entity.ViewingRequest;
import com.smartrental.exception.ApiException;
import com.smartrental.repository.ViewingRequestRepository;
import com.smartrental.security.AuthUser;
import com.smartrental.security.CurrentUser;
import com.smartrental.service.EmailService;
import com.smartrental.service.ViewingCalendarService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/** Landlord viewing hours, bookable slots, rescheduling and calendar files. */
@RestController
public class ViewingCalendarController {

    private final ViewingCalendarService calendar;
    private final ViewingRequestRepository viewings;
    private final EmailService email;

    public ViewingCalendarController(ViewingCalendarService calendar, ViewingRequestRepository viewings, EmailService email) {
        this.calendar = calendar;
        this.viewings = viewings;
        this.email = email;
    }

    @GetMapping("/api/availability")
    public ResponseEntity<Map<String, Object>> mySchedule() {
        AuthUser user = CurrentUser.get();
        if (!user.isLandlord() && !user.isAdmin()) throw ApiException.forbidden();
        List<ViewingAvailability> rows = calendar.scheduleFor(user.id());
        return ResponseEntity.ok(Map.of(
                "custom", calendar.hasCustomSchedule(user.id()),
                "slotMinutes", rows.isEmpty() ? 60 : rows.get(0).getSlotMinutes(),
                "windows", rows));
    }

    @SuppressWarnings("unchecked")
    @PutMapping("/api/availability")
    public ResponseEntity<Map<String, Object>> saveSchedule(@RequestBody Map<String, Object> body) {
        AuthUser user = CurrentUser.get();
        if (!user.isLandlord() && !user.isAdmin()) throw ApiException.forbidden();
        Object w = body.get("windows");
        if (!(w instanceof List<?>)) throw ApiException.badRequest("windows is required");
        int slot = body.get("slotMinutes") instanceof Number n ? n.intValue() : 60;
        List<ViewingAvailability> rows = calendar.replaceSchedule(user.id(), (List<Map<String, Object>>) w, slot);
        return ResponseEntity.ok(Map.of("custom", !rows.isEmpty(), "slotMinutes", slot, "windows", rows));
    }

    /** Public: anyone can see when a home can be visited. */
    @GetMapping("/api/properties/{id}/viewing-slots")
    public ResponseEntity<List<ViewingCalendarService.Day>> slots(@PathVariable String id,
                                                                 @RequestParam(defaultValue = "14") int days,
                                                                 @RequestParam(required = false) String reschedule) {
        return ResponseEntity.ok(calendar.slotsForProperty(id, days, reschedule));
    }

    @PatchMapping("/api/viewing-requests/{id}/reschedule")
    public ResponseEntity<ViewingRequest> reschedule(@PathVariable String id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(calendar.reschedule(id, CurrentUser.get(), body.get("requestedDate"), body.get("requestedTimeSlot"), body.get("note")));
    }

    @GetMapping("/api/viewing-requests/{id}/calendar.ics")
    public ResponseEntity<byte[]> ics(@PathVariable String id) {
        ViewingRequest v = viewings.findById(id).orElseThrow(() -> ApiException.notFound("Viewing request"));
        AuthUser user = CurrentUser.get();
        if (!user.canActFor(v.getTenantId()) && !user.canActFor(v.getLandlordId())) throw ApiException.forbidden();
        byte[] body = calendar.ics(v, email.appUrl("")).getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/calendar; charset=utf-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"habify-viewing-" + id + ".ics\"")
                .body(body);
    }
}
