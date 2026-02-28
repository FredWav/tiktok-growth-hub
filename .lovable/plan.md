

## Plan : Annuler le job @capsulescards

Le record `bb64ddf4-9eeb-45b8-bb19-870633787e98` est bloqué en `processing`. 

### Action unique
Mettre à jour le record dans `express_analyses` :
- `status` → `failed`
- `error_message` → `Annulé manuellement par admin`
- `completed_at` → `now()`

Aucun changement de code nécessaire. Juste une mise à jour de donnée en base.

