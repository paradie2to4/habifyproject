package com.smartrental.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/** Every error leaves the API as {status, error, message, path, timestamp}. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    public static Map<String, Object> body(HttpStatus status, String message, String path) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        body.put("path", path);
        body.put("timestamp", Instant.now().toString());
        return body;
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApi(ApiException ex, HttpServletRequest req) {
        return ResponseEntity.status(ex.getStatus()).body(body(ex.getStatus(), ex.getMessage(), req.getRequestURI()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleDenied(AccessDeniedException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(body(HttpStatus.FORBIDDEN, "You do not have permission to perform this action", req.getRequestURI()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest().body(body(HttpStatus.BAD_REQUEST, message, req.getRequestURI()));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MissingServletRequestParameterException.class})
    public ResponseEntity<Map<String, Object>> handleBadInput(Exception ex, HttpServletRequest req) {
        return ResponseEntity.badRequest().body(body(HttpStatus.BAD_REQUEST, "Malformed request", req.getRequestURI()));
    }

    /** Legacy services throw plain RuntimeExceptions with user-facing messages. */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntime(RuntimeException ex, HttpServletRequest req) {
        log.warn("Request {} failed: {}", req.getRequestURI(), ex.getMessage());
        HttpStatus status = ex.getMessage() != null && ex.getMessage().toLowerCase().contains("not found")
                ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(body(status, ex.getMessage(), req.getRequestURI()));
    }
}
