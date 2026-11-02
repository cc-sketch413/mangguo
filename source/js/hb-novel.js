/* ============================================================
   source/js/hb-novel.js —— 小说下载区「密码解锁」
   ------------------------------------------------------------
   配合 scripts/tags.js 的 {% novels %} 标签：
   - 卡片的 data-hash 里存的是正确密码的 SHA-256，
     所以网站源码 / 公开仓库里看不到密码明文
   - 访客输入密码 → 浏览器本地算 SHA-256 比对 → 正确才展开下载按钮
   - 安全性定位：**门帘级别**。纯静态站没有后端，文件本身仍可直链访问，
     懂技术的人直接访问文件路径就能下载。要真正保护需改成
     「文件加密（Web Crypto AES）+ 前端解密」。
   - 用 document 级事件委托，pjax 翻页后无需重新绑定
   ============================================================ */
(function () {
  'use strict';

  var unlocked = {};   // 已解锁的哈希：同一密码的其他卡片一起放开，省得每本都输一遍

  function sha256Hex(text) {
    if (!window.crypto || !crypto.subtle) return Promise.reject(new Error('no-subtle'));
    var data = new TextEncoder().encode(text);
    return crypto.subtle.digest('SHA-256', data).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return ('0' + b.toString(16)).slice(-2);
      }).join('');
    });
  }

  function setMsg(card, text, kind) {
    var msg = card.querySelector('.hb-novel-msg');
    if (!msg) return;
    msg.textContent = text || '';
    msg.className = 'hb-novel-msg' + (kind ? ' is-' + kind : '');
  }

  function unlock(card) {
    var files = card.querySelector('.hb-novel-files');
    var lock = card.querySelector('.hb-novel-lock');
    if (files) files.hidden = false;
    if (lock) lock.classList.add('is-done');
  }

  function tryUnlock(card) {
    var input = card.querySelector('.hb-novel-pw');
    var want = (card.getAttribute('data-hash') || '').trim();
    var val = input ? String(input.value || '').trim() : '';

    if (!val) { setMsg(card, '请先输入密码', 'warn'); return; }
    if (!want) { unlock(card); return; }            // 数据里没配密码 → 直接放开
    if (unlocked[want]) { unlock(card); return; }   // 本次访问已解锁过

    setMsg(card, '校验中…', '');
    sha256Hex(val).then(function (got) {
      if (got === want) {
        unlocked[want] = true;
        document.querySelectorAll('.hb-novel').forEach(function (c) {
          if ((c.getAttribute('data-hash') || '').trim() === want) unlock(c);
        });
      } else {
        setMsg(card, '密码不对，请核对后再试', 'err');
        if (input) { input.value = ''; input.focus(); }
      }
    }, function () {
      setMsg(card, '当前浏览器不支持密码校验，请改用 Chrome / Edge 或升级浏览器', 'warn');
    });
  }

  // 按钮点击
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.hb-novel-btn');
    if (!btn) return;
    var card = btn.closest('.hb-novel');
    if (card) tryUnlock(card);
  });

  // 输入框回车
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var input = e.target.closest && e.target.closest('.hb-novel-pw');
    if (!input) return;
    var card = input.closest('.hb-novel');
    if (card) { e.preventDefault(); tryUnlock(card); }
  });
})();
