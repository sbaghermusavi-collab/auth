import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createJwt(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encode = (obj) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  return `${encode(header)}.${encode(payload)}.asan_bff_sig`;
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const params = new URLSearchParams(body);
        const result = {};
        for (const [k, v] of params.entries()) {
          result[k] = v;
        }
        resolve(result);
      } else if (body) {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve({});
        }
      } else {
        resolve({});
      }
    });
  });
}

function iamBffMockPlugin() {
  const availableModules = [
    {
      code: 'phonebook',
      name: 'دفترچه تلفن و مخاطبین',
      description: 'مدیریت گروه‌ها، مخاطبین، ورود اکسل و گزارشات تماس',
      category: 'core',
      defaultEnabled: true
    },
    {
      code: 'sms_single',
      name: 'ارسال تکی و وب‌پنل',
      description: 'ارسال پیامک تکی، یادآوری و پاسخگوی خودکار',
      category: 'core',
      defaultEnabled: true
    },
    {
      code: 'sms_bulk',
      name: 'ارسال گروهی و انبوه',
      description: 'ارسال نظیر به نظیر، پیامک هوشمند و ارسال به بانک شماره',
      category: 'marketing',
      defaultEnabled: true
    },
    {
      code: 'reports',
      name: 'گزارشات و تحلیل ترافیک',
      description: 'گزارش پیام‌های ارسالی، دریافتی، دلیوری و تحلیل آماری',
      category: 'analytics',
      defaultEnabled: true
    },
    {
      code: 'webservice',
      name: 'وب‌سرویس و کلیدهای API',
      description: 'مدیریت کلیدهای دسترسی API، وب‌هوک‌ها و قالب‌های پیامکی',
      category: 'developer',
      defaultEnabled: true
    },
    {
      code: 'finance',
      name: 'مدیریت مالی و شارژ',
      description: 'گزارش تراکنش‌ها، افزایش اعتبار آنلاین و صورتحساب',
      category: 'billing',
      defaultEnabled: true
    },
    {
      code: 'ticketing',
      name: 'پشتیبانی و تیکتینگ',
      description: 'سامانه پشتیبانی آنلاین، ارسال تیکت و گفتگوی کارشناس',
      category: 'support',
      defaultEnabled: false
    }
  ];

  let tenants = [
    {
      id: 1,
      code: 'default',
      name: 'پلتفرم مرکزی آسان (asan.com)',
      baseUrl: 'https://admin.asan.com',
      description: 'هسته مرکزی مدیریت هویت، سیاست‌های امنیتی و راهبری مستأجرین',
      primaryColor: '#0ea5e9',
      secondaryColor: '#0284c7',
      activeModules: ['phonebook', 'sms_single', 'sms_bulk', 'reports', 'webservice', 'finance', 'ticketing'],
      title: 'کنسول یکپارچه مدیریت آسان (admin.asan.com)',
      themeTone: 'dark',
      animationType: 'orbit',
      authBg: '#0b0f17',
      otpEnabled: true,
      passwordEnabled: true,
      captchaEnabled: false,
      active: true,
      defaultRoleId: 4,
      adminUsername: 'superadmin',
      createdAt: '2026-01-10T08:00:00Z',
      updatedAt: '2026-10-30T14:20:00Z'
    },
    {
      id: 10,
      code: 'smslocal',
      name: 'سامانه پیامک سازمانی (smslocal.ir)',
      baseUrl: 'https://smslocal.asan.com',
      description: 'مستأجر تخصصی ارسال پیامک انبوه، کمپین‌های تبلیغاتی و وب‌سرویس پیامکی',
      primaryColor: '#0288D1',
      secondaryColor: '#00BCD4',
      activeModules: ['phonebook', 'sms_single', 'sms_bulk', 'reports', 'webservice', 'finance'],
      title: 'پنل سازمانی پیامک — smslocal',
      themeTone: 'dark',
      animationType: 'waves',
      authBg: '#0b1e28',
      otpEnabled: true,
      passwordEnabled: true,
      captchaEnabled: false,
      active: true,
      defaultRoleId: 3,
      adminUsername: 'sms_admin',
      createdAt: '2026-02-14T10:30:00Z',
      updatedAt: '2026-10-29T11:15:00Z'
    },
    {
      id: 20,
      code: 'asanlocal',
      name: 'ارتباطات یکپارچه آسان‌لوکال (asanlocal.ir)',
      baseUrl: 'https://asanlocal.asan.com',
      description: 'مستأجر راهکارهای ارتباطی ابری، مرکز تماس و مدیریت مشتریان سازمانی',
      primaryColor: '#10b981',
      secondaryColor: '#059669',
      activeModules: ['phonebook', 'sms_single', 'reports', 'ticketing', 'finance'],
      title: 'سامانه ارتباطی آسان‌لوکال',
      themeTone: 'dark',
      animationType: 'orbit',
      authBg: '#0d2314',
      otpEnabled: true,
      passwordEnabled: true,
      captchaEnabled: true,
      active: true,
      defaultRoleId: 6,
      adminUsername: 'asan_admin',
      createdAt: '2026-04-05T09:00:00Z',
      updatedAt: '2026-10-25T16:40:00Z'
    }
  ];

  let permissionsCatalog = [
    { id: 101, code: 'sms.smr.getSmsStats', name: 'مشاهده آمار زنده ارسال و دلیوری', description: 'دریافت گزارش‌های تحلیلی ترافیک پیامک و نرخ تحویل اپراتورها', groupCode: 'SMS_ENGINE', tenantId: 1, active: true },
    { id: 102, code: 'Campaign', name: 'مدیریت و اجرای کمپین‌های پیامکی', description: 'ایجاد، زمان‌بندی و ارسال کمپین‌های انبوه تبلیغاتی و خدماتی', groupCode: 'SMS_ENGINE', tenantId: 1, active: true },
    { id: 103, code: 'sms.sendSingle', name: 'ارسال پیامک تکی و سریع', description: 'ارسال پیامک به شماره‌های تکی از طریق وب‌پنل', groupCode: 'SMS_ENGINE', tenantId: 1, active: true },
    { id: 104, code: 'sms.p2p.batch', name: 'ارسال نظیر به نظیر (P2P Batch)', description: 'ارسال پیامک‌های شخصی‌سازی‌شده از فایل اکسل', groupCode: 'SMS_ENGINE', tenantId: 1, active: true },
    { id: 201, code: 'Contacts_Customers', name: 'مدیریت مخاطبین و مشتریان', description: 'افزودن، ویرایش و جستجوی شماره‌های دفترچه تلفن', groupCode: 'CONTACTS_BOOK', tenantId: 1, active: true },
    { id: 202, code: 'phs.manageGroups', name: 'دسته‌بندی و گروه‌بندی دفترچه تلفن', description: 'تعریف گروه‌های مخاطبین و ورود/خروج دسته‌ای شماره‌ها', groupCode: 'CONTACTS_BOOK', tenantId: 1, active: true },
    { id: 301, code: 'USER_READ', name: 'مشاهده فهرست کاربران مستأجر', description: 'دسترسی خواندنی به پروفایل، وضعیت و نقش‌های کاربران زیرمجموعه', groupCode: 'IAM_GOVERNANCE', tenantId: 1, active: true },
    { id: 302, code: 'USER_WRITE', name: 'ایجاد و ویرایش کاربران مستأجر', description: 'تعریف کاربر جدید، انسداد حساب و تغییر اطلاعات پایه', groupCode: 'IAM_GOVERNANCE', tenantId: 1, active: true },
    { id: 303, code: 'us.manageRoles', name: 'مدیریت نقش‌ها و انتساب دسترسی', description: 'تعریف نقش سفارشی و تخصیص پرمیژن‌های مجاز مستأجر به کاربران', groupCode: 'IAM_GOVERNANCE', tenantId: 1, active: true },
    { id: 304, code: 'us.impersonate', name: 'جعل هویت مجاز (RFC 8693 Token Exchange)', description: 'ورود به محیط کاربری زیرمجموعه با ثبت کامل Actor در لاگ ممیزی', groupCode: 'IAM_GOVERNANCE', tenantId: 1, active: true },
    { id: 401, code: 'api.keys.manage', name: 'مدیریت کلیدهای وب‌سرویس و API', description: 'صدور، چرخش و ابطال کلیدهای دسترسی REST/SOAP و محدودیت IP', groupCode: 'DEVELOPER_API', tenantId: 1, active: true },
    { id: 402, code: 'api.webhooks.configure', name: 'تنظیم وب‌هوک‌های دریافت و دلیوری', description: 'پیکربندی آدرس‌های Callback برای رویدادهای دریافت پیامک', groupCode: 'DEVELOPER_API', tenantId: 1, active: true },
    { id: 501, code: 'finance.wallet.view', name: 'مشاهده صورتحساب و گردش کیف پول', description: 'مشاهده ریز تراکنش‌ها، مصرف خطوط و فاکتورهای رسمی', groupCode: 'FINANCE_BILLING', tenantId: 1, active: true },
    { id: 502, code: 'finance.credit.charge', name: 'افزایش اعتبار و خرید بسته پیامک', description: 'پرداخت آنلاین و شارژ اعتبار مستأجر یا زیرکاربران', groupCode: 'FINANCE_BILLING', tenantId: 1, active: true }
  ];

  let permissionGroupsCatalog = [
    {
      id: 1,
      code: 'SMS_ENGINE',
      name: 'موتور ارسال و کمپین پیامک (SMS Engine)',
      description: 'مجوزهای هسته اصلی ارسال تکی، گروهی، نظیر به نظیر و آمار زنده دلیوری',
      tenantId: 1
    },
    {
      id: 2,
      code: 'CONTACTS_BOOK',
      name: 'دفترچه تلفن و مدیریت مخاطبین (Contacts)',
      description: 'مدیریت بانک شماره‌ها، گروه‌بندی مشتریان و درون‌ریزی فایل',
      tenantId: 1
    },
    {
      id: 3,
      code: 'IAM_GOVERNANCE',
      name: 'مدیریت هویت، کاربران و نقش‌ها (IAM Governance)',
      description: 'مدیریت چرخه حیات کاربران مستأجر، نقش‌های مقید و جعل هویت RFC 8693',
      tenantId: 1
    },
    {
      id: 4,
      code: 'DEVELOPER_API',
      name: 'وب‌سرویس، کلیدهای API و وب‌هوک (Developer)',
      description: 'تنظیمات اتصال برنامه‌نویسی، کلیدهای امنیتی و Callbackها',
      tenantId: 1
    },
    {
      id: 5,
      code: 'FINANCE_BILLING',
      name: 'امور مالی، کیف پول و صورتحساب (Finance)',
      description: 'مشاهده تراکنش‌های مالی، تعرفه‌ها و شارژ حساب',
      tenantId: 1
    }
  ];

  // Per-tenant entitled permission IDs and group IDs
  const tenantEntitledPermIds = {
    1: new Set(permissionsCatalog.map((p) => p.id)),
    10: new Set([101, 102, 103, 104, 201, 202, 301, 302, 303, 304, 401, 402, 501]),
    20: new Set([103, 201, 202, 301, 302, 303, 501, 502])
  };

  const tenantEntitledGroupIds = {
    1: new Set([1, 2, 3, 4, 5]),
    10: new Set([1, 2, 3, 4]),
    20: new Set([2, 3, 5])
  };

  function getEffectiveTenantPermCodes(tid) {
    const numTid = Number(tid);
    if (numTid === 1) {
      return permissionsCatalog.map((p) => p.code);
    }
    const directSet = tenantEntitledPermIds[numTid] || new Set();
    const result = new Set();
    for (const p of permissionsCatalog) {
      if (directSet.has(p.id)) {
        result.add(p.code);
      }
    }
    return Array.from(result);
  }

  let roles = [
    {
      id: 4,
      code: 'SUPER_ADMIN',
      name: 'راهبر کل پلتفرم (Super Admin)',
      description: 'دسترسی کامل به تمامی مستأجرین، مدیریت استحقاق پرمیژن‌ها، کلون تننت و ممیزی سراسری در admin.asan.com',
      tenantId: 1,
      isDefault: true,
      groupCodes: ['SMS_ENGINE', 'CONTACTS_BOOK', 'IAM_GOVERNANCE', 'DEVELOPER_API', 'FINANCE_BILLING'],
      permissions: permissionsCatalog.map((p) => p.code)
    },
    {
      id: 1,
      code: 'TENANT_ADMIN',
      name: 'مدیر ارشد مستأجر پیامک (Tenant Admin)',
      description: 'مدیریت کامل کاربران، نقش‌ها و دسترسی‌های مجاز در محدوده مستأجر smslocal',
      tenantId: 10,
      isDefault: false,
      groupCodes: ['SMS_ENGINE', 'CONTACTS_BOOK', 'IAM_GOVERNANCE', 'DEVELOPER_API'],
      permissions: [
        'sms.smr.getSmsStats',
        'Campaign',
        'sms.sendSingle',
        'sms.p2p.batch',
        'Contacts_Customers',
        'phs.manageGroups',
        'USER_READ',
        'USER_WRITE',
        'us.manageRoles',
        'us.impersonate',
        'api.keys.manage',
        'finance.wallet.view'
      ]
    },
    {
      id: 2,
      code: 'ROLE_SMS_OPERATOR',
      name: 'اپراتور کمپین و پشتیبانی پیامک',
      description: 'مدیریت ارسال‌های انبوه، مشاهده آمار دلیوری و مدیریت دفترچه تلفن',
      tenantId: 10,
      isDefault: false,
      groupCodes: ['SMS_ENGINE', 'CONTACTS_BOOK'],
      permissions: [
        'sms.smr.getSmsStats',
        'Campaign',
        'sms.sendSingle',
        'sms.p2p.batch',
        'Contacts_Customers',
        'phs.manageGroups'
      ]
    },
    {
      id: 3,
      code: 'ROLE_USER',
      name: 'کاربر بهره‌بردار پنل پیامک',
      description: 'دسترسی استاندارد به ارسال پیامک تکی، کمپین و دفترچه تلفن شخصی',
      tenantId: 10,
      isDefault: true,
      groupCodes: ['CONTACTS_BOOK'],
      permissions: ['Campaign', 'sms.sendSingle', 'Contacts_Customers', 'phs.manageGroups']
    },
    {
      id: 5,
      code: 'TENANT_ADMIN',
      name: 'مدیر ارشد مستأجر آسان‌لوکال',
      description: 'مدیریت کاربران و دسترسی‌های مستأجر ارتباطی آسان‌لوکال (Tenant 20)',
      tenantId: 20,
      isDefault: false,
      groupCodes: ['CONTACTS_BOOK', 'IAM_GOVERNANCE', 'FINANCE_BILLING'],
      permissions: [
        'sms.sendSingle',
        'Contacts_Customers',
        'phs.manageGroups',
        'USER_READ',
        'USER_WRITE',
        'us.manageRoles',
        'finance.wallet.view',
        'finance.credit.charge'
      ]
    },
    {
      id: 6,
      code: 'ROLE_ASAN_AGENT',
      name: 'کارشناس ارتباط با مشتریان',
      description: 'پاسخگویی به مشتریان، ارسال پیامک تکی و مدیریت مخاطبین در آسان‌لوکال',
      tenantId: 20,
      isDefault: true,
      groupCodes: ['CONTACTS_BOOK'],
      permissions: ['sms.sendSingle', 'Contacts_Customers', 'phs.manageGroups']
    }
  ];

  let users = [
    {
      id: 999,
      username: 'superadmin',
      firstName: 'راهبر کل',
      lastName: 'پلتفرم آسان',
      phone: '09199999999',
      email: 'superadmin@asan.com',
      tenantId: 1,
      tenantName: 'default',
      roles: ['SUPER_ADMIN'],
      directPermissions: [],
      enabled: true,
      systemUser: true,
      lastLogin: '1405/08/09 11:10',
      createdAt: '1404/10/01'
    },
    {
      id: 110,
      username: 'sms_admin',
      firstName: 'امیرحسین',
      lastName: 'رضایی (مدیر smslocal)',
      phone: '09121110000',
      email: 'sms_admin@smslocal.ir',
      tenantId: 10,
      tenantName: 'smslocal',
      roles: ['TENANT_ADMIN', 'ROLE_SMS_OPERATOR'],
      directPermissions: [],
      enabled: true,
      systemUser: false,
      lastLogin: '1405/08/09 10:42',
      createdAt: '1405/01/15'
    },
    {
      id: 111,
      username: 'sms_user',
      firstName: 'سارا',
      lastName: 'محمدی',
      phone: '09121112222',
      email: 's.mohammadi@smslocal.ir',
      tenantId: 10,
      tenantName: 'smslocal',
      roles: ['ROLE_USER'],
      directPermissions: [],
      enabled: true,
      systemUser: false,
      lastLogin: '1405/08/09 09:18',
      createdAt: '1405/02/20'
    },
    {
      id: 112,
      username: 'sms_support',
      firstName: 'کیوان',
      lastName: 'صادقی',
      phone: '09121113333',
      email: 'k.sadeghi@smslocal.ir',
      tenantId: 10,
      tenantName: 'smslocal',
      roles: ['ROLE_SMS_OPERATOR'],
      directPermissions: ['api.keys.manage'],
      enabled: true,
      systemUser: false,
      lastLogin: '1405/08/08 17:30',
      createdAt: '1405/03/11'
    },
    {
      id: 113,
      username: 'sms_finance',
      firstName: 'مهسا',
      lastName: 'کریمی',
      phone: '09121114444',
      email: 'm.karimi@smslocal.ir',
      tenantId: 10,
      tenantName: 'smslocal',
      roles: ['ROLE_USER'],
      directPermissions: ['finance.wallet.view'],
      enabled: false,
      systemUser: false,
      lastLogin: '1405/07/22 14:05',
      createdAt: '1405/04/05'
    },
    {
      id: 201,
      username: 'asan_admin',
      firstName: 'فرهاد',
      lastName: 'نوری (مدیر asanlocal)',
      phone: '09122220000',
      email: 'admin@asanlocal.ir',
      tenantId: 20,
      tenantName: 'asanlocal',
      roles: ['TENANT_ADMIN'],
      directPermissions: [],
      enabled: true,
      systemUser: false,
      lastLogin: '1405/08/09 08:55',
      createdAt: '1405/02/10'
    },
    {
      id: 210,
      username: 'asan_user',
      firstName: 'نگار',
      lastName: 'حسینی',
      phone: '09122221111',
      email: 'n.hosseini@asanlocal.ir',
      tenantId: 20,
      tenantName: 'asanlocal',
      roles: ['ROLE_ASAN_AGENT'],
      directPermissions: [],
      enabled: true,
      systemUser: false,
      lastLogin: '1405/08/08 16:12',
      createdAt: '1405/05/18'
    }
  ];

  let auditLogs = [
    {
      id: 'AUD-942',
      timestamp: '1405/08/09 11:04:18',
      actor: 'superadmin',
      target: 'Tenant 10 (smslocal)',
      action: 'GRANT_TENANT_PERMISSION',
      tenantId: 10,
      status: 'SUCCESS',
      ip: '185.143.232.10',
      details: 'Granted permission api.keys.manage to tenant smslocal via admin.asan.com'
    },
    {
      id: 'AUD-938',
      timestamp: '1405/08/09 10:45:02',
      actor: 'sms_admin',
      target: 'sms_user',
      action: 'IMPERSONATE_USER',
      tenantId: 10,
      status: 'SUCCESS',
      ip: '185.143.232.44',
      details: 'RFC 8693 token exchange issued on admin.asan.com (act: sms_admin)'
    },
    {
      id: 'AUD-929',
      timestamp: '1405/08/09 09:50:11',
      actor: 'sms_admin',
      target: 'asan_user (Tenant 20)',
      action: 'CROSS_TENANT_IMPERSONATE',
      tenantId: 10,
      status: 'BLOCKED_403',
      ip: '185.143.232.44',
      details: 'Rejected by Tenant Boundary Guard: Target user belongs to Tenant 20'
    },
    {
      id: 'AUD-915',
      timestamp: '1405/08/08 18:22:39',
      actor: 'superadmin',
      target: 'Tenant 20 (asanlocal)',
      action: 'REVOKE_TENANT_PERMISSION',
      tenantId: 20,
      status: 'SUCCESS',
      ip: '185.143.232.10',
      details: 'Revoked Campaign & sms.smr.getSmsStats from tenant asanlocal'
    },
    {
      id: 'AUD-904',
      timestamp: '1405/08/08 15:10:05',
      actor: 'sms_admin',
      target: 'sms_finance',
      action: 'USER_STATUS_DISABLED',
      tenantId: 10,
      status: 'SUCCESS',
      ip: '185.143.232.44',
      details: 'Disabled user account and terminated 2 active sessions & refresh tokens'
    }
  ];

  let activeSessions = [
    {
      id: 701,
      sessionTokenId: 'sid_admin_asan_999a',
      username: 'superadmin',
      tenantId: 1,
      ip: '185.143.232.10',
      userAgent: 'Chrome 130.0 / macOS — admin.asan.com',
      createdAt: '1405/08/09 10:00:00',
      expiresAt: '2026-11-01T10:00:00Z',
      active: true,
      current: true
    },
    {
      id: 702,
      sessionTokenId: 'sid_sms_admin_110b',
      username: 'sms_admin',
      tenantId: 10,
      ip: '185.143.232.44',
      userAgent: 'Firefox 132.0 / Windows 11 — admin.asan.com',
      createdAt: '1405/08/09 10:42:00',
      expiresAt: '2026-11-01T10:42:00Z',
      active: true,
      current: false
    },
    {
      id: 703,
      sessionTokenId: 'sid_sms_user_111c',
      username: 'sms_user',
      tenantId: 10,
      ip: '5.160.112.88',
      userAgent: 'Safari 18.1 / iOS — smslocal.asan.com',
      createdAt: '1405/08/09 09:18:00',
      expiresAt: '2026-11-01T09:18:00Z',
      active: true,
      current: false
    }
  ];

  const preAuthSessions = new Map();

  function computeUserEffectivePermissions(user) {
    const entitledForTenant = new Set(getEffectiveTenantPermCodes(user.tenantId));
    const effective = new Set();
    const userRoles = roles.filter(
      (r) =>
        user.roles.includes(r.code) &&
        (r.tenantId === user.tenantId || r.tenantId === 1)
    );
    for (const r of userRoles) {
      for (const permCode of r.permissions || []) {
        if (user.tenantId === 1 || entitledForTenant.has(permCode)) {
          effective.add(permCode);
        }
      }
    }
    for (const dp of user.directPermissions || []) {
      if (user.tenantId === 1 || entitledForTenant.has(dp)) {
        effective.add(dp);
      }
    }
    return Array.from(effective);
  }

  function enrichUser(u) {
    const tenantObj = tenants.find((t) => t.id === u.tenantId);
    return {
      ...u,
      tenantName: tenantObj ? tenantObj.code : u.tenantName || 'default',
      tenantDisplayName: tenantObj ? tenantObj.name : u.tenantName,
      effectivePermissions: computeUserEffectivePermissions(u)
    };
  }

  const attachMiddleware = (middlewares) => {
    middlewares.use(async (req, res, next) => {
      const rawUrl = req.url || '';
      const [url, queryString] = rawUrl.split('?');
      if (!url.startsWith('/api/') && url !== '/logout') {
        return next();
      }

      const query = new URLSearchParams(queryString || '');
      const sendJson = (status, data) => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(data));
      };

      // 1. Auth Login Step 1
      if (req.method === 'POST' && url === '/api/auth/login') {
        const body = await parseBody(req);
        const identifier = (body.identifier || body.username || '').trim();
        let matchedUser = users.find(
          (u) => u.username === identifier || u.phone === identifier
        );
        if (!matchedUser) {
          if (identifier === 'admin') {
            matchedUser = users.find((u) => u.username === 'superadmin');
          } else {
            return sendJson(401, { message: 'نام کاربری یا رمز عبور در درگاه admin.asan.com یافت نشد' });
          }
        }
        if (!matchedUser.enabled) {
          return sendJson(403, { message: 'این حساب کاربری مسدود شده است. با مدیر سیستم تماس بگیرید.' });
        }
        const authSessionId = `sess_${Date.now()}_${matchedUser.id}`;
        preAuthSessions.set(authSessionId, matchedUser);
        return sendJson(200, {
          authSessionId,
          nextStep: 'OTP',
          phones: [matchedUser.phone || '09121110000'],
          userPreview: {
            username: matchedUser.username,
            tenantId: matchedUser.tenantId,
            tenantName: matchedUser.tenantName
          }
        });
      }

      // 2. Auth Send OTP
      if (req.method === 'POST' && (url === '/api/auth/send-otp' || url === '/api/auth/resend-otp')) {
        return sendJson(200, {
          status: 'OTP_SENT',
          message: 'کد تایید دو مرحله‌ای ارسال شد'
        });
      }

      // 3. Auth Verify 2FA
      if (req.method === 'POST' && (url === '/api/auth/verify-2fa' || url === '/api/auth/otp/verify')) {
        const body = await parseBody(req);
        const { authSessionId, code } = body;
        if (code && code !== '999999' && String(code).length !== 6) {
          return sendJson(400, { message: 'کد تایید ۶ رقمی نامعتبر است' });
        }
        const user =
          preAuthSessions.get(authSessionId) ||
          users.find((u) => u.username === 'superadmin');
        const isSuper = user.username === 'superadmin' || user.tenantId === 1 || user.roles.includes('SUPER_ADMIN');
        const accessToken = createJwt({
          iss: 'https://admin.asan.com/auth',
          aud: 'admin.asan.com',
          sub: String(user.id),
          preferred_username: user.username,
          username: user.username,
          tenant_numeric_id: user.tenantId,
          tenant_id: user.tenantName || (isSuper ? 'default' : 'smslocal'),
          realm_access: { roles: user.roles },
          roles: user.roles,
          permissions: computeUserEffectivePermissions(user),
          is_impersonated: false,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600
        });

        auditLogs.unshift({
          id: `AUD-${Math.floor(950 + Math.random() * 900)}`,
          timestamp: 'هم‌اکنون',
          actor: user.username,
          target: 'admin.asan.com',
          action: 'ADMIN_PORTAL_LOGIN',
          tenantId: user.tenantId,
          status: 'SUCCESS',
          ip: '185.143.232.10',
          details: `Authenticated via 2FA OTP into unified host admin.asan.com (Tenant ${user.tenantId})`
        });

        return sendJson(200, {
          accessToken,
          tokenType: 'Bearer',
          expiresIn: 3600
        });
      }

      // 4. Logout
      if (url === '/api/v1/permission/logout' || url === '/logout') {
        return sendJson(200, { status: 'SUCCESS', loggedOut: true });
      }

      // 5. Modules catalog
      if (req.method === 'GET' && url === '/api/admin/modules') {
        return sendJson(200, availableModules);
      }

      // 6. Tenants CRUD & Clone
      if (req.method === 'GET' && url === '/api/admin/tenants') {
        const enrichedTenants = tenants.map((t) => ({
          ...t,
          userCount: users.filter((u) => u.tenantId === t.id).length,
          roleCount: roles.filter((r) => r.tenantId === t.id).length,
          entitledPermissionCount: getEffectiveTenantPermCodes(t.id).length
        }));
        return sendJson(200, enrichedTenants);
      }

      if (req.method === 'POST' && url === '/api/admin/tenants') {
        const body = await parseBody(req);
        const newId = Math.max(...tenants.map((t) => t.id)) + 10;
        const code = (body.code || `tenant_${newId}`).toLowerCase().trim();
        const created = {
          id: newId,
          code,
          name: body.name || `مستأجر ${code}`,
          baseUrl: body.baseUrl || `https://${code}.asan.com`,
          description: body.description || 'مستأجر سازمانی متصل به درگاه یکپارچه admin.asan.com',
          primaryColor: body.primaryColor || '#0ea5e9',
          secondaryColor: body.secondaryColor || '#0284c7',
          activeModules: body.activeModules || ['phonebook', 'sms_single', 'reports'],
          title: body.title || body.name,
          themeTone: 'dark',
          animationType: 'orbit',
          authBg: '#0b0f17',
          otpEnabled: body.otpEnabled ?? true,
          passwordEnabled: body.passwordEnabled ?? true,
          captchaEnabled: body.captchaEnabled ?? false,
          active: true,
          defaultRoleId: 3,
          adminUsername: body.adminUsername || `${code}_admin`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        tenants.push(created);
        tenantEntitledPermIds[newId] = new Set([101, 102, 103, 201, 202, 301, 302, 303]);
        tenantEntitledGroupIds[newId] = new Set([1, 2, 3]);

        // Provision initial tenant admin user
        users.push({
          id: Date.now(),
          username: created.adminUsername,
          firstName: 'مدیر ارشد',
          lastName: created.name,
          phone: '09123334455',
          email: `${created.adminUsername}@${code}.asan.com`,
          tenantId: newId,
          tenantName: code,
          roles: ['TENANT_ADMIN'],
          directPermissions: [],
          enabled: true,
          systemUser: false,
          lastLogin: 'ثبت اولیه',
          createdAt: 'هم‌اکنون'
        });

        roles.push({
          id: Date.now() + 1,
          code: 'TENANT_ADMIN',
          name: `مدیر ارشد ${created.name}`,
          description: 'دسترسی مدیریت کاربران و نقش‌ها در مستأجر',
          tenantId: newId,
          isDefault: true,
          groupCodes: ['SMS_ENGINE', 'CONTACTS_BOOK', 'IAM_GOVERNANCE'],
          permissions: ['sms.smr.getSmsStats', 'Campaign', 'sms.sendSingle', 'Contacts_Customers', 'phs.manageGroups', 'USER_READ', 'USER_WRITE', 'us.manageRoles']
        });

        auditLogs.unshift({
          id: `AUD-${Math.floor(950 + Math.random() * 900)}`,
          timestamp: 'هم‌اکنون',
          actor: 'superadmin',
          target: `Tenant ${newId} (${code})`,
          action: 'CREATE_TENANT',
          tenantId: newId,
          status: 'SUCCESS',
          ip: '185.143.232.10',
          details: `Provisioned tenant ${created.name} and initial admin @${created.adminUsername}`
        });

        return sendJson(201, created);
      }

      const tenantIdMatch = url.match(/^\/api\/admin\/tenants\/(\d+)$/);
      if (tenantIdMatch) {
        const tid = Number(tenantIdMatch[1]);
        const idx = tenants.findIndex((t) => t.id === tid);
        if (idx === -1) return sendJson(404, { message: 'مستأجر یافت نشد' });

        if (req.method === 'GET') {
          return sendJson(200, tenants[idx]);
        }
        if (req.method === 'PUT') {
          const body = await parseBody(req);
          tenants[idx] = {
            ...tenants[idx],
            ...body,
            id: tid,
            updatedAt: new Date().toISOString()
          };
          auditLogs.unshift({
            id: `AUD-${Math.floor(950 + Math.random() * 900)}`,
            timestamp: 'هم‌اکنون',
            actor: 'superadmin',
            target: `Tenant ${tid} (${tenants[idx].code})`,
            action: 'UPDATE_TENANT_CONFIG',
            tenantId: tid,
            status: 'SUCCESS',
            ip: '185.143.232.10',
            details: `Updated modules & security policy for tenant ${tenants[idx].code}`
          });
          return sendJson(200, tenants[idx]);
        }
        if (req.method === 'DELETE') {
          if (tid === 1) {
            return sendJson(400, { message: 'مستأجر پیش‌فرض مرکزی قابل حذف نیست' });
          }
          tenants.splice(idx, 1);
          return sendJson(200, { message: 'مستأجر با موفقیت حذف شد' });
        }
      }

      const tenantCloneMatch = url.match(/^\/api\/admin\/tenants\/(\d+)\/clone$/);
      if (req.method === 'POST' && (tenantCloneMatch || url === '/api/admin/tenants/clone')) {
        const body = await parseBody(req);
        const sourceId = tenantCloneMatch ? Number(tenantCloneMatch[1]) : Number(body.sourceTenantId || 10);
        const source = tenants.find((t) => t.id === sourceId) || tenants[1];
        const newId = Math.max(...tenants.map((t) => t.id)) + 10;
        const targetCode = (body.targetCode || `${source.code}_copy`).toLowerCase().trim();
        const cloned = {
          ...source,
          id: newId,
          code: targetCode,
          name: body.targetName || `کلون ${source.name}`,
          baseUrl: body.targetBaseUrl || `https://${targetCode}.asan.com`,
          description: body.description || `کلون شده از مستأجر ${source.name}`,
          adminUsername: body.adminUsername || `${targetCode}_admin`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        tenants.push(cloned);
        tenantEntitledPermIds[newId] = new Set(tenantEntitledPermIds[sourceId] || []);
        tenantEntitledGroupIds[newId] = new Set(tenantEntitledGroupIds[sourceId] || []);

        if (body.copyRoles !== false) {
          const sourceRoles = roles.filter((r) => r.tenantId === sourceId);
          for (const sr of sourceRoles) {
            roles.push({
              ...sr,
              id: Date.now() + Math.floor(Math.random() * 1000),
              tenantId: newId,
              permissions: [...sr.permissions]
            });
          }
        }

        users.push({
          id: Date.now() + 99,
          username: cloned.adminUsername,
          firstName: 'مدیر کلون',
          lastName: cloned.name,
          phone: '09128889900',
          email: `${cloned.adminUsername}@${targetCode}.asan.com`,
          tenantId: newId,
          tenantName: targetCode,
          roles: ['TENANT_ADMIN'],
          directPermissions: [],
          enabled: true,
          systemUser: false,
          lastLogin: 'کلون جدید',
          createdAt: 'هم‌اکنون'
        });

        auditLogs.unshift({
          id: `AUD-${Math.floor(950 + Math.random() * 900)}`,
          timestamp: 'هم‌اکنون',
          actor: 'superadmin',
          target: `Tenant ${newId} (${targetCode})`,
          action: 'CLONE_TENANT',
          tenantId: newId,
          status: 'SUCCESS',
          ip: '185.143.232.10',
          details: `Cloned tenant ${targetCode} from source tenant ${source.code} (roles & entitlements copied)`
        });

        return sendJson(201, cloned);
      }

      // 7. Permissions & Permission Groups Catalog + Tenant Entitlements (Super Admin & Tenant Admin)
      if (req.method === 'GET' && url === '/api/admin/permissions') {
        const tid = query.get('tenantId') ? Number(query.get('tenantId')) : null;
        if (tid && tid !== 1) {
          const entitled = new Set(getEffectiveTenantPermCodes(tid));
          return sendJson(
            200,
            permissionsCatalog.filter((p) => entitled.has(p.code))
          );
        }
        return sendJson(200, permissionsCatalog);
      }

      if (req.method === 'POST' && url === '/api/admin/permissions') {
        const body = await parseBody(req);
        const newPerm = {
          id: Math.max(...permissionsCatalog.map((p) => p.id)) + 1,
          code: (body.code || '').trim(),
          name: (body.name || body.code || '').trim(),
          description: body.description || 'مجوز عملیاتی تعریف شده توسط سوپرادمین',
          groupCode: body.groupCode || 'SMS_ENGINE',
          tenantId: Number(body.tenantId || 1),
          active: true
        };
        permissionsCatalog.push(newPerm);
        tenantEntitledPermIds[1].add(newPerm.id);
        if (body.entitleToTenantId) {
          const tSet = tenantEntitledPermIds[Number(body.entitleToTenantId)] || new Set();
          tSet.add(newPerm.id);
          tenantEntitledPermIds[Number(body.entitleToTenantId)] = tSet;
        }
        return sendJson(201, newPerm);
      }

      const permIdMatch = url.match(/^\/api\/admin\/permissions\/(\d+)$/);
      if (permIdMatch) {
        const pid = Number(permIdMatch[1]);
        const pIdx = permissionsCatalog.findIndex((p) => p.id === pid);
        if (pIdx === -1) return sendJson(404, { message: 'پرمیژن یافت نشد' });

        if (req.method === 'GET') {
          return sendJson(200, permissionsCatalog[pIdx]);
        }
        if (req.method === 'PUT') {
          const body = await parseBody(req);
          permissionsCatalog[pIdx] = {
            ...permissionsCatalog[pIdx],
            code: body.code ? body.code.trim() : permissionsCatalog[pIdx].code,
            name: body.name ? body.name.trim() : permissionsCatalog[pIdx].name,
            description: body.description !== undefined ? body.description : permissionsCatalog[pIdx].description,
            groupCode: body.groupCode || permissionsCatalog[pIdx].groupCode,
            active: body.active !== undefined ? Boolean(body.active) : permissionsCatalog[pIdx].active
          };
          return sendJson(200, permissionsCatalog[pIdx]);
        }
        if (req.method === 'DELETE') {
          const removed = permissionsCatalog.splice(pIdx, 1)[0];
          Object.values(tenantEntitledPermIds).forEach((s) => s.delete(pid));
          roles.forEach((r) => {
            r.permissions = (r.permissions || []).filter((c) => c !== removed.code);
          });
          return sendJson(200, { deleted: true, id: pid });
        }
      }

      const tenantDefaultRoleMatch = url.match(/^\/api\/admin\/tenants\/(\d+)\/default-role$/);
      if (req.method === 'PUT' && tenantDefaultRoleMatch) {
        const tid = Number(tenantDefaultRoleMatch[1]);
        const body = await parseBody(req);
        const t = tenants.find((item) => item.id === tid);
        if (!t) return sendJson(404, { message: 'مستأجر یافت نشد' });
        t.defaultRoleId = Number(body.defaultRoleId);
        roles.forEach((r) => {
          if (r.tenantId === tid) {
            r.isDefault = r.id === t.defaultRoleId;
          }
        });
        return sendJson(200, { tenantId: tid, defaultRoleId: t.defaultRoleId });
      }

      const tenantImpersonateMatch = url.match(/^\/api\/admin\/tenants\/(\d+)\/impersonate$/);
      if (req.method === 'POST' && tenantImpersonateMatch) {
        const tid = Number(tenantImpersonateMatch[1]);
        const t = tenants.find((item) => item.id === tid);
        if (!t) return sendJson(404, { message: 'مستأجر یافت نشد' });
        const targetAdmin =
          users.find((u) => u.tenantId === tid && u.roles.includes('TENANT_ADMIN')) ||
          users.find((u) => u.tenantId === tid);
        if (!targetAdmin) return sendJson(404, { message: 'کاربر ادمین برای این مستأجر یافت نشد' });
        const impToken = createJwt({
          iss: 'https://admin.asan.com/auth',
          aud: 'admin.asan.com',
          sub: String(targetAdmin.id),
          preferred_username: targetAdmin.username,
          username: targetAdmin.username,
          tenant_numeric_id: targetAdmin.tenantId,
          tenant_id: t.code,
          roles: targetAdmin.roles,
          permissions: computeUserEffectivePermissions(targetAdmin),
          is_impersonated: true,
          act: { sub: '999', username: 'superadmin', tenant_id: '1' },
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600
        });
        return sendJson(200, {
          status: 'SUCCESS',
          isImpersonated: true,
          targetUsername: targetAdmin.username,
          tenantId: tid,
          accessToken: impToken
        });
      }

      if (req.method === 'GET' && url === '/api/admin/permission-groups') {
        const enrichedGroups = permissionGroupsCatalog.map((g) => ({
          ...g,
          permissions: permissionsCatalog.filter((p) => p.groupCode === g.code)
        }));
        return sendJson(200, enrichedGroups);
      }

      if (req.method === 'POST' && url === '/api/admin/permission-groups') {
        const body = await parseBody(req);
        const newGrp = {
          id: Math.max(...permissionGroupsCatalog.map((g) => g.id)) + 1,
          code: (body.code || `GRP_${Date.now()}`).toUpperCase().trim(),
          name: body.name || body.code,
          description: body.description || 'گروه مجوزهای سیستمی',
          tenantId: Number(body.tenantId || 1)
        };
        permissionGroupsCatalog.push(newGrp);
        tenantEntitledGroupIds[1].add(newGrp.id);
        return sendJson(201, { ...newGrp, permissions: [] });
      }

      const grpIdMatch = url.match(/^\/api\/admin\/permission-groups\/(\d+)$/);
      if (grpIdMatch) {
        const gid = Number(grpIdMatch[1]);
        const gIdx = permissionGroupsCatalog.findIndex((g) => g.id === gid);
        if (gIdx === -1) return sendJson(404, { message: 'گروه پرمیژن یافت نشد' });
        if (req.method === 'PUT') {
          const body = await parseBody(req);
          permissionGroupsCatalog[gIdx] = {
            ...permissionGroupsCatalog[gIdx],
            name: body.name || permissionGroupsCatalog[gIdx].name,
            description: body.description !== undefined ? body.description : permissionGroupsCatalog[gIdx].description
          };
          return sendJson(200, permissionGroupsCatalog[gIdx]);
        }
        if (req.method === 'DELETE') {
          permissionGroupsCatalog.splice(gIdx, 1);
          return sendJson(200, { deleted: true, id: gid });
        }
      }

      const tenantPermsMatch = url.match(/^\/api\/admin\/tenants\/(\d+)\/permissions$/);
      if (req.method === 'GET' && tenantPermsMatch) {
        const tid = Number(tenantPermsMatch[1]);
        const entitledCodes = getEffectiveTenantPermCodes(tid);
        const entitledIds = Array.from(tenantEntitledPermIds[tid] || []);
        const entitledGroupIds = Array.from(tenantEntitledGroupIds[tid] || []);
        const groupCodes = permissionGroupsCatalog
          .filter((g) => entitledGroupIds.includes(g.id))
          .map((g) => g.code);

        return sendJson(200, {
          tenantId: tid,
          permissions: entitledCodes,
          entitledPermissionIds: entitledIds,
          permissionGroups: groupCodes,
          entitledGroupIds,
          catalog: permissionGroupsCatalog.map((g) => ({
            ...g,
            entitled: tid === 1 || entitledGroupIds.includes(g.id),
            permissions: permissionsCatalog
              .filter((p) => p.groupCode === g.code)
              .map((p) => ({
                ...p,
                entitled: tid === 1 || entitledCodes.includes(p.code)
              }))
          }))
        });
      }

      // Grant / Revoke single permission to/from Tenant (Super Admin)
      const grantRevokePermMatch = url.match(/^\/api\/admin\/tenants\/(\d+)\/permissions\/(\d+)$/);
      if (grantRevokePermMatch) {
        const tid = Number(grantRevokePermMatch[1]);
        const pid = Number(grantRevokePermMatch[2]);
        const perm = permissionsCatalog.find((p) => p.id === pid);
        if (!tenantEntitledPermIds[tid]) tenantEntitledPermIds[tid] = new Set();

        if (req.method === 'POST') {
          tenantEntitledPermIds[tid].add(pid);
          auditLogs.unshift({
            id: `AUD-${Math.floor(950 + Math.random() * 900)}`,
            timestamp: 'هم‌اکنون',
            actor: 'superadmin',
            target: `Tenant ${tid}`,
            action: 'GRANT_TENANT_PERMISSION',
            tenantId: tid,
            status: 'SUCCESS',
            ip: '185.143.232.10',
            details: `Granted permission ${perm ? perm.code : pid} to Tenant ${tid}`
          });
          return sendJson(200, { status: 'GRANTED', tenantId: tid, permissionId: pid });
        }

        if (req.method === 'DELETE') {
          tenantEntitledPermIds[tid].delete(pid);
          // Also strip revoked permission from any scoped role of that tenant
          if (perm) {
            for (const r of roles) {
              if (r.tenantId === tid) {
                r.permissions = r.permissions.filter((c) => c !== perm.code);
              }
            }
          }
          auditLogs.unshift({
            id: `AUD-${Math.floor(950 + Math.random() * 900)}`,
            timestamp: 'هم‌اکنون',
            actor: 'superadmin',
            target: `Tenant ${tid}`,
            action: 'REVOKE_TENANT_PERMISSION',
            tenantId: tid,
            status: 'SUCCESS',
            ip: '185.143.232.10',
            details: `Revoked permission ${perm ? perm.code : pid} from Tenant ${tid} and cascaded to tenant roles`
          });
          return sendJson(200, { status: 'REVOKED', tenantId: tid, permissionId: pid });
        }
      }

      // Grant / Revoke entire permission group to/from Tenant (Super Admin)
      const grantRevokeGroupMatch = url.match(/^\/api\/admin\/tenants\/(\d+)\/permission-groups\/(\d+)$/);
      if (grantRevokeGroupMatch) {
        const tid = Number(grantRevokeGroupMatch[1]);
        const gid = Number(grantRevokeGroupMatch[2]);
        const grp = permissionGroupsCatalog.find((g) => g.id === gid);
        if (!tenantEntitledGroupIds[tid]) tenantEntitledGroupIds[tid] = new Set();
        if (!tenantEntitledPermIds[tid]) tenantEntitledPermIds[tid] = new Set();

        const groupPerms = grp ? permissionsCatalog.filter((p) => p.groupCode === grp.code) : [];

        if (req.method === 'POST') {
          tenantEntitledGroupIds[tid].add(gid);
          for (const gp of groupPerms) {
            tenantEntitledPermIds[tid].add(gp.id);
          }
          auditLogs.unshift({
            id: `AUD-${Math.floor(950 + Math.random() * 900)}`,
            timestamp: 'هم‌اکنون',
            actor: 'superadmin',
            target: `Tenant ${tid}`,
            action: 'GRANT_PERMISSION_GROUP',
            tenantId: tid,
            status: 'SUCCESS',
            ip: '185.143.232.10',
            details: `Granted group ${grp ? grp.code : gid} (${groupPerms.length} permissions) to Tenant ${tid}`
          });
          return sendJson(200, { status: 'GROUP_GRANTED', tenantId: tid, groupId: gid });
        }

        if (req.method === 'DELETE') {
          tenantEntitledGroupIds[tid].delete(gid);
          for (const gp of groupPerms) {
            tenantEntitledPermIds[tid].delete(gp.id);
            for (const r of roles) {
              if (r.tenantId === tid) {
                r.permissions = r.permissions.filter((c) => c !== gp.code);
              }
            }
          }
          auditLogs.unshift({
            id: `AUD-${Math.floor(950 + Math.random() * 900)}`,
            timestamp: 'هم‌اکنون',
            actor: 'superadmin',
            target: `Tenant ${tid}`,
            action: 'REVOKE_PERMISSION_GROUP',
            tenantId: tid,
            status: 'SUCCESS',
            ip: '185.143.232.10',
            details: `Revoked group ${grp ? grp.code : gid} from Tenant ${tid}`
          });
          return sendJson(200, { status: 'GROUP_REVOKED', tenantId: tid, groupId: gid });
        }
      }

      // 8. Users & User Permissions / Roles Management
      if (req.method === 'GET' && (url === '/api/admin/users' || url === '/api/tenant-admin/users')) {
        const qTenant = query.get('tenantId') ? Number(query.get('tenantId')) : null;
        if (url === '/api/tenant-admin/users') {
          const actorTenant = Number(req.headers['x-actor-tenant-id'] || req.headers['x-tenant-id'] || 10);
          return sendJson(
            200,
            users.filter((u) => u.tenantId === actorTenant).map(enrichUser)
          );
        }
        if (qTenant) {
          return sendJson(
            200,
            users.filter((u) => u.tenantId === qTenant).map(enrichUser)
          );
        }
        return sendJson(200, users.map(enrichUser));
      }

      if (req.method === 'POST' && (url === '/api/admin/users' || url === '/api/tenant-admin/users')) {
        const body = await parseBody(req);
        const targetTid = Number(body.tenantId || req.headers['x-actor-tenant-id'] || 10);
        const tenantObj = tenants.find((t) => t.id === targetTid);
        const newUser = {
          id: Date.now(),
          username: (body.username || `user_${Date.now()}`).trim(),
          firstName: body.firstName || 'کاربر',
          lastName: body.lastName || 'جدید',
          phone: body.phone || body.phoneNumber || '09120000000',
          email: body.email || `${body.username}@${tenantObj ? tenantObj.code : 'tenant'}.asan.com`,
          tenantId: targetTid,
          tenantName: tenantObj ? tenantObj.code : 'smslocal',
          roles: Array.isArray(body.roles) && body.roles.length > 0 ? body.roles : ['ROLE_USER'],
          directPermissions: Array.isArray(body.directPermissions) ? body.directPermissions : [],
          enabled: true,
          systemUser: false,
          lastLogin: 'ثبت جدید',
          createdAt: 'هم‌اکنون'
        };
        users.push(newUser);
        auditLogs.unshift({
          id: `AUD-${Math.floor(950 + Math.random() * 900)}`,
          timestamp: 'هم‌اکنون',
          actor: req.headers['x-actor-role'] === 'SUPER_ADMIN' ? 'superadmin' : 'tenant_admin',
          target: `@${newUser.username}`,
          action: 'CREATE_USER',
          tenantId: targetTid,
          status: 'SUCCESS',
          ip: '185.143.232.44',
          details: `Created user @${newUser.username} in Tenant ${targetTid} with roles [${newUser.roles.join(', ')}]`
        });
        return sendJson(201, enrichUser(newUser));
      }

      const statusMatch = url.match(/^\/api\/(?:tenant-)?admin\/users\/(\d+)\/status$/);
      if (req.method === 'PUT' && statusMatch) {
        const userId = Number(statusMatch[1]);
        const body = await parseBody(req);
        const user = users.find((u) => u.id === userId);
        if (!user) return sendJson(404, { message: 'کاربر یافت نشد' });
        user.enabled = Boolean(body.enabled);
        if (!user.enabled) {
          activeSessions = activeSessions.filter((s) => s.username !== user.username);
        }
        auditLogs.unshift({
          id: `AUD-${Math.floor(950 + Math.random() * 900)}`,
          timestamp: 'هم‌اکنون',
          actor: req.headers['x-actor-role'] === 'SUPER_ADMIN' ? 'superadmin' : 'sms_admin',
          target: `@${user.username}`,
          action: user.enabled ? 'USER_STATUS_ENABLED' : 'USER_STATUS_DISABLED',
          tenantId: user.tenantId,
          status: 'SUCCESS',
          ip: '185.143.232.44',
          details: user.enabled
            ? `Re-enabled user @${user.username}`
            : `Blocked user @${user.username} and revoked active sessions`
        });
        return sendJson(200, enrichUser(user));
      }

      const userRolesMatch = url.match(/^\/api\/(?:tenant-)?admin\/users\/(\d+)\/roles$/);
      if (req.method === 'PUT' && userRolesMatch) {
        const userId = Number(userRolesMatch[1]);
        const body = await parseBody(req);
        const user = users.find((u) => u.id === userId);
        if (!user) return sendJson(404, { message: 'کاربر یافت نشد' });

        if (Array.isArray(body.roles)) {
          user.roles = body.roles;
        }
        if (Array.isArray(body.directPermissions)) {
          // Validate against tenant entitlement
          const entitled = new Set(getEffectiveTenantPermCodes(user.tenantId));
          user.directPermissions = body.directPermissions.filter(
            (p) => user.tenantId === 1 || entitled.has(p)
          );
        }
        auditLogs.unshift({
          id: `AUD-${Math.floor(950 + Math.random() * 900)}`,
          timestamp: 'هم‌اکنون',
          actor: req.headers['x-actor-role'] === 'SUPER_ADMIN' ? 'superadmin' : 'sms_admin',
          target: `@${user.username}`,
          action: 'UPDATE_USER_ACCESS',
          tenantId: user.tenantId,
          status: 'SUCCESS',
          ip: '185.143.232.44',
          details: `Updated roles [${user.roles.join(', ')}] & direct permissions (${user.directPermissions.length}) for @${user.username}`
        });
        return sendJson(200, enrichUser(user));
      }

      const userDeleteMatch = url.match(/^\/api\/(?:tenant-)?admin\/users\/(\d+)$/);
      if (req.method === 'DELETE' && userDeleteMatch) {
        const userId = Number(userDeleteMatch[1]);
        const idx = users.findIndex((u) => u.id === userId);
        if (idx === -1) return sendJson(404, { message: 'کاربر یافت نشد' });
        if (users[idx].systemUser) {
          return sendJson(400, { message: 'کاربر سیستمی قابل حذف نیست' });
        }
        const removed = users.splice(idx, 1)[0];
        return sendJson(200, { deleted: true, username: removed.username });
      }

      // 9. Roles & One-Click Group Attach/Detach
      if (req.method === 'GET' && url === '/api/admin/roles') {
        const qTenant = query.get('tenantId') ? Number(query.get('tenantId')) : null;
        const filteredRoles = qTenant && qTenant !== 1
          ? roles.filter((r) => r.tenantId === qTenant)
          : roles;
        const enrichedRoles = filteredRoles.map((r) => ({
          ...r,
          userCount: users.filter((u) => u.tenantId === r.tenantId && u.roles.includes(r.code)).length
        }));
        return sendJson(200, enrichedRoles);
      }

      if (req.method === 'POST' && url === '/api/admin/roles') {
        const body = await parseBody(req);
        const tid = Number(body.tenantId || 10);
        const entitled = new Set(getEffectiveTenantPermCodes(tid));
        const requestedPerms = Array.isArray(body.permissions) ? body.permissions : [];

        if (tid !== 1) {
          for (const code of requestedPerms) {
            if (!entitled.has(code)) {
              return sendJson(403, {
                message: `خطای گارد استحقاق (PERMISSION_NOT_ENTITLED): مجوز ${code} برای مستأجر ${tid} فعال نیست.`
              });
            }
          }
        }

        const newRole = {
          id: Date.now(),
          code: (body.code || 'ROLE_CUSTOM').startsWith('ROLE_')
            ? body.code.toUpperCase()
            : `ROLE_${(body.code || 'CUSTOM').toUpperCase()}`,
          name: body.name || body.code,
          description: body.description || 'نقش سفارشی مستأجر',
          tenantId: tid,
          isDefault: Boolean(body.isDefault),
          groupCodes: body.groupCodes || [],
          permissions: requestedPerms
        };
        roles.push(newRole);
        auditLogs.unshift({
          id: `AUD-${Math.floor(950 + Math.random() * 900)}`,
          timestamp: 'هم‌اکنون',
          actor: req.headers['x-actor-role'] === 'SUPER_ADMIN' ? 'superadmin' : 'sms_admin',
          target: newRole.code,
          action: 'CREATE_ROLE',
          tenantId: tid,
          status: 'SUCCESS',
          ip: '185.143.232.44',
          details: `Created scoped role ${newRole.code} with ${newRole.permissions.length} entitled permissions`
        });
        return sendJson(201, newRole);
      }

      const roleUpdateMatch = url.match(/^\/api\/admin\/roles\/(\d+)$/);
      if (roleUpdateMatch) {
        const roleId = Number(roleUpdateMatch[1]);
        const role = roles.find((r) => r.id === roleId);
        if (!role) return sendJson(404, { message: 'نقش یافت نشد' });

        if (req.method === 'PUT') {
          const body = await parseBody(req);
          const tid = role.tenantId;
          const entitled = new Set(getEffectiveTenantPermCodes(tid));
          if (Array.isArray(body.permissions)) {
            if (tid !== 1) {
              for (const code of body.permissions) {
                if (!entitled.has(code)) {
                  return sendJson(403, {
                    message: `خطای گارد استحقاق (PERMISSION_NOT_ENTITLED): مجوز ${code} برای مستأجر ${tid} مجاز نیست.`
                  });
                }
              }
            }
            role.permissions = body.permissions;
          }
          if (body.name) role.name = body.name;
          if (body.description !== undefined) role.description = body.description;
          return sendJson(200, role);
        }

        if (req.method === 'DELETE') {
          if (role.isDefault || role.code === 'SUPER_ADMIN' || role.code === 'TENANT_ADMIN') {
            return sendJson(400, { message: 'نقش پایه سیستمی قابل حذف نیست' });
          }
          roles = roles.filter((r) => r.id !== roleId);
          return sendJson(200, { deleted: true });
        }
      }

      // One-Click Group Attach / Detach to Role (/api/admin/roles/:roleId/groups/:groupId)
      const roleGroupMatch = url.match(/^\/api\/admin\/roles\/(\d+)\/groups\/(\d+)$/);
      if (roleGroupMatch) {
        const roleId = Number(roleGroupMatch[1]);
        const groupId = Number(roleGroupMatch[2]);
        const role = roles.find((r) => r.id === roleId);
        const grp = permissionGroupsCatalog.find((g) => g.id === groupId);
        if (!role || !grp) return sendJson(404, { message: 'نقش یا گروه پرمیژن یافت نشد' });

        const groupPerms = permissionsCatalog.filter((p) => p.groupCode === grp.code);
        const entitled = new Set(getEffectiveTenantPermCodes(role.tenantId));

        if (req.method === 'POST') {
          let added = 0;
          let skipped = 0;
          for (const p of groupPerms) {
            if (role.tenantId !== 1 && !entitled.has(p.code)) {
              skipped++;
              continue;
            }
            if (!role.permissions.includes(p.code)) {
              role.permissions.push(p.code);
              added++;
            }
          }
          if (!role.groupCodes) role.groupCodes = [];
          if (!role.groupCodes.includes(grp.code)) role.groupCodes.push(grp.code);
          return sendJson(200, {
            added,
            skipped,
            reason: skipped > 0 ? `تعداد ${skipped} مجوز به دلیل عدم استحقاق مستأجر نادیده گرفته شد` : null,
            role
          });
        }

        if (req.method === 'DELETE') {
          const groupPermCodes = new Set(groupPerms.map((p) => p.code));
          const beforeCount = role.permissions.length;
          role.permissions = role.permissions.filter((c) => !groupPermCodes.has(c));
          role.groupCodes = (role.groupCodes || []).filter((c) => c !== grp.code);
          return sendJson(200, {
            removed: beforeCount - role.permissions.length,
            skipped: 0,
            reason: 'detached successfully',
            role
          });
        }
      }

      // 10. Impersonation (RFC 8693)
      if (req.method === 'POST' && url === '/api/admin/impersonate') {
        const body = await parseBody(req);
        const target = users.find((u) => u.username === body.targetUsername);
        if (!target) {
          return sendJson(404, { message: 'کاربر هدف یافت نشد' });
        }
        const actorRole = req.headers['x-actor-role'] || 'TENANT_ADMIN';
        const actorTenant = Number(req.headers['x-actor-tenant-id'] || 10);
        if (actorRole !== 'SUPER_ADMIN' && actorTenant !== 1 && target.tenantId !== actorTenant) {
          auditLogs.unshift({
            id: `AUD-${Math.floor(950 + Math.random() * 900)}`,
            timestamp: 'هم‌اکنون',
            actor: 'sms_admin',
            target: `${target.username} (Tenant ${target.tenantId})`,
            action: 'CROSS_TENANT_IMPERSONATE',
            tenantId: actorTenant,
            status: 'BLOCKED_403',
            ip: '185.143.232.44',
            details: `Rejected by Security Boundary Guard: Cannot impersonate user outside Tenant ${actorTenant}`
          });
          return sendJson(403, {
            message: 'خطای مرزبندی امنیتی: ادمین مستأجر مجاز به جعل هویت کاربر خارج از مستأجر خود نیست'
          });
        }
        const actorUsername = actorRole === 'SUPER_ADMIN' ? 'superadmin' : 'sms_admin';
        const impToken = createJwt({
          iss: 'https://admin.asan.com/auth',
          aud: 'admin.asan.com',
          sub: String(target.id),
          preferred_username: target.username,
          username: target.username,
          tenant_numeric_id: target.tenantId,
          tenant_id: target.tenantName || 'smslocal',
          roles: target.roles,
          permissions: computeUserEffectivePermissions(target),
          is_impersonated: true,
          act: {
            sub: actorRole === 'SUPER_ADMIN' ? '999' : '110',
            username: actorUsername,
            tenant_id: String(actorTenant)
          },
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600
        });

        auditLogs.unshift({
          id: `AUD-${Math.floor(950 + Math.random() * 900)}`,
          timestamp: 'هم‌اکنون',
          actor: actorUsername,
          target: target.username,
          action: 'IMPERSONATE_USER',
          tenantId: target.tenantId,
          status: 'SUCCESS',
          ip: '185.143.232.10',
          details: `RFC 8693 token exchange on admin.asan.com (act: ${actorUsername} -> sub: ${target.username})`
        });

        return sendJson(200, {
          status: 'SUCCESS',
          isImpersonated: true,
          targetUsername: target.username,
          accessToken: impToken
        });
      }

      if (req.method === 'POST' && url === '/api/admin/impersonate/revert') {
        return sendJson(200, {
          status: 'SUCCESS',
          isImpersonated: false,
          message: 'بازگشت به نشست اصلی ادمین در admin.asan.com با موفقیت انجام شد'
        });
      }

      // 11. Audit Logs & Reports (/api/reports/users/:username/logs, /api/admin/audit-logs)
      if (req.method === 'GET' && url === '/api/admin/audit-logs') {
        const qTenant = query.get('tenantId') ? Number(query.get('tenantId')) : null;
        if (qTenant && qTenant !== 1) {
          return sendJson(
            200,
            auditLogs.filter((l) => l.tenantId === qTenant)
          );
        }
        return sendJson(200, auditLogs);
      }

      const userLogsMatch = url.match(/^\/api\/reports\/users\/([^/]+)\/logs$/);
      if (req.method === 'GET' && userLogsMatch) {
        const uname = decodeURIComponent(userLogsMatch[1]);
        const logs = auditLogs.filter(
          (l) => l.actor === uname || l.target.includes(uname)
        );
        return sendJson(200, logs);
      }

      // 12. Active Sessions (/api/sessions/my, DELETE /api/sessions/:id)
      if (req.method === 'GET' && url === '/api/sessions/my') {
        return sendJson(200, activeSessions);
      }

      const sessionDeleteMatch = url.match(/^\/api\/sessions\/(\d+)$/);
      if (req.method === 'DELETE' && sessionDeleteMatch) {
        const sid = Number(sessionDeleteMatch[1]);
        activeSessions = activeSessions.filter((s) => s.id !== sid);
        return sendJson(200, { revoked: true, sessionId: sid });
      }

      if (req.method === 'DELETE' && url === '/api/sessions/all-other') {
        const before = activeSessions.length;
        activeSessions = activeSessions.filter((s) => s.current === true);
        return sendJson(200, { revokedCount: Math.max(0, before - activeSessions.length) });
      }

      // 13. Hierarchical User Groups (/api/groups & /api/groups/:id/permissions)
      if (!globalThis.__asanUserGroups) {
        globalThis.__asanUserGroups = [
          {
            id: 501,
            name: 'تیم بازاریابی پیامکی و کمپین (شعبه مرکزی)',
            tenantId: 10,
            fatherUserId: 110,
            fatherUsername: 'sms_admin',
            permissions: ['sms.smr.getSmsStats', 'Campaign', 'sms.sendSingle', 'Contacts_Customers']
          },
          {
            id: 502,
            name: 'واحد پشتیبانی مشتریان و تیکتینگ',
            tenantId: 10,
            fatherUserId: 110,
            fatherUsername: 'sms_admin',
            permissions: ['Contacts_Customers', 'USER_READ']
          },
          {
            id: 503,
            name: 'گروه عملیات ارتباطات ابری آسان‌لوکال',
            tenantId: 20,
            fatherUserId: 210,
            fatherUsername: 'asan_admin',
            permissions: ['sms.smr.getSmsStats', 'Contacts_Customers', 'finance.wallet.view']
          }
        ];
      }
      const userGroups = globalThis.__asanUserGroups;

      if (req.method === 'GET' && url === '/api/groups') {
        const qTid = query.get('tenantId') ? Number(query.get('tenantId')) : null;
        const list = qTid && qTid !== 1 ? userGroups.filter((g) => g.tenantId === qTid) : userGroups;
        return sendJson(200, list);
      }

      if (req.method === 'POST' && url === '/api/groups') {
        const body = await parseBody(req);
        const tid = Number(body.tenantId || 10);
        const fatherId = Number(body.fatherUserId || 110);
        const father = users.find((u) => u.id === fatherId);
        const createdGroup = {
          id: Date.now(),
          name: body.name || 'گروه کاربری جدید',
          tenantId: tid,
          fatherUserId: fatherId,
          fatherUsername: father ? father.username : 'sms_admin',
          permissions: Array.isArray(body.permissions) ? body.permissions : []
        };
        userGroups.push(createdGroup);
        return sendJson(201, createdGroup);
      }

      const userGroupPermMatch = url.match(/^\/api\/groups\/(\d+)\/permissions$/);
      if (req.method === 'POST' && userGroupPermMatch) {
        const gid = Number(userGroupPermMatch[1]);
        const body = await parseBody(req);
        const grp = userGroups.find((g) => g.id === gid);
        if (!grp) return sendJson(404, { message: 'گروه کاربری یافت نشد' });
        const permObj =
          permissionsCatalog.find((p) => p.id === Number(body.permissionId)) ||
          permissionsCatalog.find((p) => p.code === body.permissionCode);
        if (!permObj) return sendJson(404, { message: 'پرمیژن یافت نشد' });

        if (!grp.permissions.includes(permObj.code)) {
          grp.permissions.push(permObj.code);
        } else if (body.toggle) {
          grp.permissions = grp.permissions.filter((c) => c !== permObj.code);
        }
        return sendJson(200, grp);
      }

      return next();
    });
  };

  return {
    name: 'iam-bff-mock-api',
    configureServer(server) {
      attachMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachMiddleware(server.middlewares);
    }
  };
}

export default defineConfig({
  plugins: [react(), iamBffMockPlugin()],
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          content: [
            path.resolve(__dirname, './index.html'),
            path.resolve(__dirname, './src/**/*.{js,ts,jsx,tsx}')
          ],
          theme: {
            extend: {
              fontFamily: {
                sans: ['Vazirmatn', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
                vazir: ['Vazirmatn', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace']
              },
              colors: {
                indigo: {
                  50: 'rgb(var(--c-brand-50) / <alpha-value>)',
                  100: 'rgb(var(--c-brand-100) / <alpha-value>)',
                  200: 'rgb(var(--c-brand-200) / <alpha-value>)',
                  300: 'rgb(var(--c-brand-300) / <alpha-value>)',
                  400: 'rgb(var(--c-brand-400) / <alpha-value>)',
                  500: 'rgb(var(--c-brand-500) / <alpha-value>)',
                  600: 'rgb(var(--c-brand-600) / <alpha-value>)',
                  700: 'rgb(var(--c-brand-700) / <alpha-value>)',
                  800: 'rgb(var(--c-brand-800) / <alpha-value>)',
                  900: 'rgb(var(--c-brand-900) / <alpha-value>)'
                },
                slate: {
                  50: 'rgb(var(--c-neutral-50) / <alpha-value>)',
                  100: 'rgb(var(--c-neutral-100) / <alpha-value>)',
                  200: 'rgb(var(--c-neutral-200) / <alpha-value>)',
                  300: 'rgb(var(--c-neutral-300) / <alpha-value>)',
                  400: 'rgb(var(--c-neutral-400) / <alpha-value>)',
                  500: 'rgb(var(--c-neutral-500) / <alpha-value>)',
                  600: 'rgb(var(--c-neutral-600) / <alpha-value>)',
                  700: 'rgb(var(--c-neutral-700) / <alpha-value>)',
                  800: 'rgb(var(--c-neutral-800) / <alpha-value>)',
                  900: 'rgb(var(--c-neutral-900) / <alpha-value>)'
                }
              }
            }
          },
          plugins: []
        }),
        autoprefixer()
      ]
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: true
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: true
  }
});
