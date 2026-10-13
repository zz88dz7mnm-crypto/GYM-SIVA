import type { Metadata } from "next";
import { VistaHistorial } from "@/components/vistas/VistaHistorial";

export const metadata: Metadata = { title: "Historial" };

export default function Pagina() {
  return <VistaHistorial />;
}
