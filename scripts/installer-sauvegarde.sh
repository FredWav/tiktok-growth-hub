#!/usr/bin/env bash
# Installe sur le VPS la sauvegarde nocturne de la base fredwav.
#
#   SSH_CONFIG='E:\EMMA\06_CONFIG\ssh-vps.conf' bash scripts/installer-sauvegarde.sh
#
# Ajoute un script (/usr/local/bin/fredwav-sauvegarde) et une tâche systemd chaque nuit vers
# 3 h 15. Ne touche à aucun autre site. Affiche à la fin l'empreinte du mot de passe du rôle
# « sauvegarde » (pas le mot de passe), à appliquer une fois dans Supabase :
#   ALTER ROLE sauvegarde PASSWORD '<empreinte>';
# Désinstaller : sudo systemctl disable --now fredwav-sauvegarde.timer, puis supprimer
# /usr/local/bin/fredwav-sauvegarde, /usr/local/bin/fredwav-restauration-essai, /etc/systemd/system/fredwav-sauvegarde.* et
# /etc/fredwav-sauvegarde (les sauvegardes restent dans /var/backups/fredwav).
set -euo pipefail
SSH_CONFIG="${SSH_CONFIG:?chemin du fichier ssh_config}"
SSH_HOST="${SSH_HOST:-emma-vps}"
DIR="$(cd "$(dirname "$0")/../deploy/vps" && pwd)"

bash -n "$DIR/fredwav-sauvegarde.sh"
bash -n "$DIR/fredwav-restauration-essai.sh"
scp -F "$SSH_CONFIG" -q "$DIR/fredwav-sauvegarde.sh" "$DIR/fredwav-restauration-essai.sh" "$DIR/fredwav-sauvegarde.service" "$DIR/fredwav-sauvegarde.timer" "$SSH_HOST:/tmp/"
ssh -F "$SSH_CONFIG" "$SSH_HOST" 'set -e
  command -v python3 >/dev/null && command -v flock >/dev/null && command -v podman >/dev/null
  sudo -n install -m 0755 /tmp/fredwav-sauvegarde.sh /usr/local/bin/fredwav-sauvegarde
  sudo -n install -m 0755 /tmp/fredwav-restauration-essai.sh /usr/local/bin/fredwav-restauration-essai
  sudo -n install -m 0644 /tmp/fredwav-sauvegarde.service /tmp/fredwav-sauvegarde.timer /etc/systemd/system/
  rm -f /tmp/fredwav-sauvegarde.sh /tmp/fredwav-restauration-essai.sh /tmp/fredwav-sauvegarde.service /tmp/fredwav-sauvegarde.timer
  sudo -n podman pull -q docker.io/library/postgres:17-alpine >/dev/null
  sudo -n systemctl daemon-reload
  sudo -n systemctl enable --now fredwav-sauvegarde.timer
  sudo -n sh -c "chmod 600 /var/backups/fredwav/fredwav-*.dump 2>/dev/null || true"
  systemctl list-timers fredwav-sauvegarde.timer --no-pager | head -2
  echo "Empreinte : $(sudo -n /usr/local/bin/fredwav-sauvegarde --empreinte)"'
echo "Installé. Journal : ssh … sudo journalctl -u fredwav-sauvegarde -n 20"
