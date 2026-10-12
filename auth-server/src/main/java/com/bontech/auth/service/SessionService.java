package com.bontech.auth.service;

import com.bontech.auth.dto.SessionDto;
import com.bontech.auth.repository.UserSessionRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SessionService {
    private final UserSessionRepository repository;


    public SessionDto.ActiveSessionsResponse activeSessions(String username) {
        return new SessionDto.ActiveSessionsResponse(username,
                repository.findByUser_UsernameAndActiveTrue(username).stream()
                        .map(s -> new SessionDto.SessionView(s.getSessionTokenId(), s.getExpiresAt(), s.isActive())).toList());
    }

    @Transactional
    public void signOutOtherSessions(SessionDto.SignOutOtherSessionsRequest request) {
        repository.findByUser_UsernameAndActiveTrue(request.username()).forEach(session -> {
            if (!session.getSessionTokenId().equals(request.currentSessionId())) {
                session.setActive(false);
            }
        });
    }
}
