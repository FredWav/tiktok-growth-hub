#!/usr/bin/env bash
# Installe sur le VPS la mise à jour automatique du site de TEST fredwav.
#
#   SSH_CONFIG='E:\EMMA\06_CONFIG\ssh-vps.conf' bash scripts/installer-deploiement-auto.sh
#
# Ajoute un script (/usr/local/bin/fredwav-site-test) et une tâche systemd toutes les
# 2 minutes. Ne modifie ni le Caddyfile, ni les autres sites, ni fredwav.com.
# Désinstaller : sudo systemctl disable --now fredwav-site-test.timer, puis supprimer
# /usr/local/bin/fredwav-site-test et /etc/systemd/system/fredwav-site-test.*
set -euo pipefail
SSH_CONFIG="${SSH_CONFIG:?chemin du fichier ssh_config}"
SSH_HOST="${SSH_HOST:-emma-vps}"
DIR="$(cd "$(dirname "$0")/../deploy/vps" && pwd)"

bash -n "$DIR/fredwav-site-test.sh"
scp -F "$SSH_CONFIG" -q "$DIR/fredwav-site-test.sh" "$DIR/fredwav-site-test.service" "$DIR/fredwav-site-test.timer" "$SSH_HOST:/tmp/"
ssh -F "$SSH_CONFIG" "$SSH_HOST" 'set -e
  command -v python3 >/dev/null && command -v flock >/dev/null && command -v curl >/dev/null
  sudo -n install -m 0755 /tmp/fredwav-site-test.sh /usr/local/bin/fredwav-site-test
  sudo -n install -m 0644 /tmp/fredwav-site-test.service /tmp/fredwav-site-test.timer /etc/systemd/system/
  rm -f /tmp/fredwav-site-test.sh /tmp/fredwav-site-test.service /tmp/fredwav-site-test.timer
  sudo -n systemctl daemon-reload
  sudo -n systemctl enable --now fredwav-site-test.timer
  systemctl list-timers fredwav-site-test.timer --no-pager | head -3'
echo "Installé. Journal : ssh … sudo journalctl -u fredwav-site-test -n 20"
