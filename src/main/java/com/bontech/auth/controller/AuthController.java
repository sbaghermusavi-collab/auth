package com.bontech.auth.controller;

import com.bontech.auth.dto.AuthDto;
import com.bontech.auth.service.AuthService;
import com.bontech.auth.service.RegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final RegistrationService registrationService;
    private final AuthService authService;

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
}
