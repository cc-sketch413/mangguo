/* ============================================================
   hb-effects.js —— 站点视觉特效（轻量、无依赖、可独立运行）
   1. 顶部滚动进度条
   2. 鼠标点击涟漪
   3. 飘落花瓣/光点
   4. 首页按时间问候语
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. 顶部滚动进度条 ---------- */
  var bar = document.createElement('div');
  bar.id = 'hb-progress';
  document.body.appendChild(bar);
  var onScroll = function () {
    var doc = document.documentElement;
    var sc = doc.scrollTop || document.body.scrollTop;
    var max = (doc.scrollHeight || document.body.scrollHeight) - doc.clientHeight;
    var pct = max > 0 ? (sc / max) * 100 : 0;
    bar.style.width = pct + '%';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- 2. 鼠标点击涟漪 ---------- */
  document.addEventListener('click', function (e) {
    // 点在可点击元素上才出涟漪，避免误触视觉噪音
    var ripple = document.createElement('span');
    ripple.className = 'hb-ripple';
    var size = 22;
    ripple.style.left = (e.clientX - size / 2) + 'px';
    ripple.style.top = (e.clientY - size / 2) + 'px';
    ripple.style.width = ripple.style.height = size + 'px';
    document.body.appendChild(ripple);
    window.setTimeout(function () {
      if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
    }, 750);
  });

  /* ---------- 3. 飘落花瓣/光点 ---------- */
  // 只在桌面端启用，移动端省电、避免干扰
  var isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  if (!isMobile && !document.body.classList.contains('hb-petals-on')) {
    document.body.classList.add('hb-petals-on');
    var PETALS = 10;
    var colors = ['#ffffff', '#fdf2dd', '#fde8c8', '#f6d9a8'];
    for (var i = 0; i < PETALS; i++) {
      var p = document.createElement('i');
      p.className = 'hb-petal';
      var sz = 6 + Math.random() * 10;          // 6~16px
      p.style.width = p.style.height = sz + 'px';
      p.style.left = (Math.random() * 100) + 'vw';
      p.style.background = colors[i % colors.length];
      p.style.opacity = (0.25 + Math.random() * 0.45).toFixed(2);
      p.style.animationDuration = (14 + Math.random() * 14) + 's';
      p.style.animationDelay = (-Math.random() * 20) + 's';
      p.style.borderRadius = (Math.random() > 0.5 ? '50%' : '40% 60% 55% 45%');
      document.body.appendChild(p);
    }
  }

  /* ---------- 4. 首页按时间问候语 ---------- */
  var info = document.querySelector('#site-info');
  if (info && !document.getElementById('hb-greeting')) {
    var hour = new Date().getHours();
    var greet = '';
    if (hour < 5) greet = '夜深了，注意休息 🌙';
    else if (hour < 9) greet = '早上好呀 ☀️';
    else if (hour < 12) greet = '上午好 🌤️';
    else if (hour < 14) greet = '中午好，记得吃饭 🍚';
    else if (hour < 18) greet = '下午好 🍃';
    else if (hour < 23) greet = '晚上好 🌆';
    else greet = '夜深了，注意休息 🌙';

    var g = document.createElement('div');
    g.id = 'hb-greeting';
    g.textContent = greet;
    info.insertBefore(g, info.firstChild);
  }
})();
