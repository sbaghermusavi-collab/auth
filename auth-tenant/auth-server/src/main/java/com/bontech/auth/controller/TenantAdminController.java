package com.bontech.auth.controller;

import com.bontech.auth.dto.TenantAdminDto;
import com.bontech.auth.entity.Role;
import com.bontech.auth.entity.UserAccount;
import com.bontech.auth.repository.RoleRepository;
import com.bontech.auth.repository.UserAccountRepository;
import jakarta.validation.Valid;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import com.bontech.auth.security.CustomPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tenant-admin/users")
@RequiredArgsConstructor
public class TenantAdminController {
    private final UserAccountRepository userAccountRepository;
    private final RoleRepository roleRepository;
    private final CustomPasswordEncoder passwordEncoder;
    private final com.bontech.auth.repository.UserSessionRepository userSessionRepository;
    private final com.bontech.auth.repository.RefreshTokenRecordRepository refreshTokenRecordRepository;

    @PostMapping
    public TenantAdminDto.UserResponse create(@RequestHeader(value = "X-Actor-Role", required = false) String actorRole,
                                              @RequestHeader(value = "X-Actor-Tenant-Id", required = false) Long actorTenantId,
                                              @AuthenticationPrincipal Jwt jwt,
                                              @Valid @RequestBody TenantAdminDto.UserCreateRequest request) {
        ResolvedActor actor = resolveActor(actorRole, actorTenantId, jwt);
        requireTenantAdmin(actor.role());
        if (!actor.tenantId().equals(request.tenantId())) throw new IllegalArgumentException("Tenant admin can only manage own tenant users");

        UserAccount user = UserAccount.builder()
                .username(request.username())
                .passwordHash(passwordEncoder.encode(request.username(), request.password()))
                .tenantId(request.tenantId())
                .systemUser(request.systemUser())
                .passwordExpiresAt(Instant.now().plus(90, ChronoUnit.DAYS))
                .passwordChangeRequired(false)
                .roles(new LinkedHashSet<>())
                .build();

        if (request.roleIds() != null) {
            request.roleIds().forEach(rid -> roleRepository.findById(rid).ifPresent(r -> {
                if (!r.getTenantId().equals(actor.tenantId())) throw new IllegalArgumentException("Role is not in admin tenant");
                user.getRoles().add(r);
            }));
        }

        UserAccount saved = userAccountRepository.save(user);
        return toResponse(saved);
    }

    @GetMapping
    public List<TenantAdminDto.UserResponse> list(@RequestHeader(value = "X-Actor-Role", required = false) String actorRole,
                                                  @RequestHeader(value = "X-Actor-Tenant-Id", required = false) Long actorTenantId,
                                                  @AuthenticationPrincipal Jwt jwt) {
        ResolvedActor actor = resolveActor(actorRole, actorTenantId, jwt);
        requireTenantAdmin(actor.role());
        return userAccountRepository.findAll().stream()
                .filter(u -> actor.tenantId() != null && actor.tenantId().equals(u.getTenantId()))
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/{id}")
    public TenantAdminDto.UserResponse get(@RequestHeader("X-Actor-Role") String actorRole,
                                           @RequestHeader("X-Actor-Tenant-Id") Long actorTenantId,
                                           @PathVariable Long id) {
        requireTenantAdmin(actorRole);
        UserAccount user = userAccountRepository.findById(id).orElseThrow();
        if (!actorTenantId.equals(user.getTenantId())) throw new IllegalArgumentException("Forbidden tenant user access");
        return toResponse(user);
    }

    @PutMapping("/{id}")
    public TenantAdminDto.UserResponse update(@RequestHeader("X-Actor-Role") String actorRole,
                                              @RequestHeader("X-Actor-Tenant-Id") Long actorTenantId,
                                              @PathVariable Long id,
                                              @Valid @RequestBody TenantAdminDto.UserUpdateRequest request) {
        requireTenantAdmin(actorRole);
        UserAccount user = userAccountRepository.findById(id).orElseThrow();
        if (!actorTenantId.equals(user.getTenantId())) throw new IllegalArgumentException("Forbidden tenant user access");
        user.setUsername(request.username());
        user.setSystemUser(request.systemUser());
        user.getRoles().clear();
        if (request.roleIds() != null) {
            request.roleIds().forEach(rid -> roleRepository.findById(rid).ifPresent(r -> {
                if (!r.getTenantId().equals(actorTenantId)) throw new IllegalArgumentException("Role is not in admin tenant");
                user.getRoles().add(r);
            }));
        }
        return toResponse(userAccountRepository.save(user));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void delete(@RequestHeader("X-Actor-Role") String actorRole,
                       @RequestHeader("X-Actor-Tenant-Id") Long actorTenantId,
                       @PathVariable Long id) {
        requireTenantAdmin(actorRole);
        UserAccount user = userAccountRepository.findById(id).orElseThrow();
        if (!actorTenantId.equals(user.getTenantId())) throw new IllegalArgumentException("Forbidden tenant user access");
        userAccountRepository.deleteById(id);
    }

    @PutMapping("/{id}/status")
    @Transactional
    public TenantAdminDto.UserResponse updateStatus(@RequestHeader(value = "X-Actor-Role", required = false) String actorRole,
                                                    @RequestHeader(value = "X-Actor-Tenant-Id", required = false) Long actorTenantId,
                                                    @AuthenticationPrincipal Jwt jwt,
                                                    @PathVariable Long id,
                                                    @Valid @RequestBody com.bontech.auth.dto.AdminDto.UserStatusUpdateRequest request) {
        ResolvedActor actor = resolveActor(actorRole, actorTenantId, jwt);
        requireTenantAdmin(actor.role());
        UserAccount user = userAccountRepository.findById(id).orElseThrow();
        if (!actor.tenantId().equals(user.getTenantId())) throw new IllegalArgumentException("Forbidden tenant user access");
        user.setEnabled(request.enabled());
        UserAccount saved = userAccountRepository.save(user);
        if (!request.enabled()) {
            userSessionRepository.deactivateAllUserSessions(user.getId());
            refreshTokenRecordRepository.revokeAllForUser(user.getId());
        }
        return toResponse(saved);
    }

    private record ResolvedActor(String role, Long tenantId) {}

    private ResolvedActor resolveActor(String actorRole, Long actorTenantId, Jwt jwt) {
        String role = actorRole;
        Long tenantId = actorTenantId;

        if (jwt != null) {
            if (role == null) {
                List<String> roles = jwt.getClaimAsStringList("roles");
                if (roles != null && (roles.contains("ADMIN") || roles.contains("TENANT_ADMIN") || roles.contains("ROLE_ADMIN"))) {
                    role = "TENANT_ADMIN";
                }
            }
            if (tenantId == null) {
                Object tid = jwt.getClaim("tenant_id");
                if (tid != null) {
                    try {
                        tenantId = Long.parseLong(tid.toString());
                    } catch (NumberFormatException ignored) {}
                }
                if (tenantId == null) {
                    tenantId = 1L;
                }
            }
        }
        return new ResolvedActor(role, tenantId);
    }

    private void requireTenantAdmin(String actorRole) {
        if (actorRole == null || (!"TENANT_ADMIN".equalsIgnoreCase(actorRole) && !"ADMIN".equalsIgnoreCase(actorRole) && !"ROLE_ADMIN".equalsIgnoreCase(actorRole))) {
            throw new IllegalArgumentException("Only tenant admin can manage tenant users");
        }
    }

    private TenantAdminDto.UserResponse toResponse(UserAccount user) {
        Set<String> roleCodes = user.getRoles().stream().map(Role::getCode).collect(Collectors.toSet());
        return new TenantAdminDto.UserResponse(user.getId(), user.getUsername(), user.getTenantId(), user.isEnabled(), user.isSystemUser(), roleCodes);
    }
}
