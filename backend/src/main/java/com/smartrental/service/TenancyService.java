package com.smartrental.service;

import com.smartrental.entity.*;
import com.smartrental.exception.ApiException;
import com.smartrental.repository.*;
import com.smartrental.security.AuthUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

/** Leases, rent payments and maintenance — with access rules for landlords and tenants. */
@Service
public class TenancyService {

    public static final ZoneId KIGALI = ZoneId.of("Africa/Kigali");
    private static final Set<String> LEASE_STATUSES = Set.of("ACTIVE", "PENDING_SIGNATURE", "EXPIRED", "TERMINATED");
    private static final Set<String> METHODS = Set.of("MTN_MOMO", "AIRTEL_MONEY", "BK_TRANSFER", "IM_BANK", "CASH");
    private static final Set<String> TICKET_STATUSES = Set.of("REPORTED", "IN_PROGRESS", "RESOLVED", "CANCELLED");
    private static final Set<String> PRIORITIES = Set.of("URGENT", "HIGH", "MEDIUM", "LOW");
    private static final Set<String> CATEGORIES = Set.of("PLUMBING", "ELECTRICAL_SOLAR", "WATER_PUMP_TANK", "APPLIANCES", "STRUCTURAL_PAINTING", "INTERNET_SECURITY");

    private final LeaseRepository leases;
    private final RentPaymentRepository payments;
    private final MaintenanceTicketRepository tickets;
    private final PropertyRepository properties;
    private final UserRepository users;
    private final NotificationService notifications;

    public TenancyService(LeaseRepository leases, RentPaymentRepository payments, MaintenanceTicketRepository tickets,
                          PropertyRepository properties, UserRepository users, NotificationService notifications) {
        this.leases = leases;
        this.payments = payments;
        this.tickets = tickets;
        this.properties = properties;
        this.users = users;
        this.notifications = notifications;
    }

    public static LocalDate today() {
        return LocalDate.now(KIGALI);
    }

    public static String monthLabel(YearMonth ym) {
        return ym.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH) + " " + ym.getYear();
    }

    private Property ownProperty(String propertyId, AuthUser user) {
        Property p = properties.findById(propertyId == null ? "" : propertyId).orElseThrow(() -> ApiException.notFound("Property"));
        if (!user.canActFor(p.getLandlordId())) throw ApiException.forbidden();
        return p;
    }

    private Lease lease(String id) {
        return leases.findById(id).orElseThrow(() -> ApiException.notFound("Lease"));
    }

    private static boolean isTenantOf(Lease l, AuthUser user) {
        return user.id().equals(l.getTenantId());
    }

    // ================================================================= leases

    public List<Lease> leasesFor(AuthUser user) {
        if (user.isLandlord()) return leases.findByLandlordIdOrderByCreatedAtDesc(user.id());
        if (user.isAdmin()) return leases.findAll();
        return leases.findByTenantIdOrderByCreatedAtDesc(user.id());
    }

    @Transactional
    public Lease createLease(Map<String, Object> body, AuthUser user) {
        if (!user.isLandlord() && !user.isAdmin()) throw ApiException.forbidden();
        Property p = ownProperty((String) body.get("propertyId"), user);
        String tenantName = str(body.get("tenantName"));
        if (tenantName == null) throw ApiException.badRequest("Tenant name is required");
        Double rent = num(body.get("monthlyRent"));
        if (rent == null || rent <= 0) throw ApiException.badRequest("Monthly rent must be more than 0");
        String start = date(body.get("startDate"), "Start date");
        String end = body.get("endDate") == null ? null : date(body.get("endDate"), "End date");
        if (end != null && end.compareTo(start) <= 0) throw ApiException.badRequest("End date must be after the start date");
        Integer dueDay = body.get("paymentDueDay") == null ? 5 : num(body.get("paymentDueDay")).intValue();
        if (dueDay < 1 || dueDay > 28) throw ApiException.badRequest("Rent due day must be between 1 and 28");

        Lease l = new Lease();
        l.setId(NotificationService.newId("lease"));
        l.setPropertyId(p.getId());
        l.setPropertyTitle(p.getTitle());
        l.setPropertyAddress(p.getAddress());
        l.setPropertySector(p.getLocationSector());
        l.setLandlordId(p.getLandlordId());
        l.setLandlordName(p.getLandlordName());
        l.setTenantName(tenantName);
        l.setTenantPhone(str(body.get("tenantPhone")));
        String email = str(body.get("tenantEmail"));
        l.setTenantEmail(email == null ? null : email.toLowerCase());
        l.setMonthlyRent(rent);
        Double deposit = num(body.get("securityDeposit"));
        l.setSecurityDeposit(deposit == null ? rent : deposit);
        l.setStartDate(start);
        l.setEndDate(end);
        l.setPaymentDueDay(dueDay);
        l.setStatus("ACTIVE");
        l.setPaymentStatus("DUE");

        // Link the tenant's account straight away only if they've proven they own the email
        if (l.getTenantEmail() != null) {
            users.findByEmail(l.getTenantEmail())
                    .filter(u -> "TENANT".equals(u.getRole()) && Boolean.TRUE.equals(u.getEmailVerified()))
                    .ifPresent(u -> l.setTenantId(u.getId()));
        }
        Lease saved = leases.save(l);

        p.setIsAvailable(false);
        properties.save(p);

        notifications.notify(saved.getTenantId(), "LEASE",
                "Your lease for “" + p.getTitle() + "” is on Habify",
                "Rent of " + String.format("%,.0f", rent) + " RWF is due on day " + dueDay + " of each month. You can see receipts and report repairs from your dashboard.",
                "/dashboard", true);
        return saved;
    }

    @Transactional
    public Lease updateLease(String id, Map<String, Object> body, AuthUser user) {
        Lease l = lease(id);
        if (!user.canActFor(l.getLandlordId())) throw ApiException.forbidden();
        String status = str(body.get("status"));
        if (status != null) {
            status = status.toUpperCase();
            if (!LEASE_STATUSES.contains(status)) throw ApiException.badRequest("Unknown lease status");
            l.setStatus(status);
            if (!"ACTIVE".equals(status)) {
                properties.findById(l.getPropertyId()).ifPresent(p -> {
                    p.setIsAvailable(true);
                    properties.save(p);
                });
            }
        }
        String ps = str(body.get("paymentStatus"));
        if (ps != null) l.setPaymentStatus(ps.toUpperCase());
        return leases.save(l);
    }

    // ================================================================= payments

    public List<RentPayment> paymentsFor(AuthUser user) {
        if (user.isLandlord()) return payments.findByLandlordIdOrderByCreatedAtDesc(user.id());
        if (user.isAdmin()) return payments.findAll();
        List<String> ids = leases.findByTenantIdOrderByCreatedAtDesc(user.id()).stream().map(Lease::getId).toList();
        return ids.isEmpty() ? List.of() : payments.findByLeaseIdInOrderByCreatedAtDesc(ids);
    }

    /** Landlord records a payment (verified), or the tenant reports one (pending until the landlord confirms). */
    @Transactional
    public RentPayment recordPayment(Map<String, Object> body, AuthUser user) {
        Lease l = lease(str(body.get("leaseId")));
        boolean landlord = user.canActFor(l.getLandlordId());
        boolean tenant = isTenantOf(l, user);
        if (!landlord && !tenant) throw ApiException.forbidden();

        Double amount = num(body.get("amountRwf"));
        if (amount == null || amount <= 0) throw ApiException.badRequest("Amount must be more than 0");
        String method = Optional.ofNullable(str(body.get("paymentMethod"))).map(String::toUpperCase).orElse("MTN_MOMO");
        if (!METHODS.contains(method)) throw ApiException.badRequest("Unknown payment method");

        YearMonth period = parsePeriod(str(body.get("period")));
        RentPayment p = new RentPayment();
        p.setId(NotificationService.newId("pay"));
        p.setReceiptNumber(receiptNumber());
        p.setLeaseId(l.getId());
        p.setPropertyId(l.getPropertyId());
        p.setPropertyTitle(l.getPropertyTitle());
        p.setLandlordId(l.getLandlordId());
        p.setLandlordName(l.getLandlordName());
        p.setTenantId(l.getTenantId());
        p.setTenantName(l.getTenantName());
        p.setAmountRwf(amount);
        p.setPaymentMethod(method);
        String ref = str(body.get("transactionReference"));
        p.setTransactionReference(ref == null ? method + "-" + (100000 + new Random().nextInt(900000)) : ref);
        p.setPeriod(period.toString());
        p.setPaidForMonth(monthLabel(period));
        String paymentDate = body.get("paymentDate") == null ? today().toString() : date(body.get("paymentDate"), "Payment date");
        p.setPaymentDate(paymentDate);
        p.setNotes(str(body.get("notes")));
        p.setStatus(landlord ? "VERIFIED" : "PENDING");
        RentPayment saved = payments.save(p);

        if (landlord) {
            applyToLease(l, saved);
            notifications.notify(l.getTenantId(), "PAYMENT",
                    "Receipt " + saved.getReceiptNumber() + " for " + saved.getPaidForMonth(),
                    String.format("%,.0f", amount) + " RWF received for “" + l.getPropertyTitle() + "”. Your receipt is in your dashboard.",
                    "/dashboard", true);
        } else {
            notifications.notify(l.getLandlordId(), "PAYMENT",
                    l.getTenantName() + " reported a rent payment",
                    String.format("%,.0f", amount) + " RWF for " + saved.getPaidForMonth() + " (" + method.replace('_', ' ') + ", ref " + saved.getTransactionReference() + "). Confirm it once you’ve checked.",
                    "/landlord?tab=leases", true);
        }
        return saved;
    }

    @Transactional
    public RentPayment confirmPayment(String id, AuthUser user) {
        RentPayment p = payments.findById(id).orElseThrow(() -> ApiException.notFound("Payment"));
        if (!user.canActFor(p.getLandlordId())) throw ApiException.forbidden();
        if ("VERIFIED".equals(p.getStatus())) return p;
        if ("MOBILE_MONEY".equals(p.getChannel())) {
            throw ApiException.badRequest("Mobile-money payments confirm themselves once the tenant approves them on their phone.");
        }
        p.setStatus("VERIFIED");
        RentPayment saved = payments.save(p);
        applyToLease(lease(p.getLeaseId()), saved);
        notifications.notify(p.getTenantId(), "PAYMENT",
                "Payment confirmed: receipt " + p.getReceiptNumber(),
                "Your landlord confirmed " + String.format("%,.0f", p.getAmountRwf()) + " RWF for " + p.getPaidForMonth() + ".",
                "/dashboard", true);
        return saved;
    }

    /** A payment confirmed outside the normal record/confirm flow (e.g. mobile money) updates its lease too. */
    @Transactional
    public void applyVerifiedPayment(RentPayment p) {
        leases.findById(p.getLeaseId()).ifPresent(l -> applyToLease(l, p));
    }

    private void applyToLease(Lease l, RentPayment p) {
        if (l.getLastPaymentDate() == null || p.getPaymentDate().compareTo(l.getLastPaymentDate()) > 0) {
            l.setLastPaymentDate(p.getPaymentDate());
        }
        if (YearMonth.now(KIGALI).toString().equals(p.getPeriod())) l.setPaymentStatus("PAID");
        leases.save(l);
    }

    private static String receiptNumber() {
        return "RW-REC-" + today().format(DateTimeFormatter.BASIC_ISO_DATE) + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    private static YearMonth parsePeriod(String s) {
        if (s == null) return YearMonth.now(KIGALI);
        try {
            return YearMonth.parse(s);
        } catch (Exception e) {
            throw ApiException.badRequest("Period must look like 2026-11");
        }
    }

    // ================================================================= maintenance

    public List<MaintenanceTicket> ticketsFor(AuthUser user) {
        if (user.isLandlord()) return tickets.findByLandlordIdOrderByCreatedAtDesc(user.id());
        if (user.isAdmin()) return tickets.findAll();
        return tickets.findByTenantIdOrderByCreatedAtDesc(user.id());
    }

    @Transactional
    public MaintenanceTicket createTicket(Map<String, Object> body, AuthUser user) {
        String propertyId = str(body.get("propertyId"));
        Property p = properties.findById(propertyId == null ? "" : propertyId).orElseThrow(() -> ApiException.notFound("Property"));
        boolean landlord = user.canActFor(p.getLandlordId());
        Lease active = leases.findByTenantIdOrderByCreatedAtDesc(user.id()).stream()
                .filter(l -> l.getPropertyId().equals(p.getId()) && "ACTIVE".equals(l.getStatus()))
                .findFirst().orElse(null);
        if (!landlord && active == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only report repairs for a home you currently rent");
        }
        String title = str(body.get("title"));
        if (title == null) throw ApiException.badRequest("Give the problem a short title");

        MaintenanceTicket t = new MaintenanceTicket();
        t.setId(NotificationService.newId("maint"));
        t.setPropertyId(p.getId());
        t.setPropertyTitle(p.getTitle());
        t.setPropertySector(p.getLocationSector());
        t.setLandlordId(p.getLandlordId());
        t.setTitle(title);
        t.setDescription(str(body.get("description")));
        t.setCategory(pick(body.get("category"), CATEGORIES, "PLUMBING"));
        t.setPriority(pick(body.get("priority"), PRIORITIES, "MEDIUM"));
        t.setPhotos(joinPhotos(body.get("photos")));
        t.setReportedDate(today().toString());
        t.setStatus("REPORTED");
        if (landlord) {
            t.setReportedBy("LANDLORD");
            t.setEstimatedCostRwf(num(body.get("estimatedCostRwf")));
            t.setContractorName(str(body.get("contractorName")));
            leases.findByLandlordIdOrderByCreatedAtDesc(p.getLandlordId()).stream()
                    .filter(l -> l.getPropertyId().equals(p.getId()) && "ACTIVE".equals(l.getStatus()))
                    .findFirst().ifPresent(l -> {
                        t.setTenantId(l.getTenantId());
                        t.setTenantName(l.getTenantName());
                    });
        } else {
            t.setReportedBy("TENANT");
            t.setTenantId(user.id());
            t.setTenantName(active.getTenantName());
        }
        MaintenanceTicket saved = tickets.save(t);

        if (!landlord) {
            notifications.notify(p.getLandlordId(), "MAINTENANCE",
                    ("URGENT".equals(saved.getPriority()) ? "Urgent repair: " : "Repair request: ") + saved.getTitle(),
                    saved.getTenantName() + " reported a problem at “" + p.getTitle() + "”." + (saved.getDescription() != null ? " " + saved.getDescription() : ""),
                    "/landlord?tab=maintenance", true);
        }
        return saved;
    }

    @Transactional
    public MaintenanceTicket updateTicket(String id, Map<String, Object> body, AuthUser user) {
        MaintenanceTicket t = tickets.findById(id).orElseThrow(() -> ApiException.notFound("Repair request"));
        boolean landlord = user.canActFor(t.getLandlordId());
        boolean tenant = user.id().equals(t.getTenantId());
        if (!landlord && !tenant) throw ApiException.forbidden();

        String before = t.getStatus();
        String status = str(body.get("status"));
        if (status != null) {
            status = status.toUpperCase();
            if (!TICKET_STATUSES.contains(status)) throw ApiException.badRequest("Unknown status");
            if (!landlord && !"CANCELLED".equals(status)) throw ApiException.forbidden();
            t.setStatus(status);
            if ("RESOLVED".equals(status) && t.getResolvedDate() == null) t.setResolvedDate(today().toString());
        }
        if (landlord) {
            if (body.containsKey("priority")) t.setPriority(pick(body.get("priority"), PRIORITIES, t.getPriority()));
            if (body.containsKey("contractorName")) t.setContractorName(str(body.get("contractorName")));
            if (body.containsKey("landlordNotes")) t.setLandlordNotes(str(body.get("landlordNotes")));
            if (body.containsKey("estimatedCostRwf")) t.setEstimatedCostRwf(num(body.get("estimatedCostRwf")));
            if (body.containsKey("actualCostRwf")) t.setActualCostRwf(num(body.get("actualCostRwf")));
        }
        MaintenanceTicket saved = tickets.save(t);

        if (!Objects.equals(before, saved.getStatus())) {
            if (landlord) {
                String what = switch (saved.getStatus()) {
                    case "IN_PROGRESS" -> "is being worked on";
                    case "RESOLVED" -> "has been fixed";
                    case "CANCELLED" -> "was closed";
                    default -> "was updated";
                };
                notifications.notify(saved.getTenantId(), "MAINTENANCE", "Repair update: " + saved.getTitle(),
                        "Your request " + what + "." + (saved.getLandlordNotes() != null ? " Note: " + saved.getLandlordNotes() : ""),
                        "/dashboard", true);
            } else {
                notifications.notify(saved.getLandlordId(), "MAINTENANCE", "Repair request withdrawn: " + saved.getTitle(),
                        saved.getTenantName() + " cancelled this request.", "/landlord?tab=maintenance", false);
            }
        }
        return saved;
    }

    // ================================================================= rent reminders

    /** Runs daily: updates payment status and sends due / overdue reminders once per month. */
    @Transactional
    public int runRentReminders(LocalDate today) {
        YearMonth period = YearMonth.from(today);
        int sent = 0;
        for (Lease l : leases.findByStatus("ACTIVE")) {
            if (l.getEndDate() != null && l.getEndDate().compareTo(today.toString()) < 0) {
                l.setStatus("EXPIRED");
                leases.save(l);
                continue;
            }
            if (l.getStartDate() != null && l.getStartDate().compareTo(today.toString()) > 0) continue;

            int day = Math.min(l.getPaymentDueDay() == null ? 5 : l.getPaymentDueDay(), period.lengthOfMonth());
            LocalDate due = period.atDay(day);
            boolean paid = payments.existsByLeaseIdAndPeriodAndStatus(l.getId(), period.toString(), "VERIFIED");
            String amount = String.format("%,.0f", l.getMonthlyRent());

            String newStatus;
            if (paid) {
                newStatus = "PAID";
            } else if (today.isAfter(due)) {
                newStatus = "OVERDUE";
                if (notifications.notify(l.getTenantId(), "RENT_DUE", "Rent for " + monthLabel(period) + " is overdue",
                        amount + " RWF for “" + l.getPropertyTitle() + "” was due on " + due + ". If you’ve already paid, report it so your landlord can confirm.",
                        "/dashboard", true, "RENT_OVERDUE:" + l.getId() + ":" + period)) sent++;
                notifications.notify(l.getLandlordId(), "RENT_DUE", l.getTenantName() + "’s rent is overdue",
                        amount + " RWF for “" + l.getPropertyTitle() + "” was due on " + due + ".",
                        "/landlord?tab=leases", false, "RENT_OVERDUE_LL:" + l.getId() + ":" + period);
            } else {
                newStatus = "DUE";
                if (!due.isAfter(today.plusDays(3))) {
                    if (notifications.notify(l.getTenantId(), "RENT_DUE", "Rent due " + (due.equals(today) ? "today" : "on " + due),
                            amount + " RWF for “" + l.getPropertyTitle() + "” (" + monthLabel(period) + ").",
                            "/dashboard", true, "RENT_DUE:" + l.getId() + ":" + period)) sent++;
                }
            }
            if (!newStatus.equals(l.getPaymentStatus())) {
                l.setPaymentStatus(newStatus);
                leases.save(l);
            }
        }
        return sent;
    }

    // ================================================================= helpers

    private static String str(Object o) {
        if (o == null) return null;
        String s = o.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private static Double num(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(o.toString().replace(",", "").trim());
        } catch (NumberFormatException e) {
            throw ApiException.badRequest("“" + o + "” isn’t a number");
        }
    }

    private static String date(Object o, String label) {
        String s = str(o);
        if (s == null) throw ApiException.badRequest(label + " is required");
        try {
            return LocalDate.parse(s.length() > 10 ? s.substring(0, 10) : s).toString();
        } catch (Exception e) {
            throw ApiException.badRequest(label + " must look like 2026-11-30");
        }
    }

    private static String pick(Object o, Set<String> allowed, String fallback) {
        String s = str(o);
        if (s == null) return fallback;
        s = s.toUpperCase();
        if (!allowed.contains(s)) throw ApiException.badRequest("Unknown value: " + o);
        return s;
    }

    @SuppressWarnings("unchecked")
    private static String joinPhotos(Object o) {
        if (o == null) return null;
        Collection<Object> list = o instanceof Collection<?> c ? (Collection<Object>) c : List.of(o.toString().split(","));
        String joined = list.stream().map(Object::toString).map(String::trim)
                .filter(s -> s.startsWith("http"))
                .limit(8)
                .collect(Collectors.joining(","));
        return joined.isEmpty() ? null : joined;
    }
}
