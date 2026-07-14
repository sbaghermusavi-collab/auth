package com.bontech.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import java.util.List;

public final class AuthDto {
    private AuthDto() {}

    public record RegistrationRequest(
            @NotBlank String tenantCode,
            @NotBlank String tenantName,
            @NotBlank String tenantBaseUrl,
            @NotBlank String username,
            @NotBlank @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,}$", message = "Password must have letters and numbers and min length 8") String password,
            boolean systemUser,
            @NotEmpty List<PhoneInput> phones,
            List<String> roleCodes
    ) {}

    public record PhoneInput(@NotBlank String phoneNumber, String nationalCode, boolean preferred) {}

    public record LoginStartRequest(@NotBlank String identifier, String password, String captchaId, String captchaToken, String deliveryMethod) {}

    public record LoginStartResponse(String status, String message, List<MaskedPhone> candidates, boolean passwordChangeRequired, String accessToken, String refreshToken, Long expiresIn) {}

    public record SelectPhoneRequest(@NotBlank String identifier, @NotBlank String nationalCode) {}

    public record SelectPhoneResponse(String status, String message, boolean passwordChangeRequired) {}

    public record MaskedPhone(String phone, String nationalCode) {}

    public record TwoStepVerifyRequest(@NotBlank String identifier, @NotBlank String code) {}

    public record TokenResponse(String accessToken, String refreshToken, String tokenType, long expiresIn) {}

    public record RefreshTokenRequest(@NotBlank String refreshToken) {}

    public record ImpersonateRequest(@NotBlank String actorUsername, @NotBlank String targetUsername) {}

    public record ChangeExpiredPasswordRequest(
            @NotBlank String phoneNumber,
            @NotBlank String currentPassword,
            @NotBlank @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,}$", message = "Password must have letters and numbers and min length 8") String newPassword
    ) {}
}
