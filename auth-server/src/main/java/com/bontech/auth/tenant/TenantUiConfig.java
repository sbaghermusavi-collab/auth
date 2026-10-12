package com.bontech.auth.tenant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantUiConfig {
    private String brandName;
    private String title;
    private String logoUrl;
    private String themeTone;
    private String animationType;
    private String primaryColor;
    private String secondaryColor;
    private String authBg;
    private boolean otpEnabled;
    private boolean passwordEnabled;
    private boolean captchaEnabled;
    private String badgeLabel;
    private String headline;
    private String subHeadline;
}
