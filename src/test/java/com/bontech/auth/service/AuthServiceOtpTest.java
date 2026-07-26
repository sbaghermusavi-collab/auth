package com.bontech.auth.service;

import com.bontech.auth.config.AppProperties;
import com.bontech.auth.dto.AuthDto;
import com.bontech.auth.entity.TwoStepChallenge;
import com.bontech.auth.entity.UserAccount;
import com.bontech.auth.entity.UserPhoneNumber;
import com.bontech.auth.repository.*;
import com.bontech.auth.security.JwtService;
import com.bontech.auth.security.SessionAuthenticationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServiceOtpTest {

    @Mock
    private UserPhoneNumberRepository phoneRepository;
    @Mock
    private TwoStepChallengeRepository challengeRepository;
    @Mock
    private UserSessionRepository sessionRepository;
    @Mock
    private PasswordHistoryRepository passwordHistoryRepository;
    @Mock
    private UserAccountRepository userAccountRepository;
    @Mock
    private com.bontech.auth.security.CustomPasswordEncoder encoder;
    @Mock
    private CaptchaService captchaService;
    @Mock
    private SmsService smsService;
    @Mock
    private JwtService jwtService;
    @Mock
    private ActivityLogService logService;
    @Mock
    private SessionAuthenticationService sessionAuthenticationService;
    @Mock
    private AppProperties properties;
    @Mock
    private OtpService otpService;

    @InjectMocks
    private AuthService authService;

    private UserAccount testUser;
    private AppProperties.Auth authProperties;

    @BeforeEach
    void setUp() {
        testUser = new UserAccount();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setPasswordHash("hashed_pw");
        testUser.setPasswordExpiresAt(Instant.now().plusSeconds(3600));

        authProperties = new AppProperties.Auth();
        authProperties.setOtpEnabled(true);
        authProperties.setPasswordEnabled(true);
        authProperties.setCaptchaEnabled(false);
        authProperties.setTestMode(true);
        authProperties.setOtpExpirationSeconds(180);
        authProperties.setLoginInactivityTimeoutSeconds(180);
    }

    @Test
    @DisplayName("Should return NEED_DELIVERY_METHOD on initial loginStepOne when deliveryMethod is not specified")
    void testLoginStepOneReturnsNeedDeliveryMethod() {
        AuthDto.LoginStartRequest request = new AuthDto.LoginStartRequest("testuser", "raw_pw", null, null, null);
        UserPhoneNumber phone = new UserPhoneNumber();
        phone.setPhoneNumber("09123456789");
        phone.setPreferredNumber(true);

        when(properties.getAuth()).thenReturn(authProperties);
        when(userAccountRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(encoder.matches("testuser", "raw_pw", "hashed_pw")).thenReturn(true);
        when(phoneRepository.findByUser_Username("testuser")).thenReturn(List.of(phone));

        AuthDto.LoginStartResponse response = authService.loginStepOne(request, null, null);

        assertNotNull(response);
        assertEquals("NEED_DELIVERY_METHOD", response.status());
        verify(otpService, never()).createAndSendChallenge(any(), any(), any());
    }

    @Test
    @DisplayName("Should send OTP via OtpService when deliveryMethod is specified")
    void testSendOtpServiceIntegration() {
        AuthDto.SendOtpRequest request = new AuthDto.SendOtpRequest("testuser", "09123456789", "voice");
        UserPhoneNumber phone = new UserPhoneNumber();
        phone.setPhoneNumber("09123456789");

        when(userAccountRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(phoneRepository.findByUser_Username("testuser")).thenReturn(List.of(phone));

        AuthDto.SelectPhoneResponse response = authService.sendOtp(request);

        assertNotNull(response);
        assertEquals("OTP_SENT", response.status());
        verify(otpService, times(1)).createAndSendChallenge(eq(testUser), eq(phone), eq("voice"));
    }

    @Test
    @DisplayName("Should verify second step via OtpService")
    void testVerifySecondStepDelegatesToOtpService() {
        AuthDto.TwoStepVerifyRequest request = new AuthDto.TwoStepVerifyRequest("testuser", "999999");
        TwoStepChallenge challenge = new TwoStepChallenge();
        challenge.setCode("999999");
        challenge.setUsed(true);

        when(userAccountRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(otpService.verifyChallenge(testUser, "999999")).thenReturn(challenge);
        when(jwtService.generate(any(), any())).thenReturn("mock_token");
        when(jwtService.generateRefreshToken(any())).thenReturn("mock_refresh_token");

        AuthDto.TokenResponse response = authService.verifySecondStep(request, null, null);

        assertNotNull(response);
        assertEquals("mock_token", response.accessToken());
        verify(otpService, times(1)).verifyChallenge(testUser, "999999");
    }
}
