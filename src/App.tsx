import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Offres from "./pages/Offres";
import OneShot from "./pages/OneShot";
import APropos from "./pages/APropos";
import Preuves from "./pages/Preuves";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/offres" element={<Offres />} />
          <Route path="/offres/45-jours" element={<Offres />} />
          <Route path="/offres/vip" element={<Offres />} />
          <Route path="/one-shot" element={<OneShot />} />
          <Route path="/a-propos" element={<APropos />} />
          <Route path="/preuves" element={<Preuves />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
