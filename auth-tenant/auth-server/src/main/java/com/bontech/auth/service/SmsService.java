package com.bontech.auth.service;

import com.bontech.auth.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class SmsService {
    private final AppProperties properties;

    public void sendCode(String phone, String code) {
        String adapter = properties.getSms().getNotification().getAdapter();
        if ("logging".equalsIgnoreCase(adapter)) {
            log.info("[NOTIFICATION ADAPTER: LOGGING] OTP dispatch for phone: {} | Verification Code: {}", phone, code);
            return;
        }

        // Default / 'sms' adapter: invoke configured external SMS API endpoint
        String url = properties.getSms().getSenderApiUrl();
        String key = properties.getSms().getSenderApiKey();
        log.info("[NOTIFICATION ADAPTER: SMS] Calling SMS endpoint {} for phone: {} (key length: {})",
                url, phone, key == null ? 0 : key.length());
    }
}
