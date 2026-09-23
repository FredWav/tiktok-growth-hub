CREATE OR REPLACE FUNCTION public.express_notification_outbox()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Le mail client de livraison est mis en file par sendExpressResultMail (version HTML).
  -- Ce trigger ne doit plus insérer la variante texte brut : elle gagnait le dedupe_key.
  IF NEW.support_requested_at IS NOT NULL AND OLD.support_requested_at IS NULL THEN
    INSERT INTO commerce_mail(dedupe_key,recipient,subject,body) VALUES
      ('express-support:'||NEW.id,'contact@fredwav.com','Analyse Express : intervention requise',
       'Dossier '||NEW.id||' · @'||NEW.tiktok_username||E'\nIntervention sous deux jours ouvrés. Si résolution impossible, effectuer le remboursement intégral puis en enregistrer la référence.')
    ON CONFLICT(dedupe_key) DO NOTHING;
  END IF;
  RETURN NEW;
END $function$;