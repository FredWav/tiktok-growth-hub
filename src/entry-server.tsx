import React from "react";
import { PassThrough } from "node:stream";
import { QueryClient } from "@tanstack/react-query";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router";
import { AppProviders, AppRouterContent } from "./App";
import { BASE_URL } from "./config/seo";
import { CLIENT_ONLY_ROUTE_PATTERNS, LEGACY_REDIRECTS, SSG_ROUTES } from "./config/routes";

const RENDER_TIMEOUT_MS = 15_000;

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  };
}

// Certaines pages historiques lisent encore `localStorage` directement dans
// leur fonction de rendu. Cette mémoire isolée rend leur état initial vide et
// déterministe sans exposer les sessions d'un visiteur pendant le build.
if (typeof globalThis.localStorage === "undefined") {
  Object.defineProperty(globalThis, "localStorage", { value: createMemoryStorage() });
}
if (typeof globalThis.sessionStorage === "undefined") {
  Object.defineProperty(globalThis, "sessionStorage", { value: createMemoryStorage() });
}

export { BASE_URL, CLIENT_ONLY_ROUTE_PATTERNS, LEGACY_REDIRECTS, SSG_ROUTES };

export async function renderRoute(url: string): Promise<string> {
  // Chaque route part d'un environnement vierge : aucune lecture historique
  // ne peut influencer la page suivante au sein du même processus de build.
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
  const queryClient = new QueryClient();

  try {
    return await new Promise<string>((resolve, reject) => {
      let renderError: unknown = null;
      let settled = false;
      const timeoutRef: { current?: ReturnType<typeof setTimeout> } = {};

      const finishWithError = (error: unknown) => {
        if (settled) return;
        settled = true;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        reject(error instanceof Error ? error : new Error(String(error)));
      };

      const { pipe, abort } = renderToPipeableStream(
        <React.StrictMode>
          <AppProviders queryClient={queryClient}>
            <StaticRouter location={url}>
              <AppRouterContent />
            </StaticRouter>
          </AppProviders>
        </React.StrictMode>,
        {
          identifierPrefix: "fw-",
          onAllReady() {
            if (renderError) {
              finishWithError(renderError);
              return;
            }

            const destination = new PassThrough();
            let html = "";
            destination.setEncoding("utf8");
            destination.on("data", (chunk: string) => {
              html += chunk;
            });
            destination.on("error", finishWithError);
            destination.on("end", () => {
              if (settled) return;
              settled = true;
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              resolve(html);
            });
            pipe(destination);
          },
          onShellError: finishWithError,
          onError(error) {
            renderError ??= error;
          },
        },
      );

      timeoutRef.current = setTimeout(() => {
        abort();
        finishWithError(new Error(`[ssg] Le rendu de ${url} a dépassé ${RENDER_TIMEOUT_MS} ms.`));
      }, RENDER_TIMEOUT_MS);
    });
  } finally {
    queryClient.clear();
  }
}
