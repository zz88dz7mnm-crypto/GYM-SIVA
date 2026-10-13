import type { Metadata } from "next";
import { VistaPlan } from "@/components/vistas/VistaPlan";

export const metadata: Metadata = { title: "Plan" };

// Todo se muestra recién en el navegador, después de iniciar sesión: no hay nada que validar del lado del servidor.
export const instant = false;

export default function Pagina() {
  return <VistaPlan />;
}
