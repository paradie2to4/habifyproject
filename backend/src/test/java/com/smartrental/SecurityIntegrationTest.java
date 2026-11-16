package com.smartrental;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "jwt.secret=test-secret-that-is-definitely-longer-than-32-bytes")
@AutoConfigureMockMvc
@ActiveProfiles("h2")
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper json;

    private String login(String email, String password) throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andExpect(content().string(not(containsString("passwordHash"))))
                .andReturn().getResponse().getContentAsString();
        JsonNode node = json.readTree(body);
        return "Bearer " + node.get("token").asText();
    }

    @Test
    void publicListingsAreReadableAnonymously() throws Exception {
        mvc.perform(get("/api/properties")).andExpect(status().isOk());
    }

    @Test
    void wrongPasswordIsRejected() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"tenant@smartrental.rw\",\"password\":\"nope-nope\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void anonymousWritesAreRejected() throws Exception {
        mvc.perform(delete("/api/properties/prop-01")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/users")).andExpect(status().isUnauthorized());
    }

    @Test
    void tenantCannotTouchOtherUsersData() throws Exception {
        String tenant = login("tenant@smartrental.rw", "password123");
        mvc.perform(delete("/api/properties/prop-01").header("Authorization", tenant)).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/users").header("Authorization", tenant)).andExpect(status().isForbidden());
        mvc.perform(get("/api/inquiries/landlord/usr-landlord-01").header("Authorization", tenant))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/auth/me").header("Authorization", tenant))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("tenant@smartrental.rw"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void tenantFavoritesRoundTrip() throws Exception {
        String tenant = login("tenant@smartrental.rw", "password123");
        mvc.perform(put("/api/favorites/prop-01").header("Authorization", tenant))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0]").value("prop-01"));
        mvc.perform(delete("/api/favorites/prop-01").header("Authorization", tenant))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void registerCannotSelfAssignAdmin() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"sneaky@x.rw\",\"password\":\"password123\",\"fullName\":\"S\",\"role\":\"ADMIN\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void landlordCanUpdateOwnListing() throws Exception {
        String landlord = login("landlord@smartrental.rw", "password123");
        String existing = mvc.perform(get("/api/properties/prop-01")).andReturn().getResponse().getContentAsString();
        mvc.perform(put("/api/properties/prop-01").header("Authorization", landlord)
                        .contentType(MediaType.APPLICATION_JSON).content(existing))
                .andExpect(status().isOk());
    }

    @Test
    void forgedTokenIsIgnored() throws Exception {
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer not.a.jwt"))
                .andExpect(status().isUnauthorized());
    }
}
