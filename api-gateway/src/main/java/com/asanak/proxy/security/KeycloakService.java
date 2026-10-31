package com.asanak.proxy.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class KeycloakService {

    private final WebClient webClient;
    private final String keycloakTokenUri;
    private final String userInfoUri;
    private final String clientId;
    private final String clientSecret;
    /** Keycloak Admin REST API users endpoint, e.g. http://localhost/auth/admin/realms/milky-way/users */
    private final String adminUsersUri;
    private final MultiValueMap<String, String> constantBody;

    public KeycloakService(
            WebClient.Builder webClientBuilder,
            @Value("${spring.security.oauth2.client.provider.keycloak.token-uri}") String keycloakTokenUri,
            @Value("${spring.security.oauth2.client.provider.keycloak.user-info-uri}") String userInfoUri,
            @Value("${spring.security.oauth2.client.registration.keycloak.client-id}") String clientId,
            @Value("${spring.security.oauth2.client.registration.keycloak.client-secret:}") String clientSecret
    ) {
        this.webClient = webClientBuilder.build();
        this.keycloakTokenUri = keycloakTokenUri;
        this.userInfoUri = userInfoUri;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        // Derive admin users URI from token URI:
        // e.g. http://host/auth/realms/my-realm/protocol/openid-connect/token
        //   => http://host/auth/admin/realms/my-realm/users
        this.adminUsersUri = keycloakTokenUri
                .replaceFirst("/protocol/openid-connect/token$", "/users")
                .replaceFirst("/realms/", "/admin/realms/");
        this.constantBody = new LinkedMultiValueMap<>();
        this.constantBody.add("grant_type", "urn:ietf:params:oauth:grant-type:uma-ticket");
        this.constantBody.add("audience", clientId);
        this.constantBody.add("response_mode", "permissions");
    }

    /**
     * Calls Keycloak logout endpoint directly (Backchannel Logout) using refreshToken.
     * Resilient against failures: if Keycloak is down, already logged out (400), or times out,
     * it logs a warning and completes gracefully so local session cleanup and redirect continue.
     */
    public Mono<Void> logoutFromKeycloak(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            log.info("[KeycloakService] No refresh token available, skipping Keycloak backchannel call");
            return Mono.empty();
        }
        String logoutUrl = this.keycloakTokenUri.replaceFirst("/token$", "/logout");
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", this.clientId);
        if (this.clientSecret != null && !this.clientSecret.isBlank()) {
            body.add("client_secret", this.clientSecret);
        }
        body.add("refresh_token", refreshToken);

        log.info("[KeycloakService] Sending backchannel logout to: {} with client_id: {}", logoutUrl, this.clientId);

        return this.webClient.post()
                .uri(logoutUrl)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(body))
                .retrieve()
                .toBodilessEntity()
                .timeout(java.time.Duration.ofSeconds(3))
                .doOnSuccess(entity -> log.info("[KeycloakService] Keycloak backchannel logout completed with status: {}", entity.getStatusCode()))
                .then()
                .onErrorResume(e -> {
                    // Gracefully swallow 400 (already logged out), connection refused, timeout, or 5xx
                    log.warn("[KeycloakService] Keycloak backchannel logout bypassed (already logged out or service unreachable): {}", e.getMessage());
                    return Mono.empty();
                });
    }

    /**
     * Fetches user profile information (claims) from the Keycloak UserInfo endpoint.
     *
     * @param userAccessToken The valid access token of the user.
     * @return A Mono containing a map of the user's claims (e.g., sub, name, email).
     */
    public Mono<Map<String, Object>> getUserInfo(String userAccessToken) {
        return this.webClient.get() // 2. It's a GET request
                .uri(this.userInfoUri) // 3. Use the UserInfo URI
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + userAccessToken) // 4. Authenticate with the token
                .retrieve()
                .onStatus(
                        status -> status.is4xxClientError() || status.is5xxServerError(),
                        clientResponse -> clientResponse.bodyToMono(String.class)
                                .flatMap(errorBody -> Mono.error(
                                        new RuntimeException("Keycloak user info request failed with status " + clientResponse.statusCode() + " and body: " + errorBody)
                                ))
                )
                // 5. The response is a JSON object, which we map to a Map
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {});
    }

    public Mono<List<Permission>> getPermissions(String userAccessToken) {
        return this.webClient.post()
                .uri(this.keycloakTokenUri)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + userAccessToken)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromValue(this.constantBody))
                .retrieve()
                .onStatus(
                        status -> status.is4xxClientError() || status.is5xxServerError(),
                        clientResponse -> clientResponse.bodyToMono(String.class)
                                .flatMap(errorBody -> Mono.error(
                                        new RuntimeException("Keycloak permission check failed with status " + clientResponse.statusCode() + " and body: " + errorBody)
                                ))
                )
                // The response is a JSON array of Permission objects
                .bodyToMono(Permission[].class)
                .map(Arrays::asList)
                // If the response is empty or something goes wrong, return an empty list
                .defaultIfEmpty(Collections.emptyList());
    }

    /**
     * Obtains a service account access token using client_credentials grant.
     */
    public Mono<String> getClientToken() {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");
        body.add("client_id", this.clientId);
        if (this.clientSecret != null && !this.clientSecret.isBlank()) {
            body.add("client_secret", this.clientSecret);
        }

        return this.webClient.post()
                .uri(this.keycloakTokenUri)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(body))
                .retrieve()
                .onStatus(
                        status -> status.is4xxClientError() || status.is5xxServerError(),
                        clientResponse -> clientResponse.bodyToMono(String.class)
                                .flatMap(errorBody -> Mono.error(
                                        new RuntimeException("Keycloak client_credentials token request failed: " + errorBody)
                                ))
                )
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(map -> (String) map.get("access_token"));
    }

    /**
     * Looks up a Keycloak user ID (UUID) by exact username via the Admin REST API.
     * Uses the client service account token for lookup.
     *
     * @param username The exact Keycloak username to look up.
     * @return A Mono emitting the user's Keycloak ID (UUID string).
     */
    public Mono<String> getUserIdByUsername(String username) {
        return getClientToken().flatMap(clientToken -> {
            String uri = UriComponentsBuilder.fromUriString(this.adminUsersUri)
                    .queryParam("username", username)
                    .queryParam("exact", true)
                    .build()
                    .toUriString();

            return this.webClient.get()
                    .uri(uri)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + clientToken)
                    .retrieve()
                    .onStatus(
                            status -> status.is4xxClientError() || status.is5xxServerError(),
                            clientResponse -> clientResponse.bodyToMono(String.class)
                                    .flatMap(errorBody -> Mono.error(
                                            new RuntimeException("Keycloak admin user lookup failed with status " + clientResponse.statusCode() + " and body: " + errorBody)
                                    ))
                    )
                    .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                    .flatMap(users -> {
                        if (users == null || users.isEmpty()) {
                            log.warn("Impersonation lookup: no Keycloak user found with username '{}'", username);
                            return Mono.error(new RuntimeException("No Keycloak user found with username: " + username));
                        }
                        String id = (String) users.get(0).get("id");
                        log.info("Impersonation lookup: resolved username '{}' to Keycloak user ID '{}'", username, id);
                        return Mono.just(id);
                    });
        });
    }

    /**
     * Impersonates a target Keycloak user identified by username.
     * Looks up the user ID from Keycloak Admin REST API first, then performs a token exchange.
     * The calling client must have token-exchange enabled and the caller must have the impersonation permission.
     *
     * @param adminAccessToken The access token of the admin initiating impersonation.
     * @param username         The Keycloak username of the user to impersonate.
     * @return A Mono containing the raw token response map (access_token, refresh_token, etc.).
     */
    public Mono<Map<String, Object>> impersonateByUsername(String adminAccessToken, String username) {
        log.info("Impersonation requested for username '{}'", username);
        return getUserIdByUsername(username)
                .flatMap(userId -> impersonateUser(adminAccessToken, userId))
                .doOnNext(tokenMap -> log.info("Impersonation token exchange succeeded for username '{}'", username))
                .doOnError(e -> log.error("Impersonation failed for username '{}': {}", username, e.getMessage()));
    }

    /**
     * Impersonates a target Keycloak user using the admin's access token via
     * the token-exchange grant. The calling client must have token-exchange
     * enabled and the caller's role must carry the impersonation permission.
     *
     * @param adminAccessToken The access token of the admin initiating impersonation.
     * @param targetUserId     The Keycloak user ID (UUID) of the user to impersonate.
     * @return A Mono containing the raw token response map (access_token, refresh_token, etc.).
     */
    public Mono<Map<String, Object>> impersonateUser(String adminAccessToken, String targetUserId) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "urn:ietf:params:oauth:grant-type:token-exchange");
        body.add("client_id", this.clientId);
        if (this.clientSecret != null && !this.clientSecret.isBlank()) {
            body.add("client_secret", this.clientSecret);
        }
        body.add("subject_token", adminAccessToken);
        body.add("subject_token_type", "urn:ietf:params:oauth:token-type:access_token");
        body.add("requested_token_type", "urn:ietf:params:oauth:token-type:access_token");
        body.add("requested_subject", targetUserId);

        return this.webClient.post()
                .uri(this.keycloakTokenUri)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminAccessToken)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(body))
                .retrieve()
                .onStatus(
                        status -> status.is4xxClientError() || status.is5xxServerError(),
                        clientResponse -> clientResponse.bodyToMono(String.class)
                                .flatMap(errorBody -> Mono.error(
                                        new RuntimeException("Keycloak token exchange failed with status " + clientResponse.statusCode() + " and body: " + errorBody)
                                ))
                )
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {});
    }


}

