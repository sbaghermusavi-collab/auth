package com.bontech.auth.service;

import com.bontech.auth.dto.AuthDto;
import com.bontech.auth.entity.PasswordHistory;
import com.bontech.auth.entity.Role;
import com.bontech.auth.entity.TwoStepChallenge;
import com.bontech.auth.entity.UserAccount;
import com.bontech.auth.entity.UserPhoneNumber;
import com.bontech.auth.entity.UserSession;
import com.bontech.auth.repository.PasswordHistoryRepository;
import com.bontech.auth.repository.TwoStepChallengeRepository;
import com.bontech.auth.repository.UserAccountRepository;
import com.bontech.auth.repository.UserPhoneNumberRepository;
import com.bontech.auth.repository.UserSessionRepository;
import com.bontech.auth.security.JwtService;
import com.bontech.auth.security.SessionAuthenticationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.security.SecureRandom;
import com.bontech.auth.security.CustomPasswordEncoder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    private final UserPhoneNumberRepository phoneRepository;
    private final TwoStepChallengeRepository challengeRepository;
    private final UserSessionRepository sessionRepository;
    private final PasswordHistoryRepository passwordHistoryRepository;
    private final UserAccountRepository userAccountRepository;
    private final CustomPasswordEncoder encoder;
    private final CaptchaService captchaService;
    private final SmsService smsService;
    private final JwtService jwtService;
    private final ActivityLogService logService;
    private final SessionAuthenticationService sessionAuthenticationService;
    private static final SecureRandom OTP_RANDOM = new SecureRandom();

    private final OtpService otpService;
    private final com.bontech.auth.config.AppProperties properties;

    @Transactional
    public AuthDto.LoginStartResponse loginStepOne(AuthDto.LoginStartRequest request,
                                                    HttpServletRequest httpRequest,
                                                    HttpServletResponse httpResponse) {
        if (properties.getAuth().isCaptchaEnabled()) {
            if (request.captchaToken() == null || !captchaService.validate(request.captchaId(), request.captchaToken())) {
                throw new IllegalArgumentException("Captcha validation failed");
            }
        }

        UserAccount user = findUserByIdentifier(request.identifier());

        if (properties.getAuth().isPasswordEnabled()) {
            if (request.password() == null || request.password().isBlank() || !encoder.matches(user.getUsername(), request.password(), user.getPasswordHash())) {
                throw new IllegalArgumentException("Invalid username or password");
            }
        }

        List<UserPhoneNumber> phones = phoneRepository.findByUser_Username(user.getUsername());
        if (phones.isEmpty() && properties.getAuth().isOtpEnabled()) {
            throw new IllegalArgumentException("No phone numbers found");
        }
        boolean passwordChangeRequired = isPasswordChangeRequired(user);

        if (!properties.getAuth().isOtpEnabled()) {
             if (passwordChangeRequired) {
                 logService.log(user, "PASSWORD_EXPIRED", "Password expired; change password required");
                 return new AuthDto.LoginStartResponse(
                         "PASSWORD_CHANGE_REQUIRED",
                         "Password change required",
                         phones.stream().map(p -> new AuthDto.MaskedPhone(mask(p.getPhoneNumber()), p.getNationalCode())).toList(),
                         true, null, null, null, null
                 );
             }

             String token = jwtService.generate(user, null);
             String refreshToken = jwtService.generateRefreshToken(user);
             saveSession(user, token);

             sessionAuthenticationService.establishSession(httpRequest, httpResponse, user);
             String redirectUrl = sessionAuthenticationService.resolveRedirectUrl(httpRequest, httpResponse, "http://localhost:8090/");

             logService.log(user, "LOGIN_SUCCESS", "Login successful (OTP disabled)");
             return new AuthDto.LoginStartResponse(
                    "SUCCESS",
                    "Login successful",
                    phones.stream().map(p -> new AuthDto.MaskedPhone(mask(p.getPhoneNumber()), p.getNationalCode())).toList(),
                    passwordChangeRequired,
                    token,
                    refreshToken,
                    jwtService.getExpirationSeconds(),
                    redirectUrl
             );
        }

        UserPhoneNumber target = phones.stream().filter(UserPhoneNumber::isPreferredNumber).findFirst().orElse(phones.getFirst());

        if (request.deliveryMethod() != null && !request.deliveryMethod().isBlank()) {
            otpService.createAndSendChallenge(user, target, request.deliveryMethod());
            logService.log(user, "LOGIN_STEP_1", "Validated; OTP sent via " + request.deliveryMethod());
            return new AuthDto.LoginStartResponse(
                    "OTP_SENT",
                    "Two-step code sent",
                    phones.stream().map(p -> new AuthDto.MaskedPhone(mask(p.getPhoneNumber()), p.getNationalCode())).toList(),
                    passwordChangeRequired,
                    null, null, null, null
            );
        }

        logService.log(user, "LOGIN_STEP_1", "Validated; delivery method selection required");
        return new AuthDto.LoginStartResponse(
                "NEED_DELIVERY_METHOD",
                "Please select delivery method",
                phones.stream().map(p -> new AuthDto.MaskedPhone(mask(p.getPhoneNumber()), p.getNationalCode())).toList(),
                passwordChangeRequired,
                null, null, null, null
        );
    }

    @Transactional
    public AuthDto.SelectPhoneResponse sendOtp(AuthDto.SendOtpRequest request) {
        UserAccount user = findUserByIdentifier(request.identifier());

        List<UserPhoneNumber> phones = phoneRepository.findByUser_Username(user.getUsername());
        if (phones.isEmpty()) {
            throw new IllegalArgumentException("No phone numbers found");
        }
        
        UserPhoneNumber target;
        if (request.phone() != null && !request.phone().isBlank()) {
            target = phones.stream()
                    .filter(p -> p.getPhoneNumber().replaceAll("[^0-9]", "").contains(request.phone().replaceAll("[^0-9]", "")))
                    .findFirst()
                    .orElse(phones.getFirst());
        } else {
            target = phones.stream().filter(UserPhoneNumber::isPreferredNumber).findFirst().orElse(phones.getFirst());
        }

        String deliveryMethod = (request.deliveryMethod() != null && !request.deliveryMethod().isBlank()) ? request.deliveryMethod() : "sms";
        otpService.createAndSendChallenge(user, target, deliveryMethod);
        logService.log(user, "OTP_DISPATCHED", "OTP sent via " + deliveryMethod);

        boolean passwordChangeRequired = isPasswordChangeRequired(user);
        return new AuthDto.SelectPhoneResponse("OTP_SENT", "Two-step code sent via " + deliveryMethod, passwordChangeRequired);
    }

    @Transactional
    public AuthDto.SelectPhoneResponse selectPhone(AuthDto.SelectPhoneRequest request) {
        UserAccount user = findUserByIdentifier(request.identifier());

        List<UserPhoneNumber> phones = phoneRepository.findByUser_Username(user.getUsername());
        if (phones.isEmpty()) {
            throw new IllegalArgumentException("No phone numbers found");
        }
        UserPhoneNumber target;
        if (phones.size() == 1) {
            target = phones.getFirst();
        } else {
            target = phones.stream()
                    .filter(p -> request.nationalCode().equalsIgnoreCase(p.getNationalCode()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Invalid national code for user"));
        }
        otpService.createAndSendChallenge(user, target, "sms");
        logService.log(user, "LOGIN_STEP_1", "Phone selected; OTP sent");

        boolean passwordChangeRequired = isPasswordChangeRequired(user);
        return new AuthDto.SelectPhoneResponse("OTP_SENT", "Two-step code sent", passwordChangeRequired);
    }

    @Transactional
    public AuthDto.TokenResponse verifySecondStep(AuthDto.TwoStepVerifyRequest request,
                                                   HttpServletRequest httpRequest,
                                                   HttpServletResponse httpResponse) {
        UserAccount user = findUserByIdentifier(request.identifier());

        otpService.verifyChallenge(user, request.code());

        if (isPasswordChangeRequired(user)) {
            logService.log(user, "PASSWORD_EXPIRED", "Password expired; change password required");
            return new AuthDto.TokenResponse("PASSWORD_CHANGE_REQUIRED", null, "None", 0, null);
        }

        String token = jwtService.generate(user, null);
        String refreshToken = jwtService.generateRefreshToken(user);
        saveSession(user, token);

        sessionAuthenticationService.establishSession(httpRequest, httpResponse, user);
        String redirectUrl = sessionAuthenticationService.resolveRedirectUrl(httpRequest, httpResponse, "http://localhost:8090/");

        logService.log(user, "LOGIN_SUCCESS", "Second step validated");
        return new AuthDto.TokenResponse(token, refreshToken, "Bearer", jwtService.getExpirationSeconds(), redirectUrl);
    }

    @Transactional
    public AuthDto.TokenResponse changeExpiredPassword(AuthDto.ChangeExpiredPasswordRequest request,
                                                         HttpServletRequest httpRequest,
                                                         HttpServletResponse httpResponse) {
        UserAccount user = findUserByIdentifier(request.identifier());

        if (!encoder.matches(user.getUsername(), request.currentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is invalid");
        }

        List<PasswordHistory> last3 = passwordHistoryRepository.findTop3ByUser_UsernameOrderByCreatedAtDesc(user.getUsername());
        boolean reused = last3.stream().anyMatch(p -> encoder.matches(user.getUsername(), request.newPassword(), p.getPasswordHash()));
        if (reused) {
            throw new IllegalArgumentException("New password cannot match last 3 passwords");
        }

        String newHash = encoder.encode(user.getUsername(), request.newPassword());
        user.setPasswordHash(newHash);
        user.setPasswordChangeRequired(false);
        user.setPasswordExpiresAt(Instant.now().plus(90, ChronoUnit.DAYS));

        PasswordHistory history = new PasswordHistory();
        history.setUserId(user.getId());
        history.setPasswordHash(newHash);
        history.setTenantId(user.getTenantId());
        passwordHistoryRepository.save(history);
        logService.log(user, "PASSWORD_CHANGED", "Password changed after expiry/login flow");

        String token = jwtService.generate(user, null);
        String refreshToken = jwtService.generateRefreshToken(user);
        saveSession(user, token);

        sessionAuthenticationService.establishSession(httpRequest, httpResponse, user);
        String redirectUrl = sessionAuthenticationService.resolveRedirectUrl(httpRequest, httpResponse, "http://localhost:8090/");

        return new AuthDto.TokenResponse(token, refreshToken, "Bearer", jwtService.getExpirationSeconds(), redirectUrl);
    }

    @Transactional
    public AuthDto.TokenResponse resetPassword(AuthDto.ResetPasswordRequest request,
                                               HttpServletRequest httpRequest,
                                               HttpServletResponse httpResponse) {
        UserAccount user = findUserByIdentifier(request.identifier());

        List<PasswordHistory> last3 = passwordHistoryRepository.findTop3ByUser_UsernameOrderByCreatedAtDesc(user.getUsername());
        boolean reused = last3.stream().anyMatch(p -> encoder.matches(user.getUsername(), request.newPassword(), p.getPasswordHash()));
        if (reused) {
            throw new IllegalArgumentException("New password cannot match last 3 passwords");
        }

        String newHash = encoder.encode(user.getUsername(), request.newPassword());
        user.setPasswordHash(newHash);
        user.setPasswordChangeRequired(false);
        user.setPasswordExpiresAt(Instant.now().plus(90, ChronoUnit.DAYS));

        PasswordHistory history = new PasswordHistory();
        history.setUserId(user.getId());
        history.setPasswordHash(newHash);
        history.setTenantId(user.getTenantId());
        passwordHistoryRepository.save(history);
        logService.log(user, "PASSWORD_RESET", "Password reset successfully");

        String token = jwtService.generate(user, null);
        String refreshToken = jwtService.generateRefreshToken(user);
        saveSession(user, token);

        sessionAuthenticationService.establishSession(httpRequest, httpResponse, user);
        String redirectUrl = sessionAuthenticationService.resolveRedirectUrl(httpRequest, httpResponse, "http://localhost:8090/");

        return new AuthDto.TokenResponse(token, refreshToken, "Bearer", jwtService.getExpirationSeconds(), redirectUrl);
    }


    private UserAccount findUserByIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new IllegalArgumentException("Invalid username or password");
        }
        return userAccountRepository.findByUsername(identifier)
                .orElseGet(() -> phoneRepository.findByPhoneNumber(identifier)
                        .map(UserPhoneNumber::getUser)
                        .orElseThrow(() -> new IllegalArgumentException("Invalid username or password")));
    }

    private String mask(String phone) {
        if (phone.length() < 4) return "****";
        return "*".repeat(phone.length() - 4) + phone.substring(phone.length() - 4);
    }

    private boolean isPasswordChangeRequired(UserAccount user) {
        Instant expiresAt = user.getPasswordExpiresAt();
        return user.isPasswordChangeRequired() || expiresAt == null || !expiresAt.isAfter(Instant.now());
    }

    private void saveSession(UserAccount user, String token) {
        UserSession session = new UserSession();
        session.setUserId(user.getId());
        session.setSessionTokenId(jwtService.extractTokenId(token));
        session.setExpiresAt(Instant.now().plusSeconds(jwtService.getExpirationSeconds()));
        session.setActive(true);
        session.setTenantId(user.getTenantId());
        sessionRepository.save(session);
    }

    private void sendOtp(String phone, String code) {
        log.info("==========================================");
        log.info(" [OTP SERVICE LOG] Phone: {} | Code: {}", phone, code);
        log.info("==========================================");
    }

    private void createAndSendChallenge(UserAccount user, UserPhoneNumber target, String deliveryMethod) {
        String code = String.format("%06d", OTP_RANDOM.nextInt(1_000_000));
        TwoStepChallenge challenge = new TwoStepChallenge();
        challenge.setUserId(user.getId());
        challenge.setCode(code);
        challenge.setTargetPhone(target.getPhoneNumber());
        challenge.setExpiresAt(Instant.now().plusSeconds(180));
        challenge.setUsed(false);
        challenge.setTenantId(user.getTenantId());
        challengeRepository.save(challenge);

        // Use deliveryMethod if needed (e.g. "voice" vs "sms")
        // For now, smsService.sendCode is used for both or we can switch if we add voice.
        sendOtp(target.getPhoneNumber(), code);
        smsService.sendCode(target.getPhoneNumber(), code);
    }

    @Transactional
    public AuthDto.TokenResponse impersonate(AuthDto.ImpersonateRequest request) {
        UserAccount actor = findUserByIdentifier(request.actorUsername());
        UserAccount target = findUserByIdentifier(request.targetUsername());

        boolean isTenantAdmin = actor.getRoles().stream()
                .map(Role::getCode)
                .anyMatch(code -> "ADMIN".equalsIgnoreCase(code)
                               || "TENANT_ADMIN".equalsIgnoreCase(code)
                               || "ROLE_ADMIN".equalsIgnoreCase(code)
                               || "ROLE_TENANT_ADMIN".equalsIgnoreCase(code));

        if (!isTenantAdmin) {
            throw new IllegalArgumentException("Only TenantAdmin (users with ADMIN role) can perform impersonation");
        }

        Long actorTenant = actor.getTenantId() != null ? actor.getTenantId() : (actor.getTenant() != null ? actor.getTenant().getId() : null);
        Long targetTenant = target.getTenantId() != null ? target.getTenantId() : (target.getTenant() != null ? target.getTenant().getId() : null);

        if (actorTenant == null || targetTenant == null || !actorTenant.equals(targetTenant)) {
            throw new IllegalArgumentException("TenantAdmin can only impersonate users within the same tenant");
        }

        String token = jwtService.generate(target, actor.getUsername());
        String refreshToken = jwtService.generateRefreshToken(target);
        logService.log(actor, "IMPERSONATE", "Impersonated " + target.getUsername());
        return new AuthDto.TokenResponse(token, refreshToken, "Bearer", jwtService.getExpirationSeconds(), null);
    }

    @Transactional
    public AuthDto.TokenResponse refresh(AuthDto.RefreshTokenRequest request) {
        org.springframework.security.oauth2.jwt.Jwt decodedToken;
        try {
            decodedToken = jwtService.decode(request.refreshToken());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid refresh token");
        }

        if (!"refresh".equals(decodedToken.getClaimAsString("type"))) {
            throw new IllegalArgumentException("Invalid token type");
        }

        String username = decodedToken.getSubject();
        UserAccount user = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (isPasswordChangeRequired(user)) {
            logService.log(user, "PASSWORD_EXPIRED", "Password expired; change password required during refresh");
            return new AuthDto.TokenResponse("PASSWORD_CHANGE_REQUIRED", null, "None", 0, null);
        }

        String token = jwtService.generate(user, null);
        String refreshToken = jwtService.generateRefreshToken(user);
        saveSession(user, token);

        logService.log(user, "REFRESH_SUCCESS", "Token refreshed successfully");
        return new AuthDto.TokenResponse(token, refreshToken, "Bearer", jwtService.getExpirationSeconds(), null);
    }
}
