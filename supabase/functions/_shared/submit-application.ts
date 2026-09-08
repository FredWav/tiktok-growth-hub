import {
  CALENDAR,
  db,
  email,
  fingerprint,
  headers,
  json,
  text,
  uuid,
} from "./commerce.ts";

export function applicationHandler(offer: "academy" | "premium") {
  return async (req: Request) => {
    if (req.method === "OPTIONS") return new Response(null, { headers });
    if (req.method !== "POST") {
      return json({ error: "Méthode non autorisée" }, 405);
    }
    try {
      const body = await req.json();
      if (body.website) return json({ error: "Demande non acceptée" }, 400);
      const values = {
        request_id: uuid(body.request_id),
        offer,
        first_name: text(body.first_name, 1, 100),
        email: email(body.email),
        account_or_project: text(body.account_or_project, 5, 2000),
        objective: text(body.objective, 20, 2000),
        timing: typeof body.timing === "string"
          ? text(body.timing, 0, 200)
          : "",
        commitments: {
          price: body.price === true,
          practice: body.practice === true,
          commercial_call: body.commercial_call === true,
        },
        fingerprint: await fingerprint(req),
      };
      if (!Object.values(values.commitments).every(Boolean)) {
        return json({
          error: "Lis les conditions de l'appel avant de réserver.",
          eligible: false,
        }, 422);
      }
      const client = db();
      const { data: id, error } = await client.rpc(
        "commerce_submit_application",
        { v: values },
      );
      if (error || !id) throw error || new Error("Enregistrement absent");
      return json({
        id,
        ...(offer === "academy" ? { calendar_url: CALENDAR } : {}),
        notification: "queued",
      });
    } catch (error) {
      console.error(error);
      return json({
        error:
          "La demande n'a pas pu être confirmée. Réessaie ; ta référence sera conservée.",
      }, 400);
    }
  };
}
