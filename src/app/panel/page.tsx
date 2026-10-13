import type { Metadata } from "next";
import { VistaPanel } from "@/components/vistas/VistaPanel";

export const metadata: Metadata = { title: "Panel" };

// Todo se muestra recién en el navegador, después de iniciar sesión: no hay nada que validar del lado del servidor.
export const instant = false;

export default function Pagina() {
  return <VistaPanel />;
}
