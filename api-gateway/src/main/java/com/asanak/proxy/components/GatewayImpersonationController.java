package com.asanak.proxy.components;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebSession;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/impersonate")
@RequiredArgsConstructor
@Slf4j
public class GatewayImpersonationController {

    private final WebClient.Builder webClientBuilder;

    @Value("${AUTH_SERVER_URL:http://localhost:9005}")
    private String authServerUrl;

    public record ImpersonateReq(String targetUsername) {}

    @PostMapping
    public Mono<ResponseEntity<Map<String, Object>>> impersonate(
            @RequestBody ImpersonateReq request,
            ServerWebExchange exchange) {
        return doImpersonate(request, exchange);
    }

    @PostMapping("/start")
    public Mono<ResponseEntity<Map<String, Object>>> impersonateStart(
            @RequestBody ImpersonateReq request,
            ServerWebExchange exchange) {
        return doImpersonate(request, exchange);
    }

    private Mono<ResponseEntity<Map<String, Object>>> doImpersonate(
            ImpersonateReq request,
            ServerWebExchange exchange) {

        return exchange.getSession().flatMap(session -> {
            String activeToken = extractActiveToken(exchange, session);
            if (activeToken == null || activeToken.isBlank()) {
                return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("status", "ERROR", "message", "Authentication required")));
            }

            WebClient webClient = webClientBuilder.baseUrl(authServerUrl).build();
            return webClient.post()
                    .uri("/auth/api/auth/impersonate")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + activeToken)
                    .bodyValue(Map.of("targetUsername", request.targetUsername()))
                    .exchangeToMono(response -> {
                        if (response.statusCode().is2xxSuccessful()) {
                            return response.bodyToMono(Map.class).map(body -> {
                                String newToken = (String) body.get("accessToken");
                                if (newToken == null) newToken = (String) body.get("token");

                                // Stash original admin token if not already impersonating
                                if (!session.getAttributes().containsKey("ORIGINAL_ADMIN_TOKEN")) {
                                    session.getAttributes().put("ORIGINAL_ADMIN_TOKEN", activeToken);
                                }
                                session.getAttributes().put("IMPERSONATED_ACCESS_TOKEN", newToken);
                                session.getAttributes().put("IMPERSONATED_TARGET_USER", request.targetUsername());

                                // Update access_token cookie
                                exchange.getResponse().addCookie(ResponseCookie.from("access_token", newToken)
                                        .path("/").httpOnly(false).sameSite("Lax").build());
                                String rootDomain = resolveRootDomain(exchange);
                                if (rootDomain != null) {
                                    exchange.getResponse().addCookie(ResponseCookie.from("access_token", newToken)
                                            .domain(rootDomain).path("/").httpOnly(false).sameSite("Lax").build());
                                }

                                log.info("[Gateway Impersonation] Switched active session to target user: {}", request.targetUsername());
                                return ResponseEntity.ok(Map.<String, Object>of(
                                        "status", "SUCCESS",
                                        "isImpersonated", true,
                                        "targetUsername", request.targetUsername(),
                                        "accessToken", newToken
                                ));
                            });
                        } else {
                            return response.bodyToMono(Map.class).defaultIfEmpty(Map.of()).map(err ->
                                    ResponseEntity.status(response.statusCode()).body(err));
                        }
                    });
        });
    }

    @PostMapping("/revert")
    public Mono<ResponseEntity<Map<String, Object>>> revert(ServerWebExchange exchange) {
        return exchange.getSession().flatMap(session -> {
            String originalToken = (String) session.getAttributes().get("ORIGINAL_ADMIN_TOKEN");
            if (originalToken == null || originalToken.isBlank()) {
                return Mono.just(ResponseEntity.badRequest()
                        .body(Map.of("status", "ERROR", "message", "No active impersonation session found to revert")));
            }

            session.getAttributes().remove("IMPERSONATED_ACCESS_TOKEN");
            session.getAttributes().remove("IMPERSONATED_TARGET_USER");
            session.getAttributes().remove("ORIGINAL_ADMIN_TOKEN");

            exchange.getResponse().addCookie(ResponseCookie.from("access_token", originalToken)
                    .path("/").httpOnly(false).sameSite("Lax").build());
            String rootDomain = resolveRootDomain(exchange);
            if (rootDomain != null) {
                exchange.getResponse().addCookie(ResponseCookie.from("access_token", originalToken)
                        .domain(rootDomain).path("/").httpOnly(false).sameSite("Lax").build());
            }

            log.info("[Gateway Impersonation] Reverted session back to original admin");
            return Mono.just(ResponseEntity.ok(Map.<String, Object>of(
                    "status", "SUCCESS",
                    "isImpersonated", false,
                    "message", "Successfully reverted to admin session"
            )));
        });
    }

    @GetMapping("/status")
    public Mono<ResponseEntity<Map<String, Object>>> status(ServerWebExchange exchange) {
        return exchange.getSession().map(session -> {
            boolean isImpersonated = session.getAttributes().containsKey("IMPERSONATED_ACCESS_TOKEN");
            String targetUser = (String) session.getAttributes().get("IMPERSONATED_TARGET_USER");
            return ResponseEntity.ok(Map.<String, Object>of(
                    "isImpersonated", isImpersonated,
                    "targetUsername", targetUser != null ? targetUser : ""
            ));
        });
    }

    private String resolveRootDomain(ServerWebExchange exchange) {
        String host = exchange.getRequest().getHeaders().getFirst("Host");
        if (host == null) return null;
        String hostNoPort = host.split(":")[0];
        if (hostNoPort.startsWith("admin.")) {
            return hostNoPort.substring("admin.".length());
        }
        return null;
    }

    private String extractActiveToken(ServerWebExchange exchange, WebSession session) {
        String token = (String) session.getAttributes().get("IMPERSONATED_ACCESS_TOKEN");
        if (token != null && !token.isBlank()) return token;

        token = (String) session.getAttributes().get("ENC_ACCESS_TOKEN");
        if (token != null && !token.isBlank()) return token;

        if (exchange.getRequest().getCookies().getFirst("access_token") != null) {
            return exchange.getRequest().getCookies().getFirst("access_token").getValue();
        }
        if (exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION) != null) {
            String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader.startsWith("Bearer ")) return authHeader.substring(7);
        }
        return null;
    }
}
