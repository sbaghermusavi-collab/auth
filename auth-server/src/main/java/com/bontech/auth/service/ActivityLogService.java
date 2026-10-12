package com.bontech.auth.service;

import com.bontech.auth.dto.LogDto;
import com.bontech.auth.entity.ActivityLog;
import com.bontech.auth.entity.UserAccount;
import com.bontech.auth.repository.ActivityLogRepository;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityLogService {
    private final ActivityLogRepository repository;

    public void log(UserAccount user, String action, String details) {
        ActivityLog activity = new ActivityLog();
        activity.setUserId(user.getId());
        activity.setAction(action);
        activity.setDetails(details);
        activity.setActionAt(Instant.now());
        activity.setTenantCode(user.getTenant().getCode());
        activity.setTenantId(user.getTenantId());
        activity.setUsername(user.getUsername());
        repository.save(activity);

        MDC.put("tenant", activity.getTenantCode());
        MDC.put("user", activity.getUsername());
        try {
            log.info("activity action={} details={}", action, details);
        } finally {
            MDC.remove("tenant");
            MDC.remove("user");
        }
    }

    public List<LogDto.ActivityLogView> userLogs(String username) {
        return repository.findTop100ByUser_UsernameOrderByActionAtDesc(username)
                .stream().map(l -> new LogDto.ActivityLogView(l.getActionAt(), l.getAction(), l.getDetails())).toList();
    }
}
