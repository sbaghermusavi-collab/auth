package com.bontech.auth.security;

import com.bontech.auth.entity.UserAccount;
import com.bontech.auth.entity.Permission;
import com.bontech.auth.entity.Role;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final JwtEncoder jwtEncoder;
    private final JwtDecoder jwtDecoder;
    private final long expirationSeconds;
    private final long refreshExpirationSeconds;

    public JwtService(JwtEncoder jwtEncoder,
                      JwtDecoder jwtDecoder,
                      @Value("${app.jwt.expiration-seconds:3600}") long expirationSeconds,
                      @Value("${app.jwt.refresh-expiration-seconds:86400}") long refreshExpirationSeconds) {
        this.jwtEncoder = jwtEncoder;
        this.jwtDecoder = jwtDecoder;
        this.expirationSeconds = expirationSeconds;
        this.refreshExpirationSeconds = refreshExpirationSeconds;
    }

    public String generate(UserAccount user, String actor) {
        Instant now = Instant.now();

        Set<String> permissions = user.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .map(Permission::getCode)
                .collect(Collectors.toSet());

        String userSub = UUID.nameUUIDFromBytes(("user:" + user.getId()).getBytes()).toString();
        String sessionId = UUID.randomUUID().toString();

        java.util.Map<String, Object> realmAccess = java.util.Map.of(
                "roles", permissions.isEmpty() ? List.of("us.userProfile.create") : permissions
        );

        java.util.Map<String, Object> customer = java.util.Map.of(
                "id", user.getId(),
                "first_name", user.getUsername(),
                "last_name", ""
        );

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .id(UUID.randomUUID().toString())
                .issuer("http://milky.peykasa.ir/auth/realms/milky-way")
                .issuedAt(now)
                .expiresAt(now.plusSeconds(expirationSeconds))
                .subject(userSub)
                .claim("auth_time", now.getEpochSecond())
                .claim("aud", List.of("realm-management", "account"))
                .claim("typ", "Bearer")
                .claim("azp", "asanak")
                .claim("sid", sessionId)
                .claim("acr", "1")
                .claim("allowed-origins", List.of())
                .claim("realm_access", realmAccess)
                .claim("scope", "openid profile email Company_ID_Mapper organization")
                .claim("panel_id", "1")
                .claim("email_verified", true)
                .claim("name", user.getUsername())
                .claim("preferred_username", user.getUsername())
                .claim("locale", "fa")
                .claim("given_name", user.getUsername())
                .claim("family_name", "")
                .claim("userId", user.getId())
                .claim("email", user.getUsername())
                .claim("customer", customer)
                .claim("tenant_id", String.valueOf(user.getTenant() != null ? user.getTenant().getId() : user.getTenantId()))
                .claim("tenant_name", user.getTenant() != null ? user.getTenant().getName() : "")
                .claim("username", user.getUsername())
                .claim("actor", actor == null ? user.getUsername() : actor)
                .build();

        JwsHeader header = JwsHeader.with(org.springframework.security.oauth2.jose.jws.SignatureAlgorithm.RS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    public String generateRefreshToken(UserAccount user) {
        Instant now = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .id(UUID.randomUUID().toString())
                .issuer("self")
                .issuedAt(now)
                .expiresAt(now.plusSeconds(refreshExpirationSeconds))
                .subject(user.getUsername())
                .claim("type", "refresh")
                .build();

        JwsHeader header = JwsHeader.with(org.springframework.security.oauth2.jose.jws.SignatureAlgorithm.RS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    public long getExpirationSeconds() {
        return expirationSeconds;
    }

    public long getRefreshExpirationSeconds() {
        return refreshExpirationSeconds;
    }

    public String extractTokenId(String token) {
        return jwtDecoder.decode(token).getId();
    }

    public org.springframework.security.oauth2.jwt.Jwt decode(String token) {
        return jwtDecoder.decode(token);
    }
}
