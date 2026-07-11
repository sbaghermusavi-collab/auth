package com.bontech.auth.controller;

import com.bontech.auth.dto.AuthDto;
import com.bontech.auth.dto.UserDto;
import com.bontech.auth.service.UserQueryService;
import com.bontech.auth.service.AuthService;
import com.bontech.auth.service.RegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final RegistrationService registrationService;
    private final AuthService authService;
    private final UserQueryService userQueryService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public void register(@Valid @RequestBody AuthDto.RegistrationRequest request) {
        registrationService.register(request);
    }

    @PostMapping("/login")
    public AuthDto.LoginStartResponse loginStepOne(@Valid @RequestBody AuthDto.LoginStartRequest request) {
        return authService.loginStepOne(request);
    }

    @PostMapping("/login/select-phone")
    public AuthDto.SelectPhoneResponse selectPhone(@Valid @RequestBody AuthDto.SelectPhoneRequest request) {
        return authService.selectPhone(request);
    }


    @PostMapping(value = {"/verify-2fa", "/otp/verify"})
    public AuthDto.TokenResponse verifySecondStep(@Valid @RequestBody AuthDto.TwoStepVerifyRequest request) {
        return authService.verifySecondStep(request);
    }


    @PostMapping("/password/change-expired")
    public void changeExpiredPassword(@Valid @RequestBody AuthDto.ChangeExpiredPasswordRequest request) {
        authService.changeExpiredPassword(request);
    }

    @PostMapping("/impersonate")
    public AuthDto.TokenResponse impersonate(@Valid @RequestBody AuthDto.ImpersonateRequest request) {
        return authService.impersonate(request);
    }

    @PostMapping("/refresh")
    public AuthDto.TokenResponse refresh(@Valid @RequestBody AuthDto.RefreshTokenRequest request) {
        return authService.refresh(request);
    }

    @GetMapping("/me/token")
    public Map<String, Object> getMeToken(@RequestHeader(value = "X-Actor-Tenant-Id", required = false) Long actorTenantId, JwtAuthenticationToken jwtToken) {
        UserDto.UserAuthzResponse authz = userQueryService.getAuthz(jwtToken.getName(), actorTenantId);
        Map<String, Object> response = new HashMap<>();
        response.put("user", authz);
        response.put("token", jwtToken.getToken().getTokenValue());
        response.put("tokenAttributes", jwtToken.getTokenAttributes());
        return response;
    }

}
