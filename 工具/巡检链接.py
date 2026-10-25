# -*- coding: utf-8 -*-
"""
网盘链接自动巡检
================
遍历站点里所有登记过的网盘下载链接（relink 补链页 + 各作品页的 {% dl %} 标签），
逐个 HTTP 访问、抓正文匹配「失效关键字」，判定链接是否已失效。

产出：
  1. 人类可读报告（打印到终端）
  2. source/_data/deadlinks.yml（供站点渲染「已失效」标注）

返回码：
  0 = 没有失效链接
  1 = 发现失效链接
  2 = 脚本自身出错（提取失败等）

用法：
  python 工具/巡检链接.py                 # 默认巡检 + 写数据文件 + 打印报告
  python 工具/巡检链接.py --no-write      # 只检测，不写 deadlinks.yml
  python 工具/巡检链接.py --limit 3       # 只测前 3 条（调试用）
  python 工具/巡检链接.py --verbose       # 逐条打印判定依据（抓到的关键片段）

设计要点（坑，别踩）：
  * 网盘分享失效后返回的仍是 HTTP 200 的「分享已取消」页面 —— 不能只看状态码，
    必须抓正文匹配失效文案。
  * 判定保持「保守」：只有明确命中失效文案才判 dead；网络异常 / 被反爬拦 →
    判 unknown（单独列出，不误判失效）。宁可漏报，不可误报。
  * 境外 IP（GitHub Actions 机房）访问国内网盘可能被拦或验证 —— 同样归入 unknown，
    不要据此判失效。要精确结论请在本地跑。
"""

import argparse
import base64
import datetime
import glob
import json
import os
import random
import re
import sys
import time
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, 'source')
DATA_FILE = os.path.join(SOURCE, '_data', 'deadlinks.yml')

UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36')

# ---- 失效关键字（命中任一即判 dead）----
# 注意：宁可漏，不可错。只放「明确表示分享失效」的文案。
DEAD_KEYWORDS = [
    # 百度网盘
    '你来晚了', '分享的文件已经被取消', '分享的文件已经被删除',
    '链接不存在', '此链接分享内容可能因为涉及侵权', '分享已取消',
    '啊哦', '文件已被删除', '链接已失效',
    # UC 网盘 / 阿里系
    '分享已取消', '该分享已取消', '链接已失效', '分享链接已失效',
    '分享不存在', '文件已被删除', '该分享已过期', '分享已过期',
]

# ---- 存活特征（辅助判定，命中即认为活着）----
ALIVE_KEYWORDS = [
    '请输入提取码', '提取码', '请输入访问密码', '访问密码',
]

HEADERS = {
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Cache-Control': 'no-cache',
}


def log(msg):
    print(msg, flush=True)


def extract_links():
    """扫描 source 目录，提取所有 {% dl 名称 || 链接 || 备注 %} 链接。

    返回 [{'title': 作品/分组标题, 'url': 链接, 'file': 相对文件, 'note': 备注}, ...]
    """
    links = []
    md_files = (
        glob.glob(os.path.join(SOURCE, 'relink', '*.md')) +
        glob.glob(os.path.join(SOURCE, '_posts', '*.md'))
    )
    for path in md_files:
        rel = os.path.relpath(path, ROOT).replace('\\', '/')
        try:
            text = open(path, 'r', encoding='utf-8-sig').read()
        except Exception as e:
            log('[提取] 读取失败 %s: %s' % (rel, e))
            continue

        # 该文件的作品标题（front-matter title）
        ft = re.search(r'^title:\s*(.+)$', text, re.M)
        file_title = ft.group(1).strip() if ft else os.path.basename(path)

        # 作品页（_posts）标题用 front-matter 作品名；补链页（relink）用 dlbox 标题
        is_relink = '/relink/' in rel
        current_group = file_title
        # 逐行扫描，维护 dlbox 上下文标题
        for line in text.splitlines():
            box = re.search(r'\{%\s*dlbox\s+([^%]*?)\s*%\}', line)
            if box:
                box_title = box.group(1).split('||')[0].strip()
                current_group = (box_title or file_title) if is_relink else file_title
                continue
            m = re.search(r'\{%\s*dl\s+([^%]*?)\s*%\}', line)
            if not m:
                continue
            parts = [p.strip() for p in m.group(1).split('||')]
            if len(parts) < 2:
                continue
            name, url = parts[0], parts[1]
            note = parts[2] if len(parts) > 2 else ''
            # 只认网盘/外部下载链接，跳过站内相对路径
            if not re.match(r'^https?://', url):
                continue
            links.append({
                'title': current_group,
                'name': name,
                'url': url,
                'note': note,
                'file': rel,
            })
    return links


# 目标都是国内网盘，必须直连 —— 禁用系统代理，否则本机/CI 的代理会把请求劫持掉
_OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def fetch(url, timeout=15):
    """GET 拉取正文（尽量多读一点），返回 (status, text) 或抛异常。"""
    req = urllib.request.Request(url, headers=HEADERS)
    with _OPENER.open(req, timeout=timeout) as r:
        status = r.status
        data = r.read(300 * 1024)  # 最多读 300KB，够用
        # 尝试按常见编码解码
        text = None
        for enc in ('utf-8', 'gbk', 'gb18030'):
            try:
                text = data.decode(enc)
                break
            except Exception:
                continue
        if text is None:
            text = data.decode('utf-8', 'replace')
        return status, text


def judge(text):
    """根据正文判定：'dead' / 'alive' / 'unknown'。

    规则：
      1. 命中失效关键字 → dead
      2. 命中存活特征   → alive
      3. 其余（请求成功但识别不出）→ alive（默认乐观，避免误报）
    """
    if not text:
        return 'unknown'
    for kw in DEAD_KEYWORDS:
        if kw in text:
            return 'dead'
    for kw in ALIVE_KEYWORDS:
        if kw in text:
            return 'alive'
    return 'alive'


def hit_keyword(text, kws):
    return next((kw for kw in kws if kw in text), None)


def run(limit=None, no_write=False, verbose=False, sleep=True):
    links = extract_links()
    if not links:
        log('[!] 没有提取到任何 dl 链接，请检查 source/relink 与 source/_posts。')
        return 2

    # 去重（同一 url 可能出现在作品页 + relink 页两处）
    seen = set()
    uniq = []
    for l in links:
        if l['url'] in seen:
            continue
        seen.add(l['url'])
        uniq.append(l)

    if limit:
        uniq = uniq[:limit]

    log('开始巡检 %d 条链接（去重后）…' % len(uniq))
    results = {'dead': [], 'alive': [], 'unknown': []}
    for i, l in enumerate(uniq, 1):
        try:
            status, text = fetch(l['url'])
            verdict = judge(text)
        except Exception as e:
            verdict = 'unknown'
            text = ''
            status = 'ERR'
            if verbose:
                log('  [%d/%d] %s → %s（%s）' % (i, len(uniq), l['url'], verdict, e))
        else:
            if verbose:
                reason = hit_keyword(text, DEAD_KEYWORDS) or hit_keyword(text, ALIVE_KEYWORDS) or '(无特征，默认存活)'
                log('  [%d/%d] %-24s → %-7s（%s）' % (i, len(uniq), l['title'][:24], verdict, reason))

        l['status'] = status
        l['verdict'] = verdict
        l['reason'] = (hit_keyword(text, DEAD_KEYWORDS) or '') if verdict == 'dead' else ''
        results[verdict].append(l)

        if sleep and i < len(uniq):
            time.sleep(random.uniform(1.0, 2.5))

    return results, uniq


def write_data(results, checked):
    dead = [{
        'title': l['title'],
        'name': l['name'],
        'url': l['url'],
        'note': l['note'],
        'reason': l['reason'] or '疑似失效',
        'file': l['file'],
    } for l in results['dead']]

    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    lines = ['# 自动生成，勿手改 —— 由 工具/巡检链接.py 维护',
             '# 这里列出的链接已在最近一次巡检中被判定为失效，站点会据此给对应下载项打「已失效」标注。',
             '# 补链后重新跑一次巡检，本文件会自动清空/更新。',
             'checked: "%s"' % checked,
             'dead:']
    if not dead:
        lines.append('  []')
    else:
        for d in dead:
            lines.append('  - title: "%s"' % d['title'].replace('"', "'"))
            lines.append('    url: "%s"' % d['url'])
            lines.append('    reason: "%s"' % d['reason'].replace('"', "'"))
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')


def main():
    ap = argparse.ArgumentParser(description='网盘链接自动巡检')
    ap.add_argument('--no-write', action='store_true', help='只检测，不写 deadlinks.yml')
    ap.add_argument('--limit', type=int, default=None, help='只测前 N 条（调试）')
    ap.add_argument('--verbose', action='store_true', help='逐条打印判定')
    ap.add_argument('--no-sleep', action='store_true', help='不在请求间随机间隔')
    args = ap.parse_args()

    results, uniq = run(limit=args.limit, no_write=args.no_write,
                        verbose=args.verbose, sleep=not args.no_sleep)

    checked = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
    if not args.no_write:
        write_data(results, checked)

    # ---- 报告 ----
    print()
    print('================ 巡检报告（%s）================' % checked)
    print('  共检测 %d 条（去重）' % len(uniq))
    print('  正常      : %d' % len(results['alive']))
    print('  失效      : %d' % len(results['dead']))
    print('  无法判定  : %d' % len(results['unknown']))
    print()

    if results['dead']:
        print('--- 失效链接（请尽快补链）---')
        for l in results['dead']:
            print('  ✗ [%s] %s' % (l['title'], l['url']))
            print('        判定依据: %s' % (l['reason'] or '失效文案命中'))
        print()

    if results['unknown']:
        print('--- 无法判定（网络异常 / 被反爬拦截，需人工确认）---')
        for l in results['unknown']:
            print('  ? [%s] %s' % (l['title'], l['url']))
        print()

    if args.no_write:
        print('(已加 --no-write，未写 deadlinks.yml)')

    return 1 if results['dead'] else 0


if __name__ == '__main__':
    sys.exit(main())
