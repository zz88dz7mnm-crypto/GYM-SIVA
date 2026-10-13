import type { Metadata } from "next";
import { VistaPlan } from "@/components/vistas/VistaPlan";

export const metadata: Metadata = { title: "Plan" };

export default function Pagina() {
  return <VistaPlan />;
}
