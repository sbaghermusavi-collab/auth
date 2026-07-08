package com.bontech.auth.service;

import com.bontech.auth.dto.AuthDto;
import com.bontech.auth.entity.PasswordHistory;
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
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Random;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserPhoneNumberRepository phoneRepository;
    private final TwoStepChallengeRepository challengeRepository;
    private final UserSessionRepository sessionRepository;
    private final PasswordHistoryRepository passwordHistoryRepository;
    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder encoder;
    private final CaptchaService captchaService;
    private final SmsService smsService;
    private final JwtService jwtService;
    private final ActivityLogService logService;
    private final com.bontech.auth.config.AppProperties properties;

    @Transactional
    public AuthDto.LoginStartResponse loginStepOne(AuthDto.LoginStartRequest request) {
        if (properties.getAuth().isCaptchaEnabled()) {
            if (request.captchaToken() == null || !captchaService.validate(request.captchaToken())) {
                throw new IllegalArgumentException("Captcha validation failed");
            }
        }

        UserAccount user = findUserByIdentifier(request.identifier());

        if (properties.getAuth().isPasswordEnabled()) {
            if (request.password() == null || !encoder.matches(request.password(), user.getPasswordHash())) {
                throw new IllegalArgumentException("Invalid username or password");
            }
        }

        List<UserPhoneNumber> phones = phoneRepository.findByUser_Username(user.getUsername());
        boolean passwordChangeRequired = user.isPasswordChangeRequired() || user.getPasswordExpiresAt().isBefore(Instant.now());

        if (!properties.getAuth().isOtpEnabled()) {
             // OTP is disabled, issue token immediately
             logService.log(user, "LOGIN_SUCCESS", "Login successful (OTP disabled)");
             return new AuthDto.LoginStartResponse(
                    "SUCCESS",
                    "Login successful",
                    phones.stream().map(p -> new AuthDto.MaskedPhone(mask(p.getPhoneNumber()), p.getNationalCode())).toList(),
                    passwordChangeRequired
             );
        }

        if (phones.size() > 1) {
            logService.log(user, "LOGIN_STEP_1", "Validated; awaiting national code");
            return new AuthDto.LoginStartResponse(
                    "NEED_NATIONAL_CODE",
                    "Multiple phone numbers found; select national code",
                    phones.stream().map(p -> new AuthDto.MaskedPhone(mask(p.getPhoneNumber()), p.getNationalCode())).toList(),
                    passwordChangeRequired
            );
        }

        UserPhoneNumber target = phones.stream().filter(UserPhoneNumber::isPreferredNumber).findFirst().orElse(phones.getFirst());
        createAndSendChallenge(user, target, request.deliveryMethod());
        logService.log(user, "LOGIN_STEP_1", "Validated; OTP sent");
        return new AuthDto.LoginStartResponse(
                "OTP_SENT",
                "Two-step code sent",
                phones.stream().map(p -> new AuthDto.MaskedPhone(mask(p.getPhoneNumber()), p.getNationalCode())).toList(),
                passwordChangeRequired
        );
    }

    @Transactional
    public AuthDto.SelectPhoneResponse selectPhone(AuthDto.SelectPhoneRequest request) {
        UserAccount user = findUserByIdentifier(request.identifier());

        List<UserPhoneNumber> phones = phoneRepository.findByUser_Username(user.getUsername());
        if (phones.isEmpty()) {
            throw new IllegalArgumentException("No phone numbers found");
        }
        if (phones.size() == 1) {
            UserPhoneNumber target = phones.getFirst();
            createAndSendChallenge(user, target, "sms");
            logService.log(user, "LOGIN_STEP_1", "Single phone detected; OTP sent");
        } else {
            UserPhoneNumber target = phones.stream()
                    .filter(p -> request.nationalCode().equalsIgnoreCase(p.getNationalCode()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Invalid national code for user"));
            createAndSendChallenge(user, target, "sms");
            logService.log(user, "LOGIN_STEP_1", "National code selected; OTP sent");
        }

        boolean passwordChangeRequired = user.isPasswordChangeRequired() || user.getPasswordExpiresAt().isBefore(Instant.now());
        return new AuthDto.SelectPhoneResponse("OTP_SENT", "Two-step code sent", passwordChangeRequired);
    }

    @Transactional
    public AuthDto.TokenResponse verifySecondStep(AuthDto.TwoStepVerifyRequest request) {
        UserAccount user = findUserByIdentifier(request.identifier());

        TwoStepChallenge challenge = challengeRepository.findByUser_UsernameAndCodeAndUsedFalse(user.getUsername(), request.code())
                .orElseThrow(() -> new IllegalArgumentException("Invalid challenge"));
        if (challenge.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Challenge expired");
        }

        challenge.setUsed(true);

        if (user.isPasswordChangeRequired() || user.getPasswordExpiresAt().isBefore(Instant.now())) {
            logService.log(user, "PASSWORD_EXPIRED", "Password expired; change password required");
            return new AuthDto.TokenResponse("PASSWORD_CHANGE_REQUIRED", "None", 0);
        }

        String token = jwtService.generate(user, null);
        UserSession session = new UserSession();
        session.setUserId(user.getId());
        session.setSessionTokenId(jwtService.extractTokenId(token));
        session.setExpiresAt(Instant.now().plusSeconds(jwtService.getExpirationSeconds()));
        session.setActive(true);
        session.setTenantId(user.getTenantId());
        sessionRepository.save(session);
        logService.log(user, "LOGIN_SUCCESS", "Second step validated");
        return new AuthDto.TokenResponse(token, "Bearer", jwtService.getExpirationSeconds());
    }

    @Transactional
    public void changeExpiredPassword(AuthDto.ChangeExpiredPasswordRequest request) {
        UserPhoneNumber phone = phoneRepository.findByPhoneNumber(request.phoneNumber())
                .orElseThrow(() -> new IllegalArgumentException("Phone not found"));
        UserAccount user = phone.getUser();

        if (!encoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is invalid");
        }

        List<PasswordHistory> last3 = passwordHistoryRepository.findTop3ByUser_UsernameOrderByCreatedAtDesc(user.getUsername());
        boolean reused = last3.stream().anyMatch(p -> encoder.matches(request.newPassword(), p.getPasswordHash()));
        if (reused) {
            throw new IllegalArgumentException("New password cannot match last 3 passwords");
        }

        String newHash = encoder.encode(request.newPassword());
        user.setPasswordHash(newHash);
        user.setPasswordChangeRequired(false);
        user.setPasswordExpiresAt(Instant.now().plus(90, ChronoUnit.DAYS));

        PasswordHistory history = new PasswordHistory();
        history.setUserId(user.getId());
        history.setPasswordHash(newHash);
        history.setTenantId(user.getTenantId());
        passwordHistoryRepository.save(history);

        logService.log(user, "PASSWORD_CHANGED", "Password changed after expiry/login flow");
    }


    private UserAccount findUserByIdentifier(String identifier) {
        return userAccountRepository.findByUsername(identifier)
                .orElseGet(() -> phoneRepository.findByPhoneNumber(identifier)
                        .map(UserPhoneNumber::getUser)
                        .orElseThrow(() -> new IllegalArgumentException("User not found")));
    }

    private String mask(String phone) {
        if (phone.length() < 4) return "****";
        return "*".repeat(phone.length() - 4) + phone.substring(phone.length() - 4);
    }

    private void createAndSendChallenge(UserAccount user, UserPhoneNumber target, String deliveryMethod) {
        String code = String.format("%06d", new Random().nextInt(999999));
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
        smsService.sendCode(target.getPhoneNumber(), code);
    }

    @Transactional
    public AuthDto.TokenResponse impersonate(AuthDto.ImpersonateRequest request) {
        UserPhoneNumber actorPhone = phoneRepository.findByUser_Username(request.actorUsername()).stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Actor not found"));
        UserPhoneNumber targetPhone = phoneRepository.findByUser_Username(request.targetUsername()).stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Target not found"));
        UserAccount actor = actorPhone.getUser();
        UserAccount target = targetPhone.getUser();

        String token = jwtService.generate(target, actor.getUsername());
        logService.log(actor, "IMPERSONATE", "Impersonated " + target.getUsername());
        return new AuthDto.TokenResponse(token, "Bearer", jwtService.getExpirationSeconds());
    }
}
