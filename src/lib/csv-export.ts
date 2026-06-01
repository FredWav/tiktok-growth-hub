// Helpers génériques d'export CSV (aucune dépendance).
// Utilisé notamment pour exporter les consentements Wav Academy (preuve légale).

export type CsvColumn<T> = {
  /** Clé de la propriété sur la ligne (ignorée si `format` est fourni). */
  key?: keyof T;
  /** En-tête de colonne affiché dans le CSV. */
  label: string;
  /** Valeur calculée pour la cellule (prioritaire sur `key`). */
  format?: (row: T) => string | number | boolean | null | undefined;
};

function escapeCell(value: unknown, delimiter: string): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  // Échapper si le délimiteur, un guillemet ou un retour-ligne est présent.
  if (s.includes(delimiter) || /["\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Convertit un tableau d'objets en chaîne CSV.
 * Délimiteur `;` par défaut (Excel FR l'ouvre correctement au double-clic).
 */
export function toCSV<T>(rows: T[], columns: CsvColumn<T>[], delimiter = ";"): string {
  const header = columns.map((c) => escapeCell(c.label, delimiter)).join(delimiter);
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const raw = c.format ? c.format(row) : c.key ? row[c.key] : "";
        return escapeCell(raw, delimiter);
      })
      .join(delimiter),
  );
  return [header, ...lines].join("\r\n");
}

/** Déclenche le téléchargement d'un CSV (préfixe BOM UTF-8 pour les accents dans Excel). */
export function downloadCSV(filename: string, csv: string): void {
  const bom = String.fromCharCode(0xfeff); // UTF-8 BOM
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
