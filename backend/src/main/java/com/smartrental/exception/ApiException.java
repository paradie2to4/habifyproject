package com.smartrental.exception;

import org.springframework.http.HttpStatus;

/** Business error carrying the HTTP status the API should return. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public static ApiException notFound(String what) {
        return new ApiException(HttpStatus.NOT_FOUND, what + " not found");
    }

    public static ApiException forbidden() {
        return new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to perform this action");
    }

    public static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }
}
