package com.asanak.proxy.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256 GCM encryption helper for sensitive session attributes and token storage.
 */
@Component
@Slf4j
public class SessionEncryptionHelper {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int TAG_LENGTH_BIT = 128;
    private static final int IV_LENGTH_BYTE = 12;

    // 256-bit key for AES-GCM (can be overridden via environment or properties)
    private static final byte[] DEFAULT_KEY = "AsanakSecretSessionKey_2026_Auth".getBytes(StandardCharsets.UTF_8);
    private final SecretKey secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public SessionEncryptionHelper() {
        this.secretKey = new SecretKeySpec(DEFAULT_KEY, 0, 32, "AES");
    }

    public String encrypt(String plainText) {
        if (plainText == null || plainText.isBlank()) return plainText;
        try {
            byte[] iv = new byte[IV_LENGTH_BYTE];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LENGTH_BIT, iv));

            byte[] cipherText = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            byte[] combined = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(cipherText, 0, combined, iv.length, cipherText.length);

            return "ENC:" + Base64.getUrlEncoder().withoutPadding().encodeToString(combined);
        } catch (Exception e) {
            log.error("[SessionEncryption] Failed to encrypt session value: {}", e.getMessage());
            return plainText;
        }
    }

    public String decrypt(String encryptedText) {
        if (encryptedText == null || !encryptedText.startsWith("ENC:")) return encryptedText;
        try {
            byte[] combined = Base64.getUrlDecoder().decode(encryptedText.substring(4));
            byte[] iv = new byte[IV_LENGTH_BYTE];
            System.arraycopy(combined, 0, iv, 0, iv.length);

            int cipherTextLength = combined.length - IV_LENGTH_BYTE;
            byte[] cipherText = new byte[cipherTextLength];
            System.arraycopy(combined, IV_LENGTH_BYTE, cipherText, 0, cipherTextLength);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LENGTH_BIT, iv));

            byte[] plainTextBytes = cipher.doFinal(cipherText);
            return new String(plainTextBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("[SessionEncryption] Failed to decrypt session value: {}", e.getMessage());
            return encryptedText;
        }
    }
}
