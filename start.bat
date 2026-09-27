@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PORT=8765

netstat -ano | findstr /r /c:":%PORT% .*LISTENING" >nul
if %errorlevel%==0 (
  echo Сервер аль хэдийн ажиллаж байна: http://localhost:%PORT%/
  start "" "http://localhost:%PORT%/"
  exit /b 0
)

where npm >nul 2>nul
if %errorlevel%==0 (
  if exist "%~dp0node_modules\next" (
    echo Математикийн багшийн туслах: http://localhost:%PORT%/
    echo Энэ цонхыг хаавал сайт унтарна.
    start "" "http://localhost:%PORT%/"
    npm run dev
    exit /b 0
  )
)

where python >nul 2>nul
if %errorlevel%==0 (
  echo Математик багшийн туслах: http://localhost:%PORT%/
  echo Энэ цонхыг хаавал сайт унтарна.
  start "" "http://localhost:%PORT%/"
  python -m http.server %PORT%
  exit /b 0
)

where py >nul 2>nul
if %errorlevel%==0 (
  echo Математик багшийн туслах: http://localhost:%PORT%/
  echo Энэ цонхыг хаавал сайт унтарна.
  start "" "http://localhost:%PORT%/"
  py -m http.server %PORT%
  exit /b 0
)

echo Python олдсонгүй. index.html-ийг шууд нээж байна.
start "" "%~dp0index.html"
