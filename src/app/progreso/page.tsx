import type { Metadata } from "next";
import { VistaProgreso } from "@/components/vistas/VistaProgreso";

export const metadata: Metadata = { title: "Progreso" };

// Todo se muestra recién en el navegador, después de iniciar sesión: no hay nada que validar del lado del servidor.
export const instant = false;

export default function Pagina() {
  return <VistaProgreso />;
}
