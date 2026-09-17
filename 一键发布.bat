@echo off
setlocal
cd /d "%~dp0"

set "PATH=C:\Users\D.Q\.workbuddy\binaries\node\versions\22.22.2-2;%PATH%"

echo.
echo ==================================================
echo   一键发布
echo   本地构建 -^> 同步 GitHub -^> Cloudflare 自动上线
echo ==================================================
echo.

echo === 1/2 本地构建（先验一遍，避免推错东西）===
call hexo clean
if errorlevel 1 goto fail
call hexo generate
if errorlevel 1 goto fail
echo 本地构建通过。
echo.

echo === 2/2 同步到 GitHub ===
git add -A
git commit -m "更新站点内容"
git push
if errorlevel 1 goto fail

echo.
echo 已推送！Cloudflare 大约 1 分钟内自动构建上线。
echo 打开 https://mangguo413.pages.dev 看看（旧页面按 Ctrl+F5 强制刷新）。
echo.
echo 按任意键关闭。
pause >nul
exit /b 0

:fail
echo.
echo *** 出错了，把上面的信息截图发给帮你建站的人 ***
pause
exit /b 1
