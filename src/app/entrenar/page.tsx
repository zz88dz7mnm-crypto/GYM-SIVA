import type { Metadata } from "next";
import { VistaEntrenar } from "@/components/vistas/VistaEntrenar";

export const metadata: Metadata = { title: "Entrenando" };

// Todo se muestra recién en el navegador, después de iniciar sesión: no hay nada que validar del lado del servidor.
export const instant = false;

export default function Pagina() {
  return <VistaEntrenar />;
}
