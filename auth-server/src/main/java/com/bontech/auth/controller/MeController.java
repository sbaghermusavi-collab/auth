package com.bontech.auth.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class MeController {

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "Host", required = false) String hostHeader) {
        
        Map<String, Object> response = new HashMap<>();
        response.put("username", jwt != null ? jwt.getSubject() : "anonymous");
        response.put("sub", jwt != null ? jwt.getSubject() : null);
        response.put("claims", jwt != null ? jwt.getClaims() : Map.of());
        response.put("host", hostHeader);
        
        String tenant = "UNKNOWN";
        if (hostHeader != null) {
            if (hostHeader.contains("sms")) tenant = "SMS";
            else if (hostHeader.contains("asan")) tenant = "ASAN";
            else if (hostHeader.contains("arman")) tenant = "ARMAN";
        }
        response.put("tenant", tenant);
        response.put("status", "ACTIVE");
        
        return ResponseEntity.ok(response);
    }
}
