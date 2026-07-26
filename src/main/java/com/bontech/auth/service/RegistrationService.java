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

    @Transactional
    public UserAccount register(AuthDto.RegistrationRequest request) {
        if (userRepository.findByUsername(request.username()).isPresent()) {
            throw new IllegalArgumentException("Username already exists");
        }

        String tenantCode = (request.tenantCode() != null && !request.tenantCode().isBlank()) ? request.tenantCode() : "DEFAULT";
        String tenantName = (request.tenantName() != null && !request.tenantName().isBlank()) ? request.tenantName() : "Default Tenant";
        String tenantBaseUrl = (request.tenantBaseUrl() != null && !request.tenantBaseUrl().isBlank()) ? request.tenantBaseUrl() : "http://localhost";

        Tenant tenant = tenantRepository.findByCode(tenantCode).orElseGet(() -> {
            Tenant t = new Tenant();
            t.setCode(tenantCode);
            t.setName(tenantName);
            t.setBaseUrl(tenantBaseUrl);
            return tenantRepository.save(t);
        });

        UserAccount user = new UserAccount();
        user.setUsername(request.username());
        user.setPasswordHash(encoder.encode(request.username(), request.password()));
        user.setTenantId(tenant.getId());
        user.setSystemUser(request.systemUser());
        user.setPasswordExpiresAt(Instant.now().plus(90, ChronoUnit.DAYS));
        user.setPasswordChangeRequired(false);
        Optional.ofNullable(request.roleCodes()).orElseGet(java.util.List::of)
                .forEach(code -> roleRepository.findByCodeAndTenantId(code, tenant.getId()).ifPresent(user.getRoles()::add));
        UserAccount savedUser = userRepository.save(user);

        PasswordHistory history = new PasswordHistory();
        history.setUserId(savedUser.getId());
        history.setPasswordHash(savedUser.getPasswordHash());
        history.setTenantId(tenant.getId());
        passwordHistoryRepository.save(history);

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
                }
            }
        }
        return savedUser;
    }
}
