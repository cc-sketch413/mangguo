/* ============================================================
   scripts/render-settings.js —— 渲染时替换设置占位符
   ------------------------------------------------------------
   页面里写 %%站名%% %%署名%% %%密码%% %%微博%% %%邮箱%%，
   构建时按「我的设置.yml」的值替换。

   为什么放在「渲染时」而不是用脚本直接改写 md 文件：
   直接改写是一次性的 —— 源文件里的占位符一旦被换成实际值，
   以后改设置就再也替换不到了（改密码页面不更新）。
   放在渲染时替换，源文件始终保留占位符，每次构建都按最新设置产出。

   值为空时删掉含占位符的整行，实现「不填就不显示」。
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

// 占位符名 -> 我的设置.yml 里的键名
const MAP = {
  '站名': '站名',
  '署名': '署名',
  '密码': '密码',
  '微博': '微博主页',
  '邮箱': '邮箱'
};

function loadSettings() {
  const file = path.join(hexo.base_dir, '我的设置.yml');
  const data = {};
  if (!fs.existsSync(file)) return data;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line[0] === '#' || line.indexOf(':') < 0) continue;
    const idx = line.indexOf(':');
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (val.length >= 2 && val[0] === val[val.length - 1] && (val[0] === '"' || val[0] === "'")) {
      val = val.slice(1, -1);
    }
    data[key] = val;
  }
  return data;
}

hexo.extend.filter.register('after_render:html', function (str) {
  if (typeof str !== 'string' || str.indexOf('%%') < 0) return str;

  const st = loadSettings();
  for (const ph of Object.keys(MAP)) {
    const token = '%%' + ph + '%%';
    if (str.indexOf(token) < 0) continue;
    const val = st[MAP[ph]] || '';
    if (val) {
      str = str.split(token).join(val);
    } else {
      // 留空：连整行一起删掉（渲染后的 HTML 里每行是一个独立块）
      str = str.replace(new RegExp('[^\\n]*' + token + '[^\\n]*\\n?', 'g'), '');
    }
  }
  return str;
});
