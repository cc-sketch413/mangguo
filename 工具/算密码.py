# -*- coding: utf-8 -*-
"""
算密码.py —— 生成小说下载密码的 SHA-256 哈希
============================================================
用法（可一次算多个，空格隔开）：

    python 工具/算密码.py 密码A 密码B 密码C

会打印出每个密码对应的哈希，把它填到 source/_data/novels.yml
里对应小说的 password_hash 即可。

为什么存哈希：哈希不可逆，即使仓库公开，别人也猜不出你的密码。
"""
import hashlib
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass


def main():
    args = sys.argv[1:]
    if not args:
        print('用法：python 工具/算密码.py 密码1 密码2 ...')
        print('      （可以一次算多个，用空格隔开）')
        return

    for pw in args:
        h = hashlib.sha256(pw.encode('utf-8')).hexdigest()
        print('%-20s ->  %s' % (pw, h))


if __name__ == '__main__':
    main()
