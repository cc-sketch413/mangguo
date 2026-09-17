/* ============================================================
   scripts/tags.js —— 自定义标签插件
   ------------------------------------------------------------
   在文章里可以直接用这些标签，不用写 HTML：

     {% dl 百度网盘 || https://pan.baidu.com/s/xxx || 提取码：bread %}
     {% dlbox 漫画总链接 %} ... 多个 {% dl %} ... {% enddlbox %}
     {% tip warn %} 提示内容 {% endtip %}
     {% worklist %}              列出全部作品
     {% worklist 漫画 || 8 %}     只要漫画，最多 8 个
     {% progress 2 || 12 %}      进度条 2/12
     {% workhead 类型 || 状态 || 原作者 || 进度 %}

   参数用 || 分隔（不用引号，避免空格问题）
   ------------------------------------------------------------
   注意：本文件运行在 Hexo 的 scripts 沙箱里，`hexo` 是现成的
   全局变量，直接调用即可，不要用 module.exports 包裹。
   ============================================================ */
'use strict';

/* 把参数统一解析成数组。Hexo 可能已经把参数拆好，也可能没有 */
function parseArgs(raw) {
  const s = Array.isArray(raw) ? raw.join(' ') : String(raw == null ? '' : raw);
  return s.split('||').map(x => x.trim()).filter(x => x !== '');
}

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const ICON_DL = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14"/></svg>';
const ICON_ARROW = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
const ICON_COPY = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';

/* ---------- 封面：没有图就用标题 hash 生成渐变封面 ---------- */
const PALETTES = [
  ['#f59e0b', '#d97706'], ['#f0783a', '#c8561f'], ['#f6b733', '#e08c0d'],
  ['#e06b7a', '#b04a5f'], ['#7b8ede', '#4a5bb5'], ['#c98fd4', '#9159a3'],
  ['#6fb1a0', '#3a7f70'], ['#8fbf6a', '#5d8f3f'], ['#e8a0b0', '#c06b84'],
  ['#a98fd4', '#7059a3']
];
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}
function coverHTML(post) {
  const img = post.cover || post.top_img;
  if (img) return `<img src="${esc(img)}" alt="${esc(post.title)}" loading="lazy">`;
  const p = PALETTES[hash(String(post.slug || post.title)) % PALETTES.length];
  return `<div class="hb-cover-gen" style="background:linear-gradient(150deg,${p[0]},${p[1]})"><span>${esc(post.title)}</span></div>`;
}

/* ---------- 状态文案 ---------- */
const STATUS = {
  ongoing: '连载中', completed: '已完结',
  hiatus: '暂停中', planned: '预告'
};

/* ---------- 备注 → 提取码一键复制 ---------- */
/* 备注形如「提取码：abcd」时，把码本身渲染成可点击复制的按钮；
   其他备注（如「无需提取码」）原样显示 */
function noteHTML(note) {
  if (!note) return '';
  const m = String(note).match(/^(.*?提取码\s*[:：]\s*)([A-Za-z0-9]{2,16})(.*)$/);
  if (!m) return `<i class="hb-dl-note">${esc(note)}</i>`;
  const pre = m[1], code = m[2], post = m[3];
  return `<i class="hb-dl-note">${esc(pre)}`
    + `<button class="hb-dl-code" type="button" data-code="${esc(code)}" title="点击复制提取码">`
    + `<span>${esc(code)}</span>${ICON_COPY}</button>`
    + (post ? esc(post) : '')
    + '</i>';
}

/* ---------- {% dl %} ---------- */
/* 链接用 base64 存进 data-url，前端点击后才解码显示，避免爬虫/采集直接抓走明文链接 */
hexo.extend.tag.register('dl', function (args) {
  const a = parseArgs(args);
  const name = a[0], url = a[1], note = a[2];
  if (!name || !url) {
    return '<p style="color:#e6a23c">⚠ dl 标签参数不足，正确写法：<code>{% dl 名称 || 链接 || 备注 %}</code></p>';
  }
  const b64 = Buffer.from(url, 'utf8').toString('base64');
  // 把提取码提取出来挂到容器上，展开链接后仍能一键复制
  const codeM = note ? String(note).match(/提取码\s*[:：]\s*([A-Za-z0-9]{2,16})/) : null;
  const codeAttr = codeM ? ` data-code="${esc(codeM[1])}"` : '';
  return `<div class="hb-dl" data-url="${b64}"${codeAttr}>`
    + `<span class="hb-dl-ico">${ICON_DL}</span>`
    + `<span class="hb-dl-main"><b>${esc(name)}</b>${noteHTML(note)}</span>`
    + `<button class="hb-dl-show" type="button">显示链接</button>`
    + `<span class="hb-dl-arrow">${ICON_ARROW}</span>`
    + '</div>';
});

/* ---------- {% dlbox 标题 %} ... {% enddlbox %} ---------- */
hexo.extend.tag.register('dlbox', function (args, content) {
  const a = parseArgs(args);
  const title = a[0];
  const head = title ? `<div class="hb-dlbox-hd">${esc(title)}</div>` : '';
  return `<div class="hb-dlbox">${head}${content}</div>`;
}, { ends: true });

/* ---------- {% tip %} ... {% endtip %} ---------- */
hexo.extend.tag.register('tip', function (args, content) {
  const a = parseArgs(args);
  const kind = a[0] || 'info';
  return `<div class="hb-tip hb-tip-${esc(kind)}">${content}</div>`;
}, { ends: true });

/* ---------- {% copy 值 || 显示文本 %} ----------
   任意内容一键复制（解压密码、账号、命令等）。
   例：{% copy mangguo %}            → 按钮显示 mangguo
       {% copy hxfabuzhan || 密码 %} → 按钮显示「密码」，复制的是 hxfabuzhan */
hexo.extend.tag.register('copy', function (args) {
  const a = parseArgs(args);
  const val = a[0];
  if (!val) return '<span style="color:#e6a23c">⚠ copy 标签需要内容：<code>{% copy 要复制的内容 %}</code></span>';
  const label = a[1] || val;
  return `<button class="hb-copy" type="button" data-code="${esc(val)}" title="点击复制">`
    + `<span>${esc(label)}</span>${ICON_COPY}</button>`;
});

/* ---------- {% progress 已发布 || 总话数 %} ---------- */
hexo.extend.tag.register('progress', function (args) {
  const a = parseArgs(args);
  const done = Number(a[0]) || 0;
  const total = Number(a[1]) || 0;
  const pct = total ? Math.min(100, Math.round(done / total * 100)) : 0;
  return `<div class="hb-progress"><div class="hb-progress-bar" style="width:${pct}%"></div>`
    + `<span class="hb-progress-txt">已发布 <b>${done}</b> / ${total || '?'}</span></div>`;
});

/* ---------- {% worklist 分类 || 数量 %} ---------- */
hexo.extend.tag.register('worklist', function (args) {
  const a = parseArgs(args);
  const wantCat = a[0] || '';
  const limit = Number(a[1]) || 999;

  const posts = hexo.locals.get('posts');
  if (!posts || !posts.length) {
    return '<p style="color:#93a3af">（还没有作品）</p>';
  }

  let list = posts.filter(p => {
    if (p.categories && p.categories.length) {
      const names = p.categories.toArray().map(c => c.name);
      if (names.indexOf('公告') >= 0) return false;   // 公告不算作品
      if (wantCat && names.indexOf(wantCat) < 0) return false;
    } else {
      if (wantCat) return false;
    }
    return true;
  });

  list = list.sort((x, y) => (y.updated || y.date) - (x.updated || x.date)).slice(0, limit);

  if (!list.length) return `<p style="color:#93a3af">（没有找到${wantCat ? '「' + esc(wantCat) + '」分类下的' : ''}作品）</p>`;

  return '<div class="hb-work-grid">' + list.map(p => {
    const names = p.categories && p.categories.length ? p.categories.toArray().map(c => c.name) : [];
    const type = names.indexOf('漫画') >= 0 ? '漫画' : (names.indexOf('小说') >= 0 ? '小说' : '作品');
    const status = STATUS[p.work_status] || '';
    const tags = p.tags && p.tags.length ? p.tags.toArray().filter(t => !STATUS[t.name]).slice(0, 3) : [];
    const d = p.updated || p.date;
    const dateStr = d ? `${d.year()}/${String(d.month() + 1).padStart(2, '0')}/${String(d.date()).padStart(2, '0')}` : '';

    return `<a class="hb-work-card" href="${p.path ? '/' + p.path : p.permalink}">`
      + `<span class="hb-work-cover">${coverHTML(p)}`
      + `<span class="hb-badge hb-badge-${type === '漫画' ? 'manga' : 'novel'}">${type}</span>`
      + (status ? `<span class="hb-badge-status hb-st-${esc(p.work_status || '')}">${status}</span>` : '')
      + '</span>'
      + `<span class="hb-work-body"><b>${esc(p.title)}</b>`
      + (p.work_original ? `<i>${esc(p.work_original)}</i>` : '')
      + (tags.length ? `<span class="hb-work-tags">${tags.map(t => `<em>${esc(t.name)}</em>`).join('')}</span>` : '')
      + `<span class="hb-work-foot"><span>${esc(p.work_episodes || '')}</span><span>${dateStr}</span></span>`
      + '</span></a>';
  }).join('') + '</div>';
});

/* ---------- {% calendar new | update %} ----------
   读 source/_data/calendar.yml，渲染一个日历容器。
   月历格子、点击弹层由 source/js/hb-calendar.js 在前端生成。 */
function calDate(d) {
  if (!d) return '';
  // YAML 里不加引号的日期会被解析成 Date 对象，统一成 YYYY-MM-DD
  if (typeof d === 'object' && typeof d.toISOString === 'function') {
    return d.toISOString().slice(0, 10);
  }
  return String(d).trim().slice(0, 10);
}
hexo.extend.tag.register('calendar', function (args) {
  const a = parseArgs(args);
  const kind = a[0] === 'update' ? 'updates' : 'new_works';
  const data = hexo.locals.get('data') || {};
  const cal = data.calendar || {};
  const raw = Array.isArray(cal[kind]) ? cal[kind] : [];
  const items = raw
    .map(it => ({
      date: calDate(it.date),
      title: it.title ? String(it.title) : '',
      platform: it.platform ? String(it.platform) : '',
      episode: it.episode ? String(it.episode) : '',
      cover: it.cover ? String(it.cover) : '',
      link: it.link ? String(it.link) : ''
    }))
    .filter(it => it.date && it.title);
  const json = JSON.stringify(items)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const emptyMsg = kind === 'updates'
    ? '暂无更新记录'
    : '本月暂无新作记录 —— 新作数据每月更新，以平台实际上架情况为准';
  const empty = items.length ? '' : `<p class="hb-cal-empty">${emptyMsg}</p>`;
  return `<div class="hb-cal" data-kind="${kind}" data-items="${json}"></div>${empty}`;
});

/* ---------- {% workhead %} —— 作品页顶部的信息条 ---------- */
hexo.extend.tag.register('workhead', function (args) {
  const a = parseArgs(args);
  // {% workhead 类型 || 状态 || 原作者 || 进度 %}
  const type = a[0], status = a[1], author = a[2], prog = a[3];
  const stCls = Object.keys(STATUS).find(k => STATUS[k] === status) || 'ongoing';
  return `<div class="hb-workhead">`
    + `<span class="hb-wh-item"><label>类型</label><b>${esc(type || '—')}</b></span>`
    + `<span class="hb-wh-item"><label>状态</label><b class="hb-st-${esc(stCls)}">${esc(status || '—')}</b></span>`
    + `<span class="hb-wh-item"><label>原作者</label><b>${esc(author || '—')}</b></span>`
    + `<span class="hb-wh-item"><label>汉化进度</label><b>${esc(prog || '—')}</b></span>`
    + '</div>';
});
