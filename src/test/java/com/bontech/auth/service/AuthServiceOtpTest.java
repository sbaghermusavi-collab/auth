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

    @Test
    @DisplayName("Should allow impersonation when actor is TenantAdmin with ADMIN role in same tenant")
    void testImpersonateSuccess() {
        com.bontech.auth.entity.Role adminRole = new com.bontech.auth.entity.Role();
        adminRole.setCode("ADMIN");

        UserAccount adminActor = new UserAccount();
        adminActor.setId(1L);
        adminActor.setUsername("adminuser");
        adminActor.setTenantId(100L);
        adminActor.setRoles(java.util.Set.of(adminRole));

        UserAccount targetUser = new UserAccount();
        targetUser.setId(2L);
        targetUser.setUsername("targetuser");
        targetUser.setTenantId(100L);

        when(userAccountRepository.findByUsername("adminuser")).thenReturn(Optional.of(adminActor));
        when(userAccountRepository.findByUsername("targetuser")).thenReturn(Optional.of(targetUser));
        when(jwtService.generate(eq(targetUser), eq("adminuser"))).thenReturn("impersonated_token");
        when(jwtService.generateRefreshToken(eq(targetUser))).thenReturn("impersonated_refresh");

        AuthDto.ImpersonateRequest request = new AuthDto.ImpersonateRequest("adminuser", "targetuser");
        AuthDto.TokenResponse response = authService.impersonate(request);

        assertNotNull(response);
        assertEquals("impersonated_token", response.accessToken());
    }

    @Test
    @DisplayName("Should reject impersonation when actor does not have ADMIN role")
    void testImpersonateFailsNonAdmin() {
        com.bontech.auth.entity.Role userRole = new com.bontech.auth.entity.Role();
        userRole.setCode("USER");

        UserAccount regularActor = new UserAccount();
        regularActor.setId(1L);
        regularActor.setUsername("regularuser");
        regularActor.setTenantId(100L);
        regularActor.setRoles(java.util.Set.of(userRole));

        UserAccount targetUser = new UserAccount();
        targetUser.setId(2L);
        targetUser.setUsername("targetuser");
        targetUser.setTenantId(100L);

        when(userAccountRepository.findByUsername("regularuser")).thenReturn(Optional.of(regularActor));
        when(userAccountRepository.findByUsername("targetuser")).thenReturn(Optional.of(targetUser));

        AuthDto.ImpersonateRequest request = new AuthDto.ImpersonateRequest("regularuser", "targetuser");
        assertThrows(IllegalArgumentException.class, () -> authService.impersonate(request));
    }

    @Test
    @DisplayName("Should reject impersonation when target user belongs to a different tenant")
    void testImpersonateFailsDifferentTenant() {
        com.bontech.auth.entity.Role adminRole = new com.bontech.auth.entity.Role();
        adminRole.setCode("ADMIN");

        UserAccount adminActor = new UserAccount();
        adminActor.setId(1L);
        adminActor.setUsername("adminuser");
        adminActor.setTenantId(100L);
        adminActor.setRoles(java.util.Set.of(adminRole));

        UserAccount otherTenantTarget = new UserAccount();
        otherTenantTarget.setId(2L);
        otherTenantTarget.setUsername("othertarget");
        otherTenantTarget.setTenantId(200L);

        when(userAccountRepository.findByUsername("adminuser")).thenReturn(Optional.of(adminActor));
        when(userAccountRepository.findByUsername("othertarget")).thenReturn(Optional.of(otherTenantTarget));

        AuthDto.ImpersonateRequest request = new AuthDto.ImpersonateRequest("adminuser", "othertarget");
        assertThrows(IllegalArgumentException.class, () -> authService.impersonate(request));
    }
}
