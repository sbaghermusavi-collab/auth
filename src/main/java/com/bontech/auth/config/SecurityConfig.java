package com.bontech.auth.config;

import com.bontech.auth.security.CustomPasswordEncoder;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.oauth2.server.authorization.OAuth2AuthorizationServerConfigurer;
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

@Configuration
@EnableWebSecurity
@Slf4j
public class SecurityConfig {

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
                .oauth2ResourceServer(resourceServer -> resourceServer.jwt(Customizer.withDefaults()))
                .formLogin(form -> form
                        .loginPage("/login")
                        .failureHandler((request, response, exception) -> {
                            log.error("[AUTH SERVER FORM LOGIN FAILED] URI: {} | Exception: {} - Redirecting to /login?error",
                                    request.getRequestURI(), exception.getMessage(), exception);
                            response.sendRedirect("/login?error");
                        })
                        .permitAll());

        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain applicationSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
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
                                "/api/auth/password/change-expired",
                                "/api/auth/password/reset",
                                "/resources/**",
                                "/css/**",
                                "/js/**",
                                "/images/**",
                                "/WEB-INF/**"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .formLogin(form -> form
                        .loginPage("/login")
                        .failureHandler((request, response, exception) -> {
                            log.error("[APP FORM LOGIN FAILED] URI: {} | Exception: {} - Redirecting to /login?error",
                                    request.getRequestURI(), exception.getMessage(), exception);
                            response.sendRedirect("/login?error");
                        })
                        .permitAll())
                .logout(logout -> logout
                        .logoutSuccessUrl("/login?logout")
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
            UserAccount userAccount = userAccountRepository.findByUsername(username)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

            return User.withUsername(userAccount.getUsername())
                    .password(userAccount.getPasswordHash())
                    .roles(userAccount.getRoles().stream().map(r -> r.getCode()).toArray(String[]::new))
                    .build();
        };
    }
    @Bean
    @Primary
    public PasswordEncoder passwordEncoder(CustomPasswordEncoder customPasswordEncoder) {
        String defaultId = "bcrypt";

        Map<String, PasswordEncoder> encoders = new HashMap<>();
        encoders.put("bcrypt", new BCryptPasswordEncoder());
        // your "other" encoder for legacy/user-password accounts
        encoders.put("legacy", customPasswordEncoder);

        DelegatingPasswordEncoder delegatingEncoder =
                new DelegatingPasswordEncoder(defaultId, encoders);

        // encoder used when a stored hash has NO {id} prefix at all
        delegatingEncoder.setDefaultPasswordEncoderForMatches(customPasswordEncoder);

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
    public AuthenticationProvider authenticationProvider(UserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    @Bean
    public RegisteredClientRepository registeredClientRepository(PasswordEncoder clientPasswordEncoder) {
        RegisteredClient defaultClient = RegisteredClient.withId("client-id-1")
                .clientId("auth-client")
                .clientSecret(clientPasswordEncoder.encode("auth-secret"))
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
                .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
                //.authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)  // usually not for client_credentials
                .scope("user.read")
                .scope("user.write")
                .build();

        RegisteredClient asanakClient = RegisteredClient.withId("asanak-client")
                .clientId("asanak")
                .clientSecret(clientPasswordEncoder.encode(System.getenv().getOrDefault("ASANAK_CLIENT_SECRET", "FoHnEjcMn0ivnr0CV384qicgcEIPuTB4")))
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)
                .redirectUri("http://localhost/login/oauth2/code/keycloak")
                .redirectUri("http://localhost:4200/login/oauth2/code/keycloak")
                .redirectUri("http://localhost:4200/whoami")
                .redirectUri("http://localhost:4200/home")
                .redirectUri("http://localhost:4200")
                .scope("openid")
                .scope("profile")
                .scope("email")
                .clientSettings(ClientSettings.builder().requireProofKey(false).requireAuthorizationConsent(false).build())
                .build();

        return new InMemoryRegisteredClientRepository(defaultClient, asanakClient);
    }

    @Bean
    public AuthorizationServerSettings authorizationServerSettings() {
        return AuthorizationServerSettings.builder().build();
        // Or customize: .issuer("http://localhost:9000") etc.
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
                    context.getClaims().claim("roles", roles);
                    context.getClaims().claim("permissions", permissions);
                    context.getClaims().claim("authorities", authorities);

                    // Add to JWT Header (JWS Header)
                    context.getJwsHeader().header("roles", roles);
                    context.getJwsHeader().header("permissions", permissions);
                    context.getJwsHeader().header("authorities", authorities);
                });
            }
        };
    }
}
