package com.smartrental.controller;

import com.smartrental.dto.AuthResponseDto;
import com.smartrental.dto.LoginRequestDto;
import com.smartrental.dto.RegisterRequestDto;
import com.smartrental.entity.User;
import com.smartrental.security.CurrentUser;
import com.smartrental.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
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
}
