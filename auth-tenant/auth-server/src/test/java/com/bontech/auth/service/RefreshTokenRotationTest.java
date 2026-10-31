package com.bontech.auth.service;

import com.bontech.auth.dto.AuthDto;
import com.bontech.auth.entity.UserAccount;
import com.bontech.auth.repository.RefreshTokenRecordRepository;
import com.bontech.auth.repository.UserAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class RefreshTokenRotationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private RefreshTokenRecordRepository refreshTokenRecordRepository;

    @Autowired
    private com.bontech.auth.repository.RoleRepository roleRepository;

    private UserAccount testUser;

    @BeforeEach
    void setUp() {
        refreshTokenRecordRepository.deleteAll();

        String uniqueUsername = "rotation_user_" + UUID.randomUUID().toString().substring(0, 8);

        com.bontech.auth.entity.Role adminRole = roleRepository.findByCodeAndTenantId("ADMIN", 1L)
                .orElseGet(() -> roleRepository.save(com.bontech.auth.entity.Role.builder()
                        .code("ADMIN")
                        .tenantId(1L)
                        .permissions(new java.util.LinkedHashSet<>())
                        .build()));

        java.util.Set<com.bontech.auth.entity.Role> roles = new java.util.LinkedHashSet<>();
        roles.add(adminRole);

        testUser = userAccountRepository.save(UserAccount.builder()
                .username(uniqueUsername)
                .passwordHash("dummy_hash")
                .systemUser(false)
                .tenantId(1L)
                .roles(roles)
                .profileCompleted(true)
                .passwordExpiresAt(Instant.now().plus(90, ChronoUnit.DAYS))
                .passwordChangeRequired(false)
                .build());
    }

    @Test
    void testSuccessfulRotation() {
        // Step 1: Initial token generation
        AuthDto.TokenResponse loginRes = authService.impersonate(new AuthDto.ImpersonateRequest(testUser.getUsername(), testUser.getUsername()));
        String r1 = loginRes.refreshToken();
        assertThat(r1).isNotNull();

        // Step 2: First refresh with r1 -> should succeed and return r2
        AuthDto.TokenResponse res2 = authService.refresh(new AuthDto.RefreshTokenRequest(r1));
        String r2 = res2.refreshToken();
        assertThat(r2).isNotNull();
        assertThat(r2).isNotEqualTo(r1);

        // Step 3: Second refresh with r2 -> should succeed and return r3
        AuthDto.TokenResponse res3 = authService.refresh(new AuthDto.RefreshTokenRequest(r2));
        String r3 = res3.refreshToken();
        assertThat(r3).isNotNull();
        assertThat(r3).isNotEqualTo(r2);
    }

    @Test
    void testReuseDetectionRevokesFamily() {
        // Step 1: Initial token
        AuthDto.TokenResponse loginRes = authService.impersonate(new AuthDto.ImpersonateRequest(testUser.getUsername(), testUser.getUsername()));
        String r1 = loginRes.refreshToken();

        // Step 2: Legitimate rotation (r1 -> r2)
        AuthDto.TokenResponse res2 = authService.refresh(new AuthDto.RefreshTokenRequest(r1));
        String r2 = res2.refreshToken();
        assertThat(r2).isNotNull();

        // Step 3: Attacker tries to reuse r1 -> MUST throw SecurityException
        assertThatThrownBy(() -> authService.refresh(new AuthDto.RefreshTokenRequest(r1)))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("Refresh token reuse detected");

        // Step 4: Legitimate user tries to use r2 -> must also fail because family was revoked!
        assertThatThrownBy(() -> authService.refresh(new AuthDto.RefreshTokenRequest(r2)))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("Refresh token reuse detected");
    }
}
