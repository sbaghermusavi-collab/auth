package com.bontech.auth.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app")
@Getter
@Setter
public class AppProperties {
    private Jwt jwt = new Jwt();
    private Captcha captcha = new Captcha();
    private Sms sms = new Sms();

    @Getter
    @Setter
    public static class Jwt {
        private String secret;
        private long expirationSeconds;
    }

    @Getter
    @Setter
    public static class Captcha {
        private String url;
        private String validateUrl;
    }

    @Getter
    @Setter
    public static class Sms {
        private String senderApiUrl;
        private String senderApiKey;
    }
}
