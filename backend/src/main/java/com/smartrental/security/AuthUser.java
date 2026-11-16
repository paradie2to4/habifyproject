package com.smartrental.security;

/** The authenticated caller, extracted from a verified JWT. */
public record AuthUser(String id, String email, String role) {

    public boolean isAdmin() {
        return "ADMIN".equals(role);
    }

    public boolean isLandlord() {
        return "LANDLORD".equals(role);
    }

    /** True when the caller is the given user or an admin. */
    public boolean canActFor(String userId) {
        return isAdmin() || (userId != null && userId.equals(id));
    }
}
