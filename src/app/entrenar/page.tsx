import type { Metadata } from "next";
import { VistaEntrenar } from "@/components/vistas/VistaEntrenar";

export const metadata: Metadata = { title: "Entrenando" };

export default function Pagina() {
  return <VistaEntrenar />;
}
