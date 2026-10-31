package com.bontech.auth.controller;

import com.bontech.auth.entity.UserAccount;
import com.bontech.auth.repository.UserAccountRepository;
import com.bontech.auth.security.JwtService;
import com.bontech.auth.service.ActivityLogService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/profile")
@RequiredArgsConstructor
@Slf4j
public class ProfileCompletionController {

    private final UserAccountRepository userAccountRepository;
    private final JwtService jwtService;
    private final ActivityLogService logService;

    public record CompleteProfileRequest(
            @NotBlank(message = "Full name is required") String fullName,
            @NotBlank(message = "National code is required") @Pattern(regexp = "^[0-9]{10}$", message = "National code must be 10 digits") String nationalCode,
            @NotBlank(message = "Email is required") @Email(message = "Valid email is required") String email
    ) {}

    public record ProfileStatusResponse(
            boolean profileCompleted,
            String username,
            String fullName,
            String nationalCode,
            String email,
            Long tenantId
    ) {}

    @GetMapping("/status")
    public ProfileStatusResponse getProfileStatus(@AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("username");
        if (username == null) username = jwt.getSubject();

        UserAccount user = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return new ProfileStatusResponse(
                user.isProfileCompleted(),
                user.getUsername(),
                user.getFullName(),
                user.getNationalCode(),
                user.getEmail(),
                user.getTenantId()
        );
    }

    @PostMapping("/complete")
    @Transactional
    public ResponseEntity<Map<String, Object>> completeProfile(
            @Valid @RequestBody CompleteProfileRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        String username = jwt.getClaimAsString("username");
        if (username == null) username = jwt.getSubject();

        UserAccount user = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setFullName(request.fullName());
        user.setNationalCode(request.nationalCode());
        user.setEmail(request.email());
        user.setProfileCompleted(true);
        userAccountRepository.save(user);

        logService.log(user, "PROFILE_COMPLETED", "User completed mandatory profile details");

        // Issue new token with profile_completed = true
        String updatedToken = jwtService.generate(user, null);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "profileCompleted", true,
                "token", updatedToken,
                "message", "Profile completed successfully"
        ));
    }
}
