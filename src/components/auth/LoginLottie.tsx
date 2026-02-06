"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Lottie = dynamic(
  () => import("lottie-react").then((mod) => mod.default),
  { ssr: false }
);

interface LottieAnimationData {
  v?: string;
  fr?: number;
  layers?: unknown[];
  [key: string]: unknown;
}

export function LoginLottie() {
  const [animationData, setAnimationData] = useState<LottieAnimationData | null>(null);

  useEffect(() => {
    fetch("/lottie/login.json")
      .then((res) => res.json())
      .then(setAnimationData)
      .catch(() => setAnimationData(null));
  }, []);

  if (!animationData) {
    return (
      <div
        className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30"
        aria-hidden
      />
    );
  }

  return (
    <div className="mx-auto h-28 w-28 flex-shrink-0" aria-hidden>
      <Lottie
        animationData={animationData}
        loop
        className="h-full w-full"
        style={{ margin: 0 }}
      />
    </div>
  );
}
