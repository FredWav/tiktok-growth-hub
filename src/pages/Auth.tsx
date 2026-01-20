import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, User, Shield, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

const adminSetupSchema = z.object({
  fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  secretCode: z.string().min(1, "Le code secret est requis"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
});

type AuthMode = 'login' | 'adminSetup' | 'forgotPassword';

const Auth: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretCode, setSecretCode] = useState("");

  // Field errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { user, role, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user && role) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/app", { replace: true });
      }
    }
  }, [user, role, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError("Email ou mot de passe incorrect");
        } else {
          setError(error.message);
        }
      }
    } catch (err) {
      setError("Une erreur inattendue s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const result = adminSetupSchema.safeParse({ fullName, email, password, secretCode });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/setup-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            email,
            password,
            fullName,
            secretCode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la création du compte admin');
        return;
      }

      setSuccess('Compte administrateur créé ! Connexion en cours...');
      toast.success('Compte administrateur créé avec succès');

      // Auto-login
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError('Compte créé mais erreur de connexion. Veuillez vous connecter manuellement.');
        setMode('login');
      }
    } catch (err) {
      setError("Une erreur inattendue s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess('Un email de réinitialisation a été envoyé. Vérifiez votre boîte de réception.');
      toast.success('Email de réinitialisation envoyé');
    } catch (err) {
      setError("Une erreur inattendue s'est produite");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    setPassword("");
    setSecretCode("");
  };

  return (
    <div className="min-h-screen bg-noir flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-primary">Fred Wav</h1>
          <p className="text-cream/60 mt-2">
            {mode === 'login' && "Connectez-vous à votre espace"}
            {mode === 'adminSetup' && "Configuration administrateur"}
            {mode === 'forgotPassword' && "Réinitialiser votre mot de passe"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-noir-light border border-primary/20 rounded-lg p-8">
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-cream">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream/40" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="pl-10 bg-noir border-primary/30 text-cream placeholder:text-cream/40"
                    disabled={isLoading}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-red-400 text-sm">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-cream">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream/40" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 bg-noir border-primary/30 text-cream placeholder:text-cream/40"
                    disabled={isLoading}
                  />
                </div>
              {fieldErrors.password && (
                  <p className="text-red-400 text-sm">{fieldErrors.password}</p>
                )}
                <button
                  type="button"
                  onClick={() => { setMode('forgotPassword'); resetForm(); }}
                  className="text-primary/80 hover:text-primary text-sm transition-colors"
                  disabled={isLoading}
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-md p-3">
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                variant="hero"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>
          )}

          {mode === 'adminSetup' && (
            <form onSubmit={handleAdminSetup} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-cream">
                  Nom complet
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream/40" />
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Votre nom"
                    className="pl-10 bg-noir border-primary/30 text-cream placeholder:text-cream/40"
                    disabled={isLoading}
                  />
                </div>
                {fieldErrors.fullName && (
                  <p className="text-red-400 text-sm">{fieldErrors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail" className="text-cream">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream/40" />
                  <Input
                    id="adminEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@email.com"
                    className="pl-10 bg-noir border-primary/30 text-cream placeholder:text-cream/40"
                    disabled={isLoading}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-red-400 text-sm">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminPassword" className="text-cream">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream/40" />
                  <Input
                    id="adminPassword"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 bg-noir border-primary/30 text-cream placeholder:text-cream/40"
                    disabled={isLoading}
                  />
                </div>
                {fieldErrors.password && (
                  <p className="text-red-400 text-sm">{fieldErrors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="secretCode" className="text-cream">
                  Code secret
                </Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream/40" />
                  <Input
                    id="secretCode"
                    type="password"
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value)}
                    placeholder="Code d'accès admin"
                    className="pl-10 bg-noir border-primary/30 text-cream placeholder:text-cream/40"
                    disabled={isLoading}
                  />
                </div>
                {fieldErrors.secretCode && (
                  <p className="text-red-400 text-sm">{fieldErrors.secretCode}</p>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-md p-3">
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                variant="hero"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  "Créer le compte admin"
                )}
              </Button>

              <button
                type="button"
                onClick={() => { setMode('login'); resetForm(); }}
                className="w-full flex items-center justify-center gap-2 text-cream/60 hover:text-cream text-sm transition-colors mt-4"
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4" />
                Retour à la connexion
              </button>
            </form>
          )}

          {/* Forgot password form */}
          {mode === 'forgotPassword' && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="resetEmail" className="text-cream">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream/40" />
                  <Input
                    id="resetEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="pl-10 bg-noir border-primary/30 text-cream placeholder:text-cream/40"
                    disabled={isLoading}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-red-400 text-sm">{fieldErrors.email}</p>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-md p-3">
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                variant="hero"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  "Envoyer le lien de réinitialisation"
                )}
              </Button>

              <button
                type="button"
                onClick={() => { setMode('login'); resetForm(); }}
                className="w-full flex items-center justify-center gap-2 text-cream/60 hover:text-cream text-sm transition-colors mt-4"
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4" />
                Retour à la connexion
              </button>
            </form>
          )}

          {/* Admin setup link - only visible on login */}
          {mode === 'login' && (
            <div className="mt-6 pt-4 border-t border-primary/10">
              <button
                type="button"
                onClick={() => { setMode('adminSetup'); resetForm(); }}
                className="w-full flex items-center justify-center gap-2 text-cream/40 hover:text-cream/60 text-xs transition-colors"
                disabled={isLoading}
              >
                <Shield className="h-3 w-3" />
                Configuration administrateur
              </button>
            </div>
          )}
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-cream/60 hover:text-cream text-sm transition-colors"
          >
            ← Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
};

export default Auth;
