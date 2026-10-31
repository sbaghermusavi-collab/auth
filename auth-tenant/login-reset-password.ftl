<!DOCTYPE html>
<html lang="fa" dir="rtl" data-auth-tone="dark">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>آسانک — فراموشی رمز عبور</title>

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

    <link rel="stylesheet" href="${url.resourcesPath}/css/stylesLogin.css" />
</head>
<body>
<div id="app">
    <div class="auth-flex">
        <div id="screens" style="flex:1; min-width:0; display:flex;">

            <section class="screen active"
                     data-screen="<#if flow_step?? && flow_step == 'ASK_OTP'>forgot-otp<#elseif flow_step?? && flow_step == 'ASK_NATIONAL_ID'>forgot-national<#else>forgot</#if>">

                <div class="brand-logo">
                    <div class="logo-container">
                        <img src="${url.resourcesPath}/img/Asanak-Logo.png" alt="آسانک" />
                    </div>
                    <span class="name">آسانک</span>
                </div>

                <div class="card-center">
                    <div class="card fade-up" id="form-card">
                        <#if message?has_content>
                            <div class="alert alert-${message.type}">
                                ${kcSanitize(message.summary)?no_esc}
                            </div>
                        </#if>

                        <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">

                            <#if flow_step?? && flow_step == "ASK_NATIONAL_ID">
                                <!-- ===================== مرحله ۲: تایید کد ملی ===================== -->
                                <input type="hidden" name="flow_step" value="ASK_NATIONAL_ID" />

                                <div style="margin-bottom: 24px">
                                    <h1 style="font-size:29px;font-weight:800;letter-spacing:-.02em;text-align:center">تایید هویت</h1>
                                    <p class="muted center" style="margin-top:9px;font-size:14.5px;line-height:1.9">
                                        برای ادامه، لطفا کد ملی خود را وارد نمایید.
                                    </p>
                                </div>

                                <div class="fld">
                                    <label class="field-label">کد ملی</label>
                                    <div class="fld-wrap">
                                        <input type="text" id="nationalId" name="nationalId" autofocus
                                               placeholder="کد ملی ۱۰ رقمی" class="fld-input tnum"
                                               aria-invalid="<#if messagesPerField.existsError('nationalId')>true</#if>" />
                                        <span class="lead" data-icon="user:18"></span>
                                    </div>
                                    <#if messagesPerField.existsError('nationalId')>
                                        <p class="fld-hint error" style="margin-top: 7px;">
                                            ${kcSanitize(messagesPerField.get('nationalId'))?no_esc}
                                        </p>
                                    </#if>
                                </div>

                                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 22px">
                                    ادامه <span data-icon="arrowLeft:18"></span>
                                </button>

                            <#elseif flow_step?? && flow_step == "ASK_OTP">
                                <!-- ===================== مرحله ۳: کد یکبار مصرف (مطابق استاندارد FTL سالم) ===================== -->
                                <input type="hidden" name="flow_step" value="ASK_OTP" />

                                <div style="margin-bottom: 24px">
                                    <h1 style="font-size:29px;font-weight:800;letter-spacing:-.02em;text-align:center">کد تایید را وارد کنید</h1>
                                    <#if username??>
                                        <p class="muted center" style="margin-top: 9px; font-size: 14.5px">
                                            درحال بازیابی برای نام کاربری: <strong>${username}</strong>
                                        </p>
                                    </#if>
                                    <p class="muted center" style="margin-top: 9px; font-size: 14.5px">
                                        کد یکبار مصرف به شماره موبایل شما ارسال شد.
                                    </p>
                                </div>

                                <div class="fld">
                                    <div class="fld-row">
                                        <label class="field-label">کد تایید پیامکی</label>
                                        <div class="timer-container" style="font-size: 13px; color: var(--text-3);">
                                            زمان باقی‌مانده: <span id="timer" class="tnum">۰۲:۰۰</span>
                                        </div>
                                    </div>
                                    <div class="fld-wrap" dir="ltr">
                                        <input type="text" id="otp-code" name="otp"
                                               placeholder="- - - - - -" maxlength="6" inputmode="numeric"
                                               class="fld-input tnum" style="text-align: center; letter-spacing: 0.5em;"
                                               autocomplete="one-time-code" autofocus
                                               aria-invalid="<#if messagesPerField.existsError('otp')>true</#if>" />
                                        <span class="lead" data-icon="shield:18"></span>
                                    </div>
                                    <#if messagesPerField.existsError('otp')>
                                        <p class="fld-hint error" style="margin-top: 7px;">
                                            ${kcSanitize(messagesPerField.get('otp'))?no_esc}
                                        </p>
                                    </#if>
                                </div>

                                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 22px">
                                    تایید
                                </button>

                                <button type="submit" name="resend" value="true" id="resend-otp-button"
                                        class="btn btn-outline btn-block" style="margin-top: 12px" disabled>
                                    ارسال مجدد کد پیامکی
                                </button>

                            <#else>
                                <!-- ===================== مرحله ۱: نام کاربری + کپچا ===================== -->
                                <input type="hidden" name="flow_step" value="ASK_USERNAME_CAPTCHA" />

                                   <a class="btn btn-ghost btn-sm back-btn" href="${url.loginUrl}" id="forgotBack">
                                    <span data-icon="chevronRight:16"></span> بازگشت به ورود
                                </a>


                                <div style="margin-bottom: 24px">
                                    <h1 style="font-size:29px;font-weight:800;letter-spacing:-.02em">فراموشی رمز عبور</h1>
                                    <p class="muted" style="margin-top:9px;font-size:14.5px;line-height:1.9">
                                        نام کاربری یا شماره موبایل حساب خود را وارد کنید تا کد بازیابی برایتان پیامک شود.
                                    </p>
                                </div>

                                <div class="fld">
                                    <label class="field-label">نام کاربری یا شماره موبایل</label>
                                    <div class="fld-wrap">
                                        <input type="text" id="username" name="username"
                                               value="${(login.username)!''}"
                                               placeholder="نام کاربری یا شماره موبایل" autocomplete="off" autofocus dir="rtl"
                                               class="fld-input"
                                               aria-invalid="<#if messagesPerField.existsError('username')>true</#if>" />
                                        <span class="lead" data-icon="user:18"></span>
                                    </div>
                                    <#if messagesPerField.existsError('username')>
                                        <p class="fld-hint error" style="margin-top: 4px;">
                                            ${kcSanitize(messagesPerField.get('username'))?no_esc}
                                        </p>
                                    </#if>
                                </div>

                                <!-- کد امنیتی کپچا -->
                                <div class="fld" style="margin-top: 16px;">
                                    <label class="field-label">کد امنیتی</label>
                                    <div class="captcha-row">
                                        <div class="fld-wrap" dir="ltr" style="flex: 1">
                                            <input type="text" id="captcha-response" name="captcha-response"
                                                   placeholder="کد تصویر" maxlength="5" class="fld-input tnum" autocomplete="off"
                                                   style="letter-spacing: 0.18em" />
                                            <span class="lead" data-icon="shield:18"></span>
                                        </div>
                                        <div class="captcha-box">
                                            <img id="captcha-image" src="" alt="کد امنیتی" class="captcha-image" style="height: 50px" />
                                            <input type="hidden" id="captcha-id" name="captcha-id" />
                                            <button type="button" id="refresh-captcha" class="captcha-refresh" aria-label="کد جدید">
                                                <span data-icon="refresh:17"></span>
                                            </button>
                                        </div>
                                    </div>
                                    <#if messagesPerField.existsError('captcha-response')>
                                        <p class="fld-hint error" style="margin-top: 4px;">
                                            ${kcSanitize(messagesPerField.getFirstError('captcha-response'))?no_esc}
                                        </p>
                                    </#if>
                                </div>

                                <button type="submit" name="login" id="kc-login" class="btn btn-primary btn-block" style="margin-top: 22px">
                                    ارسال کد بازیابی <span data-icon="arrowLeft:18"></span>
                                </button>
                            </#if>

                            <input type="hidden" id="id-hidden-input" name="credentialId"
                                   <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if> />
                        </form>
                    </div>
                </div>
            </section>
        </div>

        <!-- پنل برندینگ سمت چپ -->
        <aside class="auth-dark">
            <div class="auth-glow g1"></div>
            <div class="auth-glow g2"></div>
            <div class="auth-grid"></div>
            <div class="auth-top">
                <span class="auth-eyebrow"><span data-icon="bolt:13"></span> پلتفرم ارتباط و شناخت مشتری</span>
                <h2>هر مشتری را<br /><b>بهتر بشناسید</b></h2>
                <p>پیامک، تماس صوتی و تحلیل رفتار مشتری — همه در یک پلتفرم یکپارچه و زنده.</p>
            </div>

            <div class="auth-stage">
                <div class="viz">
                    <div class="viz-ring r1"></div>
                    <div class="viz-ring r2"></div>
                    <div class="viz-ring r3"></div>
                    <div class="viz-pulse"></div>
                    <div class="viz-pulse p2"></div>
                    <div class="viz-orbit">
                        <div class="viz-node n-t green"><div class="viz-node-in"><span data-icon="mail:22"></span></div></div>
                        <div class="viz-node n-l gold"><div class="viz-node-in"><span data-icon="phone:22"></span></div></div>
                        <div class="viz-node n-b"><div class="viz-node-in"><span data-icon="star:22"></span></div></div>
                        <div class="viz-node n-r"><div class="viz-node-in"><span data-icon="bell:22"></span></div></div>
                    </div>
                    <div class="viz-core">
                        <span data-icon="users:40"></span>
                        <span class="dot"></span>
                    </div>
                    <div class="phone">
                        <div class="phone-notch"></div>
                        <div class="phone-screen">
                            <div class="sms-head">
                                <span class="av"><span data-icon="bolt:13"></span></span>
                                <div><div class="nm">آسانک</div><div class="st">آنلاین</div></div>
                            </div>
                            <div class="sms-thread">
                                <div class="sms-day">امروز ۱۰:۲۴</div>
                                <div class="bubble biz">جشنواره ویژه 🎉 عدد <b>۱</b> را بفرستید.<span class="tk">تحویل‌شده ✓✓</span></div>
                                <div class="bubble out">۱</div>
                                <div class="bubble biz">ثبت شد ✓ تماس می‌گیریم.<span class="tk">۱۰:۲۴</span></div>
                            </div>
                        </div>
                    </div>
                    <div class="viz-chip c1">
                        <div class="viz-bars"><i style="height:9px"></i><i style="height:15px"></i><i style="height:11px"></i><i style="height:20px"></i><i style="height:15px"></i></div>
                        <div><div class="cv">تحلیل هوشمند</div><div class="ck">رفتار و نیاز مشتری</div></div>
                    </div>
                </div>
            </div>

            <div class="auth-trust">
                <div><div class="tv tnum">۲۴/۷</div><div class="tk">پشتیبانی</div></div>
                <div><div class="tv tnum">٪۹۹٫۹</div><div class="tk">پایداری سرویس</div></div>
                <div><div class="tv">رمزنگاری</div><div class="tk">امنیت داده‌ها</div></div>
            </div>
        </aside>
    </div>
</div>

<!-- اسکریپت آدرس کپچا -->
<script>
    window.CAPTCHA_SERVICE_URL = "${(properties.CAPTCHA_SERVICE_URL!'http://milky.peykasa.ir/api/user-service')}";
</script>

<#if flow_step?? && flow_step == "ASK_OTP">
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            if (window.AsanakAuth) {
                window.AsanakAuth.initResendTimer(120, 'timer', 'resend-otp-button');
            }
        });
    </script>
</#if>

<script src="${url.resourcesPath}/js/app.js"></script>
</body>
</html>