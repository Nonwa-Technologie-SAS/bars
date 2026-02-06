import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - Bars",
  description: "Authentication pages for Bars application",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/25 blur-[100px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[100px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-blue-400/20 blur-[100px]" />
      </div>
      <div className="relative w-full max-w-md z-10">{children}</div>
    </div>
  );
}