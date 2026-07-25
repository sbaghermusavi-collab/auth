package com.bontech.auth.controller;

import com.bontech.auth.dto.TenantAdminDto;
import com.bontech.auth.entity.Role;
import com.bontech.auth.entity.UserAccount;
import com.bontech.auth.repository.RoleRepository;
import com.bontech.auth.repository.UserAccountRepository;
import com.bontech.auth.tenant.TenantContext;
import jakarta.validation.Valid;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tenant-admin/users")
@RequiredArgsConstructor
public class TenantAdminController {
    private final UserAccountRepository userAccountRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping
    public TenantAdminDto.UserResponse create(@RequestHeader(value = "X-Actor-Role", required = false) String actorRole,
                                              @RequestHeader(value = "X-Actor-Tenant-Id", required = false) Long actorTenantId,
                                              @Valid @RequestBody TenantAdminDto.UserCreateRequest request) {
        requireTenantAdmin(actorRole);
        Long effectiveTenantId = actorTenantId != null ? actorTenantId : (request.tenantId() != null ? request.tenantId() : TenantContext.getTenantId());
        if (request.tenantId() != null && !effectiveTenantId.equals(request.tenantId())) {
            throw new IllegalArgumentException("Tenant admin can only manage own tenant users");
        }

        UserAccount user = UserAccount.builder()
                .username(request.username())
                .passwordHash(passwordEncoder.encode(request.password()))
                .tenantId(effectiveTenantId)
                .systemUser(request.systemUser())
                .passwordExpiresAt(Instant.now().plus(90, ChronoUnit.DAYS))
                .passwordChangeRequired(false)
                .roles(new LinkedHashSet<>())
                .build();

        if (request.roleIds() != null) {
            request.roleIds().forEach(rid -> roleRepository.findById(rid).ifPresent(r -> {
                if (r.getTenantId() != null && !r.getTenantId().equals(effectiveTenantId)) {
                    throw new IllegalArgumentException("Role is not in admin tenant");
                }
                user.getRoles().add(r);
            }));
        }

        UserAccount saved = userAccountRepository.save(user);
        return toResponse(saved);
    }

    @GetMapping
    public List<TenantAdminDto.UserResponse> list(@RequestHeader(value = "X-Actor-Role", required = false) String actorRole,
                                                  @RequestHeader(value = "X-Actor-Tenant-Id", required = false) Long actorTenantId) {
        requireTenantAdmin(actorRole);
        Long effectiveTenantId = actorTenantId != null ? actorTenantId : TenantContext.getTenantId();
        return userAccountRepository.findAll().stream()
                .filter(u -> effectiveTenantId == null || effectiveTenantId.equals(u.getTenantId()))
                .map(this::toResponse).toList();
    }

    @GetMapping("/{id}")
    public TenantAdminDto.UserResponse get(@RequestHeader(value = "X-Actor-Role", required = false) String actorRole,
                                           @RequestHeader(value = "X-Actor-Tenant-Id", required = false) Long actorTenantId,
                                           @PathVariable Long id) {
        requireTenantAdmin(actorRole);
        Long effectiveTenantId = actorTenantId != null ? actorTenantId : TenantContext.getTenantId();
        UserAccount user = userAccountRepository.findById(id).orElseThrow();
        if (effectiveTenantId != null && !effectiveTenantId.equals(user.getTenantId())) {
            throw new IllegalArgumentException("Forbidden tenant user access");
        }
        return toResponse(user);
    }

    @PutMapping("/{id}")
    public TenantAdminDto.UserResponse update(@RequestHeader(value = "X-Actor-Role", required = false) String actorRole,
                                              @RequestHeader(value = "X-Actor-Tenant-Id", required = false) Long actorTenantId,
                                              @PathVariable Long id,
                                              @Valid @RequestBody TenantAdminDto.UserUpdateRequest request) {
        requireTenantAdmin(actorRole);
        Long effectiveTenantId = actorTenantId != null ? actorTenantId : TenantContext.getTenantId();
        UserAccount user = userAccountRepository.findById(id).orElseThrow();
        if (effectiveTenantId != null && !effectiveTenantId.equals(user.getTenantId())) {
            throw new IllegalArgumentException("Forbidden tenant user access");
        }
        user.setUsername(request.username());
        user.setSystemUser(request.systemUser());
        user.getRoles().clear();
        if (request.roleIds() != null) {
            request.roleIds().forEach(rid -> roleRepository.findById(rid).ifPresent(r -> {
                if (r.getTenantId() != null && effectiveTenantId != null && !r.getTenantId().equals(effectiveTenantId)) {
                    throw new IllegalArgumentException("Role is not in admin tenant");
                }
                user.getRoles().add(r);
            }));
        }
        return toResponse(userAccountRepository.save(user));
    }

    @DeleteMapping("/{id}")
    public void delete(@RequestHeader(value = "X-Actor-Role", required = false) String actorRole,
                       @RequestHeader(value = "X-Actor-Tenant-Id", required = false) Long actorTenantId,
                       @PathVariable Long id) {
        requireTenantAdmin(actorRole);
        Long effectiveTenantId = actorTenantId != null ? actorTenantId : TenantContext.getTenantId();
        UserAccount user = userAccountRepository.findById(id).orElseThrow();
        if (effectiveTenantId != null && !effectiveTenantId.equals(user.getTenantId())) {
            throw new IllegalArgumentException("Forbidden tenant user access");
        }
        userAccountRepository.deleteById(id);
    }

    private void requireTenantAdmin(String actorRole) {
        if (actorRole != null && !actorRole.isBlank()) {
            String roleUpper = actorRole.toUpperCase();
            if ("TENANT_ADMIN".equals(roleUpper) || "ADMIN".equals(roleUpper) || "SYS_ADMIN".equals(roleUpper) || "SYSTEM_ADMIN".equals(roleUpper) || "SUPER_ADMIN".equals(roleUpper)) {
                return;
            }
        }
    }

    private TenantAdminDto.UserResponse toResponse(UserAccount user) {
        Set<String> roleCodes = user.getRoles() != null
                ? user.getRoles().stream().map(Role::getCode).collect(Collectors.toSet())
                : Set.of();
        return new TenantAdminDto.UserResponse(user.getId(), user.getUsername(), user.getTenantId(), user.isSystemUser(), roleCodes);
    }
}
