@echo off
setlocal
cd /d "%~dp0"

rem === 工具路径（写死，双击也不依赖系统 PATH）===
set "NODE_DIR=C:\Users\D.Q\.workbuddy\binaries\node\versions\22.22.2-2"
set "GIT_DIR=C:\Users\D.Q\.workbuddy\binaries\PortableGit\versions\1.2.0"
set "PATH=%NODE_DIR%;%GIT_DIR%\mingw64\bin;%GIT_DIR%\usr\bin;%PATH%"
set "GIT_SSH=%GIT_DIR%\usr\bin\ssh.exe"

echo.
echo ==================================================
echo   一键发布
echo   本地构建 -^> 同步 GitHub -^> 自动构建上线
echo ==================================================
echo.

echo [1/2] 本地构建（先验一遍，避免推错东西）
call hexo clean
if errorlevel 1 goto fail
call hexo generate
if errorlevel 1 goto fail
echo 本地构建通过。
echo.

echo [2/2] 同步到 GitHub
git add -A
if errorlevel 1 goto fail

git diff --cached --quiet
if not errorlevel 1 goto no_change

git commit -m "更新站点内容"
if errorlevel 1 goto fail
echo 已提交改动。
goto do_push

:no_change
echo 没有检测到新改动，跳过提交。

:do_push
git push
if errorlevel 1 goto fail

echo.
echo 已推送！GitHub 会在 1~2 分钟内自动构建上线。
echo 打开 https://cc-sketch413.github.io/mangguo/ 看看（旧页面按 Ctrl+F5 强制刷新）。
echo.
echo 按任意键关闭。
pause >nul
exit /b 0

:fail
echo.
echo *** 出错了，把上面的信息截图发给帮你建站的人 ***
pause
exit /b 1
