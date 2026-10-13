"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/datos/cliente";
import { datosDeMuestra, repositorioEnMemoria } from "@/lib/datos/memoria";
import type { Repositorio } from "@/lib/datos/repositorio";
import { repositorioSupabase } from "@/lib/datos/supabase";
import { ProveedorDescanso } from "@/lib/descanso";
import { hoyEn } from "@/lib/fechas";
import { ProveedorGym, useGym } from "@/lib/gym";
import { Pesa } from "./iconos";
import { Ingreso } from "./Ingreso";
import { Marco } from "./Marco";
import { Boton } from "./ui";

type Estado = { paso: "cargando" } | { paso: "sin_sesion" } | { paso: "lista"; clave: string; repo: Repositorio; salir?: () => void };

/** Solo en desarrollo: /demo deja esta marca y la app usa datos de muestra en memoria. */
export const MARCA_DEMO = "gym-demo";

function modoDemo(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  try {
    return sessionStorage.getItem(MARCA_DEMO) === "1";
  } catch {
    return false;
  }
}

export function Espera() {
  return (
    <main className="grid min-h-dvh place-items-center" aria-busy="true" aria-label="Cargando">
      <span className="grid size-14 animate-pulse place-items-center rounded-2xl bg-acento text-sobre-acento">
        <Pesa className="size-8" />
      </span>
    </main>
  );
}

/** Decide qué mostrar: la espera, la entrada, o la app con la sesión iniciada. Vive en el layout: no se rearma al navegar. */
export function Aplicacion({ children }: { children: React.ReactNode }) {
  const ruta = usePathname();
  const [estado, setEstado] = useState<Estado>({ paso: "cargando" });

  useEffect(() => {
    if (modoDemo()) {
      // La marca de demo solo existe en el navegador: no se puede decidir antes de hidratar.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEstado({ paso: "lista", clave: "demo", repo: repositorioEnMemoria(datosDeMuestra(hoyEn())) });
      return;
    }
    const db = supabase();
    const { data } = db.auth.onAuthStateChange((_evento, sesion) => {
      const usuarioId = sesion?.user.id;
      setEstado((previo) => {
        if (!usuarioId) return { paso: "sin_sesion" };
        if (previo.paso === "lista" && previo.clave === usuarioId) return previo;
        return { paso: "lista", clave: usuarioId, repo: repositorioSupabase(db, usuarioId), salir: () => void db.auth.signOut() };
      });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (ruta === "/demo") return children;
  if (estado.paso === "cargando") return <Espera />;
  if (estado.paso === "sin_sesion") return <Ingreso />;
  return (
    <ProveedorGym key={estado.clave} repo={estado.repo} salir={estado.salir}>
      <ConDatos>{children}</ConDatos>
    </ProveedorGym>
  );
}

function ConDatos({ children }: { children: React.ReactNode }) {
  const { carga, acciones } = useGym();
  if (carga.estado === "cargando") return <Espera />;
  if (carga.estado === "error") {
    return (
      <main className="grid min-h-dvh place-items-center px-5">
        <div className="cristal grid max-w-sm gap-4 rounded-[28px] p-6 text-center">
          <p className="text-[17px] font-semibold">No se pudo cargar</p>
          <p role="alert" className="text-[15px] text-tinta-suave">
            {carga.mensaje}
          </p>
          <Boton onClick={acciones.recargar}>Reintentar</Boton>
        </div>
      </main>
    );
  }
  return (
    <ProveedorDescanso sonido={carga.ajustes.sonido}>
      <Marco>{children}</Marco>
    </ProveedorDescanso>
  );
}
