package com.bontech.auth;

import com.bontech.auth.dto.AuthDto;
import com.bontech.auth.entity.Role;
import com.bontech.auth.entity.UserAccount;
import com.bontech.auth.repository.RoleRepository;
import com.bontech.auth.repository.UserAccountRepository;
import com.bontech.auth.repository.UserSessionRepository;
import com.bontech.auth.security.JwtService;
import com.bontech.auth.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthFeaturesIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserSessionRepository sessionRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthService authService;

    private UserAccount adminUser;
    private UserAccount standardUser;
    private String adminToken;
    private String standardToken;

    @BeforeEach
    void setUp() {
        Role adminRole = roleRepository.findByCodeAndTenantId("ADMIN", 1L)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .code("ADMIN")
                        .tenantId(1L)
                        .permissions(new LinkedHashSet<>())
                        .build()));

        Role userRole = roleRepository.findByCodeAndTenantId("CUSTOMER", 1L)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .code("CUSTOMER")
                        .tenantId(1L)
                        .permissions(new LinkedHashSet<>())
                        .build()));

        String adminUsername = "admin_" + UUID.randomUUID().toString().substring(0, 8);
        String standardUsername = "user_" + UUID.randomUUID().toString().substring(0, 8);

        adminUser = userAccountRepository.save(UserAccount.builder()
                .username(adminUsername)
                .passwordHash("dummy_hash")
                .systemUser(false)
                .tenantId(1L)
                .roles(new LinkedHashSet<>(Set.of(adminRole)))
                .profileCompleted(true)
                .passwordExpiresAt(Instant.now().plus(90, ChronoUnit.DAYS))
                .passwordChangeRequired(false)
                .build());

        standardUser = userAccountRepository.save(UserAccount.builder()
                .username(standardUsername)
                .passwordHash("dummy_hash")
                .systemUser(false)
                .tenantId(1L)
                .roles(new LinkedHashSet<>(Set.of(userRole)))
                .profileCompleted(false)
                .passwordExpiresAt(Instant.now().plus(90, ChronoUnit.DAYS))
                .passwordChangeRequired(false)
                .build());

        adminToken = jwtService.generate(adminUser, null);
        standardToken = jwtService.generate(standardUser, null);
    }

    @Test
    void testProfileCompletionFlow() throws Exception {
        // 1. Check profile status when incomplete
        mockMvc.perform(get("/api/auth/profile/status")
                        .header("Authorization", "Bearer " + standardToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileCompleted", is(false)))
                .andExpect(jsonPath("$.username", is(standardUser.getUsername())));

        // 2. Complete profile
        mockMvc.perform(post("/api/auth/profile/complete")
                        .header("Authorization", "Bearer " + standardToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "سید تست",
                                  "nationalCode": "0012345678",
                                  "email": "seyyed@test.ir"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileCompleted", is(true)));

        // 3. Verify in DB
        UserAccount updated = userAccountRepository.findByUsername(standardUser.getUsername()).orElseThrow();
        assertThat(updated.isProfileCompleted()).isTrue();
        assertThat(updated.getFullName()).isEqualTo("سید تست");
        assertThat(updated.getNationalCode()).isEqualTo("0012345678");
        assertThat(updated.getEmail()).isEqualTo("seyyed@test.ir");
    }

    @Test
    void testRfc8693ImpersonationAndRevert() throws Exception {
        // 1. Admin impersonates standard user
        String impersonateResult = mockMvc.perform(post("/api/auth/impersonate")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("{\"targetUsername\": \"%s\"}", standardUser.getUsername())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn().getResponse().getContentAsString();

        // Parse token
        var om = new com.fasterxml.jackson.databind.ObjectMapper();
        var resMap = om.readValue(impersonateResult, Map.class);
        String impersonatedToken = (String) resMap.get("accessToken");

        // Verify RFC 8693 `act` claim and `is_impersonated`
        var decoded = jwtService.decode(impersonatedToken);
        assertThat(decoded.getClaimAsString("username")).isEqualTo(standardUser.getUsername());
        assertThat(decoded.getClaimAsBoolean("is_impersonated")).isTrue();
        Map<String, Object> act = decoded.getClaim("act");
        assertThat(act).isNotNull();
        assertThat(act.get("username")).isEqualTo(adminUser.getUsername());

        // 2. Revert back to admin
        mockMvc.perform(post("/api/auth/impersonate/revert")
                        .header("Authorization", "Bearer " + impersonatedToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }

    @Test
    void testSessionManagementEndpoints() throws Exception {
        // 1. Get my sessions
        mockMvc.perform(get("/api/sessions/my")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // 2. Revoke all other sessions
        mockMvc.perform(delete("/api/sessions/all-other")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revokedCount").isNumber());
    }
}
