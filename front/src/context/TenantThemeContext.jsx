import React, { createContext, useContext, useEffect, useState } from 'react';
import { UNIFIED_ADMIN_HOST } from '../api/iamService';

const TenantThemeContext = createContext({
  hostAddress: UNIFIED_ADMIN_HOST,
  tenantCode: 'default',
  tenantName: 'درگاه یکپارچه مدیریت آسان',
  logoUrl: '/tenants/default/logo.svg',
  themeCssUrl: '/tenants/default/theme.css'
});

const KNOWN_TENANTS = new Set(['default', 'smslocal', 'smslocal_ir', 'asanlocal', 'asanlocal_ir']);

function resolveTenant(currentUser) {
  let code = 'default';
  if (currentUser?.tenantName && KNOWN_TENANTS.has(currentUser.tenantName.toLowerCase())) {
    code = currentUser.tenantName.toLowerCase();
  }

  const name =
    currentUser?.role === 'SUPER_ADMIN'
      ? 'راهبری سراسری پلتفرم (Global Admin)'
      : currentUser?.tenantName
      ? `مستأجر ${currentUser.tenantName}`
      : 'درگاه یکپارچه مدیریت آسان';

  return {
    hostAddress: UNIFIED_ADMIN_HOST,
    tenantCode: code,
    tenantName: name,
    logoUrl: `/tenants/${code}/logo.svg`,
    themeCssUrl: `/tenants/default/theme.css`
  };
}

export function TenantThemeProvider({ currentUser, children }) {
  const [tenantInfo, setTenantInfo] = useState(() => resolveTenant(currentUser));

  useEffect(() => {
    const resolved = resolveTenant(currentUser);
    setTenantInfo(resolved);
  }, [currentUser]);

  return (
    <TenantThemeContext.Provider value={tenantInfo}>
      {children}
    </TenantThemeContext.Provider>
  );
}

export const useTenantTheme = () => useContext(TenantThemeContext);
