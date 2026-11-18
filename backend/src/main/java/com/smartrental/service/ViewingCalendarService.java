package com.smartrental.service;

import com.smartrental.entity.Property;
import com.smartrental.entity.ViewingAvailability;
import com.smartrental.entity.ViewingRequest;
import com.smartrental.exception.ApiException;
import com.smartrental.repository.PropertyRepository;
import com.smartrental.repository.ViewingAvailabilityRepository;
import com.smartrental.repository.ViewingRequestRepository;
import com.smartrental.security.AuthUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Landlord availability, bookable slots, rescheduling, calendar files and viewing reminders. */
@Service
public class ViewingCalendarService {

    public static final ZoneId KIGALI = ZoneId.of("Africa/Kigali");
    private static final Set<String> ACTIVE = Set.of("PENDING", "APPROVED");
    private static final Pattern TIME = Pattern.compile("(\\d{1,2}):(\\d{2})\\s*(?:-\\s*\\d{1,2}:\\d{2}\\s*)?(AM|PM)?", Pattern.CASE_INSENSITIVE);

    private final ViewingAvailabilityRepository availability;
    private final ViewingRequestRepository viewings;
    private final PropertyRepository properties;
    private final NotificationService notifications;

    public ViewingCalendarService(ViewingAvailabilityRepository availability, ViewingRequestRepository viewings,
                                  PropertyRepository properties, NotificationService notifications) {
        this.availability = availability;
        this.viewings = viewings;
        this.properties = properties;
        this.notifications = notifications;
    }

    // ---------------------------------------------------------------- availability

    /** A landlord who hasn't set hours yet gets Monday–Saturday 09:00–17:00 in hourly slots. */
    public List<ViewingAvailability> scheduleFor(String landlordId) {
        List<ViewingAvailability> rows = availability.findByLandlordIdOrderByDayOfWeekAscStartTimeAsc(landlordId);
        if (!rows.isEmpty()) return rows;
        List<ViewingAvailability> defaults = new ArrayList<>();
        for (int d = 1; d <= 6; d++) defaults.add(window(landlordId, d, "09:00", "17:00", 60));
        return defaults;
    }

    public boolean hasCustomSchedule(String landlordId) {
        return !availability.findByLandlordIdOrderByDayOfWeekAscStartTimeAsc(landlordId).isEmpty();
    }

    @Transactional
    public List<ViewingAvailability> replaceSchedule(String landlordId, List<Map<String, Object>> windows, int slotMinutes) {
        if (slotMinutes != 30 && slotMinutes != 45 && slotMinutes != 60 && slotMinutes != 90) {
            throw ApiException.badRequest("Slot length must be 30, 45, 60 or 90 minutes");
        }
        if (windows.size() > 28) throw ApiException.badRequest("Too many time windows");
        List<ViewingAvailability> rows = new ArrayList<>();
        for (Map<String, Object> w : windows) {
            int day = ((Number) Optional.ofNullable(w.get("dayOfWeek")).orElse(0)).intValue();
            String start = String.valueOf(w.get("startTime"));
            String end = String.valueOf(w.get("endTime"));
            if (day < 1 || day > 7) throw ApiException.badRequest("Day must be 1 (Monday) to 7 (Sunday)");
            LocalTime s = parseHm(start), e = parseHm(end);
            if (!e.isAfter(s) || Duration.between(s, e).toMinutes() < slotMinutes) {
                throw ApiException.badRequest("Each window must be at least one slot long (" + start + "–" + end + ")");
            }
            rows.add(window(landlordId, day, s.toString(), e.toString(), slotMinutes));
        }
        availability.deleteByLandlordId(landlordId);
        availability.flush();
        return availability.saveAll(rows);
    }

    private static ViewingAvailability window(String landlordId, int day, String start, String end, int slot) {
        ViewingAvailability a = new ViewingAvailability();
        a.setId(NotificationService.newId("avail"));
        a.setLandlordId(landlordId);
        a.setDayOfWeek(day);
        a.setStartTime(start);
        a.setEndTime(end);
        a.setSlotMinutes(slot);
        return a;
    }

    private static LocalTime parseHm(String s) {
        try {
            return LocalTime.parse(s.length() == 4 ? "0" + s : s);
        } catch (Exception e) {
            throw ApiException.badRequest("Times must look like 09:00");
        }
    }

    // ---------------------------------------------------------------- slots

    public record Slot(String time, boolean available) {}

    public record Day(String date, String label, List<Slot> slots) {}

    /** Bookable slots for the next {@code days} days. {@code ignoreViewingId} lets a booking keep its own slot when rescheduling. */
    public List<Day> slotsForProperty(String propertyId, int days, String ignoreViewingId) {
        Property p = properties.findById(propertyId).orElseThrow(() -> ApiException.notFound("Property"));
        List<ViewingAvailability> schedule = scheduleFor(p.getLandlordId());

        Set<String> taken = new HashSet<>();
        for (ViewingRequest v : viewings.findByLandlordIdOrderByCreatedAtDesc(p.getLandlordId())) {
            if (!ACTIVE.contains(v.getStatus()) || v.getId().equals(ignoreViewingId)) continue;
            LocalTime t = startTime(v.getRequestedTimeSlot());
            if (t != null) taken.add(v.getRequestedDate() + "T" + t);
        }

        ZonedDateTime now = ZonedDateTime.now(KIGALI);
        // Need at least 2 hours' notice
        ZonedDateTime earliest = now.plusHours(2);
        List<Day> out = new ArrayList<>();
        for (int i = 0; i < Math.min(Math.max(days, 1), 30); i++) {
            LocalDate date = now.toLocalDate().plusDays(i);
            int dow = date.getDayOfWeek().getValue();
            List<Slot> slots = new ArrayList<>();
            for (ViewingAvailability w : schedule) {
                if (w.getDayOfWeek() != dow) continue;
                LocalTime t = LocalTime.parse(w.getStartTime());
                LocalTime end = LocalTime.parse(w.getEndTime());
                while (!t.plusMinutes(w.getSlotMinutes()).isAfter(end)) {
                    boolean future = ZonedDateTime.of(date, t, KIGALI).isAfter(earliest);
                    if (future) slots.add(new Slot(t.toString(), !taken.contains(date + "T" + t)));
                    t = t.plusMinutes(w.getSlotMinutes());
                }
            }
            if (!slots.isEmpty()) {
                slots.sort(Comparator.comparing(Slot::time));
                String label = date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + date.getDayOfMonth() + " "
                        + date.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
                out.add(new Day(date.toString(), label, slots));
            }
        }
        return out;
    }

    /** Throws unless the date/time is an open slot for this listing. */
    public void requireOpenSlot(String propertyId, String date, String time, String ignoreViewingId) {
        LocalTime t = startTime(time);
        if (date == null || t == null) throw ApiException.badRequest("Choose a date and a time slot");
        boolean ok = slotsForProperty(propertyId, 30, ignoreViewingId).stream()
                .filter(d -> d.date().equals(date))
                .flatMap(d -> d.slots().stream())
                .anyMatch(s -> s.available() && s.time().equals(t.toString()));
        if (!ok) throw new ApiException(org.springframework.http.HttpStatus.CONFLICT, "That time isn’t available any more. Please pick another slot.");
    }

    /** Start time from "14:00" or legacy labels like "02:00 - 03:00 PM". */
    public static LocalTime startTime(String slot) {
        if (slot == null) return null;
        Matcher m = TIME.matcher(slot.trim());
        if (!m.find()) return null;
        int h = Integer.parseInt(m.group(1)), min = Integer.parseInt(m.group(2));
        String ampm = m.group(3);
        if (ampm != null) {
            if (ampm.equalsIgnoreCase("PM") && h < 12) h += 12;
            if (ampm.equalsIgnoreCase("AM") && h == 12) h = 0;
        }
        if (h > 23 || min > 59) return null;
        return LocalTime.of(h, min);
    }

    public static ZonedDateTime startOf(ViewingRequest v) {
        LocalTime t = startTime(v.getRequestedTimeSlot());
        if (t == null || v.getRequestedDate() == null) return null;
        try {
            return ZonedDateTime.of(LocalDate.parse(v.getRequestedDate()), t, KIGALI);
        } catch (Exception e) {
            return null;
        }
    }

    // ---------------------------------------------------------------- reschedule

    @Transactional
    public ViewingRequest reschedule(String viewingId, AuthUser user, String date, String time, String note) {
        ViewingRequest v = viewings.findById(viewingId).orElseThrow(() -> ApiException.notFound("Viewing request"));
        boolean landlord = user.canActFor(v.getLandlordId());
        boolean tenant = user.id().equals(v.getTenantId());
        if (!landlord && !tenant) throw ApiException.forbidden();
        if (!ACTIVE.contains(v.getStatus())) throw ApiException.badRequest("Only upcoming viewings can be rescheduled");

        LocalTime t = startTime(time);
        requireOpenSlot(v.getPropertyId(), date, time, v.getId());
        String before = v.getRequestedDate() + " at " + v.getRequestedTimeSlot();
        v.setRequestedDate(date);
        v.setRequestedTimeSlot(t.toString());
        v.setUpdatedAt(LocalDateTime.now());
        String when = pretty(v);
        if (landlord) {
            // The landlord proposing a time also confirms it
            v.setStatus("APPROVED");
            if (note != null && !note.isBlank()) v.setLandlordNote(note.trim());
            viewings.save(v);
            notifications.notify(v.getTenantId(), "VIEWING_UPDATED", "New time for your viewing: " + v.getPropertyTitle(),
                    "Your landlord moved the visit from " + before + " to " + when + "." + (note != null && !note.isBlank() ? " Note: " + note.trim() : "")
                            + " If it doesn’t suit you, pick another time or cancel.",
                    "/dashboard", true);
        } else {
            v.setStatus("PENDING");
            if (note != null && !note.isBlank()) v.setNotes(note.trim());
            viewings.save(v);
            notifications.notify(v.getLandlordId(), "VIEWING_REQUESTED", v.getTenantName() + " asked to reschedule",
                    "“" + v.getPropertyTitle() + "”: new time " + when + " (was " + before + "). Please confirm.",
                    "/landlord?tab=viewings", true);
        }
        return v;
    }

    public static String pretty(ViewingRequest v) {
        ZonedDateTime z = startOf(v);
        if (z == null) return v.getRequestedDate() + " at " + v.getRequestedTimeSlot();
        return z.format(DateTimeFormatter.ofPattern("EEEE d MMMM 'at' HH:mm", Locale.ENGLISH));
    }

    // ---------------------------------------------------------------- calendar file

    public String ics(ViewingRequest v, String appUrl) {
        ZonedDateTime start = startOf(v);
        if (start == null) throw ApiException.badRequest("This viewing doesn’t have a valid time");
        int minutes = scheduleFor(v.getLandlordId()).stream().map(ViewingAvailability::getSlotMinutes).findFirst().orElse(60);
        DateTimeFormatter f = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'");
        String dtStart = start.withZoneSameInstant(ZoneOffset.UTC).format(f);
        String dtEnd = start.plusMinutes(minutes).withZoneSameInstant(ZoneOffset.UTC).format(f);
        String stamp = ZonedDateTime.now(ZoneOffset.UTC).format(f);
        Property p = properties.findById(v.getPropertyId()).orElse(null);
        String location = p != null ? p.getAddress() + ", " + p.getLocationSector() : v.getPropertyLocation();
        String status = "APPROVED".equals(v.getStatus()) ? "CONFIRMED" : "TENTATIVE";
        return String.join("\r\n",
                "BEGIN:VCALENDAR",
                "VERSION:2.0",
                "PRODID:-//Habify//Viewings//EN",
                "CALSCALE:GREGORIAN",
                "METHOD:PUBLISH",
                "BEGIN:VEVENT",
                "UID:" + v.getId() + "@habify",
                "DTSTAMP:" + stamp,
                "DTSTART:" + dtStart,
                "DTEND:" + dtEnd,
                "SUMMARY:" + esc("Home viewing: " + v.getPropertyTitle()),
                "LOCATION:" + esc(location == null ? "" : location),
                "DESCRIPTION:" + esc("Viewing booked on Habify. Details: " + appUrl + "/properties/" + v.getPropertyId()),
                "STATUS:" + status,
                "BEGIN:VALARM",
                "TRIGGER:-PT1H",
                "ACTION:DISPLAY",
                "DESCRIPTION:Home viewing in 1 hour",
                "END:VALARM",
                "END:VEVENT",
                "END:VCALENDAR",
                "");
    }

    private static String esc(String s) {
        return s.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n");
    }

    // ---------------------------------------------------------------- reminders

    /** Day-before and two-hours-before reminders for confirmed viewings. Safe to run often (de-duplicated). */
    @Transactional
    public int sendReminders(ZonedDateTime now) {
        int sent = 0;
        for (ViewingRequest v : viewings.findAll()) {
            if (!"APPROVED".equals(v.getStatus())) continue;
            ZonedDateTime start = startOf(v);
            if (start == null || start.isBefore(now)) continue;
            long minutes = Duration.between(now, start).toMinutes();
            String when = pretty(v);
            if (minutes <= 120) {
                if (notifications.notify(v.getTenantId(), "VIEWING_REMINDER", "Viewing soon: " + v.getPropertyTitle(),
                        "Your visit is at " + start.toLocalTime() + " today. Open the home for directions.",
                        "/properties/" + v.getPropertyId(), true, "VIEW_SOON:" + v.getId() + ":" + v.getRequestedDate() + v.getRequestedTimeSlot())) sent++;
                notifications.notify(v.getLandlordId(), "VIEWING_REMINDER", "Viewing soon: " + v.getTenantName(),
                        v.getTenantName() + " is visiting “" + v.getPropertyTitle() + "” at " + start.toLocalTime() + ".",
                        "/landlord?tab=viewings", false, "VIEW_SOON_LL:" + v.getId() + ":" + v.getRequestedDate() + v.getRequestedTimeSlot());
            } else if (minutes <= 24 * 60) {
                if (notifications.notify(v.getTenantId(), "VIEWING_REMINDER", "Viewing tomorrow: " + v.getPropertyTitle(),
                        "Reminder: " + when + ".", "/dashboard", true,
                        "VIEW_DAY:" + v.getId() + ":" + v.getRequestedDate() + v.getRequestedTimeSlot())) sent++;
                notifications.notify(v.getLandlordId(), "VIEWING_REMINDER", "Viewing tomorrow: " + v.getTenantName(),
                        "“" + v.getPropertyTitle() + "”, " + when + ".", "/landlord?tab=viewings", true,
                        "VIEW_DAY_LL:" + v.getId() + ":" + v.getRequestedDate() + v.getRequestedTimeSlot());
            }
        }
        return sent;
    }
}
