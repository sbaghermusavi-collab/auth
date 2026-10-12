package com.bontech.auth.dto;

import java.time.Instant;
import java.util.List;

public final class LogDto {
    private LogDto() {}

    public record ActivityLogView(Instant actionAt, String action, String details) {}

    public record ActivityReport(String username, Instant lastLoginAt, long totalActivities, List<ActivityLogView> recentActivities) {}
}
