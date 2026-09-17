@echo off
rem ============================================
rem  汉化发布站 - 本地预览一键启动
rem  双击运行，浏览器会自动打开 http://localhost:4000
rem  按 Ctrl+C 或直接关掉窗口即可停止
rem ============================================
cd /d "%~dp0"
set PATH=C:\Users\D.Q\.workbuddy\binaries\node\versions\22.22.2-2;%PATH%
echo.
echo   正在启动本地预览服务器，请稍候...
echo   浏览器将自动打开 http://localhost:4000
echo   停止预览：关闭本窗口即可
echo.
start "" "http://localhost:4000/"
call hexo server -p 4000
pause
