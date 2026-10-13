import type { Metadata } from "next";
import { VistaProgreso } from "@/components/vistas/VistaProgreso";

export const metadata: Metadata = { title: "Progreso" };

export default function Pagina() {
  return <VistaProgreso />;
}
