# -*- coding: utf-8 -*-
"""
GitHub Pages 子路径适配
=====================================================
Hexo 的 url_for() 只会处理「主题模板里」的路径，以下三类会漏掉，
部署到 <user>.github.io/<repo>/ 这种子路径时全部 404：

  1. _config.butterfly.yml 的 inject 里写死的 /css、/js
  2. 导航菜单配置里的 /xxx/ 链接
  3. Markdown 正文里手写的 [文字](/xxx/)

所以在构建完成后，统一给 public/ 里所有「本地绝对路径」补上子路径前缀。
只处理 href / src / CSS url()，且跳过：
  - // 开头的协议相对地址（如 //cdn.jsdelivr.net）
  - http(s):// 完整地址
  - 已经带前缀的路径（避免重复叠加）
"""
import pathlib
import re
import sys

def read_root():
    """子路径从 _config.yml 的 root 读 —— 换仓库名 / 换域名都不用改本文件"""
    cfg = pathlib.Path('_config.yml')
    if cfg.is_file():
        for line in cfg.read_text(encoding='utf-8').splitlines():
            m = re.match(r'^root:\s*(.+?)\s*$', line)
            if m:
                return m.group(1).strip().strip('"').strip("'")
    return '/'


ROOT = read_root().rstrip('/')         # 如 /mangguo；根路径部署时是空串
PREFIX = ROOT.strip('/')               # mangguo

if not ROOT:
    print('[SKIP] _config.yml 的 root 是根路径，不需要子路径适配')
    sys.exit(0)

BASE = pathlib.Path('public')
if not BASE.is_dir():
    print('[X] 找不到 public/ 目录')
    sys.exit(1)

# href="/xxx" / src="/xxx"：排除 // 开头 和 已带前缀 的
pat_attr = re.compile(r'\b(href|src)="/(?!/|' + PREFIX + r'/)')
# CSS 里的 url(/xxx
pat_css = re.compile(r'url\(/(?!/|' + PREFIX + r'/)')

changed = 0
for f in BASE.rglob('*'):
    if not f.is_file():
        continue
    suf = f.suffix.lower()
    try:
        if suf in ('.html', '.htm'):
            s = f.read_text(encoding='utf-8')
            s2 = pat_attr.sub(lambda m: '%s="%s/' % (m.group(1), ROOT), s)
        elif suf == '.css':
            s = f.read_text(encoding='utf-8')
            s2 = pat_css.sub('url(%s/' % ROOT, s)
        else:
            continue
    except (UnicodeDecodeError, OSError):
        continue
    if s2 != s:
        f.write_text(s2, encoding='utf-8')
        changed += 1

print('[OK] 子路径适配完成，处理文件数：%d' % changed)
