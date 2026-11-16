package com.smartrental.security;

import com.smartrental.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/** Static access to the caller of the current request. */
public final class CurrentUser {

    private CurrentUser() {}

    public static AuthUser get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthUser user) {
            return user;
        }
        throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required — please sign in");
    }

    /** Throws 403 unless the caller is {@code userId} or an admin. */
    public static AuthUser requireSelfOrAdmin(String userId) {
        AuthUser user = get();
        if (!user.canActFor(userId)) throw ApiException.forbidden();
        return user;
    }
}
