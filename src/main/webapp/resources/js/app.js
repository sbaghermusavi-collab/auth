

(function () {
  'use strict';

  var FA_DIGITS = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  function toFa(s) { 
    return String(s).replace(/[0-9]/g, d => FA_DIGITS[+d]); 
  }

  var $ = sel => document.querySelector(sel);
  var $$ = sel => document.querySelectorAll(sel);

  function getUrlParam(param) {
    return new URLSearchParams(window.location.search).get(param);
  }

  function displayPhone() {
    var el = $('#phone-show');
    if (el) {
      var phone = getUrlParam('phone') || '09123456789';
      el.textContent = toFa(phone);
    }
  }

  var ICONS = {
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 6.1A9.7 9.7 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-3.3 4M6.6 6.6A16 16 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.2-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>'
  };

  function icon(name, size = 18) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">${ICONS[name] || ''}</svg>`;
  }

  let currentCaptcha = '';

  function genCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  function drawCaptcha() {
    const canvas = $('#cap-canvas');
    if (!canvas) return;

    currentCaptcha = genCaptcha();
    const dpr = window.devicePixelRatio || 1;
    const W = 150, H = 52;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#eef2f3'; ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 28; i++) {
      ctx.fillStyle = `rgba(12,116,124,${0.05 + Math.random() * 0.12})`;
      ctx.beginPath(); ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.6 + 0.4, 0, 7); ctx.fill();
    }
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(${20 + Math.random()*60},${90 + Math.random()*60},${100 + Math.random()*60},0.4)`;
      ctx.lineWidth = 1 + Math.random();
      ctx.beginPath(); ctx.moveTo(0, Math.random() * H);
      ctx.bezierCurveTo(W*0.3, Math.random()*H, W*0.6, Math.random()*H, W, Math.random()*H); ctx.stroke();
    }

    const colors = ['#0C747C', '#1a4f63', '#0a5c63', '#234b55', '#2a6b5e'];
    const pad = 16;
    const step = (W - pad * 2) / currentCaptcha.length;
    for (let i = 0; i < currentCaptcha.length; i++) {
      ctx.save();
      const x = pad + step * i + step / 2;
      const y = H / 2 + (Math.random() * 8 - 4);
      ctx.translate(x, y);
      ctx.rotate(Math.random() * 0.7 - 0.35);
      ctx.font = '700 ' + (26 + Math.random() * 6) + 'px Vazirmatn, system-ui, sans-serif';
      ctx.fillStyle = colors[i % colors.length];
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(currentCaptcha[i], 0, 0);
      ctx.restore();
    }
  }

  function validateLogin() {
    const primary = $('#primary');
    if (!primary) return;
    const id = $('#f-identifier')?.value.trim() || '';
    const pw = $('#f-pw')?.value || '';
    const cap = $('#f-captcha')?.value.toUpperCase() || '';
    primary.disabled = !(id.length >= 3 && pw.length >= 4 && cap === currentCaptcha);
  }

  function validateSignup() {
    const primary = $('#primary');
    if (!primary) return;
    const name = $('#f-name')?.value.trim() || '';
    const phone = $('#f-phone')?.value || '';
    const user = $('#f-username')?.value.trim() || '';
    const pw = $('#f-pw')?.value || '';
    primary.disabled = !(name.length >= 3 && /^09\d{9}$/.test(phone) && user.length >= 3 && pw.length >= 8);
  }

  function init() {
    const page = window.location.pathname.split('/').pop().toLowerCase();

    if (page.includes('login.html')) {
      if ($('#cap-canvas')) drawCaptcha();

      $('[data-act="cap-refresh"]')?.addEventListener('click', () => {
        drawCaptcha();
        $('#f-captcha').value = '';
        validateLogin();
      });

      $('[data-act="pw-toggle"]')?.addEventListener('click', function() {
        const pw = $('#f-pw');
        if (!pw) return;
        const show = pw.type === 'password';
        pw.type = show ? 'text' : 'password';
        this.innerHTML = icon(show ? 'eyeOff' : 'eye');
      });

      $$('input').forEach(el => el.addEventListener('input', validateLogin));

      $('#primary')?.addEventListener('click', () => {
        const btn = $('#primary');
        if (btn.disabled) return;
        const phone = $('#f-identifier').value.trim();
        if (phone) location.href = `method.html?phone=${encodeURIComponent(phone)}&mode=login`;
      });

      $('#otp-login')?.addEventListener('click', () => {
        const phone = $('#f-identifier').value.trim() || '09123456789';
        location.href = `method.html?phone=${encodeURIComponent(phone)}&mode=login`;
      });

      $('[data-act="to-signup"]')?.addEventListener('click', () => location.href = 'signup.html');
    }

    /* صفحه ثبت‌نام */
    if (page.includes('signup.html')) {
      $('[data-act="pw-toggle"]')?.addEventListener('click', function() {
        const pw = $('#f-pw');
        if (!pw) return;
        const show = pw.type === 'password';
        pw.type = show ? 'text' : 'password';
        this.innerHTML = icon(show ? 'eyeOff' : 'eye');
      });

      $$('input').forEach(el => el.addEventListener('input', validateSignup));

      $('#primary')?.addEventListener('click', () => {
        const btn = $('#primary');
        if (btn.disabled) return;
        const phone = $('#f-phone').value.trim();
        if (phone) location.href = `method.html?phone=${encodeURIComponent(phone)}&mode=signup`;
      });

      $('[data-act="to-login"]')?.addEventListener('click', () => location.href = 'login.html');
    }

    if (page.includes('otp.html')) {
      displayPhone();

      const cells = $$('.otp-cell');
      cells.forEach((cell, idx) => {
        cell.addEventListener('input', function () {
          this.value = this.value.replace(/[^\d]/g, '').slice(0, 1);
          if (this.value && idx < cells.length - 1) {
            cells[idx + 1].focus();
          }
        });

        cell.addEventListener('keydown', function (e) {
          if (e.key === 'Backspace' && !this.value && idx > 0) {
            cells[idx - 1].focus();
          }
        });
      });

      if (cells.length > 0) {
        setTimeout(() => cells[0].focus(), 150);
      }
    }
  }

  window.addEventListener('DOMContentLoaded', init);

})();