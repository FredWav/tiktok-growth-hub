import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { TikTokBrowserBanner } from "@/components/TikTokBrowserBanner";
interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <TikTokBrowserBanner />
      <Header />
      <main className="flex-1 pt-16 md:pt-20">
        {children}
      </main>
      <Footer />
    </div>
  );
}
