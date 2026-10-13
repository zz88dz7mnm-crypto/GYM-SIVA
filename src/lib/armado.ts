import { dia, type EjercicioDelPlan } from "./plan";
import type { Serie, Sesion } from "./tipos";

export type EjercicioEnSesion = {
  clave: string;
  nombre: string;
  /** Lo que dice el plan para este ejercicio ese día. Los agregados a mano no tienen. */
  plan: EjercicioDelPlan | null;
  orden: number;
  /** Series ya guardadas, por número. */
  guardadas: Serie[];
};

/**
 * Los ejercicios que se muestran en una sesión: los del plan para ese día (aunque no tengan
 * series todavía) más los agregados a mano, en orden.
 */
export function ejerciciosDeSesion(sesion: Sesion, series: Serie[]): EjercicioEnSesion[] {
  const propias = series.filter((s) => s.sesionId === sesion.id);
  const lista = new Map<string, EjercicioEnSesion>();
  if (sesion.dia !== "libre") {
    dia(sesion.dia).ejercicios.forEach((e, orden) => {
      lista.set(e.clave, { clave: e.clave, nombre: e.nombre, plan: e, orden, guardadas: [] });
    });
  }
  for (const s of propias) {
    let e = lista.get(s.ejercicio);
    if (!e) {
      e = { clave: s.ejercicio, nombre: s.ejercicioNombre, plan: null, orden: s.orden, guardadas: [] };
      lista.set(s.ejercicio, e);
    }
    e.guardadas.push(s);
  }
  for (const e of lista.values()) e.guardadas.sort((a, b) => a.numero - b.numero);
  return [...lista.values()].sort((a, b) => a.orden - b.orden);
}

/** Cuántas filas mostrar: las del plan, o más si se agregaron series. */
export function filasDeEjercicio(e: EjercicioEnSesion, extra = 0): number {
  const maxGuardada = Math.max(0, ...e.guardadas.map((s) => s.numero));
  return Math.max(e.plan?.series ?? 0, maxGuardada) + extra;
}
