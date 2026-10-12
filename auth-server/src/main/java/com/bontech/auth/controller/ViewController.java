package com.bontech.auth.controller;

import com.bontech.auth.config.AppProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.Cookie;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestParam;

import com.bontech.auth.entity.Tenant;
import com.bontech.auth.repository.TenantRepository;
import com.bontech.auth.tenant.TenantContext;
import com.bontech.auth.tenant.TenantResolutionFilter;
import com.bontech.auth.tenant.TenantUiConfig;
import com.bontech.auth.tenant.TenantConfigCacheService;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ViewController {
    private final AppProperties properties;
    private final TenantRepository tenantRepository;
    private final TenantConfigCacheService tenantConfigCacheService;

    private String resolveAppRootUrl(HttpServletRequest request) {
        if (request != null) {
            String fwdHost = request.getHeader("X-Forwarded-Host");
            if (fwdHost != null && !fwdHost.isBlank()) {
                String hostName = fwdHost.split(",")[0].trim();
                String fwdProto = request.getHeader("X-Forwarded-Proto");
                String proto = (fwdProto != null && !fwdProto.isBlank()) ? fwdProto : request.getScheme();
                if (hostName.startsWith("admin.")) {
                    return proto + "://" + hostName + "/admin/access/iam-governance";
                }
                return proto + "://" + hostName + "/";
            }
            String host = request.getHeader("Host");
            if (host != null && !host.isBlank()) {
                if (host.startsWith("admin.")) {
                    return request.getScheme() + "://" + host + "/admin/access/iam-governance";
                }
                return request.getScheme() + "://" + host + "/";
            }
            Object reqTenant = request.getAttribute(TenantResolutionFilter.TENANT_REQ_ATTR);
            if (reqTenant instanceof Tenant t && t.getBaseUrl() != null && !t.getBaseUrl().isBlank()) {
                return t.getBaseUrl().endsWith("/") ? t.getBaseUrl() : t.getBaseUrl() + "/";
            }
        }
        Long tenantId = TenantContext.getTenantId();
        if (tenantId != null) {
            var tenantOpt = tenantRepository.findById(tenantId);
            if (tenantOpt.isPresent() && tenantOpt.get().getBaseUrl() != null && !tenantOpt.get().getBaseUrl().isBlank()) {
                String base = tenantOpt.get().getBaseUrl();
                return base.endsWith("/") ? base : base + "/";
            }
        }
        return properties.getAppRootUrl();
    }

    @GetMapping("/")
    public String index(Model model, HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return "redirect:" + resolveAppRootUrl(request);
        }
        addConfig(model, request);
        return "login";
    }

    @GetMapping("/endpoints")
    public String endpoints(Model model, HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return "redirect:" + resolveAppRootUrl(request);
        }
        addConfig(model, request);
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
            return "redirect:" + resolveAppRootUrl(request);
        }
        addConfig(model, request);
        return "login";
    }

    @GetMapping("/logout")
    public String logout(HttpServletRequest request, HttpServletResponse response) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        Cookie cookie = new Cookie("JSESSIONID", "");
        cookie.setPath(request.getContextPath().isEmpty() ? "/" : request.getContextPath());
        cookie.setMaxAge(0);
        response.addCookie(cookie);
        return "redirect:/login?logout";
    }

    @GetMapping("/register")
    public String register(Model model, HttpServletRequest request) {
        addConfig(model, request);
        return "register";
    }

    @GetMapping("/signup")
    public String signup(Model model) {
        return "redirect:/register";
    }


    @GetMapping("/method")
    public String method(Model model, HttpServletRequest request) {
        addConfig(model, request);
        return "method";
    }

    @GetMapping("/otp")
    public String otp(Model model, HttpServletRequest request) {
        addConfig(model, request);
        return "otp";
    }

    @GetMapping("/password-change")
    public String passwordChange(Model model, HttpServletRequest request) {
        addConfig(model, request);
        return "password-change";
    }

    @GetMapping("/forgot-password")
    public String forgotPassword(Model model, HttpServletRequest request) {
        addConfig(model, request);
        return "forgot-password";
    }

    @GetMapping("/success")
    public String success(Model model, HttpServletRequest request) {
        addConfig(model, request);
        return "success";
    }

    private void addConfig(Model model, HttpServletRequest request) {
        Tenant tenant = null;
        if (request != null) {
            tenant = (Tenant) request.getAttribute(TenantResolutionFilter.TENANT_REQ_ATTR);
        }
        if (tenant == null && TenantContext.getTenantId() != null) {
            tenant = tenantRepository.findById(TenantContext.getTenantId()).orElse(null);
        }

        String requestedTenantCode = null;
        if (request != null) {
            requestedTenantCode = request.getParameter("tenant");
            if (requestedTenantCode == null || requestedTenantCode.isBlank()) {
                requestedTenantCode = request.getParameter("tenantId");
            }
            if (requestedTenantCode == null || requestedTenantCode.isBlank()) {
                requestedTenantCode = request.getHeader(TenantResolutionFilter.TENANT_HEADER);
            }
            Object effectiveCode = request.getAttribute(TenantResolutionFilter.TENANT_CODE_ATTR);
            if (effectiveCode instanceof String ec && !ec.isBlank()) {
                requestedTenantCode = ec;
            }
        }

        TenantUiConfig uiConfig = resolveTenantUiConfig(tenant, requestedTenantCode);
        model.addAttribute("tenantConfig", uiConfig);
        model.addAttribute("tenantId", tenant != null ? tenant.getId() : null);
        model.addAttribute("tenantCode", requestedTenantCode != null && !requestedTenantCode.isBlank() ? requestedTenantCode : (tenant != null ? tenant.getCode() : properties.getDefaultTenant()));
        model.addAttribute("brandName", uiConfig.getBrandName());
        model.addAttribute("pageTitle", uiConfig.getTitle());
        model.addAttribute("logoUrl", uiConfig.getLogoUrl());
        model.addAttribute("themeTone", uiConfig.getThemeTone());
        model.addAttribute("animationType", uiConfig.getAnimationType());
        model.addAttribute("primaryColor", uiConfig.getPrimaryColor());
        model.addAttribute("secondaryColor", uiConfig.getSecondaryColor());
        model.addAttribute("authBg", uiConfig.getAuthBg());

        model.addAttribute("captchaUrl", properties.getCaptcha().getUrl());
        model.addAttribute("captchaValidateUrl", properties.getCaptcha().getValidateUrl());
        model.addAttribute("smsSenderApiUrl", properties.getSms().getSenderApiUrl());
        model.addAttribute("otpEnabled", uiConfig.isOtpEnabled());
        model.addAttribute("passwordEnabled", uiConfig.isPasswordEnabled());
        model.addAttribute("captchaEnabled", uiConfig.isCaptchaEnabled());
        model.addAttribute("otpExpirationSeconds", properties.getAuth().getOtpExpirationSeconds());
        model.addAttribute("loginInactivityTimeoutSeconds", properties.getAuth().getLoginInactivityTimeoutSeconds());
        model.addAttribute("appRootUrl", resolveAppRootUrl(request));
    }

    private TenantUiConfig resolveTenantUiConfig(Tenant tenant, String requestedTenantCode) {
        return tenantConfigCacheService.resolveUiConfig(tenant, requestedTenantCode);
    }
}
