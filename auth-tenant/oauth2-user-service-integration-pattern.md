# OAuth2 and User-Service Integration Blueprint & Pattern Migration

## Executive Summary

This document reviews the existing connection architecture between:
- `keycloak-provider` (`/home/seyyed/workspace/asanak-git/milky-way/keycloak-provider/`)
- `user-service` (`/home/seyyed/workspace/asanak-git/milky-way/user-service/`)
- `auth-server` (`/home/seyyed/workspace/asanak/auth-asan/auth/`)

It provides an improved, clean architecture pattern compliant with modern OAuth2 / OIDC standards, eliminating database couplings, eliminating cross-service schema reads, and removing custom synchronous credential verification endpoints.

---

## 1. Analysis of Current Legacy Connection (Keycloak SPI & User-Service)

### 1.1 Direct Cross-Schema Database Coupling in Keycloak SPIs
In the legacy implementation:
- **`CompanyIdProtocolMapper`** (`com.bontech.keycloak.jwt.CompanyIdProtocolMapper`):
  Directly executes raw SQL `SELECT id, username, first_name, last_name FROM ${USER_SERVICE_DB_SCHEMA}.us_user WHERE username = ?` via JDBC to inject customer claims into Keycloak ID/Access tokens.
- **`CustomNumberSelectorAuthenticator`** (`com.bontech.keycloak.otp.CustomNumberSelectorAuthenticator`):
  Executes direct SQL `SELECT phone_number, national_code FROM external_schema.user_view WHERE username = ?` to query phone numbers for multi-number OTP login flows.

**Issues**:
- Breaches bounded context principles: The Identity Provider (Keycloak) must not have direct SQL access to the internal schema of a domain service (`user-service`).
- Fragile during migrations: Any change to `us_user` columns breaks authentication and token generation.

### 1.2 User-Service Database View Coupling
In `user-service`:
- **`KeycloakUserView`** (`com.peykasa.milkyway.user_service.entities.KeycloakUserView`):
  Direct JPA entity mapped to a MySQL view `keycloak_user_view`, which does a cross-database join between `MILKY_WAY_USER_SERVICE.us_user` and `keycloak.keycloak_user_view`.
- **`KeycloakUserRoleMapping`**:
  Maps to `keycloak_user_role_mapping` view.

**Issues**:
- Requires `user-service` database user to have direct read grants on the `keycloak` database schema.
- Blocks moving services to separate isolated database instances or cloud databases.

### 1.3 Custom Synchronous Credential Feign Calls
- **`KeycloakProviderClient`** (`com.peykasa.milkyway.user_service.external.keycloak_client.KeycloakProviderClient`):
  `user-service` invokes `/change-password` and `/check-password` on Keycloak SPI via OpenFeign.
- Keycloak exposes custom JAX-RS resources (`PasswordUpdateResource`, `ChangePasswordResource`).

**Issues**:
- Password verification should be strictly handled through standard OAuth2 grant flows (e.g. authorization code or direct token exchange) or self-contained in the Auth Server, not via exposed synchronous password check HTTP endpoints where plaintext passwords are transported through domain services.

---

## 2. Modern OAuth2 Target Pattern

```
+-----------------------------------------------------------------------------------+
|                                  Edge Proxy / BFF                                 |
|                      (Traefik / Spring Cloud Gateway / Redis)                     |
+-----------------------------------------+-----------------------------------------+
                                          |
             +----------------------------+----------------------------+
             |                                                         |
             v                                                         v
+-----------------------------+                           +-----------------------------+
|    Spring OAuth2 Auth       |                           |         User Service        |
|    Server (auth-server)     |                           |       (Resource Server)     |
|                             |                           |                             |
| - Owns user credentials     |                           | - Zero direct DB dependency |
| - Dynamic Tenant Resolution |                           |   on Auth Server DB         |
| - OAuth2TokenCustomizer     |                           | - Validates JWT via JWKS    |
|   (customer, roles, tenant) |                           | - Reads user profile by     |
| - Self-service password/OTP |                           |   claims: sub/username      |
+-----------------------------+                           +-----------------------------+
             |                                                         |
             v                                                         v
   [ Auth MySQL Schema ]                                     [ User MySQL Schema ]
   - tenants                                                 - us_user
   - user_accounts                                           - user_profiles
   - roles & permissions                                     - user_attachments
   - user_phone_numbers                                      - (No keycloak views)
```

### 2.1 Token Claims Enrichment (Zero Cross-Schema SQL)
Instead of Keycloak querying `us_user` via JDBC or views, the Spring Authorization Server owns the authentication credentials, tenant associations, and roles. When issuing tokens, `OAuth2TokenCustomizer` embeds the claims:

```java
@Bean
public OAuth2TokenCustomizer<JwtEncodingContext> jwtTokenCustomizer(UserAccountRepository userAccountRepository) {
    return (context) -> {
        if (context.getTokenType().getValue().equals("id_token") || 
            context.getTokenType().getValue().equals("access_token")) {
            
            String username = context.getPrincipal().getName();
            userAccountRepository.findByUsername(username).ifPresent(user -> {
                // Roles & Authorities
                Set<String> roles = user.getRoles().stream()
                        .map(Role::getCode).collect(Collectors.toSet());
                context.getClaims().claim("roles", roles);
                context.getClaims().claim("tenant_id", user.getTenantId());

                // Customer context
                Map<String, Object> customer = Map.of(
                    "id", user.getId(),
                    "username", user.getUsername(),
                    "tenant_id", user.getTenantId()
                );
                context.getClaims().claim("customer", customer);
            });
        }
    };
}
```

### 2.2 Stateless User-Service Validation (Spring Security Resource Server)
In `user-service`, configure standard OAuth2 resource server:

```properties
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://auth.local
spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://auth.local/oauth2/jwks
```

```java
@Configuration
@EnableWebSecurity
public class ResourceServerSecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));
        return http.build();
    }
}
```

### 2.3 User Profile Resolution in User-Service
Instead of `KeycloakUserView` joining across DBs, `user-service` resolves the caller directly from `Jwt`:

```java
@GetMapping("/me")
public UserProfileDTO getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
    String username = jwt.getClaimAsString("preferred_username");
    Long tenantId = jwt.getClaim("tenant_id");
    
    return userService.getByUsername(username, tenantId);
}
```

### 2.4 Credential Management (Decoupled Flow)
- **Password Verification**: Any user-facing password check happens at `auth-server` during login or re-authentication flows.
- **Password Updates**: Users navigate to `/auth/password-change` or `auth-server` exposes an authenticated endpoint `POST /api/auth/password/change` protected by Bearer token.
- **Drop `KeycloakProviderClient.checkPassword()`**: Remove Feign check calls entirely. The Resource Server simply trusts the cryptographically signed JWT.

---

## 3. Migration Roadmap & Checklist

| Step | Action | Impacted Service | Benefit |
|---|---|---|---|
| **1** | Enrich Authorization Server JWT with `customer`, `tenant_id`, and `roles` | `auth` | Eliminates SPI JDBC queries |
| **2** | Add `spring-boot-starter-oauth2-resource-server` | `user-service` | Standardized stateless verification |
| **3** | Replace `KeycloakUserView` queries with JWT claims + internal `us_user` | `user-service` | Drops MySQL cross-database view grants |
| **4** | Deprecate & remove `KeycloakProviderClient.checkPassword` | `user-service` | Removes synchronous password leakage |
| **5** | Retire `keycloak-provider` SPIs and MySQL cross-schema dependencies | `keycloak-provider` | Clean microservice boundaries |
