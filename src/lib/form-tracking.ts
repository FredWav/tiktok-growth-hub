import { useEffect, useRef, type RefObject } from "react";
import { trackEvent } from "./tracking";
import type { OfferId } from "./funnel-offers";

/**
 * Suivi des formulaires pour repérer les blocages : premier champ touché, temps
 * passé par champ, erreurs affichées, abandon. Jamais le contenu saisi : seulement
 * le nom des champs, s'ils sont remplis, et des durées.
 */

const done = new Set<string>();

/** Le formulaire de cette offre a abouti (demande enregistrée, départ au paiement) : pas d'abandon. */
export function markFormDone(offer: OfferId) {
  done.add(offer);
}

/** Erreur montrée au visiteur, sous forme de code court (ex. « email_invalide »). */
export function trackFormError(offer: OfferId, form: string, reason: string) {
  trackEvent("form_error", { offer, form, reason });
}

function fieldName(target: EventTarget | null): string {
  if (!(target instanceof HTMLElement)) return "";
  if (!target.matches("input, textarea, select, [role=checkbox], [role=radio], [role=combobox]")) return "";
  if (target instanceof HTMLInputElement && target.type === "hidden") return "";
  return target.getAttribute("name") || target.id || target.getAttribute("aria-label") || target.tagName.toLowerCase();
}

function isFilled(target: EventTarget | null): boolean {
  if (target instanceof HTMLInputElement && (target.type === "checkbox" || target.type === "radio")) return target.checked;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
    return target.value.trim() !== "";
  }
  return target instanceof HTMLElement && target.getAttribute("data-state") === "checked";
}

const seconds = (since: number) => String(Math.round((Date.now() - since) / 1000));

/** `offer` peut changer pendant la saisie (choix de l'offre dans la demande) : on lit la valeur du moment. */
export function useFormTracking(ref: RefObject<HTMLFormElement | null>, currentOffer: OfferId, form: string) {
  const offerRef = useRef(currentOffer);
  offerRef.current = currentOffer;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    done.delete(offerRef.current);
    let startedAt = 0;
    let lastField = "";
    const filled = new Set<string>();
    const focusedAt = new Map<string, number>();
    const errors = new Set<string>();

    const onFocus = (e: FocusEvent) => {
      const name = fieldName(e.target);
      if (!name) return;
      if (!startedAt) {
        startedAt = Date.now();
        trackEvent("form_start", { offer: offerRef.current, form, first_field: name, source_page: window.location.pathname });
      }
      focusedAt.set(name, Date.now());
      lastField = name;
    };
    const onBlur = (e: FocusEvent) => {
      const name = fieldName(e.target);
      const since = focusedAt.get(name);
      if (!name || !since) return;
      focusedAt.delete(name);
      const isSet = isFilled(e.target);
      if (isSet) filled.add(name); else filled.delete(name);
      trackEvent("form_field", { offer: offerRef.current, form, field: name, filled: String(isSet), seconds: seconds(since) });
    };
    // Champ obligatoire vide ou mal formé, signalé par le navigateur.
    const onInvalid = (e: Event) => {
      const name = fieldName(e.target);
      if (!name || !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) return;
      const v = e.target.validity;
      const reason = v.valueMissing ? "manquant" : v.typeMismatch ? "format" : v.tooShort || v.tooLong ? "longueur" : "invalide";
      const key = `${name}:${reason}`;
      if (errors.has(key)) return;
      errors.add(key);
      trackEvent("form_error", { offer: offerRef.current, form, field: name, reason });
    };
    const abandon = () => {
      const offer = offerRef.current;
      if (!startedAt || done.has(offer)) return;
      done.add(offer); // une seule fois par affichage
      trackEvent("form_abandon", {
        offer, form, last_field: lastField, fields_filled: String(filled.size), seconds: seconds(startedAt),
      }, { beacon: true });
    };

    el.addEventListener("focusin", onFocus);
    el.addEventListener("focusout", onBlur);
    el.addEventListener("invalid", onInvalid, true);
    window.addEventListener("pagehide", abandon);
    return () => {
      el.removeEventListener("focusin", onFocus);
      el.removeEventListener("focusout", onBlur);
      el.removeEventListener("invalid", onInvalid, true);
      window.removeEventListener("pagehide", abandon);
      abandon(); // navigation interne vers une autre page
    };
  }, [ref, form]);
}
