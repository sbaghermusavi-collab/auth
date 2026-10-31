package com.asanak.proxy.security;

public enum ErrorsStatus {
    SUCCESS(0, "SUCCESS"),
    NOT_FOUND(404, "NOT_FOUND"),
    FORBIDDEN(403, "FORBIDDEN"),
    USERNAME_EXISTS(100, "username already exists"),
    PROFILE_CHANGE_NOT_ALLOWED(101, "you cannot change your profile!"),
    UNKNOWN_ERROR(1, "UNKNOWN ERROR");
    private int code;
    private String message;

    ErrorsStatus(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}