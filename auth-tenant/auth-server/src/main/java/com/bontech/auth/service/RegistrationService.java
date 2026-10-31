package com.bontech.auth.service;

import com.bontech.auth.dto.AuthDto;
import com.bontech.auth.entity.PasswordHistory;
import com.bontech.auth.entity.Tenant;
import com.bontech.auth.entity.UserAccount;
import com.bontech.auth.entity.UserPhoneNumber;
import com.bontech.auth.repository.PasswordHistoryRepository;
import com.bontech.auth.repository.RoleRepository;
import com.bontech.auth.repository.TenantRepository;
import com.bontech.auth.repository.UserAccountRepository;
import com.bontech.auth.repository.UserPhoneNumberRepository;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import com.bontech.auth.security.CustomPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RegistrationService {
    private final TenantRepository tenantRepository;
    private final UserAccountRepository userRepository;
    private final UserPhoneNumberRepository phoneRepository;
    private final RoleRepository roleRepository;
    private final PasswordHistoryRepository passwordHistoryRepository;
    private final CustomPasswordEncoder encoder;
    private final UserEventPublisher userEventPublisher;

    @Transactional
    public UserAccount register(AuthDto.RegistrationRequest request) {
        if (userRepository.findByUsername(request.username()).isPresent()) {
            throw new IllegalArgumentException("Username already exists");
        }

        String tenantCode = (request.tenantCode() != null && !request.tenantCode().isBlank()) ? request.tenantCode() : "DEFAULT";
        String tenantName = (request.tenantName() != null && !request.tenantName().isBlank()) ? request.tenantName() : "Default Tenant";
        String tenantBaseUrl = (request.tenantBaseUrl() != null && !request.tenantBaseUrl().isBlank()) ? request.tenantBaseUrl() : "http://localhost";

        Tenant tenant = tenantRepository.findByCode(tenantCode)
                .or(() -> tenantRepository.findByCode(tenantCode.toLowerCase()))
                .or(() -> tenantRepository.findByBaseUrl(tenantBaseUrl))
                .or(() -> tenantRepository.findByBaseUrlContaining(tenantBaseUrl.replace("http://", "").replace("https://", "")))
                .orElseGet(() -> {
            Tenant t = new Tenant();
            t.setCode(tenantCode);
            t.setName(tenantName);
            t.setBaseUrl(tenantBaseUrl);
            t.setCreatedAt(Instant.now());
            t.setUpdatedAt(Instant.now());
            t.setCreatedBy("system");
            t.setVersion(0L);
            return tenantRepository.save(t);
        });

        UserAccount user = new UserAccount();
        user.setUsername(request.username());
        user.setPasswordHash("{bcrypt}" + encoder.encode(request.password()));
        user.setTenantId(tenant.getId());
        user.setSystemUser(request.systemUser());
        user.setPasswordExpiresAt(Instant.now().plus(90, ChronoUnit.DAYS));
        user.setEnabled(true);
        Optional.ofNullable(request.roleCodes()).orElseGet(java.util.List::of)
                .forEach(code -> roleRepository.findByCodeAndTenantId(code, tenant.getId())
                        .or(() -> roleRepository.findByCode(code))
                        .ifPresent(user.getRoles()::add));
        if (tenant.getDefaultRoleId() != null) {
            roleRepository.findById(tenant.getDefaultRoleId()).ifPresent(user.getRoles()::add);
        } else if (user.getRoles().isEmpty()) {
            roleRepository.findByCodeAndTenantId("ROLE_MEMBER", tenant.getId())
                    .or(() -> roleRepository.findByCode("ROLE_MEMBER"))
                    .or(() -> roleRepository.findByCode("FREE_TRIAL"))
                    .ifPresent(user.getRoles()::add);
        }
        UserAccount savedUser = userRepository.save(user);

        PasswordHistory history = new PasswordHistory();
        history.setUserId(savedUser.getId());
        history.setPasswordHash(savedUser.getPasswordHash());
        history.setTenantId(tenant.getId());
        passwordHistoryRepository.save(history);

        String primaryPhone = null;
        if (request.phones() != null) {
            for (AuthDto.PhoneInput phone : request.phones()) {
                if (phone != null && phone.phoneNumber() != null && !phone.phoneNumber().isBlank()) {
                    UserPhoneNumber p = new UserPhoneNumber();
                    p.setUserId(savedUser.getId());
                    p.setPhoneNumber(phone.phoneNumber());
                    p.setNationalCode(phone.nationalCode() != null ? phone.nationalCode() : "IR");
                    p.setPreferredNumber(phone.preferred());
                    p.setTenantId(tenant.getId());
                    phoneRepository.save(p);
                    if (primaryPhone == null || Boolean.TRUE.equals(phone.preferred())) {
                        primaryPhone = phone.phoneNumber();
                    }
                }
            }
        }

        userEventPublisher.publishUserSignedUp(new com.bontech.auth.event.UserSignedUpEvent(
                savedUser.getUsername(),
                String.valueOf(savedUser.getId()),
                primaryPhone,
                null,
                tenant.getCode(),
                request.roleCodes() != null ? request.roleCodes() : java.util.List.of("FREE_TRIAL"),
                Instant.now()
        ));

        return savedUser;
    }
}
