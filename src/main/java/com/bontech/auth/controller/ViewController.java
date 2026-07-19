package com.bontech.auth.controller;

import com.bontech.auth.config.AppProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@RequiredArgsConstructor
public class ViewController {
    private final AppProperties properties;

    @GetMapping("/")
    public String index(Model model) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return "redirect:/success";
        }
        addConfig(model);
        return "login";
    }

    @GetMapping("/endpoints")
    public String endpoints(Model model) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return "redirect:/success";
        }
        addConfig(model);
        return "login";
    }

    @GetMapping("/login")
    public String login(Model model) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return "redirect:/success";
        }
        addConfig(model);
        return "login";
    }

    @GetMapping("/register")
    public String register(Model model) {
        addConfig(model);
        return "register";
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
    }
}
