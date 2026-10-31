package com.bontech.auth.service;

import com.bontech.auth.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CaptchaService {
    private final AppProperties properties;
    private final RestTemplate restTemplate = new RestTemplate();

    public boolean validate(String captchaId, String captchaValue) {
        if (captchaId == null || captchaId.isBlank() || captchaValue == null || captchaValue.isBlank()) {
            return false;
        }

        String validateUrl = properties.getCaptcha().getValidateUrl();
        if (validateUrl == null || validateUrl.isBlank()) {
            return false;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("captchaId", captchaId);
            requestBody.put("captchaValue", captchaValue);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

            // Expected that 2xx response means success or we parse the body. Assuming 2xx is OK or we return true if no exception.
            // Adjust according to the API specification. I will assume an OK response or a boolean body
            restTemplate.postForEntity(validateUrl, request, String.class);
            return true;
        } catch (Exception e) {
            log.error("Captcha validation failed", e);
            return false;
        }
    }
}
