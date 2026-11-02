# -*- coding: utf-8 -*-
"""
作品「最近更新」时间同步
=========================================================
站点用 updated_option: mtime，即「文件的修改时间」决定作品排序。

但 Git 不保留文件的 mtime：
  - 本地：mtime = 你保存文件的时间（准确，所以本地排序是对的）
  - 构建机（GitHub Actions）：checkout 后所有文件都变成同一时刻，
    而且同一次 commit 里的多个文件时间完全相同 ——「最近更新」顺序会乱。

解决办法：把本地准确的 mtime 存成快照文件，跟着源码一起提交；
构建机上先用快照把文件 mtime 还原，再交给 Hexo 构建。

  python 工具/mtime_sync.py             # 记录（本地构建前自动执行，见 package.json 的 prebuild）
  python 工具/mtime_sync.py --restore    # 还原（构建机上执行）
"""
import json
import os
import pathlib
import sys

POSTS = pathlib.Path('source/_posts')
SNAP = pathlib.Path('工具/mtime.json')


def record():
    """把本地各作品的修改时间写进快照（本地文件时间是准的）"""
    if os.environ.get('CI'):
        # GitHub Actions 等构建机会设置 CI=true。
        # 构建机上 checkout 出来的时间不可信，绝不能拿它覆盖本地快照。
        print('[SKIP] 检测到 CI 环境，不覆盖快照（构建机应改用 --restore）')
        return
    if not POSTS.is_dir():
        print('[SKIP] 找不到 source/_posts，跳过记录')
        return
    data = {}
    for f in sorted(POSTS.glob('*.md')):
        data[f.name] = int(f.stat().st_mtime)
    SNAP.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('[OK] 记录 %d 个作品的修改时间 -> %s' % (len(data), SNAP))


def restore():
    """按快照还原文件修改时间（构建机文件时间不可信时用）"""
    if not SNAP.is_file():
        print('[SKIP] 没有快照 %s，跳过还原' % SNAP)
        return
    data = json.loads(SNAP.read_text(encoding='utf-8'))
    n = 0
    for name, ts in data.items():
        f = POSTS / name
        if f.is_file():
            os.utime(f, (ts, ts))        # 同时设 atime / mtime
            n += 1
    print('[OK] 还原 %d 个作品的修改时间' % n)


if __name__ == '__main__':
    if '--restore' in sys.argv:
        restore()
    else:
        record()
