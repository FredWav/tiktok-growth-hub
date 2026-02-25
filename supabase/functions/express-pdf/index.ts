import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

// Sanitize text to remove non-WinAnsi characters (emojis, special Unicode)
function sanitize(text: string): string {
  if (!text) return "";
  let s = text
    .replace(/\r\n/g, " ")
    .replace(/\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\t/g, " ")
    .replace(/—/g, "-")
    .replace(/–/g, "-")
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/•/g, "-")
    .replace(/·/g, "-")
    .replace(/✓/g, "v")
    .replace(/…/g, "...");
  // Strip control chars (0x00-0x1F except space 0x20) + non-printable
  s = s.replace(/[\x00-\x09\x0B-\x1F]/g, "");
  // Keep only printable WinAnsi range
  s = s.replace(/[^\x20-\xFF]/g, "");
  return s;
}

const GOLD = rgb(0.769, 0.639, 0.29);
const BLACK = rgb(0.059, 0.059, 0.059);
const GRAY = rgb(0.451, 0.451, 0.451);
const LIGHT_GRAY = rgb(0.898, 0.898, 0.898);
const BG_CREAM = rgb(0.98, 0.98, 0.957);
const WHITE = rgb(1, 1, 1);
const GREEN = rgb(0.133, 0.773, 0.369);
const ORANGE = rgb(0.976, 0.451, 0.086);
const RED = rgb(0.937, 0.267, 0.267);

function formatNumber(n: number): string {
  if (n == null) return "-";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n * 100) / 100);
}

function getScoreColor(score: number) {
  if (score >= 80) return GREEN;
  if (score >= 60) return GOLD;
  if (score >= 40) return ORANGE;
  return RED;
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Bon";
  if (score >= 40) return "Moyen";
  return "Faible";
}

// Helper to wrap text and return lines
function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

class PdfBuilder {
  doc: any;
  page: any;
  y: number;
  pageWidth = 595.28; // A4
  pageHeight = 841.89;
  marginLeft = 50;
  marginRight = 50;
  marginTop = 50;
  marginBottom = 60;
  contentWidth: number;
  fontRegular: any;
  fontBold: any;

  constructor(doc: any, fontRegular: any, fontBold: any) {
    this.doc = doc;
    this.fontRegular = fontRegular;
    this.fontBold = fontBold;
    this.contentWidth = this.pageWidth - this.marginLeft - this.marginRight;
    this.page = doc.addPage([this.pageWidth, this.pageHeight]);
    this.y = this.pageHeight - this.marginTop;
  }

  ensureSpace(needed: number) {
    if (this.y - needed < this.marginBottom) {
      this.addFooter();
      this.page = this.doc.addPage([this.pageWidth, this.pageHeight]);
      this.y = this.pageHeight - this.marginTop;
    }
  }

  addFooter() {
    const now = new Date();
    const dateStr = now.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    this.page.drawLine({ start: { x: this.marginLeft, y: 45 }, end: { x: this.pageWidth - this.marginRight, y: 45 }, color: GOLD, thickness: 1.5 });
    this.page.drawText(`Généré par FredWav — ${dateStr}`, { x: this.marginLeft, y: 30, size: 8, font: this.fontRegular, color: GRAY });
    this.page.drawText("fredwav.lovable.app", { x: this.pageWidth - this.marginRight - this.fontRegular.widthOfTextAtSize("fredwav.lovable.app", 8), y: 30, size: 8, font: this.fontRegular, color: GRAY });
  }

  drawText(text: string, opts: { font?: any; size?: number; color?: any; x?: number; maxWidth?: number; lineHeight?: number }) {
    const font = opts.font || this.fontRegular;
    const size = opts.size || 10;
    const color = opts.color || BLACK;
    const x = opts.x || this.marginLeft;
    const maxWidth = opts.maxWidth || this.contentWidth;
    const lineHeight = opts.lineHeight || size * 1.4;

    // Double safety: sanitize + split by any remaining newlines
    const sanitized = sanitize(text);
    const paragraphs = sanitized.split(/\n/);
    for (const para of paragraphs) {
      if (!para.trim()) { this.y -= lineHeight * 0.5; continue; }
      const lines = wrapText(para, font, size, maxWidth);
      for (const line of lines) {
        this.ensureSpace(lineHeight);
        this.page.drawText(line, { x, y: this.y, size, font, color });
        this.y -= lineHeight;
      }
    }
  }

  drawSectionTitle(title: string) {
    this.ensureSpace(35);
    this.y -= 12;
    this.page.drawLine({ start: { x: this.marginLeft, y: this.y - 2 }, end: { x: this.pageWidth - this.marginRight, y: this.y - 2 }, color: GOLD, thickness: 1.5 });
    this.page.drawText(title, { x: this.marginLeft, y: this.y + 5, size: 14, font: this.fontBold, color: BLACK });
    this.y -= 22;
  }

  drawScoreBar(label: string, score: number, detail?: string) {
    this.ensureSpace(35);
    const color = getScoreColor(score);
    const barY = this.y;
    
    // Label
    this.page.drawText(label, { x: this.marginLeft, y: barY, size: 10, font: this.fontBold, color: BLACK });
    const scoreText = `${score}/100 - ${getScoreLabel(score)}`;
    const scoreTextWidth = this.fontBold.widthOfTextAtSize(scoreText, 10);
    this.page.drawText(scoreText, { x: this.pageWidth - this.marginRight - scoreTextWidth, y: barY, size: 10, font: this.fontBold, color });
    
    // Bar background
    const barWidth = this.contentWidth;
    this.y -= 14;
    this.page.drawRectangle({ x: this.marginLeft, y: this.y, width: barWidth, height: 6, color: LIGHT_GRAY, borderRadius: 3 });
    // Bar fill
    this.page.drawRectangle({ x: this.marginLeft, y: this.y, width: barWidth * (score / 100), height: 6, color, borderRadius: 3 });
    this.y -= 8;

    if (detail) {
      this.drawText(detail, { size: 8, color: GRAY });
    }
    this.y -= 6;
  }

  drawMetricBox(x: number, y: number, w: number, h: number, label: string, value: string) {
    this.page.drawRectangle({ x, y, width: w, height: h, color: BG_CREAM, borderColor: LIGHT_GRAY, borderWidth: 0.5 });
    // Label centered
    const labelWidth = this.fontRegular.widthOfTextAtSize(label, 7);
    this.page.drawText(label.toUpperCase(), { x: x + (w - labelWidth) / 2, y: y + h - 14, size: 7, font: this.fontRegular, color: GRAY });
    // Value centered
    const valWidth = this.fontBold.widthOfTextAtSize(value, 14);
    this.page.drawText(value, { x: x + (w - valWidth) / 2, y: y + 10, size: 14, font: this.fontBold, color: BLACK });
  }
}

async function generatePdf(username: string, data: any): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  
  const b = new PdfBuilder(doc, fontRegular, fontBold);
  const account = data?.account || {};
  const persona = data?.persona || {};
  const healthScore = data?.health_score || account?.health_score || {};
  const pubPattern = persona?.style_contenu?.publication_pattern || {};
  const breakdown = pubPattern?.regularity_details?.tiktok_breakdown || {};
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  // ===== HEADER =====
  b.page.drawText("FredWav", { x: b.marginLeft, y: b.y, size: 22, font: fontBold, color: BLACK });
  b.page.drawText("Analyse TikTok Express", { x: b.marginLeft, y: b.y - 18, size: 10, font: fontBold, color: GOLD });
  
  const dateWidth = fontRegular.widthOfTextAtSize(dateStr, 9);
  b.page.drawText(dateStr, { x: b.pageWidth - b.marginRight - dateWidth, y: b.y, size: 9, font: fontRegular, color: GRAY });
  const userLabel = `@${username}`;
  const userWidth = fontBold.widthOfTextAtSize(userLabel, 11);
  b.page.drawText(userLabel, { x: b.pageWidth - b.marginRight - userWidth, y: b.y - 16, size: 11, font: fontBold, color: BLACK });
  
  b.y -= 32;
  b.page.drawLine({ start: { x: b.marginLeft, y: b.y }, end: { x: b.pageWidth - b.marginRight, y: b.y }, color: GOLD, thickness: 2 });
  b.y -= 20;

  // ===== PROFILE =====
  b.ensureSpace(60);
  const displayName = account.display_name || username;
  b.page.drawText(displayName, { x: b.marginLeft, y: b.y, size: 16, font: fontBold, color: BLACK });
  if (account.verified) {
    const nameW = fontBold.widthOfTextAtSize(displayName, 16);
    b.page.drawText(" [v]", { x: b.marginLeft + nameW + 4, y: b.y, size: 14, font: fontBold, color: GOLD });
  }
  b.y -= 16;
  b.page.drawText(`@${username}`, { x: b.marginLeft, y: b.y, size: 10, font: fontRegular, color: GRAY });
  b.y -= 14;

  if (account.bio) {
    b.drawText(sanitize(account.bio), { size: 9, color: GRAY, maxWidth: b.contentWidth * 0.8 });
  }
  if (account.detected_niche) {
    b.ensureSpace(16);
    const nicheText = sanitize(account.detected_niche);
    b.page.drawRectangle({ x: b.marginLeft, y: b.y - 4, width: fontBold.widthOfTextAtSize(nicheText, 9) + 16, height: 16, color: GOLD });
    b.page.drawText(nicheText, { x: b.marginLeft + 8, y: b.y, size: 9, font: fontBold, color: WHITE });
    b.y -= 22;
  }

  // ===== HEALTH SCORE =====
  if (healthScore?.total_score != null) {
    b.drawSectionTitle("Score de Sante");
    
    b.ensureSpace(40);
    const score = healthScore.total_score;
    const scoreColor = getScoreColor(score);
    b.page.drawText(`${score}/100`, { x: b.marginLeft, y: b.y, size: 28, font: fontBold, color: scoreColor });
    const labelText = getScoreLabel(score);
    b.page.drawText(labelText, { x: b.marginLeft + 100, y: b.y + 4, size: 14, font: fontBold, color: scoreColor });
    b.y -= 16;
    if (healthScore.overall_status) {
      b.drawText(sanitize(healthScore.overall_status), { size: 9, color: GRAY });
    }
    b.y -= 8;

    // Components
    const componentKeys = Object.keys(healthScore.components || {});
    for (const k of componentKeys) {
      const c = healthScore.components[k];
      b.drawScoreBar(sanitize(c.label || k), c.score || 0, sanitize(c.status || ""));
    }

    // Priority actions
    if (healthScore.priority_actions?.length) {
      b.ensureSpace(20);
      b.drawText("Actions prioritaires :", { font: fontBold, size: 10 });
      for (const action of healthScore.priority_actions) {
        b.drawText(`  -  ${sanitize(action)}`, { size: 9, color: GRAY });
      }
      b.y -= 4;
    }
  }

  // ===== METRICS =====
  b.drawSectionTitle("Metriques Cles");
  
  // Main metrics row (4 boxes)
  const boxH = 48;
  const gap = 8;
  const boxW = (b.contentWidth - gap * 3) / 4;
  b.ensureSpace(boxH + 10);
  
  const mainMetrics = [
    ["Abonnés", formatNumber(account.followers_count)],
    ["Likes total", formatNumber(account.total_likes)],
    ["Vidéos", formatNumber(account.video_count)],
    ["Engagement", account.engagement_rate != null ? `${(account.engagement_rate * 100).toFixed(2)}%` : "—"],
  ];
  for (let i = 0; i < mainMetrics.length; i++) {
    b.drawMetricBox(b.marginLeft + i * (boxW + gap), b.y - boxH, boxW, boxH, mainMetrics[i][0], mainMetrics[i][1]);
  }
  b.y -= boxH + 14;

  // Averages (5 boxes)
  if (account.avg_views != null || account.avg_likes != null) {
    b.drawText("Moyennes par vidéo", { font: fontBold, size: 10, color: GRAY });
    b.y -= 4;
    const box5W = (b.contentWidth - gap * 4) / 5;
    b.ensureSpace(boxH + 10);
    const avgMetrics = [
      ["Vues", formatNumber(account.avg_views)],
      ["Likes", formatNumber(account.avg_likes)],
      ["Commentaires", formatNumber(account.avg_comments)],
      ["Saves", formatNumber(account.avg_saves)],
      ["Partages", formatNumber(account.avg_shares)],
    ];
    for (let i = 0; i < avgMetrics.length; i++) {
      b.drawMetricBox(b.marginLeft + i * (box5W + gap), b.y - boxH, box5W, boxH, avgMetrics[i][0], avgMetrics[i][1]);
    }
    b.y -= boxH + 14;
  }

  // Medians (5 boxes)
  if (account.median_views != null || account.median_likes != null) {
    b.drawText("Médianes par vidéo", { font: fontBold, size: 10, color: GRAY });
    b.y -= 4;
    const box5W = (b.contentWidth - gap * 4) / 5;
    b.ensureSpace(boxH + 10);
    const medMetrics = [
      ["Vues", formatNumber(account.median_views)],
      ["Likes", formatNumber(account.median_likes)],
      ["Commentaires", formatNumber(account.median_comments)],
      ["Saves", formatNumber(account.median_saves)],
      ["Partages", formatNumber(account.median_shares)],
    ];
    for (let i = 0; i < medMetrics.length; i++) {
      b.drawMetricBox(b.marginLeft + i * (box5W + gap), b.y - boxH, box5W, boxH, medMetrics[i][0], medMetrics[i][1]);
    }
    b.y -= boxH + 14;
  }

  // ===== HASHTAGS =====
  if (account.top_hashtags?.length) {
    b.drawSectionTitle("Top Hashtags");
    const tags = account.top_hashtags.map((h: any) => {
      const tag = typeof h === "string" ? h : h.tag || h.name;
      const count = typeof h === "object" ? h.count : null;
      return count ? `#${tag} (${count})` : `#${tag}`;
    });
    // Print as comma-separated wrapping text
    b.drawText(tags.join("   "), { size: 10, font: fontBold, color: GOLD });
    b.y -= 4;
  }

  // ===== BEST TIMES =====
  if (pubPattern.best_times?.length) {
    b.drawSectionTitle("Meilleurs Creneaux de Publication");

    if (pubPattern.publication_frequency?.weekly_pattern) {
      b.drawText(`Fréquence : ${pubPattern.publication_frequency.weekly_pattern}`, { size: 9, color: GRAY });
    }
    if (pubPattern.consistency_score != null) {
      b.drawText(`Score de régularité : ${pubPattern.consistency_score}/100`, { size: 9, color: GRAY });
    }
    b.y -= 4;

    for (let i = 0; i < Math.min(5, pubPattern.best_times.length); i++) {
      const t = pubPattern.best_times[i];
      b.ensureSpace(18);
      const rank = `#${i + 1}`;
      const dayTime = `${DAYS[t.day] || t.day} à ${String(t.hour).padStart(2, "0")}h00`;
      const views = `${formatNumber(t.avg_views)} vues moy.`;
      
      b.page.drawText(rank, { x: b.marginLeft, y: b.y, size: 12, font: fontBold, color: GOLD });
      b.page.drawText(dayTime, { x: b.marginLeft + 30, y: b.y, size: 10, font: fontBold, color: BLACK });
      const viewsW = fontRegular.widthOfTextAtSize(views, 9);
      b.page.drawText(views, { x: b.pageWidth - b.marginRight - viewsW, y: b.y, size: 9, font: fontRegular, color: GRAY });
      b.y -= 16;
    }

    if (pubPattern.recommendations?.length) {
      b.y -= 4;
      b.drawText("Recommandations :", { font: fontBold, size: 10 });
      for (const r of pubPattern.recommendations) {
        b.drawText(`  -  ${sanitize(r)}`, { size: 9, color: GRAY });
      }
    }
    b.y -= 4;
  }

  // ===== REGULARITY =====
  const breakdownKeys = Object.keys(breakdown);
  if (breakdownKeys.length > 0) {
    b.drawSectionTitle("Regularite Detaillee");
    for (const key of breakdownKeys) {
      const val = breakdown[key];
      b.drawScoreBar(sanitize(val.label || key), val.score || 0, sanitize(val.detail || val.status || ""));
    }
  }

  // ===== PERSONA =====
  if (persona.niche_principale || persona.forces?.length || persona.faiblesses?.length) {
    b.drawSectionTitle("Persona Identifie");
    
    if (persona.niche_principale) {
      b.drawText(`Niche : ${sanitize(persona.niche_principale)}`, { font: fontBold, size: 10 });
      b.y -= 4;
    }

    if (persona.forces?.length) {
      b.drawText("Forces", { font: fontBold, size: 10 });
      for (const f of persona.forces) {
        b.drawText(`  v  ${sanitize(f)}`, { size: 9, color: GRAY });
      }
      b.y -= 4;
    }

    if (persona.faiblesses?.length) {
      b.drawText("Points d'amélioration", { font: fontBold, size: 10 });
      for (const f of persona.faiblesses) {
        b.drawText(`  !  ${sanitize(f)}`, { size: 9, color: GRAY });
      }
      b.y -= 4;
    }
  }

  // ===== AI INSIGHTS =====
  if (account.ai_insights) {
    b.drawSectionTitle("Analyse Detaillee (IA)");
    
    const lines = account.ai_insights.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) { b.y -= 6; continue; }

      if (trimmed.startsWith("### ")) {
        b.y -= 4;
        b.drawText(sanitize(trimmed.slice(4).replace(/\*\*/g, "")), { font: fontBold, size: 11, color: BLACK });
      } else if (trimmed.startsWith("## ")) {
        b.y -= 6;
        b.drawText(sanitize(trimmed.slice(3).replace(/\*\*/g, "")), { font: fontBold, size: 12, color: GOLD });
      } else if (trimmed.startsWith("# ")) {
        b.y -= 8;
        b.drawText(sanitize(trimmed.slice(2).replace(/\*\*/g, "")), { font: fontBold, size: 14, color: BLACK });
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        b.drawText(`  -  ${sanitize(trimmed.slice(2).replace(/\*\*/g, ""))}`, { size: 9, color: GRAY });
      } else if (/^\d+\.\s+/.test(trimmed)) {
        b.drawText(`  ${sanitize(trimmed.replace(/\*\*/g, ""))}`, { size: 9, color: GRAY });
      } else {
        // Check for bold segments — render entire line, stripping ** for pdf-lib
        const hasBold = /\*\*(.+?)\*\*/.test(trimmed);
        if (hasBold) {
          b.drawText(sanitize(trimmed.replace(/\*\*/g, "")), { size: 9, color: BLACK });
        } else {
          b.drawText(sanitize(trimmed), { size: 9, color: GRAY });
        }
      }
    }
  }

  // Final footer
  b.addFooter();

  return await doc.save();
}

// Encode Uint8Array to base64
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, username, data } = await req.json();
    if (!session_id || !username) throw new Error("session_id et username requis");
    if (!data) throw new Error("Les données d'analyse sont requises");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      throw new Error("Paiement non confirmé");
    }

    const pdfBytes = await generatePdf(username, data);
    const pdfBase64 = uint8ToBase64(pdfBytes);

    return new Response(JSON.stringify({ pdf_base64: pdfBase64 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
