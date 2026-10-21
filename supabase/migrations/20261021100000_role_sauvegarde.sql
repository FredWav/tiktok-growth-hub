-- Sauvegarde nocturne de la base vers le VPS (deploy/vps/fredwav-sauvegarde.sh).
-- Rôle en lecture seule : lit toutes les tables (RLS comprise, pour une copie complète),
-- ne peut rien écrire. Sans mot de passe ici : le VPS génère le sien et n'envoie que son
-- empreinte SCRAM (ALTER ROLE … PASSWORD 'SCRAM-SHA-256$…'), le mot de passe ne quitte pas le VPS.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sauvegarde') THEN
    CREATE ROLE sauvegarde LOGIN BYPASSRLS NOCREATEDB NOCREATEROLE CONNECTION LIMIT 2;
  END IF;
END $$;
GRANT pg_read_all_data TO sauvegarde;
ALTER ROLE sauvegarde SET default_transaction_read_only = on;
