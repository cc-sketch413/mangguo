@echo off
setlocal
cd /d "%~dp0"

set "PATH=C:\Users\D.Q\.workbuddy\binaries\node\versions\22.22.2-2;%PATH%"
set "PY=C:\Users\D.Q\.workbuddy\binaries\python\envs\default\Scripts\python.exe"

echo.
echo ==================================================
echo   一键发布
echo   本地构建 -^> 备份 GitHub -^> 直传 Netlify 上线
echo ==================================================
echo.

echo === 1/3 本地构建站点 ===
call hexo clean
if errorlevel 1 goto fail
call hexo generate
if errorlevel 1 goto fail
echo 本地构建通过。
echo.

echo === 2/3 备份源码到 GitHub ===
git add -A
git commit -m "更新站点内容" 2>nul
git push 2>nul
echo 源码已同步（没有改动时会跳过，属正常）。
echo.

echo === 3/3 上传到 Netlify（不走构建，不消耗额度）===
"%PY%" "%~dp0工具\立即发布.py"
if errorlevel 1 goto fail

echo.
echo 按任意键关闭。
pause >nul
exit /b 0

:fail
echo.
echo *** 出错了，把上面的信息截图发给帮你建站的人 ***
pause
exit /b 1
