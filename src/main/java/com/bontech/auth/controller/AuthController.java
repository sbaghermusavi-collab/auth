package com.bontech.auth.controller;

import com.bontech.auth.dto.AuthDto;
import com.bontech.auth.dto.UserDto;
import com.bontech.auth.service.UserQueryService;
import com.bontech.auth.service.AuthService;
import com.bontech.auth.service.RegistrationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import java.util.Map;
import java.util.HashMap;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final RegistrationService registrationService;
    private final AuthService authService;
    private final UserQueryService userQueryService;

    @PostMapping(value = "/register", consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> registerJson(@Valid @RequestBody AuthDto.RegistrationRequest request) {
        return processRegister(request);
    }

    @PostMapping(value = "/register", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> registerForm(HttpServletRequest httpRequest) {
        String username = httpRequest.getParameter("username");
        String password = httpRequest.getParameter("password");
        String phone = httpRequest.getParameter("phone");
        String tenantCode = httpRequest.getParameter("tenantCode");
        String tenantName = httpRequest.getParameter("tenantName");
        String tenantBaseUrl = httpRequest.getParameter("tenantBaseUrl");

        AuthDto.RegistrationRequest request = new AuthDto.RegistrationRequest(
                tenantCode != null && !tenantCode.isBlank() ? tenantCode : "default",
                tenantName != null && !tenantName.isBlank() ? tenantName : "Default Tenant",
                tenantBaseUrl != null && !tenantBaseUrl.isBlank() ? tenantBaseUrl : "http://localhost",
                username,
                password,
                false,
                phone != null && !phone.isBlank() ? List.of(new AuthDto.PhoneInput(phone, "IR", true)) : List.of(),
                List.of("USER")
        );
        return processRegister(request);
    }

    private Map<String, Object> processRegister(AuthDto.RegistrationRequest request) {
        var user = registrationService.register(request);
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "User registered successfully");
        response.put("username", user.getUsername());
        return response;
    }

    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    public AuthDto.LoginStartResponse loginStepOneJson(@Valid @RequestBody AuthDto.LoginStartRequest request,
                                                        HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        return authService.loginStepOne(request, httpRequest, httpResponse);
    }

    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public AuthDto.LoginStartResponse loginStepOneForm(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String identifier = httpRequest.getParameter("identifier");
        if (identifier == null || identifier.isBlank()) {
            identifier = httpRequest.getParameter("username");
        }
        String password = httpRequest.getParameter("password");
        String captchaId = httpRequest.getParameter("captchaId");
        String captchaToken = httpRequest.getParameter("captchaToken");
        String deliveryMethod = httpRequest.getParameter("deliveryMethod");
        if (deliveryMethod == null) {
            deliveryMethod = httpRequest.getParameter("delivery");
        }

        AuthDto.LoginStartRequest request = new AuthDto.LoginStartRequest(identifier, password, captchaId, captchaToken, deliveryMethod);
        return authService.loginStepOne(request, httpRequest, httpResponse);
    }

    @PostMapping(value = "/login/select-phone", consumes = MediaType.APPLICATION_JSON_VALUE)
    public AuthDto.SelectPhoneResponse selectPhoneJson(@Valid @RequestBody AuthDto.SelectPhoneRequest request) {
        return authService.selectPhone(request);
    }

    @PostMapping(value = "/login/select-phone", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public AuthDto.SelectPhoneResponse selectPhoneForm(HttpServletRequest httpRequest) {
        String identifier = httpRequest.getParameter("identifier");
        String nationalCode = httpRequest.getParameter("nationalCode");
        AuthDto.SelectPhoneRequest request = new AuthDto.SelectPhoneRequest(identifier, nationalCode);
        return authService.selectPhone(request);
    }

    @PostMapping(value = {"/send-otp", "/resend-otp"}, consumes = MediaType.APPLICATION_JSON_VALUE)
    public AuthDto.SelectPhoneResponse sendOtpJson(@Valid @RequestBody AuthDto.SendOtpRequest request) {
        return authService.sendOtp(request);
    }

    @PostMapping(value = {"/send-otp", "/resend-otp"}, consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public AuthDto.SelectPhoneResponse sendOtpForm(HttpServletRequest httpRequest) {
        String identifier = httpRequest.getParameter("identifier");
        String phone = httpRequest.getParameter("phone");
        String deliveryMethod = httpRequest.getParameter("deliveryMethod");
        if (deliveryMethod == null) {
            deliveryMethod = httpRequest.getParameter("delivery");
        }
        AuthDto.SendOtpRequest request = new AuthDto.SendOtpRequest(identifier, phone, deliveryMethod);
        return authService.sendOtp(request);
    }

    @PostMapping(value = {"/verify-2fa", "/otp/verify"}, consumes = MediaType.APPLICATION_JSON_VALUE)
    public AuthDto.TokenResponse verifySecondStepJson(@Valid @RequestBody AuthDto.TwoStepVerifyRequest request,
                                                       HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        return authService.verifySecondStep(request, httpRequest, httpResponse);
    }

    @PostMapping(value = {"/verify-2fa", "/otp/verify"}, consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public AuthDto.TokenResponse verifySecondStepForm(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String identifier = httpRequest.getParameter("identifier");
        if (identifier == null || identifier.isBlank()) {
            identifier = httpRequest.getParameter("phone");
        }
        String code = httpRequest.getParameter("code");
        if (code == null || code.isBlank()) {
            String c1 = httpRequest.getParameter("c1");
            if (c1 != null) {
                code = (c1 + nullToEmpty(httpRequest.getParameter("c2"))
                         + nullToEmpty(httpRequest.getParameter("c3"))
                         + nullToEmpty(httpRequest.getParameter("c4"))
                         + nullToEmpty(httpRequest.getParameter("c5"))
                         + nullToEmpty(httpRequest.getParameter("c6"))).trim();
            }
        }
        AuthDto.TwoStepVerifyRequest request = new AuthDto.TwoStepVerifyRequest(identifier, code);
        return authService.verifySecondStep(request, httpRequest, httpResponse);
    }

    @PostMapping(value = "/password/change-expired", consumes = MediaType.APPLICATION_JSON_VALUE)
    public AuthDto.TokenResponse changeExpiredPasswordJson(@Valid @RequestBody AuthDto.ChangeExpiredPasswordRequest request,
                                                             HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        return authService.changeExpiredPassword(request, httpRequest, httpResponse);
    }

    @PostMapping(value = "/password/change-expired", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public AuthDto.TokenResponse changeExpiredPasswordForm(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String identifier = httpRequest.getParameter("identifier");
        String currentPassword = httpRequest.getParameter("currentPassword");
        String newPassword = httpRequest.getParameter("newPassword");
        AuthDto.ChangeExpiredPasswordRequest request = new AuthDto.ChangeExpiredPasswordRequest(identifier, currentPassword, newPassword);
        return authService.changeExpiredPassword(request, httpRequest, httpResponse);
    }

    @PostMapping(value = "/password/reset", consumes = MediaType.APPLICATION_JSON_VALUE)
    public AuthDto.TokenResponse resetPasswordJson(@Valid @RequestBody AuthDto.ResetPasswordRequest request,
                                                    HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        return authService.resetPassword(request, httpRequest, httpResponse);
    }

    @PostMapping(value = "/password/reset", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public AuthDto.TokenResponse resetPasswordForm(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String identifier = httpRequest.getParameter("identifier");
        String newPassword = httpRequest.getParameter("newPassword");
        AuthDto.ResetPasswordRequest request = new AuthDto.ResetPasswordRequest(identifier, newPassword);
        return authService.resetPassword(request, httpRequest, httpResponse);
    }

    @PostMapping(value = "/impersonate", consumes = MediaType.APPLICATION_JSON_VALUE)
    public AuthDto.TokenResponse impersonateJson(@Valid @RequestBody AuthDto.ImpersonateRequest request) {
        return authService.impersonate(request);
    }

    @PostMapping(value = "/refresh", consumes = MediaType.APPLICATION_JSON_VALUE)
    public AuthDto.TokenResponse refreshJson(@Valid @RequestBody AuthDto.RefreshTokenRequest request) {
        return authService.refresh(request);
    }

    @PostMapping(value = "/refresh", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public AuthDto.TokenResponse refreshForm(HttpServletRequest httpRequest) {
        String refreshToken = httpRequest.getParameter("refreshToken");
        AuthDto.RefreshTokenRequest request = new AuthDto.RefreshTokenRequest(refreshToken);
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

    private String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
