import { headers, json } from "../_shared/commerce.ts";

// Retired orientation engine. Historical rows remain readable in administration.
Deno.serve(req => req.method === "OPTIONS" ? new Response(null,{headers}) : json({
  error: "Ce formulaire a été remplacé. Recharge la page pour envoyer une candidature étudiée personnellement par Fred.",
},410));
