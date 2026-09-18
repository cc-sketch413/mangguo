# -*- coding: utf-8 -*-
"""
打包「给朋友的整站」
============================================================
把可以交给别人的站点文件打成一个 zip（含说明文档），方便直接发给对方。

    python 工具/打包给朋友.py

产物：站点目录下的 汉化发布站-给朋友.zip，并自动复制一份到桌面。

之后你更新了站点内容（加了作品、改了设置），想再发一份新的给对方，
重新跑一次这个脚本即可 —— 它总是基于当前最新的文件。

刻意排除的东西：
  - node_modules / public / db.json   构建产物与依赖，对方不需要（GitHub 会自动装）
  - *.bat                             写死了本机 Node/Git 的绝对路径，只在你这台机器能用
  - 上线包-*.zip 等交付包              旧包不必再打进去
  - Netlify / Cloudflare 部署教程      已归档的备选方案，避免让对方困惑
"""
import pathlib
import shutil
import sys
import zipfile

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

SRC = pathlib.Path('.')
OUT = SRC / '汉化发布站-给朋友.zip'
TOP = '汉化发布站'                      # 包内顶层文件夹名

# 单份文件（站点根下的文档与配置）
FILES = [
    '从这里开始.md', '朋友部署指南.md', '使用说明.md', '如何发布作品.md',
    '我的设置.yml', '_config.yml', '_config.butterfly.yml',
    'package.json', 'package-lock.json', '.nvmrc', '.gitignore',
]

# 整目录纳入
DIRS = ['.github', 'scripts', '工具', 'source']

SKIP_DIRS = {'node_modules', '.git', 'public', '.workbuddy'}
# 站点运行 / 部署必需之外的脚本：要么含本机或个人的配置，要么对接收方没用
SKIP_NAME = {
    'db.json',
    '立即发布.py',      # Netlify 直传脚本，写死了原站主的 site_id，且现在已改用 GitHub Pages
    '打包给朋友.py',    # 本脚本自身，对方不需要
}
SKIP_SUFFIX = ('.bat',)
SKIP_KEYWORDS = ('上线包', 'Netlify部署教程', 'Cloudflare部署教程')


def keep(p: pathlib.Path) -> bool:
    if any(part in SKIP_DIRS for part in p.parts):
        return False
    if p.name in SKIP_NAME or p.name.endswith(SKIP_SUFFIX):
        return False
    return not any(k in p.name for k in SKIP_KEYWORDS)


def main():
    if OUT.exists():
        OUT.unlink()

    count = 0
    with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for f in FILES:
            p = SRC / f
            if p.is_file():
                z.write(p, f'{TOP}/{f}')
                count += 1
            else:
                print('  ⚠ 缺少文件:', f)
        for d in DIRS:
            base = SRC / d
            if not base.is_dir():
                print('  ⚠ 缺少目录:', d)
                continue
            for p in sorted(base.rglob('*')):
                if p.is_file() and keep(p):
                    z.write(p, f'{TOP}/{p.relative_to(SRC).as_posix()}')
                    count += 1

    size = OUT.stat().st_size / 1024 / 1024
    print(f'[OK] 已打包：{OUT}（{count} 个文件，{size:.2f} MB）')

    # 复制到桌面，方便直接拖进聊天窗口
    desktop = pathlib.Path.home() / 'Desktop'
    if desktop.is_dir():
        try:
            shutil.copy2(OUT, desktop / OUT.name)
            print(f'[OK] 已复制到桌面：{desktop / OUT.name}')
        except OSError as e:
            print('[!] 复制到桌面失败（可手动去站点目录取）:', e)
    else:
        print('[!] 没找到桌面目录，请从站点目录自取')


if __name__ == '__main__':
    main()
