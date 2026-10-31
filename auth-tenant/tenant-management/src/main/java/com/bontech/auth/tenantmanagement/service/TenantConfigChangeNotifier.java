package com.bontech.auth.tenantmanagement.service;

public interface TenantConfigChangeNotifier {
    void onTenantConfigChanged(String tenantCode);
    void onTenantConfigChanged(Long tenantId);
}
