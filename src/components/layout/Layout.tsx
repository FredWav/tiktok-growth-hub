import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { TikTokBrowserBanner } from "@/components/TikTokBrowserBanner";
interface LayoutProps {
  children: ReactNode;
  // "landing" = page de conversion sans navigation (header logo seul, footer légal minimal).
  variant?: "default" | "landing";
}

export function Layout({ children, variant = "default" }: LayoutProps) {
  const minimal = variant === "landing";
  return (
    <div className="min-h-screen flex flex-col">
      <TikTokBrowserBanner />
      <Header minimal={minimal} />
      <main className="flex-1 pt-16 md:pt-20">
        {children}
      </main>
      <Footer minimal={minimal} />
    </div>
  );
}
