import { applicationHandler } from "../_shared/submit-application.ts";

// Formulaire de demande unique : l'offre (one_shot, academy, premium, conseil) vient du corps.
Deno.serve(applicationHandler());
