/* ============================================================
   scripts/agegate-inject.js —— 全站注入 18+ 年龄确认门
   ------------------------------------------------------------
   站点内容整体是成人向的，所以需要「进站即拦、且从任何页面进来都被拦」。
   之前的 {% agegate %} 标签是「哪个页面写了才拦哪个页面」，只在小说页生效，
   直接访问其他页面（作品页 / 补链合集 / 果然）就绕过去了。

   这里改成渲染完成后统一往每个 HTML 的 <body> 开头注入遮罩。

   为什么用 filter 而不是 inject：
   - inject.bottom 注入的内容在 body 末尾 → 浏览器先渲染正文再出现遮罩，会闪一下；
   - 这里插在 <body> 之后、正文之前，是服务端产出的真实 HTML，
     **JS 没加载或报错也照样挡住内容**（降级友好）。

   页面里若已存在 id="hb-age"（比如手动写过标签）则跳过，避免重复注入。
   ============================================================ */
'use strict';

const AGE_HTML = `<div class="hb-age" id="hb-age">
  <div class="hb-age-box" data-step="1">
    <span class="hb-age-badge">18+</span>
    <h3 class="hb-age-title">本站内容仅限 18 岁以上观看</h3>
    <p class="hb-age-desc">本站为个人汉化作品发布站，包含成人向内容，仅限年满 18 周岁者浏览。<br>请确认您已成年，并自愿浏览本站内容。</p>
    <p class="hb-age-q">您是否已经年满 18 岁？</p>
    <div class="hb-age-btns">
      <button type="button" class="hb-age-btn hb-age-yes" data-act="confirm1">是</button>
      <button type="button" class="hb-age-btn hb-age-no" data-act="deny">否</button>
    </div>
  </div>
  <div class="hb-age-box" data-step="2" hidden>
    <span class="hb-age-badge">18+</span>
    <h3 class="hb-age-title">你确定你成年了吗？</h3>
    <p class="hb-age-desc">请再次确认。进入后请自行承担浏览成人内容的相关责任，<br>并遵守你所在地区的法律法规。</p>
    <div class="hb-age-btns">
      <button type="button" class="hb-age-btn hb-age-yes" data-act="confirm2">是</button>
      <button type="button" class="hb-age-btn hb-age-no" data-act="deny">否</button>
    </div>
  </div>
  <div class="hb-age-deny" hidden>
    <div class="hb-age-deny-bg" aria-hidden="true"></div>
    <div class="hb-age-deny-main">
      <h2>请成年后再来</h2>
      <p>本站内容仅限年满 18 周岁者浏览。</p>
    </div>
  </div>
</div>`;

hexo.extend.filter.register('after_render:html', function (str) {
  if (typeof str !== 'string' || str.indexOf('<body') < 0) return str;  // 只处理 HTML 页面
  if (str.indexOf('id="hb-age"') >= 0) return str;                      // 已存在，别重复注入
  return str.replace(/<body([^>]*)>/i, '<body$1>' + AGE_HTML);
});
