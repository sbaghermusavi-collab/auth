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
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tenant-admin/users")
@RequiredArgsConstructor
public class TenantAdminController {
    private final UserAccountRepository userAccountRepository;
    private final RoleRepository roleRepository;
    private final CustomPasswordEncoder passwordEncoder;

    @PostMapping
    public TenantAdminDto.UserResponse create(@RequestHeader("X-Actor-Role") String actorRole,
                                              @RequestHeader("X-Actor-Tenant-Id") Long actorTenantId,
                                              @Valid @RequestBody TenantAdminDto.UserCreateRequest request) {
        requireTenantAdmin(actorRole);
        if (!actorTenantId.equals(request.tenantId())) throw new IllegalArgumentException("Tenant admin can only manage own tenant users");

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
                if (!r.getTenantId().equals(actorTenantId)) throw new IllegalArgumentException("Role is not in admin tenant");
                user.getRoles().add(r);
            }));
        }

        UserAccount saved = userAccountRepository.save(user);
        return toResponse(saved);
    }

    @GetMapping
    public List<TenantAdminDto.UserResponse> list(@RequestHeader("X-Actor-Role") String actorRole,
                                                  @RequestHeader("X-Actor-Tenant-Id") Long actorTenantId) {
        requireTenantAdmin(actorRole);
        return userAccountRepository.findAll().stream().filter(u -> actorTenantId.equals(u.getTenantId())).map(this::toResponse).toList();
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
    public void delete(@RequestHeader("X-Actor-Role") String actorRole,
                       @RequestHeader("X-Actor-Tenant-Id") Long actorTenantId,
                       @PathVariable Long id) {
        requireTenantAdmin(actorRole);
        UserAccount user = userAccountRepository.findById(id).orElseThrow();
        if (!actorTenantId.equals(user.getTenantId())) throw new IllegalArgumentException("Forbidden tenant user access");
        userAccountRepository.deleteById(id);
    }

    private void requireTenantAdmin(String actorRole) {
        if (!"TENANT_ADMIN".equalsIgnoreCase(actorRole)) throw new IllegalArgumentException("Only tenant admin can manage tenant users");
    }

    private TenantAdminDto.UserResponse toResponse(UserAccount user) {
        Set<String> roleCodes = user.getRoles().stream().map(Role::getCode).collect(Collectors.toSet());
        return new TenantAdminDto.UserResponse(user.getId(), user.getUsername(), user.getTenantId(), user.isSystemUser(), roleCodes);
    }
}
