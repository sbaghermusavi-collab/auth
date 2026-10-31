package com.asanak.proxy.filter;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/test-api")
public class TestController {
    @GetMapping
    public String test() {
        return "Public endpoint";
    }
    @GetMapping("/whoami")
    public Mono<String> whoAmI(Authentication authentication) {
        return Mono.just("You are: " + authentication.getName());
    }
}