import { notFound } from "next/navigation";
import { EntrarDemo } from "@/components/EntrarDemo";

/** Solo en desarrollo: abre la app con datos de muestra en memoria, sin iniciar sesión ni tocar la base. */
export default function PaginaDemo() {
  if (process.env.NODE_ENV === "production") notFound();
  return <EntrarDemo />;
}
