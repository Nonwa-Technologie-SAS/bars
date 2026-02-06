import { redirect } from "next/navigation";

export default function Home() {
  // Redirige vers le dashboard par défaut pour éviter la boucle infinie
  redirect("/auth/login");
}
