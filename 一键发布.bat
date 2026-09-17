@echo off
setlocal
cd /d "%~dp0"

set "PATH=C:\Users\D.Q\.workbuddy\binaries\node\versions\22.22.2-2;%PATH%"
set "PY=C:\Users\D.Q\.workbuddy\binaries\python\envs\default\Scripts\python.exe"

echo.
echo ==================================================
echo   一键发布（本地构建 + 直传，不吃 Netlify 额度）
echo ==================================================
echo.

echo === 1/3 本地构建站点 ===
call hexo clean
if errorlevel 1 goto fail
call hexo generate
if errorlevel 1 goto fail
echo 构建完成。
echo.

echo === 2/3 备份源码到 GitHub ===
git add -A
git commit -m "更新站点内容" 2>nul
git push 2>nul
echo 源码已同步（没改动时会跳过，属正常）。
echo.

echo === 3/3 上传到 Netlify ===
"%PY%" "%~dp0工具\立即发布.py"
if errorlevel 1 goto fail

echo.
echo 全部完成，按任意键关闭。
pause >nul
exit /b 0

:fail
echo.
echo *** 出错了，把上面的信息截图发给帮你建站的人 ***
pause
exit /b 1
