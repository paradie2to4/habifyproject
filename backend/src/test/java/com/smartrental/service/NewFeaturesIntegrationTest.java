package com.smartrental.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartrental.repository.PropertyRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.time.YearMonth;
import java.time.ZonedDateTime;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Saved searches, viewing calendar, shared shortlists, mobile money (simulated) and the assistant switch. */
@SpringBootTest(properties = {"jwt.secret=test-secret-that-is-definitely-longer-than-32-bytes", "app.momo.simulate=true"})
@AutoConfigureMockMvc
@ActiveProfiles("h2")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class NewFeaturesIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired SavedSearchService savedSearches;
    @Autowired ViewingCalendarService calendar;
    @Autowired MobileMoneyService momo;
    @Autowired PropertyRepository properties;
    @Autowired com.smartrental.repository.ViewingRequestRepository viewings;

    private String login(String email) throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"password123\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return "Bearer " + json.readTree(body).get("token").asText();
    }

    private JsonNode read(ResultActions r) throws Exception {
        return json.readTree(r.andReturn().getResponse().getContentAsString());
    }

    private ResultActions send(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder req, String auth, String body) throws Exception {
        req.contentType(MediaType.APPLICATION_JSON).content(body);
        if (auth != null) req.header("Authorization", auth);
        return mvc.perform(req);
    }

    @Test
    void savedSearchAlertsWhenAMatchingHomeAppears() throws Exception {
        String tt = login("tenant@smartrental.rw");
        JsonNode s = read(send(post("/api/saved-searches"), tt, "{\"maxRent\":5000000,\"minBedrooms\":1}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.alertsEnabled").value(true))
                .andExpect(jsonPath("$.matchCount").value(greaterThan(0))));

        int notified = savedSearches.onListingAvailable(properties.findById("prop-01").orElseThrow());
        assertEquals(1, notified);
        // Same home again doesn't alert twice
        assertEquals(0, savedSearches.onListingAvailable(properties.findById("prop-01").orElseThrow()));
        mvc.perform(get("/api/notifications").header("Authorization", tt))
                .andExpect(jsonPath("$.items[0].type").value("SEARCH_MATCH"));

        send(patch("/api/saved-searches/" + s.get("id").asText()), tt, "{\"alertsEnabled\":false}")
                .andExpect(jsonPath("$.alertsEnabled").value(false));
        // Someone else can't delete it
        mvc.perform(delete("/api/saved-searches/" + s.get("id").asText()).header("Authorization", login("landlord@smartrental.rw")))
                .andExpect(status().is4xxClientError());
        mvc.perform(delete("/api/saved-searches/" + s.get("id").asText()).header("Authorization", tt)).andExpect(status().is2xxSuccessful());
        mvc.perform(get("/api/saved-searches").header("Authorization", tt)).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void viewingSlotsBookingRescheduleAndCalendarFile() throws Exception {
        String tt = login("tenant@smartrental.rw"), ll = login("landlord@smartrental.rw");
        JsonNode days = read(mvc.perform(get("/api/properties/prop-01/viewing-slots?days=10")).andExpect(status().isOk()));
        String date = days.get(0).get("date").asText();
        String time = days.get(0).get("slots").get(0).get("time").asText();
        String booking = "{\"propertyId\":\"prop-01\",\"requestedDate\":\"" + date + "\",\"requestedTimeSlot\":\"" + time + "\"}";

        JsonNode v = read(send(post("/api/viewing-requests"), tt, booking).andExpect(status().isCreated()));
        // The same slot can't be booked twice
        send(post("/api/viewing-requests"), tt, booking).andExpect(status().isConflict());
        JsonNode after = read(mvc.perform(get("/api/properties/prop-01/viewing-slots?days=10")));
        assertFalse(after.get(0).get("slots").get(0).get("available").asBoolean());

        // Landlord moves it → approved, tenant told
        String newDate = days.get(1).get("date").asText(), newTime = days.get(1).get("slots").get(1).get("time").asText();
        send(patch("/api/viewing-requests/" + v.get("id").asText() + "/reschedule"), ll,
                "{\"requestedDate\":\"" + newDate + "\",\"requestedTimeSlot\":\"" + newTime + "\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.requestedTimeSlot").value(newTime));
        mvc.perform(get("/api/notifications").header("Authorization", tt))
                .andExpect(jsonPath("$.items[0].type").value(startsWith("VIEWING")));

        mvc.perform(get("/api/viewing-requests/" + v.get("id").asText() + "/calendar.ics").header("Authorization", tt))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("BEGIN:VEVENT")))
                .andExpect(content().string(containsString("BEGIN:VALARM")));

        // Landlord availability can be replaced
        send(put("/api/availability"), ll, "{\"slotMinutes\":30,\"windows\":[{\"dayOfWeek\":6,\"startTime\":\"10:00\",\"endTime\":\"12:00\"}]}")
                .andExpect(status().isOk());
        JsonNode sat = read(mvc.perform(get("/api/properties/prop-01/viewing-slots?days=14")));
        for (JsonNode d : sat) assertTrue(d.get("label").asText().startsWith("Sat"));

        // Reminders go out once
        ZonedDateTime start = ViewingCalendarService.startOf(viewings.findById(v.get("id").asText()).orElseThrow());
        assertTrue(calendar.sendReminders(start.minusMinutes(90)) >= 1);
        assertEquals(0, calendar.sendReminders(start.minusMinutes(80)));
    }

    @Test
    void sharedShortlistVoting() throws Exception {
        String tt = login("tenant@smartrental.rw");
        JsonNode list = read(send(post("/api/shortlists"), tt, "{\"title\":\"Our picks\",\"propertyIds\":[\"prop-01\",\"prop-02\"]}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.shareToken").isNotEmpty()));
        String token = list.get("shareToken").asText();

        mvc.perform(get("/api/public/shortlists/" + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.homes.length()").value(2))
                .andExpect(jsonPath("$.shareToken").doesNotExist());

        String voter = "voter-key-0123456789abcdef";
        send(post("/api/public/shortlists/" + token + "/votes"), null,
                "{\"propertyId\":\"prop-02\",\"voterKey\":\"" + voter + "\",\"voterName\":\"Eric\",\"value\":1,\"comment\":\"Love the garden\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.homes[0].id").value("prop-02"))
                .andExpect(jsonPath("$.homes[0].up").value(1))
                .andExpect(jsonPath("$.homes[0].votes[0].key").value(Integer.toHexString(voter.hashCode())));
        // Voting without a name or on a home not on the list fails
        send(post("/api/public/shortlists/" + token + "/votes"), null,
                "{\"propertyId\":\"prop-02\",\"voterKey\":\"" + voter + "\",\"voterName\":\"\",\"value\":1}").andExpect(status().isBadRequest());
        send(post("/api/public/shortlists/" + token + "/votes"), null,
                "{\"propertyId\":\"prop-99\",\"voterKey\":\"" + voter + "\",\"voterName\":\"Eric\",\"value\":1}").andExpect(status().isBadRequest());
        mvc.perform(get("/api/notifications").header("Authorization", tt))
                .andExpect(jsonPath("$.items[0].type").value("SHORTLIST_VOTE"));

        // A new link retires the old one
        mvc.perform(post("/api/shortlists/" + list.get("id").asText() + "/new-link").header("Authorization", tt)).andExpect(status().isOk());
        mvc.perform(get("/api/public/shortlists/" + token)).andExpect(status().isNotFound());
    }

    @Test
    void mobileMoneyPaymentSettlesAndMarksLeasePaid() throws Exception {
        String tt = login("tenant@smartrental.rw"), ll = login("landlord@smartrental.rw");
        JsonNode lease = read(send(post("/api/leases"), ll, """
                {"propertyId":"prop-01","tenantName":"Claire Mukamana","tenantEmail":"tenant@smartrental.rw",
                 "monthlyRent":350000,"startDate":"2026-01-01","endDate":"2030-12-31","paymentDueDay":5}""")
                .andExpect(status().isCreated()));
        String leaseId = lease.get("id").asText();
        String period = YearMonth.now(TenancyService.KIGALI).toString();

        mvc.perform(get("/api/payments/mobile-money/status").header("Authorization", tt)).andExpect(jsonPath("$.mtn").value(true));
        // An Airtel number can't be charged through MTN
        send(post("/api/payments/mobile-money"), tt, "{\"leaseId\":\"" + leaseId + "\",\"provider\":\"MTN\",\"phone\":\"0731234567\",\"amount\":350000,\"period\":\"" + period + "\"}")
                .andExpect(status().isBadRequest());
        // Only the tenant can pay
        send(post("/api/payments/mobile-money"), ll, "{\"leaseId\":\"" + leaseId + "\",\"provider\":\"MTN\",\"phone\":\"0781234567\",\"amount\":350000,\"period\":\"" + period + "\"}")
                .andExpect(status().is4xxClientError());

        JsonNode pay = read(send(post("/api/payments/mobile-money"), tt,
                "{\"leaseId\":\"" + leaseId + "\",\"provider\":\"MTN\",\"phone\":\"078 123 4567\",\"amount\":350000,\"period\":\"" + period + "\"}")
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.providerStatus").value("REQUESTED"))
                .andExpect(jsonPath("$.payerPhone").value("250781234567")));

        Thread.sleep(6500);
        mvc.perform(get("/api/payments/mobile-money/" + pay.get("id").asText()).header("Authorization", tt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("VERIFIED"))
                .andExpect(jsonPath("$.receiptNumber").value(startsWith("RW-REC-")));
        mvc.perform(get("/api/leases").header("Authorization", ll)).andExpect(jsonPath("$[0].paymentStatus").value("PAID"));
    }

    @Test
    void assistantIsOffWithoutAKey() throws Exception {
        mvc.perform(get("/api/assistant/status")).andExpect(jsonPath("$.enabled").value(false));
        send(post("/api/assistant/chat"), null, "{\"messages\":[{\"role\":\"user\",\"content\":\"hi\"}]}")
                .andExpect(status().isServiceUnavailable());
    }
}
