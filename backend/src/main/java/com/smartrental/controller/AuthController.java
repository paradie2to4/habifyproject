package com.smartrental.controller;

import com.smartrental.dto.AuthResponseDto;
import com.smartrental.dto.LoginRequestDto;
import com.smartrental.dto.RegisterRequestDto;
import com.smartrental.entity.User;
import com.smartrental.security.CurrentUser;
import com.smartrental.service.AccountService;
import com.smartrental.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AccountService accountService;

    public AuthController(AuthService authService, AccountService accountService) {
        this.authService = authService;
        this.accountService = accountService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@RequestBody LoginRequestDto req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> register(@RequestBody RegisterRequestDto req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(req));
    }

    /** Validates the stored token and returns the fresh user profile. */
    @GetMapping("/me")
    public ResponseEntity<User> me() {
        return ResponseEntity.ok(authService.getUser(CurrentUser.get().id()));
    }

    /** Update name, phone or photo. Fields left out are unchanged. */
    @PutMapping("/me")
    public ResponseEntity<User> updateMe(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(accountService.updateProfile(
                CurrentUser.get().id(), body.get("fullName"), body.get("phoneNumber"), body.get("avatarUrl")));
    }

    @PostMapping("/password/change")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody Map<String, String> body) {
        accountService.changePassword(CurrentUser.get().id(), body.get("currentPassword"), body.get("newPassword"));
        return ResponseEntity.ok(Map.of("ok", true));
    }

    /** Public. Always answers the same way so it can't be used to find out who has an account. */
    @PostMapping("/password/forgot")
    public ResponseEntity<Map<String, Object>> forgot(@RequestBody Map<String, String> body) {
        accountService.requestPasswordReset(body.get("email"));
        return ResponseEntity.ok(Map.of("ok", true,
                "message", "If an account exists for that email, a reset link is on its way."));
    }

    /** Public: completes a reset with the token from the email. */
    @PostMapping("/password/reset")
    public ResponseEntity<Map<String, Object>> reset(@RequestBody Map<String, String> body) {
        accountService.resetPassword(body.get("token"), body.get("newPassword"));
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/verify/send")
    public ResponseEntity<Map<String, Object>> sendVerification() {
        accountService.sendVerification(CurrentUser.get().id());
        return ResponseEntity.ok(Map.of("ok", true));
    }

    /** Public: confirms the email with the token from the email. */
    @PostMapping("/verify/confirm")
    public ResponseEntity<User> confirm(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(accountService.verifyEmail(body.get("token")));
    }
}
