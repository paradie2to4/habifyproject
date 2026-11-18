package com.smartrental.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartrental.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Base64;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** End-to-end checks for leases, payments, repairs, conversations, notifications, account and uploads. */
@SpringBootTest(properties = "jwt.secret=test-secret-that-is-definitely-longer-than-32-bytes")
@AutoConfigureMockMvc
@ActiveProfiles("h2")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class CompleteFlowsIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired AccountService accounts;
    @Autowired TenancyService tenancy;
    @Autowired UserRepository users;

    private String login(String email, String password) throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return "Bearer " + json.readTree(body).get("token").asText();
    }

    private String tenant() throws Exception { return login("tenant@smartrental.rw", "password123"); }
    private String landlord() throws Exception { return login("landlord@smartrental.rw", "password123"); }

    private JsonNode read(ResultActions r) throws Exception {
        return json.readTree(r.andReturn().getResponse().getContentAsString());
    }

    private ResultActions postJson(String url, String auth, String body) throws Exception {
        var req = post(url).contentType(MediaType.APPLICATION_JSON).content(body);
        if (auth != null) req.header("Authorization", auth);
        return mvc.perform(req);
    }

    private String createLease(String landlord) throws Exception {
        JsonNode lease = read(postJson("/api/leases", landlord, """
                {"propertyId":"prop-01","tenantName":"Claire Mukamana","tenantEmail":"tenant@smartrental.rw",
                 "monthlyRent":350000,"startDate":"2026-01-01","endDate":"2030-12-31","paymentDueDay":5}""")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tenantId").value("usr-tenant-01")));
        return lease.get("id").asText();
    }

    @Test
    void leasePaymentAndReceiptFlow() throws Exception {
        String ll = landlord(), tt = tenant();
        String leaseId = createLease(ll);

        // Tenant sees the lease and was notified
        mvc.perform(get("/api/leases").header("Authorization", tt))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(leaseId));
        mvc.perform(get("/api/notifications").header("Authorization", tt))
                .andExpect(jsonPath("$.unread").value(greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.items[0].type").value("LEASE"));

        // Tenant reports a payment → pending; landlord confirms → verified, lease paid
        String period = YearMonth.now(TenancyService.KIGALI).toString();
        JsonNode pay = read(postJson("/api/payments", tt,
                "{\"leaseId\":\"" + leaseId + "\",\"amountRwf\":350000,\"paymentMethod\":\"MTN_MOMO\",\"transactionReference\":\"MP123\",\"period\":\"" + period + "\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.receiptNumber").value(startsWith("RW-REC-"))));

        mvc.perform(post("/api/payments/" + pay.get("id").asText() + "/confirm").header("Authorization", tt))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/payments/" + pay.get("id").asText() + "/confirm").header("Authorization", ll))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("VERIFIED"));
        mvc.perform(get("/api/leases").header("Authorization", ll))
                .andExpect(jsonPath("$[0].paymentStatus").value("PAID"));
        mvc.perform(get("/api/payments").header("Authorization", tt))
                .andExpect(jsonPath("$[0].status").value("VERIFIED"));
    }

    @Test
    void rentReminderIsSentOncePerMonth() throws Exception {
        String ll = landlord();
        createLease(ll);
        LocalDate lateInMonth = YearMonth.now(TenancyService.KIGALI).atDay(20);
        int first = tenancy.runRentReminders(lateInMonth);
        int second = tenancy.runRentReminders(lateInMonth);
        org.junit.jupiter.api.Assertions.assertEquals(1, first);
        org.junit.jupiter.api.Assertions.assertEquals(0, second);
        mvc.perform(get("/api/leases").header("Authorization", ll)).andExpect(jsonPath("$[0].paymentStatus").value("OVERDUE"));
    }

    @Test
    void tenantReportsRepairWithPhotosAndGetsUpdates() throws Exception {
        String ll = landlord(), tt = tenant();
        // No lease yet → tenant can't report
        postJson("/api/maintenance", tt, "{\"propertyId\":\"prop-01\",\"title\":\"Leaking sink\"}").andExpect(status().isForbidden());

        createLease(ll);
        JsonNode ticket = read(postJson("/api/maintenance", tt, """
                {"propertyId":"prop-01","title":"Leaking kitchen sink","description":"Water under the cabinet",
                 "category":"PLUMBING","priority":"HIGH","photos":["https://example.com/a.jpg","javascript:alert(1)"]}""")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.photos").value("https://example.com/a.jpg"))
                .andExpect(jsonPath("$.reportedBy").value("TENANT")));
        String id = ticket.get("id").asText();

        // Tenant can't mark it resolved; landlord can
        mvc.perform(patch("/api/maintenance/" + id).header("Authorization", tt).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"RESOLVED\"}")).andExpect(status().isForbidden());
        mvc.perform(patch("/api/maintenance/" + id).header("Authorization", ll).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"RESOLVED\",\"landlordNotes\":\"Plumber replaced the trap\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.resolvedDate").isNotEmpty());
        mvc.perform(get("/api/notifications").header("Authorization", tt))
                .andExpect(jsonPath("$.items[0].title").value(containsString("Repair update")));
    }

    @Test
    void conversationThreadWithReadReceipts() throws Exception {
        String ll = landlord(), tt = tenant();
        JsonNode inq = read(postJson("/api/inquiries", tt,
                "{\"propertyId\":\"prop-01\",\"message\":\"Is it still available?\",\"landlordId\":\"usr-tenant-01\"}")
                .andExpect(status().isCreated())
                // landlord comes from the listing, not from the request
                .andExpect(jsonPath("$.landlordId").value("usr-landlord-01")));
        String id = inq.get("id").asText();

        mvc.perform(get("/api/inquiries/landlord/usr-landlord-01").header("Authorization", ll))
                .andExpect(jsonPath("$[0].unreadCount").value(1));
        mvc.perform(post("/api/inquiries/" + id + "/read").header("Authorization", ll)).andExpect(status().isOk());
        postJson("/api/inquiries/" + id + "/messages", ll, "{\"body\":\"Yes! When would you like to visit?\"}").andExpect(status().isCreated());
        postJson("/api/inquiries/" + id + "/messages", tt, "{\"body\":\"Saturday morning?\"}").andExpect(status().isCreated());

        mvc.perform(get("/api/inquiries/" + id + "/messages").header("Authorization", tt))
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].readAt").isNotEmpty())     // landlord read the first message
                .andExpect(jsonPath("$[1].senderRole").value("LANDLORD"))
                .andExpect(jsonPath("$[1].readAt").isNotEmpty());    // tenant replied, so read it
        mvc.perform(get("/api/inquiries/landlord/usr-landlord-01").header("Authorization", ll))
                .andExpect(jsonPath("$[0].unreadCount").value(1))
                .andExpect(jsonPath("$[0].lastMessagePreview").value("Saturday morning?"));

        // Someone else can't read the thread
        String admin = login("admin@smartrental.rw", "password123");
        mvc.perform(get("/api/inquiries/" + id + "/messages").header("Authorization", admin)).andExpect(status().isOk());
        String other = read(postJson("/api/auth/register", null,
                "{\"email\":\"x" + UUID.randomUUID().toString().substring(0, 6) + "@t.rw\",\"password\":\"password123\",\"fullName\":\"Other\",\"role\":\"TENANT\"}")).get("token").asText();
        mvc.perform(get("/api/inquiries/" + id + "/messages").header("Authorization", "Bearer " + other)).andExpect(status().isForbidden());
    }

    @Test
    void profilePasswordResetAndVerification() throws Exception {
        String email = "new" + UUID.randomUUID().toString().substring(0, 6) + "@t.rw";
        JsonNode reg = read(postJson("/api/auth/register", null,
                "{\"email\":\"" + email + "\",\"password\":\"password123\",\"fullName\":\"Aline U\",\"role\":\"TENANT\"}"));
        String auth = "Bearer " + reg.get("token").asText();
        String userId = reg.get("user").get("id").asText();
        org.junit.jupiter.api.Assertions.assertFalse(reg.get("user").get("emailVerified").asBoolean());

        mvc.perform(put("/api/auth/me").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Aline Uwase\",\"phoneNumber\":\"+250 788 000 111\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.fullName").value("Aline Uwase"));

        // Verification
        String verify = accounts.issue(userId, AccountService.VERIFY, 60);
        postJson("/api/auth/verify/confirm", null, "{\"token\":\"" + verify + "\"}")
                .andExpect(status().isOk()).andExpect(jsonPath("$.emailVerified").value(true));
        postJson("/api/auth/verify/confirm", null, "{\"token\":\"" + verify + "\"}").andExpect(status().isBadRequest());

        // Forgot password never reveals whether the account exists
        postJson("/api/auth/password/forgot", null, "{\"email\":\"nobody@nowhere.rw\"}").andExpect(status().isOk());
        String reset = accounts.issue(userId, AccountService.RESET, 60);
        postJson("/api/auth/password/reset", null, "{\"token\":\"" + reset + "\",\"newPassword\":\"short\"}").andExpect(status().isBadRequest());
        postJson("/api/auth/password/reset", null, "{\"token\":\"" + reset + "\",\"newPassword\":\"brand-new-pass\"}").andExpect(status().isOk());
        login(email, "brand-new-pass");

        // Change password requires the current one
        String auth2 = login(email, "brand-new-pass");
        postJson("/api/auth/password/change", auth2, "{\"currentPassword\":\"wrong\",\"newPassword\":\"another-pass-1\"}").andExpect(status().isBadRequest());
        postJson("/api/auth/password/change", auth2, "{\"currentPassword\":\"brand-new-pass\",\"newPassword\":\"another-pass-1\"}").andExpect(status().isOk());
    }

    @Test
    void uploadsAreValidatedAndServedPublicly() throws Exception {
        String ll = landlord();
        mvc.perform(get("/api/uploads/signature").header("Authorization", ll))
                .andExpect(jsonPath("$.provider").value("server"));

        byte[] png = Base64.getDecoder().decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");
        JsonNode up = read(mvc.perform(multipart("/api/uploads").file(new MockMultipartFile("file", "a.png", "image/png", png))
                        .header("Authorization", ll))
                .andExpect(status().isCreated()));
        String id = up.get("id").asText();
        mvc.perform(get("/api/uploads/" + id))
                .andExpect(status().isOk()).andExpect(content().contentType("image/png"));

        // A script pretending to be an image is rejected
        mvc.perform(multipart("/api/uploads").file(new MockMultipartFile("file", "x.png", "image/png", "<script>alert(1)</script>".getBytes()))
                .header("Authorization", ll)).andExpect(status().isBadRequest());
        // Anonymous uploads are rejected
        mvc.perform(multipart("/api/uploads").file(new MockMultipartFile("file", "a.png", "image/png", png)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void viewingNotificationsReachBothSides() throws Exception {
        String ll = landlord(), tt = tenant();
        JsonNode day = read(mvc.perform(get("/api/properties/prop-01/viewing-slots?days=7"))).get(0);
        JsonNode v = read(postJson("/api/viewing-requests", tt,
                "{\"propertyId\":\"prop-01\",\"requestedDate\":\"" + day.get("date").asText()
                        + "\",\"requestedTimeSlot\":\"" + day.get("slots").get(0).get("time").asText() + "\"}")
                .andExpect(status().isCreated()));
        mvc.perform(get("/api/notifications").header("Authorization", ll))
                .andExpect(jsonPath("$.items[0].type").value("VIEWING_REQUESTED"));
        mvc.perform(patch("/api/viewing-requests/" + v.get("id").asText() + "/status").header("Authorization", ll)
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"APPROVED\"}")).andExpect(status().isOk());
        JsonNode n = read(mvc.perform(get("/api/notifications").header("Authorization", tt)));
        org.junit.jupiter.api.Assertions.assertEquals("VIEWING_UPDATED", n.get("items").get(0).get("type").asText());

        String nid = n.get("items").get(0).get("id").asText();
        mvc.perform(post("/api/notifications/" + nid + "/read").header("Authorization", ll)).andExpect(status().isForbidden());
        mvc.perform(post("/api/notifications/read-all").header("Authorization", tt)).andExpect(status().isOk());
        mvc.perform(get("/api/notifications").header("Authorization", tt)).andExpect(jsonPath("$.unread").value(0));
    }
}
