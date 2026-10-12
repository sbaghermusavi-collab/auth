package com.bontech.auth.security;

import com.bontech.auth.entity.UserAccount;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.savedrequest.HttpSessionRequestCache;
import org.springframework.security.web.savedrequest.RequestCache;
import org.springframework.security.web.savedrequest.SavedRequest;
import org.springframework.stereotype.Component;

/**
 * Bridges the custom JSON-based /api/auth/** login flow with Spring Security's
 * session-based authentication, so that a browser which was redirected to /login
 * from /oauth2/authorize (e.g. by the "asanak" client) ends up with a real,
 * authenticated HttpSession and can be bounced back to the original authorize URL.
 */
@Component
public class SessionAuthenticationService {

    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();
    private final RequestCache requestCache = new HttpSessionRequestCache();

    /** Marks the current HTTP session as authenticated for {@code user}. */
    public void establishSession(HttpServletRequest request, HttpServletResponse response, UserAccount user) {
        List<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + role.getCode().toUpperCase()))
                .collect(Collectors.toList());

        Authentication authentication = new UsernamePasswordAuthenticationToken(user.getUsername(), null, authorities);

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);
    }

    /**
     * Returns the URL Spring Security saved before redirecting to /login
     * (e.g. /oauth2/authorize?...&client_id=asanak&...), or {@code fallback} if none was saved.
     */
    public String resolveRedirectUrl(HttpServletRequest request, HttpServletResponse response, String fallback) {
        SavedRequest saved = requestCache.getRequest(request, response);
        if (saved != null) {
            String redirectUrl = saved.getRedirectUrl();
            requestCache.removeRequest(request, response);
            if (isValidAppRedirectUrl(redirectUrl)) {
                return redirectUrl;
            }
        }
        return fallback;
    }

    private boolean isValidAppRedirectUrl(String url) {
        if (url == null || url.isBlank()) return false;
        String path = url.toLowerCase();
        int queryIdx = path.indexOf('?');
        if (queryIdx != -1) {
            path = path.substring(0, queryIdx);
        }
        return !path.endsWith(".js") &&
               !path.endsWith(".css") &&
               !path.endsWith(".ico") &&
               !path.endsWith(".png") &&
               !path.endsWith(".jpg") &&
               !path.endsWith(".svg") &&
               !path.endsWith(".woff") &&
               !path.endsWith(".woff2") &&
               !path.contains("/resources/") &&
               !path.contains("/api/auth/") &&
               !path.endsWith("/login");
    }
}
