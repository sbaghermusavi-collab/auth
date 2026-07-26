package com.bontech.auth.controller;

import com.bontech.auth.config.AppProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ViewController {
    private final AppProperties properties;

    @GetMapping("/")
    public String index(Model model) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return "redirect:http://localhost:4200/whoami";
        }
        addConfig(model);
        return "login";
    }

    @GetMapping("/endpoints")
    public String endpoints(Model model) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return "redirect:http://localhost:4200/whoami";
        }
        addConfig(model);
        return "login";
    }

    @GetMapping("/login")
    public String login(@RequestParam(value = "error", required = false) String error,
                        @RequestParam(value = "logout", required = false) String logout,
                        Model model,
                        HttpServletRequest request) {
        if (error != null) {
            Object lastException = request.getSession(false) != null
                    ? request.getSession(false).getAttribute("SPRING_SECURITY_LAST_EXCEPTION")
                    : null;
            log.error("[LOGIN ERROR REDIRECT] Client redirected to /login?error | Session exception: {}",
                    lastException != null ? lastException : "Unknown/bad credentials failure");
        }
        if (logout != null) {
            log.info("[LOGOUT SUCCESS REDIRECT] Client redirected to /login?logout");
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return "redirect:http://localhost:4200/whoami";
        }
        addConfig(model);
        return "login";
    }

    @GetMapping("/register")
    public String register(Model model) {
        addConfig(model);
        return "register";
    }

    @GetMapping("/signup")
    public String signup(Model model) {
        return "redirect:/register";
    }


    @GetMapping("/method")
    public String method(Model model) {
        addConfig(model);
        return "method";
    }

    @GetMapping("/otp")
    public String otp(Model model) {
        addConfig(model);
        return "otp";
    }

    @GetMapping("/password-change")
    public String passwordChange(Model model) {
        addConfig(model);
        return "password-change";
    }

    @GetMapping("/forgot-password")
    public String forgotPassword(Model model) {
        addConfig(model);
        return "forgot-password";
    }

    @GetMapping("/success")
    public String success(Model model) {
        addConfig(model);
        return "success";
    }

    private void addConfig(Model model) {
        model.addAttribute("captchaUrl", properties.getCaptcha().getUrl());
        model.addAttribute("captchaValidateUrl", properties.getCaptcha().getValidateUrl());
        model.addAttribute("smsSenderApiUrl", properties.getSms().getSenderApiUrl());
        model.addAttribute("otpEnabled", properties.getAuth().isOtpEnabled());
        model.addAttribute("passwordEnabled", properties.getAuth().isPasswordEnabled());
        model.addAttribute("captchaEnabled", properties.getAuth().isCaptchaEnabled());
        model.addAttribute("otpExpirationSeconds", properties.getAuth().getOtpExpirationSeconds());
        model.addAttribute("loginInactivityTimeoutSeconds", properties.getAuth().getLoginInactivityTimeoutSeconds());
    }
}
