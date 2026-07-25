package com.bontech.auth.service;

import com.bontech.auth.dto.AuthDto;
import com.bontech.auth.entity.UserAccount;
import com.bontech.auth.repository.PasswordHistoryRepository;
import com.bontech.auth.repository.RoleRepository;
import com.bontech.auth.repository.TenantRepository;
import com.bontech.auth.repository.UserAccountRepository;
import com.bontech.auth.repository.UserPhoneNumberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RegistrationServiceTest {

    @Mock
    private TenantRepository tenantRepository;
    @Mock
    private UserAccountRepository userRepository;
    @Mock
    private UserPhoneNumberRepository phoneRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private PasswordHistoryRepository passwordHistoryRepository;
    @Mock
    private PasswordEncoder encoder;

    @InjectMocks
    private RegistrationService registrationService;

    @BeforeEach
    void setUp() {
    }

    @Test
    @DisplayName("Should register new user successfully")
    void testRegisterUserSuccess() {
        AuthDto.RegistrationRequest request = new AuthDto.RegistrationRequest(
                "default",
                "Default Tenant",
                "http://localhost",
                "testuser",
                "Password123",
                false,
                List.of(new AuthDto.PhoneInput("09123456789", "IR", true)),
                List.of("USER")
        );

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.empty());
        when(encoder.encode("Password123")).thenReturn("encodedPassword");
        when(tenantRepository.findByCode("default")).thenReturn(Optional.empty());

        com.bontech.auth.entity.Tenant tenant = new com.bontech.auth.entity.Tenant();
        tenant.setId(1L);
        tenant.setCode("default");
        when(tenantRepository.save(any())).thenReturn(tenant);

        UserAccount savedUser = new UserAccount();
        savedUser.setId(10L);
        savedUser.setUsername("testuser");
        savedUser.setPasswordHash("encodedPassword");
        when(userRepository.save(any())).thenReturn(savedUser);

        UserAccount result = registrationService.register(request);

        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
        verify(userRepository, times(1)).save(any());
        verify(passwordHistoryRepository, times(1)).save(any());
        verify(phoneRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Should throw exception when registering existing username")
    void testRegisterExistingUserThrowsException() {
        AuthDto.RegistrationRequest request = new AuthDto.RegistrationRequest(
                "default",
                "Default Tenant",
                "http://localhost",
                "existinguser",
                "Password123",
                false,
                List.of(new AuthDto.PhoneInput("09123456789", "IR", true)),
                List.of("USER")
        );

        when(userRepository.findByUsername("existinguser")).thenReturn(Optional.of(new UserAccount()));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            registrationService.register(request);
        });

        assertEquals("Username already exists", ex.getMessage());
        verify(userRepository, never()).save(any());
    }
}
