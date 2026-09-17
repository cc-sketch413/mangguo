/* ============================================================
   source/js/hb-calendar.js —— 日历组件（新作日历 / 汉化更新日历）
   ------------------------------------------------------------
   配合 scripts/tags.js 的 {% calendar new %} / {% calendar update %}：
   - 服务端把 source/_data/calendar.yml 的数据塞进 .hb-cal 的 data-items
   - 前端渲染月历，有内容的日期亮起，点击弹出封面 + 名字
   ============================================================ */
(function () {
  'use strict';

  var WEEK = ['日', '一', '二', '三', '四', '五', '六'];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function todayKey() {
    var t = new Date();
    return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());
  }

  /* ---------- 弹层 ---------- */
  function openPanel(date, list, kind) {
    var isUpdate = kind === 'updates';
    var wrap = document.createElement('div');
    wrap.className = 'hb-cal-pop';

    var cards = list.map(function (it) {
      var cover = it.cover
        ? '<img src="' + esc(it.cover) + '" alt="' + esc(it.title) + '" loading="lazy">'
        : '<span class="hb-cal-ph">' + esc(String(it.title).slice(0, 1)) + '</span>';
      var meta = isUpdate
        ? (it.episode ? '<i>更新至 ' + esc(it.episode) + '</i>' : '<i>已更新</i>')
        : (it.platform ? '<i>' + esc(it.platform) + '</i>' : '');
      var btn = it.link
        ? '<a class="hb-cal-go" href="' + esc(it.link) + '" target="_blank" rel="noopener">去看看</a>'
        : '';
      return '<div class="hb-cal-card">'
        + '<span class="hb-cal-cover">' + cover + '</span>'
        + '<b>' + esc(it.title) + '</b>' + meta + btn
        + '</div>';
    }).join('');

    wrap.innerHTML =
      '<div class="hb-cal-mask"></div>'
      + '<div class="hb-cal-box" role="dialog" aria-modal="true">'
      + '<button class="hb-cal-close" type="button" aria-label="关闭">&times;</button>'
      + '<div class="hb-cal-boxhd">' + esc(date.replace(/-/g, '.')) + (isUpdate ? ' 更新' : ' 新作') + '</div>'
      + '<div class="hb-cal-cards">' + cards + '</div>'
      + '</div>';

    document.body.appendChild(wrap);
    document.body.classList.add('hb-cal-lock');

    function close() {
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      document.body.classList.remove('hb-cal-lock');
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    wrap.querySelector('.hb-cal-mask').addEventListener('click', close);
    wrap.querySelector('.hb-cal-close').addEventListener('click', close);
    document.addEventListener('keydown', onKey);
  }

  /* ---------- 单个日历 ---------- */
  function render(host) {
    if (host.getAttribute('data-ready')) return;
    host.setAttribute('data-ready', '1');

    var items = [];
    try { items = JSON.parse(host.getAttribute('data-items') || '[]'); } catch (e) { items = []; }
    var kind = host.getAttribute('data-kind') || 'new_works';

    var byDate = {};
    items.forEach(function (it) {
      if (!it || !it.date) return;
      (byDate[it.date] = byDate[it.date] || []).push(it);
    });

    // 默认显示：数据里最新那个月；没数据就本月
    var now = new Date();
    var latest = items.reduce(function (max, it) { return it.date > max ? it.date : max; }, '');
    var curYM = latest ? latest.slice(0, 7) : (now.getFullYear() + '-' + pad(now.getMonth() + 1));

    host.innerHTML =
      '<div class="hb-cal-hd">'
      + '<button class="hb-cal-nav" type="button" data-step="-1" aria-label="上个月">&lsaquo;</button>'
      + '<div class="hb-cal-title"></div>'
      + '<button class="hb-cal-nav" type="button" data-step="1" aria-label="下个月">&rsaquo;</button>'
      + '</div>'
      + '<div class="hb-cal-week">' + WEEK.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div>'
      + '<div class="hb-cal-grid"></div>'
      + '<div class="hb-cal-legend">'
      + (kind === 'updates' ? '有更新的日期会亮起，点一下看当天更新了什么' : '有新作的日期会亮起，点一下看是哪些作品')
      + '</div>';

    var titleEl = host.querySelector('.hb-cal-title');
    var gridEl = host.querySelector('.hb-cal-grid');

    function draw(ym) {
      curYM = ym;
      var y = Number(ym.slice(0, 4)), m = Number(ym.slice(5, 7));
      titleEl.textContent = y + ' 年 ' + m + ' 月';

      var first = new Date(y, m - 1, 1).getDay();
      var days = new Date(y, m, 0).getDate();
      var tk = todayKey();
      var html = '';

      for (var i = 0; i < first; i++) html += '<span class="hb-cal-cell is-blank"></span>';
      for (var d = 1; d <= days; d++) {
        var key = y + '-' + pad(m) + '-' + pad(d);
        var list = byDate[key] || [];
        html += '<span class="hb-cal-cell'
          + (list.length ? ' hb-cal-has' : '')
          + (key === tk ? ' hb-cal-today' : '')
          + '" data-date="' + key + '"'
          + (list.length ? ' role="button" tabindex="0"' : '') + '>'
          + '<i>' + d + '</i>'
          + (list.length ? '<em class="hb-cal-dot">' + list.length + '</em>' : '')
          + '</span>';
      }
      gridEl.innerHTML = html;
    }

    draw(curYM);

    host.addEventListener('click', function (e) {
      var nav = e.target.closest('.hb-cal-nav');
      if (nav && host.contains(nav)) {
        var y = Number(curYM.slice(0, 4));
        var m = Number(curYM.slice(5, 7)) + Number(nav.getAttribute('data-step') || 0);
        var dt = new Date(y, m - 1, 1);
        draw(dt.getFullYear() + '-' + pad(dt.getMonth() + 1));
        return;
      }
      var cell = e.target.closest('.hb-cal-has');
      if (cell && host.contains(cell)) {
        var date = cell.getAttribute('data-date');
        openPanel(date, byDate[date] || [], kind);
      }
    });

    host.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var cell = e.target.closest('.hb-cal-has');
      if (cell && host.contains(cell)) {
        e.preventDefault();
        var date = cell.getAttribute('data-date');
        openPanel(date, byDate[date] || [], kind);
      }
    });
  }

  function init() {
    var nodes = document.querySelectorAll('.hb-cal');
    for (var i = 0; i < nodes.length; i++) render(nodes[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  // 兼容 pjax 换页
  document.addEventListener('pjax:complete', init);
  document.addEventListener('pjax:success', init);
})();
