# -*- coding: utf-8 -*-
"""
立即发布到 Netlify（不吃构建额度）
=====================================================
原理：本地已经构建好 public/，把整个目录打成 zip 直接上传。
      Netlify 的「手动部署」不经过它的构建流程，所以
      **不消耗每月 300 分钟的构建额度**，也不用等排队。

用法：双击站点根目录的「立即发布（不吃额度）.bat」，或
      在站点目录执行：python 工具\\立即发布.py

首次使用需要配一次访问令牌（只配一次，之后一直有效），
脚本会提示你把令牌存到 C:\\Users\\<你>\\.netlify-token.txt
（故意放在站点目录外——仓库是公开的，令牌绝不能进仓库）。
"""
import io
import json
import os
import sys
import time
import urllib.error
import urllib.request
import zipfile

SITE_ID = 'dec05240-3ff2-4abb-a002-ac3f58bb7398'
SITE_URL = 'https://mangguo413.netlify.app'
API = 'https://api.netlify.com/api/v1'

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, 'public')
TOKEN_PATH = os.path.join(os.path.expanduser('~'), '.netlify-token.txt')


def read_token():
    if os.path.isfile(TOKEN_PATH):
        try:
            with open(TOKEN_PATH, encoding='utf-8-sig') as f:
                t = f.read().strip()
            if t:
                return t
        except Exception:
            pass
    return None


def make_zip():
    buf = io.BytesIO()
    n = 0
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:
        for root, _dirs, files in os.walk(PUBLIC):
            for f in files:
                p = os.path.join(root, f)
                z.write(p, os.path.relpath(p, PUBLIC))
                n += 1
    return buf.getvalue(), n


def api_post(url, data, token, ctype):
    req = urllib.request.Request(url, data=data, method='POST')
    req.add_header('Authorization', 'Bearer ' + token)
    req.add_header('Content-Type', ctype)
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.loads(r.read().decode('utf-8'))


def api_get(url, token):
    req = urllib.request.Request(url)
    req.add_header('Authorization', 'Bearer ' + token)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode('utf-8'))


def main():
    print('=' * 54)
    print('  立即发布（本地构建 + 直传，不消耗 Netlify 构建额度）')
    print('=' * 54)

    if not os.path.isdir(PUBLIC):
        print('[X] 找不到 public 目录，先跑一次「一键发布.bat」生成。')
        return 1

    token = read_token()
    if not token:
        print('[X] 还没配置访问令牌，按下面做一次就行（只需一次）：')
        print()
        print('    1) 打开 https://app.netlify.com/user/applications#personal-access-tokens')
        print('       （若打不开：Netlify 右上角头像 -> User settings -> Applications）')
        print('    2) 点 "New access token"，名字随便写，比如 fabu')
        print('    3) 复制生成的令牌，新建一个文本文件，粘贴进去保存（不要换行）')
        print('    4) 文件存成下面这个路径和文件名：')
        print()
        print('       ' + TOKEN_PATH)
        print()
        print('    存好后再双击一次「立即发布（不吃额度）.bat」即可。')
        return 1

    print('[1/3] 打包 public ...')
    blob, count = make_zip()
    print('      共 %d 个文件，%.2f MB' % (count, len(blob) / 1024.0 / 1024.0))

    print('[2/3] 上传到 Netlify ...')
    try:
        dep = api_post('%s/sites/%s/deploys' % (API, SITE_ID), blob, token, 'application/zip')
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', 'ignore')[:300]
        print('      [X] 上传失败：HTTP %s' % e.code)
        print('          %s' % body)
        if e.code == 401:
            print('          -> 令牌无效或已过期，重新生成一个再试。')
        elif e.code == 403:
            print('          -> 权限不足：要选账号级的 Personal access token。')
        return 1
    except Exception as e:
        print('      [X] 上传出错：%s' % e)
        print('          -> 检查网络能否访问 api.netlify.com。')
        return 1

    dep_id = dep.get('id')
    print('      部署已创建：%s' % dep_id)

    print('[3/3] 等待生效 ...')
    for _ in range(40):
        time.sleep(3)
        try:
            st = api_get('%s/deploys/%s' % (API, dep_id), token)
        except Exception:
            continue
        state = st.get('state')
        print('      状态：%s' % state)
        if state == 'ready':
            print()
            print('[OK] 发布成功！%s' % SITE_URL)
            print('     打开若还是旧的，按 Ctrl+F5 强制刷新一次。')
            return 0
        if state in ('error', 'rejected'):
            print('[X] 部署被 Netlify 拒绝：%s' % state)
            return 1

    print('[!] 等待超时了，可以稍后直接打开站点看看。')
    return 0


if __name__ == '__main__':
    sys.exit(main())
