package com.bontech.auth.service;

import com.bontech.auth.dto.LogDto;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReportService {
    private final ActivityLogService logService;


    public LogDto.ActivityReport userActivityReport(String username) {
        List<LogDto.ActivityLogView> logs = logService.userLogs(username);
        Instant lastLogin = logs.stream()
                .filter(l -> "LOGIN_SUCCESS".equals(l.action()))
                .map(LogDto.ActivityLogView::actionAt)
                .findFirst()
                .orElse(null);
        return new LogDto.ActivityReport(username, lastLogin, logs.size(), logs);
    }
}
