/* ============================================================
   source/js/hb-download.js —— 下载链接「点击显示 + 一键复制」
   ------------------------------------------------------------
   配合 scripts/tags.js 的 {% dl %} 标签：
   - 链接以 base64 存在 .hb-dl 的 data-url 属性里，页面源码不出现明文链接
   - 点「显示链接」按钮才解码展开，并提供「复制链接」和「打开」两个动作
   目标：挡住爬虫 / 自动采集站 / 一键复制的小白倒卖者（懂行的人挡不住，
   真正的追溯靠密码 + 图片水印 + 曝光墙，见站点「曝光墙」页面）
   ============================================================ */
(function () {
  'use strict';

  function b64decode(b64) {
    try {
      const bin = atob(b64);
      const bytes = Uint8Array.from(bin, function (c) { return c.charCodeAt(0); });
      return new TextDecoder('utf-8').decode(bytes);
    } catch (e) {
      return '';
    }
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function copyText(text, btn) {
    function mark(ok) {
      if (!btn) return;
      var old = btn.textContent;
      btn.textContent = ok ? '已复制' : '复制失败';
      btn.classList.toggle('is-ok', !!ok);
      setTimeout(function () {
        btn.textContent = old;
        btn.classList.remove('is-ok');
      }, 1600);
    }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      mark(ok);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { mark(true); }, function () { fallback(); });
    } else {
      fallback();
    }
  }

  function expand(dl) {
    var b64 = dl.getAttribute('data-url') || '';
    var url = b64decode(b64);
    if (!url) return;

    var name = dl.querySelector('.hb-dl-main b');
    var note = dl.querySelector('.hb-dl-main i');
    var nameHtml = name ? name.textContent : '';
    var noteHtml = note ? note.textContent : '';

    dl.classList.add('hb-dl-open');
    dl.innerHTML =
      '<span class="hb-dl-ico">' + '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14"/></svg>' + '</span>' +
      '<span class="hb-dl-main"><b>' + escapeHtml(nameHtml) + '</b>' +
      (noteHtml ? '<i>' + escapeHtml(noteHtml) + '</i>' : '') +
      '<span class="hb-dl-url">' + escapeHtml(url) + '</span></span>' +
      '<span class="hb-dl-actions">' +
      '<button class="hb-dl-copy" type="button" data-url="' + escapeHtml(url) + '">复制链接</button>' +
      '<a class="hb-dl-go" href="' + escapeHtml(url) + '" target="_blank" rel="noopener nofollow">打开</a>' +
      '</span>';
  }

  document.addEventListener('click', function (e) {
    var show = e.target.closest('.hb-dl-show');
    if (show) {
      var dl = show.closest('.hb-dl');
      if (dl) expand(dl);
      return;
    }
    var copy = e.target.closest('.hb-dl-copy');
    if (copy) {
      copyText(copy.getAttribute('data-url') || '', copy);
    }
  });
})();
