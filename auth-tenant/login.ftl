<!DOCTYPE html>
<html lang="fa" dir="rtl" data-auth-tone="dark">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>آسانک — ورود، ثبت‌نام و کد تأیید</title>

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

    <link rel="stylesheet" href="${url.resourcesPath}/css/stylesLogin.css" />
</head>
<body>
<div id="app">
    <div class="auth-flex">
        <div id="screens" style="flex:1; min-width:0; display:flex;">

            <!-- سمت فرم -->
            <section class="screen active"
                     data-screen="<#if flow_step??>${flow_step?lower_case}<#else>login</#if>">

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

                        <form id="kc-form-login" action="${url.loginAction}" method="post">
                            <#if flow_step??>
                                <input type="hidden" name="flow_step" value="${flow_step}" />
                            </#if>

                            <#if flow_step?? && flow_step == "ASK_NATIONAL_ID">
                                <!-- ===================== مرحله: تایید هویت (کد ملی) ===================== -->
                                <div style="margin-bottom: 24px">
                                    <h1 style="font-size:29px;font-weight:800;letter-spacing:-.02em;text-align:center">تایید هویت</h1>
                                    <p class="muted center" style="margin-top: 9px; font-size: 14.5px">
                                        برای ادامه، لطفا کد ملی خود را وارد نمایید...
                                    </p>
                                </div>

                                <div class="fld">
                                    <label class="field-label">کد ملی</label>
                                    <div class="fld-wrap">
                                        <input type="text" id="nationalId" name="nationalId" class="fld-input tnum" autofocus />
                                        <span class="lead" data-icon="user:18"></span>
                                    </div>
                                </div>

                                <button type="submit" class="btn btn-primary btn-block" style="margin-top: 22px">
                                    ادامه <span data-icon="arrowLeft:18"></span>
                                </button>

                            <#elseif flow_step?? && flow_step == "ASK_OTP">
                                <!-- ===================== مرحله: وارد کردن کد یکبار مصرف ===================== -->
                                <div style="margin-bottom: 24px">
                                    <h1 style="font-size:29px;font-weight:800;letter-spacing:-.02em;text-align:center">کد تایید را وارد کنید</h1>
                                    <#if username??>
                                        <p class="muted center" style="margin-top: 9px; font-size: 14.5px">
                                            درحال ورود با نام کاربری: <strong>${username}</strong>
                                        </p>
                                    </#if>
                                    <p class="muted center" style="margin-top: 9px; font-size: 14.5px">
                                        کد یکبار مصرف به شماره شما ارسال شد.
                                    </p>
                                </div>

                                <input type="hidden" id="otp-type-id" name="otp-type-id" value="sms" />
                                <input type="hidden" id="otp" name="otp" value="" />

                                <div class="timer-chip" id="timer-container">
                                    <span data-icon="dot:14"></span>
                                    <span>زمان باقی‌مانده:</span>
                                    <span class="timer-num tnum" id="timer">۰۳:۰۰</span>
                                </div>

                                <div class="otp-row" id="otpRow" dir="ltr">
                                    <input class="otp-box" maxlength="1" inputmode="numeric" autocomplete="one-time-code" />
                                    <input class="otp-box" maxlength="1" inputmode="numeric" />
                                    <input class="otp-box" maxlength="1" inputmode="numeric" />
                                    <input class="otp-box" maxlength="1" inputmode="numeric" />
                                    <input class="otp-box" maxlength="1" inputmode="numeric" />
                                    <input class="otp-box" maxlength="1" inputmode="numeric" />
                                </div>

                                <button type="submit" id="otp-submit-button" class="btn btn-primary btn-block" style="margin-top: 4px">
                                    تایید و ورود <span data-icon="arrowLeft:18"></span>
                                </button>

                                <div class="or-div">یا</div>

                                <button type="submit" id="resend-otp-button" name="resend" value="true"
                                        class="btn btn-outline btn-block" disabled>
                                    ارسال مجدد کد
                                </button>

                            <#elseif flow_step?? && flow_step == "SELECT_METHOD">
                                <!-- ===================== مرحله: انتخاب روش ارسال کد ===================== -->
                                <div style="margin-bottom: 24px">
                                    <h1 style="font-size:29px;font-weight:800;letter-spacing:-.02em;text-align:center">انتخاب روش</h1>
                                    <p class="muted center" style="margin-top: 9px; font-size: 14.5px">
                                        روش دریافت کد یکبار مصرف را انتخاب کنید.
                                    </p>
                                </div>

                                <div class="method-tabs" id="methodTabs" style="margin-bottom: 28px">
                                    <button type="button" class="method-tab active" id="method-sms" data-otp-type="sms">پیامک</button>
                                    <button type="button" class="method-tab" id="method-call" data-otp-type="call">تماس صوتی</button>
                                </div>

                                <input type="hidden" id="selected-method" name="otp-type" value="sms" />

                                <button type="submit" id="continue-method" class="btn btn-primary btn-block">
                                    ادامه <span data-icon="arrowLeft:18"></span>
                                </button>

                            <#else>
                                <!-- ===================== مرحله پیش‌فرض: ورود با رمز عبور / موبایل ===================== -->
                                <h1 style="font-size:29px;font-weight:800;letter-spacing:-.02em;text-align:center">ورود به حساب</h1>
                                <p class="muted center" style="margin-top:9px;font-size:14.5px">
                                    حساب کاربری ندارید؟
                                    <a class="fld-link" href="${url.registrationUrl}">ثبت‌نام کنید</a>
                                </p>

                                <div style="margin-top:24px">
                                    <div class="method-tabs" id="loginMethodTabs" >
                                        <button type="button" class="method-tab active" data-method="password">نام کاربری</button>
                                        <button type="button" class="method-tab" data-method="mobile">شماره موبایل</button>
                                    </div>

                                    <div id="loginFieldsPassword">
                                        <div class="fld">
                                            <label class="field-label">نام کاربری</label>
                                            <div class="fld-wrap">
                                                <input type="text" id="username" name="username" value="${(login.username)!''}"
                                                       placeholder="نام کاربری یا شماره موبایل خود را وارد کنید"
                                                       class="fld-input tnum" autocomplete="username" autofocus />
                                                <span class="lead" data-icon="user:18"></span>
                                            </div>
                                        </div>
                                        <div class="fld">
                                            <div class="fld-row">
                                                <label class="field-label">رمز عبور</label>
                                            </div>
                                            <div class="fld-wrap">
                                                <input type="password" id="password" name="password"
                                                       placeholder="رمز عبور خود را وارد کنید"
                                                       class="fld-input" autocomplete="current-password" />
                                                <span class="lead" data-icon="lock:18"></span>
                                                <button type="button" class="fld-toggle" data-toggle-for="password" aria-label="نمایش رمز">
                                                    <span data-icon="eye:18"></span>
                                                </button>
                                            </div>
                                            <div style="text-align:left; margin-top:7px">
                                                <a href="${url.loginResetCredentialsUrl}" class="fld-link">فراموشی رمز عبور؟</a>
                                            </div>
                                        </div>
                                    </div>

                                    <div id="loginFieldsMobile" style="display:none">
                                        <div class="fld">
                                            <label class="field-label">شماره موبایل</label>
                                            <div class="fld-wrap" dir="ltr">
                                                <input type="text" id="username-mobile" name="email" disabled
                                                       class="fld-input tnum" dir="ltr" inputmode="numeric" maxlength="11"
                                                       placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹" />
                                                <span class="lead" data-icon="phone:18"></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <label class="chk on" data-act="remember" style="margin-top:2px">
                                    <span class="box">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M20 6 9 17l-5-5" />
                                        </svg>
                                    </span>
                                    مرا به خاطر بسپار
                                </label>

                                <#if captchaRequired??>
                                    <div class="fld" style="margin-top:16px">
                                        <label class="field-label">کد امنیتی</label>
                                        <div class="captcha-row">
                                            <div class="fld-wrap" dir="ltr" style="flex:1">
                                                <input type="text" id="captcha-response" name="captcha-response"
                                                       placeholder="کد تصویر" maxlength="6" autocomplete="off"
                                                       class="fld-input tnum" style="letter-spacing:.18em" />
                                                <span class="lead" data-icon="shield:18"></span>
                                            </div>
                                            <div class="captcha-box">
                                                <img id="captcha-image" class="captcha-image" alt="کد امنیتی" style="height:50px" />
                                                <input type="hidden" id="captcha-id" name="captcha-id" />
                                                <button type="button" id="refresh-captcha" class="captcha-refresh"
                                                        onclick="refreshCaptcha()" aria-label="کد جدید">
                                                    <span data-icon="refresh:17"></span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </#if>

                                <button type="submit" name="login" id="primary" class="btn btn-primary btn-block" style="margin-top:22px">
                                    ورود به حساب <span data-icon="arrowLeft:18"></span>
                                </button>

                                <p class="muted small center" style="margin-top:22px; line-height:2">
                                    با ورود،
                                    <a class="fld-link" href="#">قوانین و مقررات</a> و
                                    <a class="fld-link" href="#">حریم خصوصی</a> را می‌پذیرید.
                                </p>
                            </#if>

                            <input type="hidden" id="id-hidden-input" name="credentialId" />
                        </form>
                    </div>
                </div>
            </section>
        </div>

        <!-- پنل برند (تصویری/تزئینی — ثابت با عناصر بصری مدرن) -->
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

<#if captchaRequired??>
    <script>
        function refreshCaptcha() {
            fetch("/api/user-service/captcha/generate")
                .then(function (response) {
                    document.getElementById('captcha-id').value = response.headers.get('X-Captcha-ID');
                    return response.blob();
                })
                .then(function (blob) {
                    var url = URL.createObjectURL(blob);
                    document.getElementById('captcha-image').src = url;
                });
        }
        document.addEventListener('DOMContentLoaded', refreshCaptcha);
    </script>
</#if>

<#if flow_step?? && flow_step == "ASK_OTP">
    <script>
        document.addEventListener("DOMContentLoaded", function () {
            var row = document.getElementById('otpRow');
            var boxes = row ? row.querySelectorAll('.otp-box') : null;
            var hiddenOtp = document.getElementById('otp');
            var resendButton = document.getElementById('resend-otp-button');

            function syncHidden() {
                var val = '';
                boxes.forEach(function (b) { val += b.value; });
                hiddenOtp.value = val;
            }

            if (boxes && boxes.length) {
                boxes.forEach(function (box, idx) {
                    box.addEventListener('input', function () {
                        box.value = box.value.replace(/[^\d]/g, '').slice(-1);
                        box.classList.toggle('filled', !!box.value);
                        if (box.value && idx < boxes.length - 1) { boxes[idx + 1].focus(); }
                        syncHidden();
                    });
                    box.addEventListener('keydown', function (e) {
                        if (e.key === 'Backspace' && !box.value && idx > 0) { boxes[idx - 1].focus(); }
                    });
                });
                boxes[0].focus();
            }

            function startOtpTimer(duration, display, resendBtn) {
                var timer = duration, minutes, seconds;
                var intervalId = setInterval(function () {
                    minutes = parseInt(timer / 60, 10);
                    seconds = parseInt(timer % 60, 10);
                    minutes = minutes < 10 ? "0" + minutes : minutes;
                    seconds = seconds < 10 ? "0" + seconds : seconds;
                    display.textContent = (window.AsanakAuth ? window.AsanakAuth.toFa(minutes) : minutes) + ":" +
                        (window.AsanakAuth ? window.AsanakAuth.toFa(seconds) : seconds);

                    if (--timer < 0) {
                        clearInterval(intervalId);
                        var container = document.getElementById('timer-container');
                        if (container) {
                            container.innerHTML = '<span style="color: var(--error)">زمان به پایان رسید</span>';
                        }
                        resendBtn.disabled = false;
                    }
                }, 1000);
            }

            var display = document.getElementById('timer');
            if (display && resendButton) {
                startOtpTimer(180, display, resendButton);
            }
        });
    </script>
</#if>

<#if flow_step?? && flow_step == "SELECT_METHOD">
    <script>
        document.addEventListener("DOMContentLoaded", function () {
            var smsBtn = document.getElementById('method-sms');
            var callBtn = document.getElementById('method-call');
            var hiddenInput = document.getElementById('selected-method');
            var continueBtn = document.getElementById('continue-method');
            var form = document.getElementById('kc-form-login');

            if (smsBtn && callBtn && hiddenInput && continueBtn && form) {
                smsBtn.addEventListener('click', function () {
                    smsBtn.classList.add('active');
                    callBtn.classList.remove('active');
                    hiddenInput.value = 'sms';
                });
                callBtn.addEventListener('click', function () {
                    callBtn.classList.add('active');
                    smsBtn.classList.remove('active');
                    hiddenInput.value = 'call';
                });
                continueBtn.addEventListener('click', function () {
                    form.submit();
                });
            }
        });
    </script>
</#if>

<#if !flow_step??>
    <script>
        // تب‌های «نام کاربری / شماره موبایل» فقط در مرحله‌ی پیش‌فرض ورود وجود دارد
        document.addEventListener('DOMContentLoaded', function () {
            var tabs = document.querySelectorAll('#loginMethodTabs .method-tab');
            var fieldsPassword = document.getElementById('loginFieldsPassword');
            var fieldsMobile = document.getElementById('loginFieldsMobile');
            var username = document.getElementById('username');
            var usernameMobile = document.getElementById('username-mobile');
            var password = document.getElementById('password');

            tabs.forEach(function (btn) {
                btn.addEventListener('click', function () {
                    tabs.forEach(function (b) { b.classList.remove('active'); });
                    btn.classList.add('active');
                    var method = btn.getAttribute('data-method');
                    var isPassword = method === 'password';

                    fieldsPassword.style.display = isPassword ? 'block' : 'none';
                    fieldsMobile.style.display = isPassword ? 'none' : 'block';

                    // فقط فیلد فعال زیر نام "username" به سرور ارسال شود
                    username.disabled = !isPassword;
                    usernameMobile.disabled = isPassword;
                    if (password) { password.disabled = !isPassword; }
                });
            });

            // چک‌باکس «مرا به خاطر بسپار»
            var rememberBox = document.querySelector('.chk[data-act="remember"]');
            if (rememberBox) {
                rememberBox.addEventListener('click', function () {
                    this.classList.toggle('on');
                    var checkbox = document.getElementById('rememberMe');
                    if (checkbox) {
                        checkbox.checked = this.classList.contains('on');
                    }
                });
            }
        });
    </script>
</#if>

<input type="hidden" id="rememberMe" name="rememberMe" value="true" />

<script src="${url.resourcesPath}/js/app.js"></script>
</body>
</html>
