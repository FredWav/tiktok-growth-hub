import { PDFViewer } from "@react-pdf/renderer";
import { useEffect, useMemo, useState } from "react";

import { buildReportModel } from "@/lib/pdf/build-report-model";
import { ExpressReportDocument } from "@/lib/pdf/document/ExpressReportDocument";
import { registerFonts } from "@/lib/pdf/document/fonts";

/**
 * Atelier de mise au point du rapport PDF — monté uniquement en développement
 * (voir App.tsx). Les fixtures sont des exports réels de `result_data`, non
 * versionnés : `import.meta.glob` renvoie un objet vide si le dossier est absent,
 * donc un build sans fixture ne casse pas.
 */
const fixtures = import.meta.glob("/src/dev-fixtures/*.json");

export default function PdfPreview() {
  const names = useMemo(() => Object.keys(fixtures).sort(), []);
  const [selected, setSelected] = useState(names[0] ?? "");
  const [raw, setRaw] = useState<unknown>(null);
  const [degraded, setDegraded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    registerFonts();
  }, []);

  useEffect(() => {
    if (!selected) return;
    setRaw(null);
    setError(null);
    fixtures[selected]()
      .then((m) => setRaw((m as { default: unknown }).default))
      .catch((e) => setError(String(e)));
  }, [selected]);

  const model = useMemo(() => {
    if (!raw) return null;
    try {
      const source =
        degraded && raw && typeof raw === "object"
          ? { ...(raw as Record<string, unknown>), ai_analysis: undefined }
          : raw;
      return buildReportModel(source);
    } catch (e) {
      setError(String(e));
      return null;
    }
  }, [raw, degraded]);

  if (!names.length) {
    return (
      <div style={{ padding: 40, fontFamily: "system-ui" }}>
        <h1>Aucune fixture</h1>
        <p>
          Dépose un export de <code>result_data</code> dans <code>src/dev-fixtures/*.json</code>.
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          padding: "8px 12px",
          borderBottom: "1px solid #ddd",
          fontFamily: "system-ui",
          fontSize: 13,
        }}
      >
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {names.map((n) => (
            <option key={n} value={n}>
              {n.split("/").pop()}
            </option>
          ))}
        </select>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={degraded} onChange={(e) => setDegraded(e.target.checked)} />
          Simuler une analyse sans IA
        </label>
        {model ? (
          <span style={{ color: "#666" }}>
            @{model.meta.username} · {model.topVideos.length} vidéos ·{" "}
            {model.ai ? "IA présente" : "sans IA"}
          </span>
        ) : null}
      </div>
      {error ? (
        <pre style={{ padding: 16, color: "#b00", whiteSpace: "pre-wrap" }}>{error}</pre>
      ) : model ? (
        <PDFViewer style={{ flex: 1, border: 0 }} showToolbar>
          <ExpressReportDocument model={model} />
        </PDFViewer>
      ) : (
        <p style={{ padding: 16, fontFamily: "system-ui" }}>Chargement…</p>
      )}
    </div>
  );
}
