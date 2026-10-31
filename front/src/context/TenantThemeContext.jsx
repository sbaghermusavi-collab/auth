import React, { createContext, useContext, useEffect, useState } from 'react';

const TenantThemeContext = createContext({
  tenantCode: 'default',
  tenantName: 'سامانه مرکزی',
  logoUrl: '/tenants/default/logo.svg',
  themeCssUrl: '/tenants/default/theme.css',
});

function resolveTenant(currentUser) {
  const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const paramTenant = urlParams?.get('tenant') || urlParams?.get('tenantId');

  let code = 'default';

  if (paramTenant) {
    code = paramTenant.toLowerCase();
  } else if (currentUser?.tenantName) {
    code = currentUser.tenantName.toLowerCase();
  } else if (host) {
    let clean = host.replace(/^admin\./, '');
    let firstPart = clean.split('.')[0].trim();
    if (firstPart && firstPart !== 'localhost' && firstPart !== '127' && firstPart !== 'www') {
      code = firstPart;
    }
  }

  let name = currentUser?.tenantName || (code === 'default' ? 'سامانه مرکزی' : `مستأجر ${code}`);

  return {
    tenantCode: code,
    tenantName: name,
    logoUrl: `/tenants/${code}/logo.svg`,
    themeCssUrl: `/tenants/${code}/theme.css`,
  };
}

export function TenantThemeProvider({ currentUser, children }) {
  const [tenantInfo, setTenantInfo] = useState(() => resolveTenant(currentUser));

  useEffect(() => {
    const resolved = resolveTenant(currentUser);
    setTenantInfo(resolved);

    // Apply or update tenant stylesheet link in DOM
    let link = document.getElementById('tenant-theme-css');
    if (!link) {
      link = document.createElement('link');
      link.id = 'tenant-theme-css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = resolved.themeCssUrl;

    // Update favicon
    let favicon = document.querySelector("link[rel*='icon']");
    if (favicon) {
      favicon.href = resolved.logoUrl;
    }
  }, [currentUser]);

  return (
    <TenantThemeContext.Provider value={tenantInfo}>
      {children}
    </TenantThemeContext.Provider>
  );
}

export const useTenantTheme = () => useContext(TenantThemeContext);
