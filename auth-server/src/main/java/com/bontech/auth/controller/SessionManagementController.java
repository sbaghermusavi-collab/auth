package com.bontech.auth.controller;

import com.bontech.auth.entity.UserAccount;
import com.bontech.auth.entity.UserSession;
import com.bontech.auth.repository.UserAccountRepository;
import com.bontech.auth.repository.UserSessionRepository;
import com.bontech.auth.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@Slf4j
public class SessionManagementController {

    private final UserSessionRepository sessionRepository;
    private final UserAccountRepository userAccountRepository;
    private final ActivityLogService logService;

    public record SessionDto(Long id, String sessionTokenId, Instant expiresAt, boolean active, boolean current) {}

    @GetMapping("/my")
    public List<SessionDto> getMySessions(@AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("username");
        if (username == null) username = jwt.getSubject();
        UserAccount user = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String currentSid = jwt.getClaimAsString("sid");
        return sessionRepository.findByUserIdAndActiveTrue(user.getId()).stream()
                .map(s -> new SessionDto(
                        s.getId(),
                        s.getSessionTokenId(),
                        s.getExpiresAt(),
                        s.isActive(),
                        s.getSessionTokenId().equals(currentSid)
                ))
                .toList();
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Map<String, Object>> revokeSession(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("username");
        if (username == null) username = jwt.getSubject();
        UserAccount user = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        int updated = sessionRepository.deactivateSession(id, user.getId());
        if (updated > 0) {
            logService.log(user, "SESSION_REVOKED", "Session ID " + id + " revoked by user");
        }
        return ResponseEntity.ok(Map.of("revoked", updated > 0, "sessionId", id));
    }

    @DeleteMapping("/all-other")
    @Transactional
    public ResponseEntity<Map<String, Object>> revokeAllOtherSessions(@AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("username");
        if (username == null) username = jwt.getSubject();
        UserAccount user = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String currentSid = jwt.getClaimAsString("sid");
        int count = sessionRepository.deactivateOtherSessions(user.getId(), currentSid != null ? currentSid : "");
        logService.log(user, "SESSIONS_REVOKED_ALL_OTHER", "Revoked " + count + " other active sessions");
        return ResponseEntity.ok(Map.of("revokedCount", count));
    }
}
