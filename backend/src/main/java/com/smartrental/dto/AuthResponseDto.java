package com.smartrental.dto;

import com.smartrental.entity.User;

public class AuthResponseDto {
    private String token;
    private String tokenType = "Bearer";
    private User user;

    public AuthResponseDto() {}

    public AuthResponseDto(String token, User user) {
        this.token = token;
        this.user = user;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
