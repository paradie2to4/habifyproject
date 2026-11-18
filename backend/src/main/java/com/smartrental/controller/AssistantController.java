package com.smartrental.controller;

import com.smartrental.entity.User;
import com.smartrental.exception.ApiException;
import com.smartrental.repository.UserRepository;
import com.smartrental.security.AuthUser;
import com.smartrental.service.AssistantService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Habify Assist on Claude. Works for guests too; signed-in users also get answers about their own activity. */
@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    private final AssistantService assistant;
    private final UserRepository users;

    public AssistantController(AssistantService assistant, UserRepository users) {
        this.assistant = assistant;
        this.users = users;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(Map.of("enabled", assistant.enabled()));
    }

    public record ChatRequest(List<AssistantService.Turn> messages, String propertyId) {}

    @PostMapping("/chat")
    public ResponseEntity<AssistantService.Reply> chat(@RequestBody ChatRequest body, HttpServletRequest request) {
        if (body == null || body.messages() == null) throw ApiException.badRequest("messages is required");
        AuthUser user = SecurityContextHolder.getContext().getAuthentication() != null
                && SecurityContextHolder.getContext().getAuthentication().getPrincipal() instanceof AuthUser u ? u : null;
        String name = user == null ? null : users.findById(user.id()).map(User::getFullName).orElse(null);
        // Limit per account when signed in, otherwise per network address
        String key = user != null ? "u:" + user.id() : "ip:" + clientIp(request);
        return ResponseEntity.ok(assistant.chat(key, user == null ? null : user.id(), name, body.messages(), body.propertyId()));
    }

    private static String clientIp(HttpServletRequest req) {
        String fwd = req.getHeader("X-Forwarded-For");
        return fwd != null && !fwd.isBlank() ? fwd.split(",")[0].trim() : req.getRemoteAddr();
    }
}
