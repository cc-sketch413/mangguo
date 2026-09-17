@echo off
rem ============================================
rem  芒果的发布站 - 一键发布上线
rem  双击运行：自动构建站点并推送到线上
rem  约 1 到 2 分钟后线上自动更新完成
rem ============================================
cd /d "%~dp0"

rem ---- 工具路径（WorkBuddy 托管环境，请勿修改）----
rem  注意：变量名不能叫 GIT_DIR，那是 Git 自己的保留变量，会冲突
set "NODE_DIR=C:\Users\D.Q\.workbuddy\binaries\node\versions\22.22.2-2"
set "PORTABLE_GIT=C:\Users\D.Q\.workbuddy\binaries\PortableGit\versions\1.2.0"
set "PATH=%NODE_DIR%;%PORTABLE_GIT%\cmd;%PORTABLE_GIT%\usr\bin;%PATH%"
set "HOME=%USERPROFILE%"

echo.
echo ============================================
echo    芒果的发布站  -  一键发布
echo ============================================
echo.

echo [1/3] 正在构建站点，请稍候...
call hexo clean >nul 2>&1
call hexo generate
if errorlevel 1 goto fail
echo       构建完成 OK

echo.
echo [2/3] 正在记录本次改动...
git add -A
git commit -m "更新站点内容" >nul 2>&1
echo       完成 OK

echo.
echo [3/3] 正在推送到线上...
git push origin master
if errorlevel 1 goto fail
echo       推送完成 OK

echo.
echo ============================================
echo    发布成功！
echo.
echo    等 1 到 2 分钟，打开下面网址看效果：
echo    https://mangguo413.netlify.app
echo.
echo    如果还是旧内容，按 Ctrl+F5 强制刷新
echo ============================================
echo.
pause
exit /b 0

:fail
echo.
echo ============================================
echo    出错了，这次没有发布成功
echo.
echo    请把上面的报错内容截图发给 AI 检查
echo ============================================
echo.
pause
exit /b 1
