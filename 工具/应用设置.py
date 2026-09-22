# -*- coding: utf-8 -*-
"""
把我的设置.yml 应用到全站
============================================================
每次构建前自动运行（见 package.json 的 prebuild），也可以手动跑：

    python 工具/应用设置.py

它会做这些事（幂等，重复跑不会有副作用）：
  1. 写入 _config.yml 的站名 / 署名（保留行尾注释）
  2. 写入 _config.butterfly.yml 的社交图标、公告卡密码、主题色

注意：小说下载区的密码是「每本小说一个」，不在这里统一设置 ——
加小说时用 工具/算密码.py 算出哈希，填到 source/_data/novels.yml
里对应那本的 password_hash 即可（本脚本不再碰 novels.yml）。

页面正文里的 %%站名%% %%署名%% %%密码%% %%微博%% %%邮箱%% 占位符
由 scripts/render-settings.js 在「渲染时」替换 —— 这样源文件里始终保留占位符，
以后改设置，所有页面都会跟着更新（若在这里一次性改写文件就做不到了）。

刻意不依赖 PyYAML —— 构建机上不一定装了这个库。
"""
import pathlib
import re
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT = pathlib.Path('.')
SETTINGS = ROOT / '我的设置.yml'
BF = '_config.butterfly.yml'

# 主题色里跟随主色的字段（衍生色如 hover 深色不在这里改）
COLOR_KEYS = ['main', 'paginator', 'text_selection',
              'scrollbar_color', 'toc_color', 'blockquote_padding_color']


def load_settings(path):
    """读扁平的 key: value 设置文件（不依赖 PyYAML）"""
    data = {}
    if not path.is_file():
        return data
    for raw in path.read_text(encoding='utf-8').splitlines():
        line = raw.strip()
        if not line or line.startswith('#') or ':' not in line:
            continue
        k, v = line.split(':', 1)
        v = v.strip()
        if len(v) >= 2 and v[0] == v[-1] and v[0] in '"\'':
            v = v[1:-1]
        data[k.strip()] = v
    return data


def sub_file(rel, pattern, repl, count=0):
    p = ROOT / rel
    if not p.is_file():
        return False
    old = p.read_text(encoding='utf-8')
    new = re.sub(pattern, repl, old, count=count, flags=re.M)
    if new != old:
        p.write_text(new, encoding='utf-8')
        return True
    return False


def set_yaml_value(rel, key, value):
    """设置顶层 key 的值，**保留行尾注释**（如 `title: xxx   # ★ 站名`）"""
    p = ROOT / rel
    if not p.is_file():
        return False
    lines = p.read_text(encoding='utf-8').splitlines(keepends=True)
    pat = re.compile(r'^(' + re.escape(key) + r':\s*)(.*?)(\s*#[^\n]*)?(\n?)$')
    for i, line in enumerate(lines):
        m = pat.match(line)
        if not m:
            continue
        new_line = m.group(1) + value + (m.group(3) or '') + (m.group(4) or '')
        if new_line != line:
            lines[i] = new_line
            p.write_text(''.join(lines), encoding='utf-8')
            return True
        return False
    return False


def main():
    st = load_settings(SETTINGS)
    if not st:
        print('[SKIP] 没找到 我的设置.yml，跳过')
        return

    name = st.get('站名', '')
    author = st.get('署名', '')
    pw = st.get('密码', '')
    weibo = st.get('微博主页', '')
    mail = st.get('邮箱', '')
    color = st.get('主题色', '')

    done = []

    if name and set_yaml_value('_config.yml', 'title', name):
        done.append('站名')
    if author and set_yaml_value('_config.yml', 'author', author):
        done.append('署名')

    if pw and sub_file(BF, r'<code>[^<]*</code>', '<code>%s</code>' % pw):
        done.append('公告卡密码')

    if weibo:
        if sub_file(BF, r'^(  fab fa-weibo: ).*$', r"\g<1>%s || 微博 || '#e6162d'" % weibo):
            done.append('微博图标')
    elif sub_file(BF, r'(?m)^  fab fa-weibo:.*\n', ''):
        done.append('微博图标(移除)')

    if mail:
        if sub_file(BF, r'^(  fas fa-envelope: ).*$', r"\g<1>mailto:%s || 邮箱 || '#4a7dbe'" % mail):
            done.append('邮箱图标')
    elif sub_file(BF, r'(?m)^  fas fa-envelope:.*\n', ''):
        done.append('邮箱图标(移除)')

    if color:
        for key in COLOR_KEYS:
            sub_file(BF, r'^(  %s: ).*$' % key, '\\g<1>"%s"' % color)

    print('[OK] 已应用设置' + ('：' + '、'.join(done) if done else '（无变化）'))


if __name__ == '__main__':
    main()
