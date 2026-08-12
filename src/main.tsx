import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import { isClientOnlyQueryVariant, normalizePathname } from "@/config/routes";
import "./index.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("[bootstrap] Élément #root introuvable.");
}

const currentUrl = new URL(window.location.href);
const renderedPath = root.dataset.ssgPath;
const canHydrate =
  root.hasChildNodes() &&
  Boolean(renderedPath) &&
  normalizePathname(renderedPath!) === normalizePathname(currentUrl.pathname) &&
  !isClientOnlyQueryVariant(currentUrl);

const application = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (canHydrate) {
  hydrateRoot(root, application, {
    identifierPrefix: "fw-",
    onRecoverableError(error, errorInfo) {
      console.error("[hydration] React a dû récupérer une divergence de rendu.", error, errorInfo);
    },
  });
} else {
  // Une route fonctionnelle peut recevoir par erreur un document SSG à cause
  // d'un fallback d'hébergement. Ne jamais hydrater le contenu d'une autre URL.
  root.replaceChildren();
  createRoot(root, { identifierPrefix: "fw-" }).render(application);
}
