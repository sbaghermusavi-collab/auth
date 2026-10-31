package com.bontech.auth.dto;

import java.time.Instant;
import java.util.List;

public final class SessionDto {
    private SessionDto() {}

    public record SessionView(String sessionTokenId, Instant expiresAt, boolean active) {}

    public record ActiveSessionsResponse(String username, List<SessionView> sessions) {}

    public record SignOutOtherSessionsRequest(String username, String currentSessionId) {}
}
