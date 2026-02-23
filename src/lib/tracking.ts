export function trackEvent(event: string, data?: Record<string, string>) {
  // Placeholder - brancher analytics ici (GA, Plausible, etc.)
  if (typeof window !== "undefined") {
    console.debug("[track]", event, data);
  }
}
