package com.bontech.auth.config;

import com.bontech.auth.security.CustomPasswordEncoder;
import com.bontech.auth.tenant.TenantContext;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import jakarta.servlet.DispatcherType;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import java.io.File;
import java.nio.file.Files;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configurers.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.authorization.client.InMemoryRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer;
import org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext;
import org.springframework.security.oauth2.core.oidc.endpoint.OidcParameterNames;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import com.bontech.auth.entity.Role;
import com.bontech.auth.entity.Permission;
import com.bontech.auth.entity.UserAccount;
import com.bontech.auth.repository.TenantRepository;
import com.bontech.auth.repository.UserAccountRepository;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.core.userdetails.User;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.stream.Collectors;

import lombok.extern.slf4j.Slf4j;

import com.bontech.auth.tenant.TenantResolutionFilter;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
@Slf4j
public class SecurityConfig {

    private final TenantResolutionFilter tenantResolutionFilter;

    public SecurityConfig(TenantResolutionFilter tenantResolutionFilter) {
        this.tenantResolutionFilter = tenantResolutionFilter;
    }

    @Bean
    @Order(1)
    public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {

        OAuth2AuthorizationServerConfigurer authorizationServerConfigurer = new OAuth2AuthorizationServerConfigurer();

        http
                .securityMatcher(authorizationServerConfigurer.getEndpointsMatcher())
                .with(authorizationServerConfigurer, configurer ->
                        configurer.oidc(Customizer.withDefaults())
                )
                .authorizeHttpRequests(authorize -> authorize.anyRequest().authenticated())
                .exceptionHandling(exceptions -> exceptions
                        .defaultAuthenticationEntryPointFor(
                                new org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint("/login"),
                                new org.springframework.security.web.util.matcher.MediaTypeRequestMatcher(org.springframework.http.MediaType.TEXT_HTML)
                        )
                )
                .oauth2ResourceServer(resourceServer -> resourceServer.jwt(Customizer.withDefaults()))
                .formLogin(form -> form
                        .loginPage("/login")
                        .failureHandler((request, response, exception) -> {
                            log.error("[AUTH SERVER FORM LOGIN FAILED] URI: {} | Exception: {} - Redirecting to /login?error",
                                    request.getRequestURI(), exception.getMessage(), exception);
                            response.sendRedirect(request.getContextPath() + "/login?error");
                        })
                        .permitAll())
                .addFilterBefore(tenantResolutionFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain applicationSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .addFilterBefore(tenantResolutionFilter, UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(auth -> auth
                        .dispatcherTypeMatchers(DispatcherType.FORWARD, DispatcherType.ERROR).permitAll()
                        .requestMatchers(
                                "/",
                                "/login",
                                "/register",
                                "/signup",
                                "/method",
                                "/otp",
                                "/password-change",
                                "/forgot-password",
                                "/success",
                                "/api/auth/register",
                                "/api/auth/login",
                                "/api/auth/login/select-phone",
                                "/api/auth/send-otp",
                                "/api/auth/resend-otp",
                                "/api/auth/verify-2fa",
                                "/api/auth/otp/verify",
                                "/api/auth/refresh",
                                "/api/auth/password/change-expired",
                                "/api/auth/password/reset",
                                "/logout",
                                "/api/auth/logout",
                                "/resources/**",
                                "/tenant-assets/**",
                                "/static/**",
                                "/css/**",
                                "/js/**",
                                "/images/**",
                                "/img/**"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .formLogin(form -> form
                        .loginPage("/login")
                        .failureHandler((request, response, exception) -> {
                            log.error("[APP FORM LOGIN FAILED] URI: {} | Exception: {} - Redirecting to /login?error",
                                    request.getRequestURI(), exception.getMessage(), exception);
                            response.sendRedirect(request.getContextPath() + "/login?error");
                        })
                        .permitAll())
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/login?logout")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                        .permitAll())
                .oauth2ResourceServer(resource -> resource.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())));

        return http.build();
    }

    private JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Collection<GrantedAuthority> authorities = new java.util.ArrayList<>();

            // Add roles from the roles claim with ROLE_ prefix
            if (jwt.hasClaim("roles")) {
                java.util.List<String> roles = jwt.getClaimAsStringList("roles");
                if (roles != null) {
                    for (String role : roles) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
                    }
                }
            }

            return authorities;
        });
        return converter;
    }

    @Bean
    public UserDetailsService userDetailsService(UserAccountRepository userAccountRepository) {
        return username -> {
            Long tenantId = TenantContext.getTenantId();
            UserAccount userAccount;
            if (tenantId != null) {
                userAccount = userAccountRepository.findByUsernameAndTenantId(username, tenantId)
                        .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username + " for tenant: " + tenantId));
            } else {
                userAccount = userAccountRepository.findByUsername(username)
                        .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
            }

            return User.withUsername(userAccount.getUsername())
                    .password(userAccount.getPasswordHash())
                    .roles(userAccount.getRoles().stream().map(r -> r.getCode()).toArray(String[]::new))
                    .build();
        };
    }
    @Bean
    public CustomPasswordEncoder customPasswordEncoder() {
        return new CustomPasswordEncoder();
    }

    @Bean
    @Primary
    public PasswordEncoder passwordEncoder(CustomPasswordEncoder customPasswordEncoder) {
        String defaultId = "bcrypt";

        PasswordEncoder legacyPasswordEncoder = new PasswordEncoder() {
            @Override
            public String encode(CharSequence rawPassword) {
                return customPasswordEncoder.encode(rawPassword);
            }

            @Override
            public boolean matches(CharSequence rawPassword, String encodedPassword) {
                return customPasswordEncoder.matches(rawPassword, encodedPassword);
            }
        };

        Map<String, PasswordEncoder> encoders = new HashMap<>();
        encoders.put("bcrypt", new BCryptPasswordEncoder());
        encoders.put("noop", org.springframework.security.crypto.password.NoOpPasswordEncoder.getInstance());
        // your "other" encoder for legacy/user-password accounts
        encoders.put("legacy", legacyPasswordEncoder);

        DelegatingPasswordEncoder delegatingEncoder =
                new DelegatingPasswordEncoder(defaultId, encoders);

        // encoder used when a stored hash has NO {id} prefix at all
        delegatingEncoder.setDefaultPasswordEncoderForMatches(legacyPasswordEncoder);

        return new PasswordEncoder() {
            @Override
            public String encode(CharSequence rawPassword) {
                return delegatingEncoder.encode(rawPassword);
            }

            @Override
            public boolean matches(CharSequence rawPassword, String encodedPassword) {
                if (rawPassword == null || encodedPassword == null) {
                    return false;
                }
                String raw = rawPassword.toString();
                if (raw.startsWith("{") && raw.contains("}")) {
                    raw = raw.substring(raw.indexOf("}") + 1);
                }
                return delegatingEncoder.matches(raw, encodedPassword);
            }
        };
    }



    @Bean
    public AuthenticationProvider authenticationProvider(UserDetailsService userDetailsService,
                                                         PasswordEncoder passwordEncoder,
                                                         CustomPasswordEncoder customPasswordEncoder) {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider() {
            @Override
            protected void additionalAuthenticationChecks(org.springframework.security.core.userdetails.UserDetails userDetails,
                                                          org.springframework.security.authentication.UsernamePasswordAuthenticationToken authentication)
                    throws org.springframework.security.core.AuthenticationException {
                if (authentication.getCredentials() == null) {
                    throw new org.springframework.security.authentication.BadCredentialsException("Missing credentials");
                }
                String presentedPassword = authentication.getCredentials().toString();
                String storedPassword = userDetails.getPassword();

                if (storedPassword.startsWith("{legacy}")) {
                    String cleanHash = storedPassword.substring("{legacy}".length());
                    if (!customPasswordEncoder.matches(userDetails.getUsername(), presentedPassword, cleanHash)) {
                        throw new org.springframework.security.authentication.BadCredentialsException("Bad credentials");
                    }
                } else if (!getPasswordEncoder().matches(presentedPassword, storedPassword)) {
                    throw new org.springframework.security.authentication.BadCredentialsException("Bad credentials");
                }
            }
        };
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    @Bean
    public RegisteredClientRepository registeredClientRepository(PasswordEncoder clientPasswordEncoder,
                                                                 TenantRepository tenantRepository) {
        RegisteredClient defaultClient = RegisteredClient.withId("client-id-1")
                .clientId("auth-client")
                .clientSecret(clientPasswordEncoder.encode("auth-secret"))
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
                .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
                .scope("user.read")
                .scope("user.write")
                .build();

        // RegisteredClient base definition contains standard local defaults.
        // Dynamic tenant redirect URIs will be enriched below from database (tenants table).
        RegisteredClient asanakClient = RegisteredClient.withId("asanak-client")
                .clientId("asanak")
                .clientSecret(clientPasswordEncoder.encode(System.getenv().getOrDefault("ASANAK_CLIENT_SECRET", "FoHnEjcMn0ivnr0CV384qicgcEIPuTB4")))
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
                .redirectUri("http://localhost/login/oauth2/code/keycloak")
                .redirectUri("http://localhost:8080/login/oauth2/code/keycloak")
                .redirectUri("http://localhost:8090/login/oauth2/code/keycloak")
                .redirectUri("http://localhost/login/oauth2/code/milky-way")
                .redirectUri("http://localhost:8080/login/oauth2/code/milky-way")
                .redirectUri("http://localhost:8090/login/oauth2/code/milky-way")
                .scope("openid")
                .scope("profile")
                .scope("email")
                .clientSettings(ClientSettings.builder().requireProofKey(false).requireAuthorizationConsent(false).build())
                .tokenSettings(org.springframework.security.oauth2.server.authorization.settings.TokenSettings.builder()
                        .reuseRefreshTokens(false)
                        .accessTokenTimeToLive(java.time.Duration.ofMinutes(15))
                        .refreshTokenTimeToLive(java.time.Duration.ofDays(30))
                        .build())
                .build();

        RegisteredClient adminClient = RegisteredClient.withId("asanak-admin-client")
                .clientId("asanak-admin")
                .clientSecret(clientPasswordEncoder.encode(System.getenv().getOrDefault("ASANAK_CLIENT_SECRET", "FoHnEjcMn0ivnr0CV384qicgcEIPuTB4")))
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
                .redirectUri("http://localhost/login/oauth2/code/admin-client")
                .redirectUri("http://localhost:8080/login/oauth2/code/admin-client")
                .redirectUri("http://localhost:8090/login/oauth2/code/admin-client")
                .scope("openid")
                .scope("profile")
                .scope("email")
                .clientSettings(ClientSettings.builder().requireProofKey(false).requireAuthorizationConsent(false).build())
                .tokenSettings(org.springframework.security.oauth2.server.authorization.settings.TokenSettings.builder()
                        .reuseRefreshTokens(false)
                        .accessTokenTimeToLive(java.time.Duration.ofMinutes(15))
                        .refreshTokenTimeToLive(java.time.Duration.ofDays(30))
                        .build())
                .build();

        RegisteredClient keycloakManagerClient = RegisteredClient.withId("keycloak-manager-client")
                .clientId("keycloak-manager")
                .clientSecret(clientPasswordEncoder.encode(System.getenv().getOrDefault("KEYCLOAK_MANAGER_CLIENT_SECRET", "euAXrjBWHCwOr4gmduSc9IyRVMlTyhdj")))
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
                .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
                .scope("openid")
                .scope("profile")
                .scope("email")
                .scope("internal.system")
                .tokenSettings(org.springframework.security.oauth2.server.authorization.settings.TokenSettings.builder()
                        .accessTokenTimeToLive(java.time.Duration.ofHours(1))
                        .build())
                .build();

        return new RegisteredClientRepository() {
            private final InMemoryRegisteredClientRepository inMemory = new InMemoryRegisteredClientRepository(defaultClient, asanakClient, adminClient, keycloakManagerClient);

            @Override
            public void save(RegisteredClient registeredClient) {
                inMemory.save(registeredClient);
            }

            @Override
            public RegisteredClient findById(String id) {
                return enrichWithTenantUris(inMemory.findById(id));
            }

            @Override
            public RegisteredClient findByClientId(String clientId) {
                return enrichWithTenantUris(inMemory.findByClientId(clientId));
            }

            private RegisteredClient enrichWithTenantUris(RegisteredClient client) {
                if (client == null) {
                    return client;
                }
                RegisteredClient.Builder b = RegisteredClient.from(client);
                try {
                    for (var tenant : tenantRepository.findAll()) {
                        String base = tenant.getBaseUrl();
                        if (base != null && !base.isBlank()) {
                            base = base.trim().replaceAll("/+$", "");
                            if ("asanak".equals(client.getClientId())) {
                                b.redirectUri(base + "/login/oauth2/code/keycloak");
                                b.redirectUri(base + "/login/oauth2/code/milky-way");
                            } else if ("asanak-admin".equals(client.getClientId())) {
                                b.redirectUri(base + "/login/oauth2/code/admin-client");
                            }
                            if (base.contains(":8090")) {
                                String withoutPort = base.replace(":8090", "");
                                if ("asanak".equals(client.getClientId())) {
                                    b.redirectUri(withoutPort + "/login/oauth2/code/keycloak");
                                    b.redirectUri(withoutPort + "/login/oauth2/code/milky-way");
                                } else if ("asanak-admin".equals(client.getClientId())) {
                                    b.redirectUri(withoutPort + "/login/oauth2/code/admin-client");
                                }
                            }
                            // Also derive admin redirect URIs dynamically from tenant domain
                            try {
                                java.net.URI uri = java.net.URI.create(base);
                                String host = uri.getHost();
                                if (host != null && !host.startsWith("admin.")) {
                                    String adminHostWithPort = "http://admin." + host + (uri.getPort() > 0 ? ":" + uri.getPort() : "");
                                    String adminHostWithoutPort = "http://admin." + host;
                                    b.redirectUri(adminHostWithPort + "/login/oauth2/code/admin-client");
                                    b.redirectUri(adminHostWithoutPort + "/login/oauth2/code/admin-client");
                                    b.redirectUri(adminHostWithPort + "/login/oauth2/code/keycloak");
                                    b.redirectUri(adminHostWithoutPort + "/login/oauth2/code/keycloak");
                                }
                            } catch (Exception ignored) {}
                        }
                    }
                } catch (Exception e) {
                    // ignore if table not ready
                }
                return b.build();
            }
        };
    }

    @Bean
    public AuthorizationServerSettings authorizationServerSettings() {
        return AuthorizationServerSettings.builder().build();
    }

    @Bean
    public KeyPair keyPair() {
        try {
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
            keyPairGenerator.initialize(2048);
            return keyPairGenerator.generateKeyPair();
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to generate RSA key pair", ex);
        }
    }

    @Bean
    public JWKSource<SecurityContext> jwkSource(KeyPair keyPair) {
        RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();
        RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();
        RSAKey rsaKey = new RSAKey.Builder(publicKey)
                .privateKey(privateKey)
                .keyID(UUID.randomUUID().toString())
                .build();
        JWKSet jwkSet = new JWKSet(rsaKey);
        return new ImmutableJWKSet<>(jwkSet);
    }

    @Bean
    public JwtEncoder jwtEncoder(JWKSource<SecurityContext> jwkSource) {
        return new NimbusJwtEncoder(jwkSource);
    }

    @Bean
    public JwtDecoder jwtDecoder(KeyPair keyPair) {
        return NimbusJwtDecoder.withPublicKey((RSAPublicKey) keyPair.getPublic()).build();
    }

    @Bean
    public OAuth2TokenCustomizer<JwtEncodingContext> jwtTokenCustomizer(UserAccountRepository userAccountRepository) {
        return (context) -> {
            if (context.getTokenType().getValue().equals("id_token") || context.getTokenType().getValue().equals("access_token")) {
                String username = context.getPrincipal().getName();
                context.getClaims().claim("preferred_username", username);

                userAccountRepository.findByUsername(username).ifPresent(user -> {
                    java.util.Set<String> roles = user.getRoles().stream()
                            .map(Role::getCode)
                            .collect(Collectors.toSet());

                    java.util.Set<String> permissions = user.getRoles().stream()
                            .flatMap(r -> r.getPermissions().stream())
                            .map(Permission::getCode)
                            .collect(Collectors.toSet());

                    java.util.Set<String> authorities = context.getPrincipal().getAuthorities().stream()
                            .map(GrantedAuthority::getAuthority)
                            .collect(Collectors.toSet());
                    authorities.addAll(permissions);

                    // Add to JWT Claims (Payload)
                    context.getClaims().claim("tenant_id", user.getTenantId());
                    context.getClaims().claim("roles", roles);
//                    context.getClaims().claim("permissions", permissions);
//                    context.getClaims().claim("authorities", authorities);

                    // Combine roles and permissions in realm_access.roles for legacy Keycloak compatibility
                    java.util.Set<String> allRealmRoles = new java.util.HashSet<>(roles);
                    allRealmRoles.addAll(permissions);

                    // Add customer context claim only if user has customer roles (not pure admin)
                    java.util.Set<String> adminRoleCodes = java.util.Set.of("SUPER_ADMIN", "ADMIN", "RP_ADMIN");
                    java.util.Set<String> customerRoleCodes = java.util.Set.of("CUSTOMER", "AGGREGATOR", "CUSTOMER_R1", "RP_CUSTOMER");
                    boolean isAdmin = roles.stream().anyMatch(adminRoleCodes::contains);
                    boolean isCustomer = roles.stream().anyMatch(customerRoleCodes::contains);

                    // If user is pure admin (no customer role), customer claim must NOT be present
                    if (isCustomer || !isAdmin) {
                        Map<String, Object> customer = new HashMap<>();
                        customer.put("id", user.getId());
                        customer.put("username", user.getUsername());
                        customer.put("tenant_id", user.getTenantId());
                        context.getClaims().claim("customer", customer);
                    }

                    // Add legacy Keycloak-compatible realm_access and resource_access claims
                    Map<String, Object> realmAccess = new HashMap<>();
                    realmAccess.put("roles", allRealmRoles);
                    context.getClaims().claim("realm_access", realmAccess);

                    Map<String, Object> clientAccess = new HashMap<>();
                    clientAccess.put("roles", roles);
                    Map<String, Object> resourceAccess = new HashMap<>();
                    resourceAccess.put("account", clientAccess);
                    context.getClaims().claim("resource_access", resourceAccess);

                    // Add to JWT Header (JWS Header)
                    context.getJwsHeader().header("tenant_id", user.getTenantId());
                    context.getJwsHeader().header("roles", roles);
                    context.getJwsHeader().header("permissions", permissions);
                    context.getJwsHeader().header("authorities", authorities);
                });
            }
        };
    }

    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> tomcatCustomizer() {
        return factory -> {
        };
    }
}
