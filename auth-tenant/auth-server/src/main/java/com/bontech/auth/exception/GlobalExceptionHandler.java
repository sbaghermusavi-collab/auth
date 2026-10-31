package com.bontech.auth.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
        log.error("[API ERROR] IllegalStateException occurred: {}", ex.getMessage());
        if ("ACCOUNT_DISABLED".equals(ex.getMessage())) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "ERROR");
            error.put("code", "ACCOUNT_DISABLED");
            error.put("message", "حساب کاربری شما غیرفعال شده است");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }
        Map<String, Object> error = new HashMap<>();
        error.put("status", "ERROR");
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        log.error("[API ERROR] IllegalArgumentException occurred: {}", ex.getMessage());
        Map<String, Object> error = new HashMap<>();
        error.put("status", "ERROR");
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getAllErrors().isEmpty()
                ? "Validation error"
                : ex.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        log.error("[API ERROR] Validation failed: {}", message);
        Map<String, Object> error = new HashMap<>();
        error.put("status", "ERROR");
        error.put("message", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneralException(Exception ex) {
        log.error("[API UNHANDLED EXCEPTION] Unhandled exception occurred: {}", ex.getMessage(), ex);
        Map<String, Object> error = new HashMap<>();
        error.put("status", "ERROR");
        error.put("message", ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
