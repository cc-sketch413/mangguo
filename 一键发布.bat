@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
cd /d "%~dp0"

rem === 工具链路径不写死：用当前用户目录自动定位；node/git 版本跟随 WorkBuddy 的 current 记录 ===
set "NODE_DIR="
if exist "%USERPROFILE%\.workbuddy\binaries\node\versions\current" (
    set /p NODE_CUR=<"%USERPROFILE%\.workbuddy\binaries\node\versions\current"
    if exist "%USERPROFILE%\.workbuddy\binaries\node\versions\!NODE_CUR!\node.exe" set "NODE_DIR=%USERPROFILE%\.workbuddy\binaries\node\versions\!NODE_CUR!"
)
if not defined NODE_DIR set "NODE_DIR=%USERPROFILE%\.workbuddy\binaries\node\versions\22.22.2-6"
rem === git 版本同样跟随 current 记录，升级后自动适配 ===
set "PG_VERSIONS=%USERPROFILE%\.workbuddy\binaries\PortableGit\versions"
set "PORTABLE_GIT=%PG_VERSIONS%\1.3.0"
if exist "%PG_VERSIONS%\current" (
    set /p PG_CUR=<"%PG_VERSIONS%\current"
    if exist "%PG_VERSIONS%!PG_CUR!\usr\bin\ssh.exe" set "PORTABLE_GIT=%PG_VERSIONS%!PG_CUR!"
)
set "PATH=%NODE_DIR%;%PORTABLE_GIT%\mingw64\bin;%PORTABLE_GIT%\usr\bin;%PATH%"
set "GIT_SSH=%PORTABLE_GIT%\usr\bin\ssh.exe"

echo.
echo ==================================================
echo   一键发布
echo   构建站点 -^> 同步 GitHub -^> 自动部署上线
echo ==================================================
echo.

echo [1/2] 正在构建站点，请稍候（首次构建会下载依赖，可能稍慢）...
rem npm run build 会先执行 prebuild 生成作品数据，再调用 hexo 生成静态站点
call npm run build
if errorlevel 1 goto fail
echo 构建完成，未出现错误。
echo.

echo [2/2] 同步到 GitHub
git add -A
if errorlevel 1 goto fail

git diff --cached --quiet
if not errorlevel 1 goto no_change

git commit -m "更新站点内容"
if errorlevel 1 goto fail
echo 已提交本地改动。
goto do_push

:no_change
echo 没有检测到新的改动，跳过提交，直接推送。

:do_push
git push origin master
if errorlevel 1 goto fail

echo.
echo 已推送到 GitHub，等待 1~2 分钟 GitHub Pages 自动部署完成。
echo 打开 https://cc-sketch413.github.io/mangguo/ 并按 Ctrl+F5 强制刷新即可看到更新。
echo.
echo 发布完成，按任意键关闭窗口。
pause >nul
exit /b 0

:fail
echo.
echo *** 发布失败，请检查上面的报错信息并截图发给我。 ***
pause
exit /b 1
