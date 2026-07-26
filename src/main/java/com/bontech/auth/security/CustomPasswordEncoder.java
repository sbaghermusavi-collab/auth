package com.bontech.auth.security;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;


@Component
public class CustomPasswordEncoder implements PasswordEncoder {

    private static final String SALT = "SCourtMScaleS";
    private final BCryptPasswordEncoder bcryptFallback = new BCryptPasswordEncoder();

    public String encode(String username, String password) {
        if (password == null) {
            return null;
        }
        String uname = username != null ? username : "";
        String md5Username = hashMD5(uname);
        String md5Password = hashMD5(password);
        String combined = md5Username + SALT + md5Password;
        return hashSHA256(combined);
    }

    public boolean matches(String username, String rawPassword, String encodedPassword) {
        if (rawPassword == null || encodedPassword == null) {
            return false;
        }
        String clean = stripPrefix(encodedPassword);
        if (isBcryptHash(clean)) {
            return bcryptFallback.matches(rawPassword, clean);
        }
        String calculated = encode(username, rawPassword);
        return calculated.equalsIgnoreCase(clean);
    }

    @Override
    public String encode(CharSequence rawPassword) {
        if (rawPassword == null) return null;
        return bcryptFallback.encode(rawPassword);
    }

    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        if (rawPassword == null || encodedPassword == null) {
            return false;
        }
        String clean = stripPrefix(encodedPassword);
        if (isBcryptHash(clean)) {
            return bcryptFallback.matches(rawPassword, clean);
        }
        return encode("", rawPassword.toString()).equalsIgnoreCase(clean);
    }

    private boolean isBcryptHash(String hash) {
        String clean = stripPrefix(hash);
        return clean.startsWith("$2a$") || clean.startsWith("$2b$") || clean.startsWith("$2y$");
    }

    private String stripPrefix(String hash) {
        if (hash != null && hash.startsWith("{") && hash.contains("}")) {
            return hash.substring(hash.indexOf("}") + 1);
        }
        return hash;
    }

    public static String hashMD5(String input) {
        if (input == null) input = "";
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("MD5 algorithm not available", e);
        }
    }

    public static String hashSHA256(String input) {
        if (input == null) input = "";
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
