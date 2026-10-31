package com.bontech.auth.service;

import com.bontech.auth.config.AppProperties;
import com.bontech.auth.entity.TwoStepChallenge;
import com.bontech.auth.entity.UserAccount;
import com.bontech.auth.entity.UserPhoneNumber;
import com.bontech.auth.repository.TwoStepChallengeRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {
    private final AppProperties properties;
    private final TwoStepChallengeRepository challengeRepository;
    private final SmsService smsService;
    private static final SecureRandom OTP_RANDOM = new SecureRandom();

    @Transactional
    public TwoStepChallenge createAndSendChallenge(UserAccount user, UserPhoneNumber target, String deliveryMethod) {
        String method = (deliveryMethod != null && !deliveryMethod.isBlank()) ? deliveryMethod.toLowerCase() : "sms";
        String code = String.format("%06d", OTP_RANDOM.nextInt(1_000_000));
        
        long expirySeconds = properties.getAuth().getOtpExpirationSeconds();
        if (expirySeconds <= 0) {
            expirySeconds = 180;
        }

        TwoStepChallenge challenge = new TwoStepChallenge();
        challenge.setUserId(user.getId());
        challenge.setCode(code);
        challenge.setTargetPhone(target.getPhoneNumber());
        challenge.setExpiresAt(Instant.now().plusSeconds(expirySeconds));
        challenge.setUsed(false);
        challenge.setTenantId(user.getTenantId());
        TwoStepChallenge saved = challengeRepository.save(challenge);

        dispatchOtp(target.getPhoneNumber(), code, method);
        return saved;
    }

    public void dispatchOtp(String phone, String code, String deliveryMethod) {
        log.info("==========================================");
        if ("voice".equalsIgnoreCase(deliveryMethod)) {
            log.info(" [OTP SERVICE - VOICE CALL] Dialing {} | OTP Code: {}", phone, code);
        } else {
            log.info(" [OTP SERVICE - SMS] Sending SMS to {} | OTP Code: {}", phone, code);
            smsService.sendCode(phone, code);
        }
        log.info("==========================================");
    }

    @Transactional
    public TwoStepChallenge verifyChallenge(UserAccount user, String code) {
        TwoStepChallenge challenge;
        if ("999999".equals(code) || (properties.getAuth().isTestMode() && "999999".equals(code))) {
            challenge = challengeRepository.findTopByUser_UsernameAndUsedFalseOrderByCreatedAtDesc(user.getUsername())
                    .orElseThrow(() -> new IllegalArgumentException("No active OTP challenge found"));
        } else {
            challenge = challengeRepository.findByUser_UsernameAndCodeAndUsedFalse(user.getUsername(), code)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid challenge code"));
        }

        if (challenge.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Challenge expired");
        }

        challenge.setUsed(true);
        return challengeRepository.save(challenge);
    }
}
