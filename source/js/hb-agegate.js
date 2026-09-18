/* ============================================================
   source/js/hb-agegate.js —— 18+ 年龄确认门
   ------------------------------------------------------------
   配合 scripts/tags.js 的 {% agegate %} 标签：
   - 遮罩默认就是显示的（HTML 不带 hidden），所以即使 JS 没跑起来也照样挡住内容
   - 两层确认：① 您是否已经年满 18 岁？  ② 你确定你成年了吗？
     任何一步点「否」→ 满屏「请成年后再来」
   - 通过后记进 sessionStorage：同一次浏览不再重复问，关掉浏览器重新问
   - document 级事件委托，pjax 翻页后依然有效
   - 说明：前端年龄门只能起到告知 / 免责作用，技术上无法真正核实年龄
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'hb-age-ok';

  function wrap() { return document.getElementById('hb-age'); }

  function lockScroll(on) {
    document.documentElement.classList.toggle('hb-age-lock', !!on);
  }

  function showStep(n) {
    var w = wrap();
    if (!w) return;
    w.hidden = false;
    lockScroll(true);
    var d = w.querySelector('.hb-age-deny');
    if (d) d.hidden = true;
    w.querySelectorAll('.hb-age-box').forEach(function (b) {
      b.hidden = b.getAttribute('data-step') !== String(n);
    });
  }

  // 满屏背景：把「请成年后再来」铺满整屏（倾斜、淡红，中间再压一个大字）
  function fillDenyBg(el) {
    if (!el || el.dataset.filled) return;
    var one = '请成年后再来';
    var html = '';
    for (var i = 0; i < 200; i++) html += '<span>' + one + '</span>';
    el.innerHTML = html;
    el.dataset.filled = '1';
  }

  function denyPage() {
    var w = wrap();
    if (!w) return;
    w.hidden = false;
    lockScroll(true);
    w.querySelectorAll('.hb-age-box').forEach(function (b) { b.hidden = true; });
    var d = w.querySelector('.hb-age-deny');
    if (d) {
      d.hidden = false;
      fillDenyBg(d.querySelector('.hb-age-deny-bg'));
    }
  }

  function pass() {
    var w = wrap();
    if (!w) return;
    w.hidden = true;
    lockScroll(false);
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
  }

  function init() {
    var w = wrap();
    if (!w) return;
    var ok = false;
    try { ok = sessionStorage.getItem(KEY) === '1'; } catch (e) {}
    if (ok) pass(); else showStep(1);
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.hb-age-btn');
    if (!btn) return;
    var act = btn.getAttribute('data-act');
    if (act === 'confirm1') showStep(2);
    else if (act === 'confirm2') pass();
    else if (act === 'deny') denyPage();
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  document.addEventListener('pjax:complete', init);
})();
