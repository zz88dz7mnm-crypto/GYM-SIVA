"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ErrorDeDatos, type CambiosSesion, type Repositorio } from "./datos/repositorio";
import { hoyEn, semanaDelPlan } from "./fechas";
import type { ClaveDia } from "./plan";
import type { Ajustes, PesoCorporal, Serie, Sesion } from "./tipos";

type Datos = { ajustes: Ajustes; sesiones: Sesion[]; series: Serie[]; pesos: PesoCorporal[] };

export type Carga = { estado: "cargando" } | { estado: "error"; mensaje: string } | ({ estado: "lista" } & Datos);

type Acciones = {
  hoy: string;
  /** Guardados que fallaron y esperan reintento. */
  pendientes: number;
  reintentar(): void;
  recargar(): void;
  salir?: () => void;
  iniciarSesion(dia: ClaveDia | "libre"): Promise<Sesion>;
  guardarSerie(serie: Serie): void;
  borrarSerie(id: string): void;
  actualizarSesion(id: string, cambios: CambiosSesion): void;
  terminarSesion(id: string): void;
  borrarSesion(id: string): Promise<void>;
  guardarPeso(peso: PesoCorporal): void;
  borrarPeso(fecha: string): void;
  guardarAjustes(cambios: Partial<Ajustes>): void;
};

const Contexto = createContext<{ carga: Carga; acciones: Acciones } | null>(null);

function mensajeDeError(fallo: unknown): string {
  if (fallo instanceof ErrorDeDatos && fallo.baseDesactualizada) {
    return "Falta preparar la base de datos: pegá el archivo supabase/schema.sql en el SQL Editor de Supabase y recargá.";
  }
  return "No pude traer tus entrenamientos. Revisá la conexión y probá de nuevo.";
}

const nuevoId = () => crypto.randomUUID();

export function ProveedorGym({ repo, salir, children }: { repo: Repositorio; salir?: () => void; children: React.ReactNode }) {
  const [carga, setCarga] = useState<Carga>({ estado: "cargando" });
  const [hoy, setHoy] = useState(() => hoyEn());
  const [version, setVersion] = useState(0);
  // Cada guardado fallido queda acá, con la clave del recurso: el último intento reemplaza a los anteriores.
  const fallidos = useRef(new Map<string, () => Promise<void>>());
  const [pendientes, setPendientes] = useState(0);

  useEffect(() => {
    let vigente = true;
    Promise.all([repo.ajustes(), repo.sesiones(), repo.series(), repo.pesos()])
      .then(([ajustes, sesiones, series, pesos]) => vigente && setCarga({ estado: "lista", ajustes, sesiones, series, pesos }))
      .catch((fallo) => vigente && setCarga({ estado: "error", mensaje: mensajeDeError(fallo) }));
    return () => {
      vigente = false;
    };
  }, [repo, version]);

  // El día cambia a medianoche aunque la app quede abierta.
  useEffect(() => {
    const id = setInterval(() => setHoy(hoyEn()), 60_000);
    return () => clearInterval(id);
  }, []);

  const cambiar = useCallback((f: (d: Datos) => Datos) => {
    setCarga((c) => (c.estado === "lista" ? { estado: "lista", ...f(c) } : c));
  }, []);

  /** Ejecuta un guardado. Si falla, lo deja anotado para reintentar; la pantalla ya muestra el cambio. */
  const persistir = useCallback((clave: string, operacion: () => Promise<void>) => {
    fallidos.current.delete(clave);
    setPendientes(fallidos.current.size);
    operacion().catch(() => {
      fallidos.current.set(clave, operacion);
      setPendientes(fallidos.current.size);
    });
  }, []);

  const reintentar = useCallback(() => {
    const lista = [...fallidos.current.entries()];
    fallidos.current.clear();
    setPendientes(0);
    // En orden: primero las sesiones, después sus series.
    const prioridad = (clave: string) => (clave.startsWith("sesion") ? 0 : 1);
    lista.sort(([a], [b]) => prioridad(a) - prioridad(b));
    (async () => {
      for (const [clave, operacion] of lista) {
        try {
          await operacion();
        } catch {
          fallidos.current.set(clave, operacion);
        }
      }
      setPendientes(fallidos.current.size);
    })();
  }, []);

  // Al volver la conexión, reintenta solo.
  useEffect(() => {
    window.addEventListener("online", reintentar);
    return () => window.removeEventListener("online", reintentar);
  }, [reintentar]);

  const acciones = useMemo<Acciones>(
    () => ({
      hoy,
      pendientes,
      reintentar,
      salir,
      recargar: () => {
        setCarga({ estado: "cargando" });
        setVersion((v) => v + 1);
      },

      async iniciarSesion(dia) {
        const inicioPlan = carga.estado === "lista" ? carga.ajustes.inicioPlan : null;
        const sesion: Sesion = {
          id: nuevoId(),
          dia,
          fecha: hoy,
          inicio: new Date().toISOString(),
          fin: null,
          estado: "en_curso",
          semana: inicioPlan ? semanaDelPlan(inicioPlan, hoy) : null,
          notas: "",
        };
        // Este sí se espera: si ya hay una sesión en curso en otro dispositivo, conviene saberlo antes de entrenar.
        await repo.guardarSesion(sesion);
        cambiar((d) => ({ ...d, sesiones: [sesion, ...d.sesiones] }));
        return sesion;
      },

      guardarSerie(serie) {
        cambiar((d) => {
          const existe = d.series.some((s) => s.id === serie.id);
          return { ...d, series: existe ? d.series.map((s) => (s.id === serie.id ? serie : s)) : [...d.series, serie] };
        });
        persistir(`serie:${serie.id}`, () => repo.guardarSerie(serie));
      },

      borrarSerie(id) {
        cambiar((d) => ({ ...d, series: d.series.filter((s) => s.id !== id) }));
        persistir(`serie:${id}`, () => repo.borrarSerie(id));
      },

      actualizarSesion(id, cambios) {
        cambiar((d) => ({ ...d, sesiones: d.sesiones.map((s) => (s.id === id ? { ...s, ...cambios } : s)) }));
        persistir(`sesion:${id}:${Object.keys(cambios).sort().join(",")}`, () => repo.actualizarSesion(id, cambios));
      },

      terminarSesion(id) {
        const cambios: CambiosSesion = { estado: "completada", fin: new Date().toISOString() };
        cambiar((d) => ({ ...d, sesiones: d.sesiones.map((s) => (s.id === id ? { ...s, ...cambios } : s)) }));
        persistir(`sesion:${id}:estado`, () => repo.actualizarSesion(id, cambios));
      },

      async borrarSesion(id) {
        await repo.borrarSesion(id);
        for (const clave of fallidos.current.keys()) if (clave.includes(id)) fallidos.current.delete(clave);
        cambiar((d) => {
          const series = d.series.filter((s) => s.sesionId !== id);
          for (const s of d.series) if (s.sesionId === id) fallidos.current.delete(`serie:${s.id}`);
          return { ...d, sesiones: d.sesiones.filter((s) => s.id !== id), series };
        });
        setPendientes(fallidos.current.size);
      },

      guardarPeso(peso) {
        cambiar((d) => ({ ...d, pesos: [...d.pesos.filter((p) => p.fecha !== peso.fecha), peso].sort((a, b) => a.fecha.localeCompare(b.fecha)) }));
        persistir(`peso:${peso.fecha}`, () => repo.guardarPeso(peso));
      },

      borrarPeso(fecha) {
        cambiar((d) => ({ ...d, pesos: d.pesos.filter((p) => p.fecha !== fecha) }));
        persistir(`peso:${fecha}`, () => repo.borrarPeso(fecha));
      },

      guardarAjustes(cambios) {
        cambiar((d) => ({ ...d, ajustes: { ...d.ajustes, ...cambios } }));
        persistir(`ajustes:${Object.keys(cambios).join(",")}`, () => repo.guardarAjustes(cambios));
      },
    }),
    [hoy, pendientes, reintentar, salir, carga, repo, cambiar, persistir],
  );

  return <Contexto.Provider value={{ carga, acciones }}>{children}</Contexto.Provider>;
}

export function useGym() {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useGym fuera de ProveedorGym");
  return valor;
}

/** Para las vistas que solo se muestran con los datos ya cargados. */
export function useDatos(): Datos & Acciones {
  const { carga, acciones } = useGym();
  if (carga.estado !== "lista") throw new Error("Datos todavía no cargados");
  return { ...carga, ...acciones };
}
