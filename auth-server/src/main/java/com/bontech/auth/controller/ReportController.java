package com.bontech.auth.controller;

import com.bontech.auth.dto.LogDto;
import com.bontech.auth.service.ActivityLogService;
import com.bontech.auth.service.ReportService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {
    private final ReportService reportService;
    private final ActivityLogService activityLogService;


    @GetMapping("/users/{username}/activity")
    public LogDto.ActivityReport activityReport(@PathVariable String username) {
        return reportService.userActivityReport(username);
    }

    @GetMapping("/users/{username}/logs")
    public List<LogDto.ActivityLogView> logs(@PathVariable String username) {
        return activityLogService.userLogs(username);
    }
}
