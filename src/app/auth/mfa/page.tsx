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
import { useState, useRef, useEffect } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MFAPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multi-char input

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    router.push("/demo-club/dashboard");
  };

  return (
    <Card className="border-gray-200 dark:border-gray-800 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600 dark:text-purple-400">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-bold text-center">
          Double authentification
        </CardTitle>
        <CardDescription className="text-center">
          Entrez le code à 6 chiffres envoyé sur votre appareil
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2">
            {code.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                className="w-10 h-12 text-center text-lg font-bold"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
              />
            ))}
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            disabled={isLoading || code.some((c) => !c)}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Vérifier
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Vous n'avez pas reçu le code ?
        </p>
        <button className="text-sm font-medium text-primary hover:underline">
          Renvoyer le code
        </button>
        <Link
          href="/auth/login"
          className="mt-4 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          Retour à la connexion
        </Link>
      </CardFooter>
    </Card>
  );
}