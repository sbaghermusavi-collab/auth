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

    private Auth auth = new Auth();
    private String defaultTenant = "default";
    private TenantConfig defaultTenantConfig = new TenantConfig();
    private String appRootUrl = "http://localhost:8090/";

    @Getter
    @Setter
    public static class TenantConfig {
        private String brandName = "آسانک";
        private String logoUrl = "/auth/resources/images/logo.png";
        private String title = "آسانک — ورود، ثبت‌نام";
        private String themeTone = "dark";
        private String animationType = "orbit"; // orbit, matrix, particle, waves
        private String primaryColor = "#0C747C";
        private String secondaryColor = "#FABD09";
        private String authBg = "#0a3034";
        private boolean otpEnabled = true;
        private boolean passwordEnabled = true;
        private boolean captchaEnabled = false;
    }

    @Getter
    @Setter
    public static class Auth {
        private boolean otpEnabled = true;
        private boolean passwordEnabled = true;
        private boolean captchaEnabled = true;
        private boolean testMode = true;
        private long otpExpirationSeconds = 180;
        private long loginInactivityTimeoutSeconds = 180;
    }


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
        private Notification notification = new Notification();

        @Getter
        @Setter
        public static class Notification {
            private String adapter = "logging"; // "sms" or "logging"
        }
    }
}
