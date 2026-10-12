package com.bontech.auth.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

class CustomPasswordEncoderTest {

    private CustomPasswordEncoder encoder;

    @BeforeEach
    void setUp() {
        encoder = new CustomPasswordEncoder();
    }

    @Test
    @DisplayName("Should encode password using MD5 and SHA-256 with custom salt")
    void testEncodePassword() {
        String username = "admin";
        String password = "Password123";

        String md5Username = CustomPasswordEncoder.hashMD5(username);
        String md5Password = CustomPasswordEncoder.hashMD5(password);
        String combined = md5Username + "SCourtMScaleS" + md5Password;
        String expectedHash = CustomPasswordEncoder.hashSHA256(combined);

        String actualHash = encoder.encode(username, password);
        assertEquals(expectedHash, actualHash);
    }

    @Test
    @DisplayName("Should match correct password for given username")
    void testMatchesSuccess() {
        String username = "user";
        String password = "Password123";

        String encoded = encoder.encode(username, password);
        assertTrue(encoder.matches(username, password, encoded));
    }

    @Test
    @DisplayName("Should fail matching wrong password or wrong username")
    void testMatchesFailure() {
        String username = "testuser";
        String password = "SecretPassword!1";

        String encoded = encoder.encode(username, password);
        assertFalse(encoder.matches(username, "WrongPassword", encoded));
        assertFalse(encoder.matches("otheruser", password, encoded));
    }

    @Test
    @DisplayName("Should use BCrypt for 1-arg encode calls (client secrets)")
    void testClientSecretEncodeWithBcrypt() {
        String clientSecret = "auth-secret";
        String encoded = encoder.encode(clientSecret);

        assertTrue(encoded.startsWith("$2a$") || encoded.startsWith("$2b$"));
        assertTrue(encoder.matches(clientSecret, encoded));
    }

    @Test
    @DisplayName("Should fallback to BCrypt matching for legacy BCrypt hashes")
    void testBcryptFallback() {
        BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder();
        String bcryptHash = bcrypt.encode("LegacyPassword");

        assertTrue(encoder.matches("anyuser", "LegacyPassword", bcryptHash));
        assertFalse(encoder.matches("anyuser", "WrongPassword", bcryptHash));
    }
}
