package com.bontech.auth.controller;

import com.bontech.auth.dto.AuthDto;
import com.bontech.auth.entity.UserAccount;
import com.bontech.auth.repository.UserAccountRepository;
import com.bontech.auth.security.JwtService;
import com.bontech.auth.service.ActivityLogService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/impersonate")
@RequiredArgsConstructor
@Slf4j
public class ImpersonationController {

    private final UserAccountRepository userAccountRepository;
    private final JwtService jwtService;
    private final ActivityLogService logService;

    public record ImpersonateRequest(String actorUsername, @NotBlank String targetUsername) {}

    /**
     * RFC 8693 Impersonation: Admin exchanges their JWT for a token scoped to target user
     * with an embedded `act` (actor) claim representing the admin.
     */
    @PostMapping
    public AuthDto.TokenResponse impersonate(
            @Valid @RequestBody ImpersonateRequest request,
            @AuthenticationPrincipal Jwt adminJwt) {

        String adminUsername = null;
        if (adminJwt != null) {
            adminUsername = adminJwt.getClaimAsString("username");
            if (adminUsername == null) adminUsername = adminJwt.getSubject();
        }
        if (adminUsername == null && request.actorUsername() != null && !request.actorUsername().isBlank()) {
            adminUsername = request.actorUsername();
        }
        if (adminUsername == null) {
            throw new IllegalArgumentException("Admin authentication required for impersonation");
        }

        UserAccount admin = userAccountRepository.findByUsername(adminUsername)
                .orElseThrow(() -> new IllegalArgumentException("Admin account not found"));

        UserAccount target = userAccountRepository.findByUsername(request.targetUsername())
                .orElseThrow(() -> new IllegalArgumentException("Target user not found"));

        // Verify tenant scope: Tenant admins can only impersonate users in their own tenant
        Long adminTenant = admin.getTenantId();
        Long targetTenant = target.getTenantId();
        if (adminTenant != null && !adminTenant.equals(1L) && !adminTenant.equals(targetTenant)) {
            throw new IllegalArgumentException("Tenant admin cannot impersonate users outside their tenant");
        }

        Map<String, Object> actorClaim = Map.of(
                "sub", admin.getId().toString(),
                "username", admin.getUsername(),
                "tenant_id", adminTenant != null ? adminTenant.toString() : "1"
        );

        String token = jwtService.generateWithActor(target, admin.getUsername(), actorClaim);
        String refreshToken = jwtService.generateRefreshToken(target);

        logService.log(admin, "USER_IMPERSONATION_STARTED",
                String.format("Admin '%s' started impersonating target user '%s'", admin.getUsername(), target.getUsername()));

        return new AuthDto.TokenResponse(token, refreshToken, "Bearer", jwtService.getExpirationSeconds(), null);
    }

    public record ImpersonationStatusResponse(
            boolean isImpersonated,
            String targetUsername,
            Long targetUserId,
            Long targetTenantId,
            String actorUsername,
            Long actorUserId
    ) {}

    /**
     * Returns the active impersonation status based on token claims.
     */
    @GetMapping("/status")
    public ImpersonationStatusResponse getStatus(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return new ImpersonationStatusResponse(false, null, null, null, null, null);
        }
        Boolean isImpersonated = jwt.getClaim("is_impersonated");
        if (Boolean.TRUE.equals(isImpersonated)) {
            Map<String, Object> act = jwt.getClaim("act");
            String actorUsername = act != null ? (String) act.get("username") : null;
            Long actorUserId = null;
            if (act != null && act.get("sub") != null) {
                try {
                    actorUserId = Long.parseLong(act.get("sub").toString());
                } catch (Exception ignored) {}
            }
            Long targetTenantId = null;
            Object tid = jwt.getClaim("tenant_id");
            if (tid != null) {
                try { targetTenantId = Long.parseLong(tid.toString()); } catch (Exception ignored) {}
            }
            Long targetUserId = null;
            try { targetUserId = Long.parseLong(jwt.getSubject()); } catch (Exception ignored) {}

            return new ImpersonationStatusResponse(
                    true,
                    jwt.getClaimAsString("username"),
                    targetUserId,
                    targetTenantId,
                    actorUsername,
                    actorUserId
            );
        }
        return new ImpersonationStatusResponse(false, null, null, null, null, null);
    }

    /**
     * Reverts impersonation back to the original actor token.
     */
    @PostMapping("/revert")
    public AuthDto.TokenResponse revertImpersonation(@AuthenticationPrincipal Jwt impersonatedJwt) {
        Boolean isImpersonated = impersonatedJwt != null ? impersonatedJwt.getClaim("is_impersonated") : null;
        if (Boolean.FALSE.equals(isImpersonated) || isImpersonated == null) {
            throw new IllegalArgumentException("Current session is not impersonated");
        }

        Map<String, Object> act = impersonatedJwt.getClaim("act");
        if (act == null || !act.containsKey("username")) {
            throw new IllegalArgumentException("No actor information found in token");
        }

        String adminUsername = (String) act.get("username");
        UserAccount admin = userAccountRepository.findByUsername(adminUsername)
                .orElseThrow(() -> new IllegalArgumentException("Original admin account not found"));

        String token = jwtService.generate(admin, null);
        String refreshToken = jwtService.generateRefreshToken(admin);

        logService.log(admin, "USER_IMPERSONATION_ENDED", "Admin reverted from impersonation session");
        return new AuthDto.TokenResponse(token, refreshToken, "Bearer", jwtService.getExpirationSeconds(), null);
    }
}
