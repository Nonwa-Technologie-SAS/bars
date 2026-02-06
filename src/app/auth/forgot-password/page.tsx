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
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { LoginLottie } from "@/components/auth/LoginLottie";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setIsSubmitted(true);
  };

  return (
    <Card className="border-blue-200/50 dark:border-blue-900/50 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-4 ring-1 ring-blue-500/10">
      <CardHeader className="space-y-1 px-1">
        <CardTitle className="text-2xl font-bold text-center text-slate-900 dark:text-white">
          Mot de passe oublié
        </CardTitle>
        <CardDescription className="text-center text-slate-600 dark:text-slate-400">
          Entrez votre email pour recevoir un lien de réinitialisation
        </CardDescription>
        <LoginLottie />
      </CardHeader>
      <CardContent className="px-1">
        {isSubmitted ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
              <Mail className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Email envoyé !</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Si un compte existe avec cette adresse, vous recevrez un email avec les instructions.
              </p>
            </div>
            <Button
              className="w-full border-blue-200 dark:border-blue-800 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
              variant="outline"
              onClick={() => setIsSubmitted(false)}
            >
              Renvoyer l'email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemple@bars.com"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white focus-visible:ring-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Envoyer le lien
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link
          href="/auth/login"
          className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la connexion
        </Link>
      </CardFooter>
    </Card>
  );
}