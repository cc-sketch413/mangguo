@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

rem === ����·����д����˫��Ҳ������ϵͳ PATH��===
set "NODE_DIR="
if exist "%USERPROFILE%\.workbuddy\binaries\node\versions\current" (
    set /p NODE_CUR=<"%USERPROFILE%\.workbuddy\binaries\node\versions\current"
    if exist "%USERPROFILE%\.workbuddy\binaries\node\versions\!NODE_CUR!\node.exe" set "NODE_DIR=%USERPROFILE%\.workbuddy\binaries\node\versions\!NODE_CUR!"
)
if not defined NODE_DIR set "NODE_DIR=%USERPROFILE%\.workbuddy\binaries\node\versions\22.22.2-6"
rem === �汾�Ų���д�����Զ���ȡ WorkBuddy ��¼�� current �汾 ===
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
echo   һ������
echo   ���ع��� -^> ͬ�� GitHub -^> �Զ���������
echo ==================================================
echo.

echo [1/2] ���ع���������һ�飬�����ƴ�������
rem npm run build������ prebuild ��¼��Ʒ�޸�ʱ����գ���ִ�� hexo ����
call npm run build
if errorlevel 1 goto fail
echo ���ع���ͨ����
echo.

echo [2/2] ͬ���� GitHub
git add -A
if errorlevel 1 goto fail

git diff --cached --quiet
if not errorlevel 1 goto no_change

git commit -m "����վ������"
if errorlevel 1 goto fail
echo ���ύ�Ķ���
goto do_push

:no_change
echo û�м�⵽�¸Ķ��������ύ��

:do_push
git push
if errorlevel 1 goto fail

echo.
echo �����ͣ�GitHub ���� 1~2 �������Զ��������ߡ�
echo �� https://cc-sketch413.github.io/mangguo/ ��������ҳ�水 Ctrl+F5 ǿ��ˢ�£���
echo.
echo ��������رա�
pause >nul
exit /b 0

:fail
echo.
echo *** �����ˣ����������Ϣ��ͼ�������㽨վ���� ***
pause
exit /b 1
