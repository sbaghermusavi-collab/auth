package com.bontech.auth.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.oauth2.server.authorization.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.authorization.client.InMemoryRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;

import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    @Order(1)
    public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {

        OAuth2AuthorizationServerConfigurer authorizationServerConfigurer = new OAuth2AuthorizationServerConfigurer();
        http
                .securityMatcher(authorizationServerConfigurer.getEndpointsMatcher())
                .with(authorizationServerConfigurer, configurer ->
                        configurer.oidc(Customizer.withDefaults())  // optional — enables UserInfo, etc.
                )
                // Very important — applies the default endpoints & security
                .oauth2AuthorizationServer(Customizer.withDefaults());   // ← this is often missing!

        // If you still want the old deprecated style temporarily (not recommended):
        // OAuth2AuthorizationServerConfiguration.applyDefaultSecurity(http);

        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain applicationSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // For demo — in real apps protect your APIs
                        .anyRequest().permitAll()
//                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
//                        .requestMatchers("/css/**", "/js/**", "/images/**").permitAll()
//                        .requestMatchers("/login", "/signup", "/otp", "/method", "/success","/").permitAll()
//                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
//                        .requestMatchers("/api/tenant-admin/**").hasAnyRole("ADMIN", "TENANT_ADMIN")
//                        .requestMatchers("/api/groups/**").hasAnyRole("ADMIN", "TENANT_ADMIN")
//                        .requestMatchers("/api/reports/**").hasAnyRole("ADMIN", "TENANT_ADMIN")
//                        .anyRequest().authenticated()
                )
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
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public RegisteredClientRepository registeredClientRepository(PasswordEncoder passwordEncoder) {
        RegisteredClient defaultClient = RegisteredClient.withId("client-id-1")
                .clientId("auth-client")
                .clientSecret(passwordEncoder.encode("auth-secret"))
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.CLIENT_CREDENTIALS)
                //.authorizationGrantType(AuthorizationGrantType.REFRESH_TOKEN)  // usually not for client_credentials
                .scope("user.read")
                .scope("user.write")
                .build();

        return new InMemoryRegisteredClientRepository(defaultClient);
    }

    @Bean
    public AuthorizationServerSettings authorizationServerSettings() {
        return AuthorizationServerSettings.builder().build();
        // Or customize: .issuer("http://localhost:9000") etc.
    }

    @Bean
    public SecretKey jwtSecretKey(@Value("${app.jwt.secret:01234567890123456789012345678901}") String secret) {
        return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Bean
    public JwtEncoder jwtEncoder(SecretKey jwtSecretKey) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(jwtSecretKey));
    }

    @Bean
    public JwtDecoder jwtDecoder(SecretKey jwtSecretKey) {
        return NimbusJwtDecoder.withSecretKey(jwtSecretKey).build();
    }
}