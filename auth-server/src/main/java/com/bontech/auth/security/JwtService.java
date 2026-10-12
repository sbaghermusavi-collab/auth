package com.bontech.auth.security;

import com.bontech.auth.entity.UserAccount;
import com.bontech.auth.entity.Role;
import com.bontech.auth.entity.Permission;
import java.time.Instant;
import java.util.List;
import java.util.Map;
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

import com.bontech.auth.repository.TenantRepository;
import com.bontech.auth.entity.Tenant;

@Service
public class JwtService {
    private final JwtEncoder jwtEncoder;
    private final JwtDecoder jwtDecoder;
    private final TenantRepository tenantRepository;
    private final long expirationSeconds;
    private final long refreshExpirationSeconds;

    public JwtService(JwtEncoder jwtEncoder,
                      JwtDecoder jwtDecoder,
                      TenantRepository tenantRepository,
                      @Value("${app.jwt.expiration-seconds:3600}") long expirationSeconds,
                      @Value("${app.jwt.refresh-expiration-seconds:86400}") long refreshExpirationSeconds) {
        this.jwtEncoder = jwtEncoder;
        this.jwtDecoder = jwtDecoder;
        this.tenantRepository = tenantRepository;
        this.expirationSeconds = expirationSeconds;
        this.refreshExpirationSeconds = refreshExpirationSeconds;
    }

    public String generate(UserAccount user, String actor) {
        return generateWithActor(user, actor, null);
    }

    /**
     * Issues an access token with optional RFC 8693 `act` (actor) claim for audited impersonation.
     */
    public String generateWithActor(UserAccount user, String actor, Map<String, Object> actorClaim) {
        Instant now = Instant.now();

        Set<String> permissions = new java.util.HashSet<>();
        try {
            if (user.getRoles() != null) {
                for (Role r : user.getRoles()) {
                    if (r != null && r.getPermissions() != null) {
                        for (Permission p : r.getPermissions()) {
                            if (p != null && p.getCode() != null) {
                                permissions.add(p.getCode());
                            }
                        }
                    }
                }
            }
        } catch (Exception ignored) {
            // Role permissions proxy not initialized in detached entity
        }

        String userSub = UUID.nameUUIDFromBytes(("user:" + user.getId()).getBytes()).toString();
        String sessionId = UUID.randomUUID().toString();

        Map<String, Object> realmAccess = Map.of(
                "roles", permissions.isEmpty() ? List.of("us.userProfile.create") : permissions
        );

        Map<String, Object> customer = Map.of(
                "id", user.getId(),
                "first_name", user.getFullName() != null ? user.getFullName() : user.getUsername(),
                "last_name", ""
        );

        String tenantCode = "default";
        if (user.getTenant() != null && user.getTenant().getCode() != null) {
            tenantCode = user.getTenant().getCode();
        } else if (user.getTenantId() != null) {
            tenantCode = tenantRepository.findById(user.getTenantId())
                    .map(Tenant::getCode)
                    .orElse("default");
        }

        JwtClaimsSet.Builder builder = JwtClaimsSet.builder()
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
                .claim("name", user.getFullName() != null ? user.getFullName() : user.getUsername())
                .claim("preferred_username", user.getUsername())
                .claim("locale", "fa")
                .claim("given_name", user.getUsername())
                .claim("family_name", "")
                .claim("userId", user.getId())
                .claim("email", user.getEmail() != null ? user.getEmail() : user.getUsername())
                .claim("customer", customer)
                .claim("tenant_id", tenantCode)
                .claim("tenant_code", tenantCode)
                .claim("tenant_numeric_id", user.getTenantId())
                .claim("tenant_name", user.getTenant() != null ? user.getTenant().getName() : "")
                .claim("username", user.getUsername())
                .claim("profile_completed", user.isProfileCompleted())
                .claim("actor", actor == null ? user.getUsername() : actor);

        // RFC 8693 Impersonation / Delegation Claim
        if (actorClaim != null && !actorClaim.isEmpty()) {
            builder.claim("act", actorClaim);
            builder.claim("is_impersonated", true);
        }

        JwsHeader header = JwsHeader.with(org.springframework.security.oauth2.jose.jws.SignatureAlgorithm.RS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, builder.build())).getTokenValue();
    }

    public String generateRefreshToken(UserAccount user) {
        return generateRefreshToken(user, UUID.randomUUID().toString(), 0);
    }

    /**
     * Issues a refresh token stamped with familyId and sequence number for rotation.
     */
    public String generateRefreshToken(UserAccount user, String familyId, int sequenceNumber) {
        Instant now = Instant.now();
        String tokenId = UUID.randomUUID().toString();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .id(tokenId)
                .issuer("self")
                .issuedAt(now)
                .expiresAt(now.plusSeconds(refreshExpirationSeconds))
                .subject(user.getUsername())
                .claim("type", "refresh")
                .claim("user_id", user.getId())
                .claim("tenant_id", user.getTenantId())
                .claim("family_id", familyId)
                .claim("seq", sequenceNumber)
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
