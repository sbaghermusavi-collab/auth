<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>

<!-- Component: Multi-Tenant Visual Stage & Animation Aside -->
<aside class="auth-dark">
  <div class="auth-glow g1"></div>
  <div class="auth-glow g2"></div>
  <div class="auth-grid"></div>

  <div class="auth-top">
    <span class="auth-eyebrow">
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.9"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
      </svg>
      <span>${tenantConfig != null && tenantConfig.badgeLabel != null ? tenantConfig.badgeLabel : (tenantCode == 'smslocal' || tenantCode == 'smslocal_ir' ? 'سامانه اختصاصی پیام کوتاه' : 'پلتفرم ارتباط و شناخت مشتری')}</span>
    </span>

    <h2>${tenantConfig != null && tenantConfig.headline != null ? tenantConfig.headline : (tenantCode == 'smslocal' || tenantCode == 'smslocal_ir' ? 'ارسال پیامک هوشمند<br /><b>سریع و پایدار</b>' : 'هر مشتری را<br /><b>بهتر بشناسید</b>')}</h2>
    <p>${tenantConfig != null && tenantConfig.subHeadline != null ? tenantConfig.subHeadline : (tenantCode == 'smslocal' || tenantCode == 'smslocal_ir' ? 'ارسال سریع پیامک وب‌سرویس، اعتبارسنجی OTP و ارتباط لحظه‌ای با مخاطبان.' : 'پیامک، تماس صوتی و تحلیل رفتار مشتری — همه در یک پلتفرم یکپارچه و زنده.')}</p>
  </div>

  <div class="auth-stage" id="auth-stage-container">
    <canvas id="tenant-anim-canvas" class="anim-canvas" style="display: none;"></canvas>
    <div class="viz" id="viz-orbit-container">
      <div class="viz-ring r1"></div>
      <div class="viz-ring r2"></div>
      <div class="viz-ring r3"></div>
      <div class="viz-pulse"></div>
      <div class="viz-pulse p2"></div>
      <div class="viz-orbit">
        <div class="viz-node n-t green">
          <div class="viz-node-in">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </div>
        </div>
        <div class="viz-node n-l gold">
          <div class="viz-node-in">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
            </svg>
          </div>
        </div>
        <div class="viz-node n-b">
          <div class="viz-node-in">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 6L12 17.8 6.6 19.6l1-6L3.3 9.4l6-.9z" />
            </svg>
          </div>
        </div>
        <div class="viz-node n-r">
          <div class="viz-node-in">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
          </div>
        </div>
      </div>
      <div class="viz-core">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="8" r="3.4" />
          <path d="M2.5 20c0-3.4 2.9-6 6.5-6s6.5 2.6 6.5 6" />
          <path d="M16 5a3.2 3.2 0 0 1 0 6.2M17.5 20c0-2-.7-3.8-2-5" />
        </svg>
        <span class="dot"></span>
      </div>
      <div class="phone">
        <div class="phone-notch"></div>
        <div class="phone-screen">
          <div class="sms-head">
            <span class="av">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
              </svg>
            </span>
            <div>
              <div class="nm">${brandName != null ? brandName : 'آسانک'}</div>
              <div class="st">آنلاین</div>
            </div>
          </div>
          <div class="sms-thread">
            <div class="sms-day">امروز ۱۰:۲۴</div>
            <c:choose>
              <c:when test="${tenantCode == 'smslocal' || tenantCode == 'smslocal_ir'}">
                <div class="bubble biz">کد تایید ورود: <b>۸۴۹۲۱</b><span class="tk">تحویل‌شده ✓✓</span></div>
                <div class="bubble out">ورود انجام شد</div>
                <div class="bubble biz">سامانه SMS Local فعال است.<span class="tk">۱۰:۲۴</span></div>
              </c:when>
              <c:otherwise>
                <div class="bubble biz">جشنواره ویژه 🎉 عدد <b>۱</b> را بفرستید.<span class="tk">تحویل‌شده ✓✓</span></div>
                <div class="bubble out">۱</div>
                <div class="bubble biz">ثبت شد ✓ تماس می‌گیریم.<span class="tk">۱۰:۲۴</span></div>
              </c:otherwise>
            </c:choose>
          </div>
        </div>
      </div>
      <div class="viz-chip c1">
        <div class="viz-bars">
          <i style="height: 9px"></i><i style="height: 15px"></i><i style="height: 11px"></i><i style="height: 20px"></i><i style="height: 15px"></i>
        </div>
        <div>
          <div class="cv">
            <c:choose>
              <c:when test="${tenantCode == 'smslocal' || tenantCode == 'smslocal_ir'}">ارسال بلادرنگ</c:when>
              <c:otherwise>تحلیل هوشمند</c:otherwise>
            </c:choose>
          </div>
          <div class="ck">
            <c:choose>
              <c:when test="${tenantCode == 'smslocal' || tenantCode == 'smslocal_ir'}">ترافیک و تحویل پایداری</c:when>
              <c:otherwise>رفتار و نیاز مشتری</c:otherwise>
            </c:choose>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="auth-trust">
    <c:choose>
      <c:when test="${tenantCode == 'smslocal' || tenantCode == 'smslocal_ir'}">
        <div>
          <div class="tv tnum">۹۹٫۹۹٪</div>
          <div class="tk">تحویل بلادرنگ</div>
        </div>
        <div>
          <div class="tv tnum">&lt; ۲ ثانیه</div>
          <div class="tk">سرعت ارسال OTP</div>
        </div>
        <div>
          <div class="tv">مستقیم به اپراتور</div>
          <div class="tk">ترافیک بدون واسطه</div>
        </div>
      </c:when>
      <c:otherwise>
        <div>
          <div class="tv tnum">۲۴/۷</div>
          <div class="tk">پشتیبانی آسانک</div>
        </div>
        <div>
          <div class="tv tnum">٪۹۹٫۹</div>
          <div class="tk">پایداری سرویس</div>
        </div>
        <div>
          <div class="tv">رمزنگاری داده‌ها</div>
          <div class="tk">امنیت سازمانی</div>
        </div>
      </c:otherwise>
    </c:choose>
  </div>
</aside>
