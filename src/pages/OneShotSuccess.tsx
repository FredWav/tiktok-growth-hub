import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowRight, Calendar, CheckCircle, Loader2, Mail, XCircle } from "lucide-react";
import { trackEvent, getStoredUtmSource } from "@/lib/tracking";
import { trackPostHogEvent, getPostHogId } from "@/lib/posthog";
import { Layout } from "@/components/layout/Layout";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type VerifyState = "loading" | "verified" | "error";

export default function OneShotSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paramSessionId = searchParams.get("session_id");
  const storedSessionId = localStorage.getItem("oneshot_session_id");
  const sessionId = paramSessionId || storedSessionId;

  const [verifyState, setVerifyState] = useState<VerifyState>("loading");

  useEffect(() => {
    if (!sessionId) {
      setVerifyState("error");
      return;
    }

    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-oneshot-payment", {
          body: { session_id: sessionId },
        });

        if (error || !data?.verified) {
          setVerifyState("error");
          return;
        }

        // Persist session_id so user can return after closing the tab
        localStorage.setItem("oneshot_session_id", sessionId);

        trackPostHogEvent("oneshot_payment_verified", { session_id: sessionId });

        // Auto-submit pre-checkout form data if available
        const preFormData = sessionStorage.getItem("oneshot_pre_form");
        if (preFormData && localStorage.getItem("oneshot_form_submitted") !== "true") {
          try {
            const formValues = JSON.parse(preFormData);
            await supabase.functions.invoke("send-oneshot-form", {
              body: {
                ...formValues,
                email: data.customer_email || "",
                session_id: sessionId,
                posthog_id: getPostHogId(),
                origin_source: getStoredUtmSource() || "",
                conversion_trigger: "",
              },
            });
            localStorage.setItem("oneshot_form_submitted", "true");
            sessionStorage.removeItem("oneshot_pre_form");
          } catch (e) {
            console.error("Error auto-submitting pre-form:", e);
          }
        }

        setVerifyState("verified");
      } catch {
        trackPostHogEvent("oneshot_payment_error", { session_id: sessionId || "" });
        setVerifyState("error");
      }
    };

    verify();
  }, [sessionId]);

  if (verifyState === "loading") {
    return (
      <Layout>
        <Section variant="cream" size="lg">
          <div className="max-w-2xl mx-auto text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Vérification du paiement en cours...</p>
          </div>
        </Section>
      </Layout>
    );
  }

  if (verifyState === "error") {
    return (
      <Layout>
        <Section variant="cream" size="lg">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              Paiement non vérifié
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Nous n'avons pas pu vérifier ton paiement. Si tu penses qu'il s'agit d'une erreur, contacte-nous.
            </p>
            <Button variant="hero" size="lg" asChild>
              <Link to="/one-shot">Retour à l'offre One Shot</Link>
            </Button>
          </div>
        </Section>
      </Layout>
    );
  }

  return (
    <Layout>
      <Section variant="cream" size="lg">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Paiement confirmé !
          </h1>

          <p className="text-lg text-muted-foreground mb-8">
            Merci ! Il ne te reste plus qu'à choisir ton créneau pour notre session.
          </p>

          <Button variant="hero" size="xl" asChild>
            <a href="https://calendly.com/fredwavcm/accompagnement-one-shot" target="_blank" rel="noopener noreferrer" onClick={() => trackPostHogEvent("click_calendly_oneshot")}>
              <Calendar className="mr-2 h-5 w-5" />
              Réserver mon créneau
            </a>
          </Button>

          <div className="mt-8 p-6 bg-muted/50 rounded-xl text-left">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-muted-foreground text-sm">
                Si les horaires ne te conviennent pas, contacte-moi à{" "}
                <a href="mailto:fredwavcm@gmail.com" className="text-primary font-medium hover:underline">fredwavcm@gmail.com</a>
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Button variant="ghost" onClick={() => {
              trackPostHogEvent("oneshot_flow_complete");
              localStorage.removeItem("oneshot_session_id");
              localStorage.removeItem("oneshot_form_submitted");
              navigate("/");
            }}>
              J'ai réservé mon créneau<ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
