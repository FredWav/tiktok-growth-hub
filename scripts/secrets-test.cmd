@echo off
rem Enregistre les 3 secrets du projet de test fredwav-staging.
rem Les valeurs restent sur ton ordinateur : elles partent directement chez Supabase.
chcp 65001 >nul
cd /d "%~dp0.."

echo.
echo ================================================================
echo  Secrets du projet de test (fredwav-staging)
echo ================================================================
echo  Pour chaque question : colle la valeur (clic droit) puis Entree.
echo  Laisse vide et fais Entree pour passer une valeur.
echo.

echo  1/3  Secret du webhook Stripe de test (commence par whsec_)
echo       Stripe, page du webhook fredwav-v2-staging, icone oeil sous
echo       "Cle secrete de signature".
set "WHSEC="
set /p "WHSEC=       Valeur : "
echo.

echo  2/3  Cle Stripe restreinte de test (commence par rk_test_)
echo       Stripe, mode test, Developpeurs, Cles API, "Creer une cle
echo       restreinte" : Checkout Sessions = Lecture, Payment Links = Lecture.
set "RKTEST="
set /p "RKTEST=       Valeur : "
echo.

echo  3/3  Cle API WavStats (rapports)
set "WAVKEY="
set /p "WAVKEY=       Valeur : "
echo.

set "ARGS="
if defined WHSEC set ARGS=%ARGS% "STRIPE_WEBHOOK_SECRET_TEST=%WHSEC%"
if defined RKTEST set ARGS=%ARGS% "STRIPE_SECRET_KEY_TEST=%RKTEST%"
if defined WAVKEY set ARGS=%ARGS% "WAVSTATS_API_KEY=%WAVKEY%"
set "WHSEC=" & set "RKTEST=" & set "WAVKEY="

if not defined ARGS (
  echo  Aucune valeur saisie, rien n'a ete enregistre.
  goto fin
)

call npx.cmd --yes supabase@2.121.0 secrets set %ARGS% --project-ref ykcjzdqpvffdzlxxtjqc >nul 2>&1
if errorlevel 1 (
  echo  Echec de l'enregistrement. Previens Claude.
) else (
  echo ================================================================
  echo  TERMINE : secrets enregistres. Tu peux prevenir Claude.
  echo ================================================================
)
set "ARGS="

:fin
echo.
pause
