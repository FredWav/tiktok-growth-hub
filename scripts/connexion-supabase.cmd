@echo off
rem Connecte la CLI Supabase a ton compte puis relie ce dossier au projet de test.
rem A lancer une seule fois par ordinateur.
chcp 65001 >nul
cd /d "%~dp0.."
set PROJET=ykcjzdqpvffdzlxxtjqc

echo.
echo ================================================================
echo  ETAPE 1 sur 2 : connexion a ton compte Supabase
echo ================================================================
echo  1. Appuie sur Entree quand le message "Press Enter" s'affiche.
echo  2. Ton navigateur s'ouvre sur supabase.com : clique sur "Authorize".
echo  3. Le navigateur affiche un code de verification (8 caracteres).
echo     Copie-le, reviens ici, colle-le (clic droit) puis Entree.
echo.
call npx.cmd --yes supabase@2.121.0 login
if errorlevel 1 goto erreur

echo.
echo ================================================================
echo  ETAPE 2 sur 2 : liaison au projet de test %PROJET%
echo ================================================================
echo  Tape le mot de passe de la base (choisi a la creation du projet)
echo  puis Entree. Rien ne s'affiche pendant la saisie, c'est normal.
echo  Mot de passe oublie : supabase.com, projet, Settings, Database,
echo  "Reset database password", puis relance ce script.
echo.
call npx.cmd --yes supabase@2.121.0 link --project-ref %PROJET%
if errorlevel 1 goto erreur

echo.
echo ================================================================
echo  TERMINE. Tu peux prevenir Claude.
echo ================================================================
exit /b 0

:erreur
echo.
echo  Une erreur est survenue : copie le message ci-dessus a Claude.
exit /b 1
