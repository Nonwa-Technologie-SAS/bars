"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { LoginLottie } from "@/components/auth/LoginLottie";

export default function LoginPage() {
  const router = useRouter();
  const { fetchCurrentSession } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schema = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(6, "Mot de passe trop court"),
    remember: z.boolean().optional(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError(null);
    const parsed = schema.safeParse({ email, password, remember });
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      setError(first?.message || "Veuillez vérifier vos informations");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Échec de la connexion");
      } else {
        // Charger les données utilisateur et tenant dans le store
        await fetchCurrentSession();
        // Rediriger vers le dashboard
        router.push(data?.data?.redirect || "/");
      }
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-blue-200/50 dark:border-blue-900/50 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-4 ring-1 ring-blue-500/10">
      <CardHeader className="space-y-1 px-1">
        <CardTitle className="text-2xl font-bold text-center text-slate-900 dark:text-white">
          Connexion
        </CardTitle>
        <CardDescription className="text-center text-slate-600 dark:text-slate-400">
          Entrez vos identifiants pour accéder à votre espace
        </CardDescription>
        <LoginLottie />
      </CardHeader>
      <CardContent className="px-1">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2 mb-4">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemple@bars.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              aria-invalid={!!error}
            />
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">Mot de passe</Label>
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(v) => setRemember(Boolean(v))}
              />
              <Label htmlFor="remember" className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Se souvenir de moi</Label>
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white focus-visible:ring-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            Se connecter
          </Button>
        </form>
        
        {/* <div className="mt-6">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">
                        Ou continuer avec
                    </span>
                </div>
            </div> */}
            {/* <div className="mt-4 grid grid-cols-2 gap-3">
                <Button variant="outline" disabled={isLoading}>
                    Google
                </Button>
                <Button variant="outline" disabled={isLoading}>
                    Apple
                </Button>
            </div> */}
        {/* </div> */}
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-slate-500 dark:text-slate-400">
        Pas encore de compte ?{" "}
        {/* <Link
          href="/auth/register"
          className="ml-1 font-medium text-primary hover:underline"
        >
          S'inscrire
        </Link> */}
      </CardFooter>
    </Card>
  );
}
