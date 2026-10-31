package com.bontech.auth.service;

import com.bontech.auth.entity.Role;
import com.bontech.auth.entity.UserAccount;
import com.bontech.auth.event.UserSignedUpEvent;
import com.bontech.auth.repository.RoleRepository;
import com.bontech.auth.repository.UserAccountRepository;
import com.bontech.auth.security.CustomPasswordEncoder;
import com.bontech.auth.security.JwtService;
import com.bontech.auth.tenantmanagement.service.TenantAdminProvisioner;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class DefaultTenantAdminProvisioner implements TenantAdminProvisioner {

    private final UserAccountRepository userAccountRepository;
    private final RoleRepository roleRepository;
    private final com.bontech.auth.repository.UserPhoneNumberRepository userPhoneNumberRepository;
    private final com.bontech.auth.repository.TenantPermissionGroupRepository tenantPermissionGroupRepository;
    private final com.bontech.auth.repository.TenantPermissionRepository tenantPermissionRepository;
    private final com.bontech.auth.repository.TenantRepository tenantRepository;
    private final CustomPasswordEncoder passwordEncoder;
    private final UserEventPublisher userEventPublisher;
    private final JwtService jwtService;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void provisionTenantAdmin(Long tenantId, String tenantCode, String username, String password, String email, String fullName) {
        log.info("[TenantAdminProvisioner] Provisioning admin '{}' for tenant '{}' (id: {})", username, tenantCode, tenantId);

        // Find or create ADMIN & TENANT_ADMIN roles for this tenant
        Role adminRole = roleRepository.findByCodeAndTenantId("ADMIN", tenantId)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .code("ADMIN")
                        .tenantId(tenantId)
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .version(0L)
                        .permissions(new HashSet<>())
                        .build()));

        Role tenantAdminRole = roleRepository.findByCodeAndTenantId("TENANT_ADMIN", tenantId)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .code("TENANT_ADMIN")
                        .tenantId(tenantId)
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .version(0L)
                        .permissions(new HashSet<>())
                        .build()));

        Set<Role> roles = new LinkedHashSet<>(List.of(adminRole, tenantAdminRole));

        // Create or update user account
        UserAccount user = userAccountRepository.findByUsername(username)
                .orElseGet(() -> UserAccount.builder()
                        .username(username)
                        .tenantId(tenantId)
                        .systemUser(false)
                        .profileCompleted(true)
                        .passwordExpiresAt(Instant.now().plus(365, ChronoUnit.DAYS))
                        .passwordChangeRequired(false)
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .version(0L)
                        .build());

        user.setTenantId(tenantId);
        user.setPasswordHash(passwordEncoder.encode(username, password));
        user.setEmail(email);
        user.setFullName(fullName != null && !fullName.isBlank() ? fullName : username);
        user.setRoles(roles);

        UserAccount savedUser = userAccountRepository.save(user);
        log.info("[TenantAdminProvisioner] Saved admin account '{}' (id: {}) for tenant '{}'", savedUser.getUsername(), savedUser.getId(), tenantCode);

        // Ensure user has a registered phone number for OTP authentication
        try {
            if (userPhoneNumberRepository.findByUser_Username(savedUser.getUsername()).isEmpty()) {
                long numericSeed = Math.abs((savedUser.getId() * 37 + tenantId)) % 10000000;
                String phone = "0912" + String.format("%07d", numericSeed);
                int attempts = 0;
                while (userPhoneNumberRepository.findByPhoneNumber(phone).isPresent() && attempts < 10) {
                    phone = "0912" + String.format("%07d", Math.abs((numericSeed + attempts + 1) * 31) % 10000000);
                    attempts++;
                }
                userPhoneNumberRepository.save(com.bontech.auth.entity.UserPhoneNumber.builder()
                        .userId(savedUser.getId())
                        .phoneNumber(phone)
                        .tenantId(tenantId)
                        .preferredNumber(true)
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .version(0L)
                        .build());
                log.info("[TenantAdminProvisioner] Provisioned phone number '{}' for user '{}'", phone, savedUser.getUsername());
            }
        } catch (Exception e) {
            log.warn("[TenantAdminProvisioner] Could not provision phone number for admin: {}", e.getMessage());
        }

        // Publish event to RabbitMQ for user-service synchronization
        try {
            userEventPublisher.publishUserSignedUp(new UserSignedUpEvent(
                    savedUser.getUsername(),
                    String.valueOf(savedUser.getId()),
                    null,
                    savedUser.getEmail(),
                    tenantCode,
                    java.util.List.of("ADMIN", "TENANT_ADMIN"),
                    java.time.Instant.now()
            ));
        } catch (Exception e) {
            log.warn("[TenantAdminProvisioner] Could not publish signup event to RabbitMQ: {}", e.getMessage());
        }

        // Direct user-service database synchronization
        try {
            jdbcTemplate.update(
                    "INSERT IGNORE INTO MILKY_WAY_USER_SERVICE.us_user " +
                    "(username, tenant_id, name, last_name, email, active, accepted, created_by, created_date, external_user_id) " +
                    "VALUES (?, ?, ?, ?, ?, 1, 1, 'system', NOW(), ?)",
                    savedUser.getUsername(),
                    tenantCode,
                    savedUser.getFullName(),
                    "",
                    savedUser.getEmail() != null ? savedUser.getEmail() : savedUser.getUsername() + "@" + tenantCode + ".local",
                    String.valueOf(savedUser.getId())
            );
            log.info("[TenantAdminProvisioner] Synced user '{}' to MILKY_WAY_USER_SERVICE.us_user", savedUser.getUsername());
        } catch (Exception e) {
            log.warn("[TenantAdminProvisioner] Could not sync to us_user table: {}", e.getMessage());
        }
    }

    @Override
    @Transactional
    public void cloneTenantRolesAndPermissions(Long sourceTenantId, Long targetTenantId, Set<String> activeModules) {
        log.info("[TenantAdminProvisioner] Cloning roles, permissions, groups and default role from tenant {} to tenant {}", sourceTenantId, targetTenantId);

        // 1. Clone Entitled Permission Groups and Tenant Permissions (admin.md section 5.2)
        try {
            List<com.bontech.auth.entity.TenantPermissionGroup> sourceGroups = tenantPermissionGroupRepository.findByTenantId(sourceTenantId);
            for (var sg : sourceGroups) {
                if (tenantPermissionGroupRepository.findByTenantIdAndGroupId(targetTenantId, sg.getGroupId()).isEmpty()) {
                    tenantPermissionGroupRepository.save(com.bontech.auth.entity.TenantPermissionGroup.builder()
                            .tenantId(targetTenantId)
                            .groupId(sg.getGroupId())
                            .build());
                }
            }
            List<com.bontech.auth.entity.TenantPermission> sourcePerms = tenantPermissionRepository.findByTenantId(sourceTenantId);
            for (var sp : sourcePerms) {
                if (tenantPermissionRepository.findByTenantIdAndPermissionId(targetTenantId, sp.getPermissionId()).isEmpty()) {
                    tenantPermissionRepository.save(com.bontech.auth.entity.TenantPermission.builder()
                            .tenantId(targetTenantId)
                            .permissionId(sp.getPermissionId())
                            .build());
                }
            }
        } catch (Exception e) {
            log.warn("[TenantAdminProvisioner] Could not clone entitlements: {}", e.getMessage());
        }

        // 2. Clone non-system Roles with permissions and group links
        List<Role> sourceRoles = roleRepository.findAll().stream()
                .filter(r -> sourceTenantId.equals(r.getTenantId()))
                .toList();

        Long clonedDefaultRoleId = null;

        for (Role sourceRole : sourceRoles) {
            Role targetRole = roleRepository.findByCodeAndTenantId(sourceRole.getCode(), targetTenantId)
                    .orElseGet(() -> Role.builder()
                            .code(sourceRole.getCode())
                            .name(sourceRole.getName())
                            .description(sourceRole.getDescription())
                            .isDefault(sourceRole.isDefault())
                            .tenantId(targetTenantId)
                            .createdAt(Instant.now())
                            .updatedAt(Instant.now())
                            .version(0L)
                            .permissions(new HashSet<>())
                            .groups(new HashSet<>())
                            .build());

            if (sourceRole.getPermissions() != null) {
                targetRole.setPermissions(new HashSet<>(sourceRole.getPermissions()));
            }
            if (sourceRole.getGroups() != null) {
                targetRole.setGroups(new HashSet<>(sourceRole.getGroups()));
            }
            Role saved = roleRepository.save(targetRole);
            if (sourceRole.isDefault()) {
                clonedDefaultRoleId = saved.getId();
            }
        }

        // 3. Clone default role configuration onto target tenant
        if (clonedDefaultRoleId != null) {
            final Long defRoleId = clonedDefaultRoleId;
            tenantRepository.findById(targetTenantId).ifPresent(targetTenant -> {
                targetTenant.setDefaultRoleId(defRoleId);
                tenantRepository.save(targetTenant);
            });
        }
    }

    @Override
    public String generateImpersonationToken(Long tenantId, String targetUsername, String adminUsername) {
        UserAccount target = userAccountRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new IllegalArgumentException("کاربر مقصد '" + targetUsername + "' یافت نشد"));

        UserAccount admin = userAccountRepository.findByUsername(adminUsername)
                .orElse(null);

        Map<String, Object> actorClaim = Map.of(
                "sub", admin != null ? admin.getId().toString() : "1",
                "username", adminUsername,
                "tenant_id", admin != null && admin.getTenantId() != null ? admin.getTenantId().toString() : "1"
        );

        return jwtService.generateWithActor(target, adminUsername, actorClaim);
    }
}
