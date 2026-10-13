import type { Metadata } from "next";
import { VistaPanel } from "@/components/vistas/VistaPanel";

export const metadata: Metadata = { title: "Panel" };

export default function Pagina() {
  return <VistaPanel />;
}
