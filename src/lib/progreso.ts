/**
 * Las cuentas de GYM. Código puro: recibe sesiones y series, devuelve números.
 * Solo cuentan las series hechas de sesiones completadas, salvo que se diga otra cosa.
 */
import { lunesDe, sumarDias } from "./fechas";
import type { EjercicioDelPlan } from "./plan";
import type { Serie, Sesion } from "./tipos";

export type SerieValida = Serie & { kg: number; reps: number };

export function esValida(s: Serie): s is SerieValida {
  return s.hecha && s.kg !== null && s.reps !== null && s.kg >= 0 && s.reps > 0;
}

/** Máximo estimado a una repetición (fórmula de Epley). Con 1 repetición, es el peso mismo. */
export function maximoEstimado(kg: number, reps: number): number {
  return reps <= 1 ? kg : kg * (1 + reps / 30);
}

export function volumen(series: Serie[]): number {
  return series.filter(esValida).reduce((total, s) => total + s.kg * s.reps, 0);
}

/** Redondea a un decimal, para no arrastrar ruido de coma flotante. */
const r1 = (n: number) => Math.round(n * 10) / 10;

export type PuntoDeEjercicio = {
  sesionId: string;
  fecha: string;
  /** El peso más alto que se movió en la sesión. */
  pesoMax: number;
  /** Las repeticiones de la mejor serie con ese peso. */
  repsConPesoMax: number;
  maximoEstimado: number;
  volumen: number;
  series: number;
};

/** Un punto por sesión completada en la que se hizo ese ejercicio, de la más vieja a la más nueva. */
export function historiaDeEjercicio(sesiones: Sesion[], series: Serie[], clave: string): PuntoDeEjercicio[] {
  const porSesion = new Map<string, SerieValida[]>();
  for (const s of series) {
    if (s.ejercicio !== clave || !esValida(s)) continue;
    const lista = porSesion.get(s.sesionId) ?? [];
    lista.push(s);
    porSesion.set(s.sesionId, lista);
  }
  const puntos: { punto: PuntoDeEjercicio; inicio: string }[] = [];
  for (const sesion of sesiones) {
    const lista = porSesion.get(sesion.id);
    if (sesion.estado !== "completada" || !lista?.length) continue;
    const pesoMax = Math.max(...lista.map((s) => s.kg));
    puntos.push({
      inicio: sesion.inicio,
      punto: {
        sesionId: sesion.id,
        fecha: sesion.fecha,
        pesoMax,
        repsConPesoMax: Math.max(...lista.filter((s) => s.kg === pesoMax).map((s) => s.reps)),
        maximoEstimado: r1(Math.max(...lista.map((s) => maximoEstimado(s.kg, s.reps)))),
        volumen: r1(volumen(lista)),
        series: lista.length,
      },
    });
  }
  puntos.sort((a, b) => a.punto.fecha.localeCompare(b.punto.fecha) || a.inicio.localeCompare(b.inicio));
  return puntos.map((p) => p.punto);
}

export type Sugerencia = { tipo: "primera"; texto: string } | { tipo: "subir" | "mantener"; kg: number; texto: string; ultima: { kg: number; reps: number }[] };

/** Cuánto subir cuando se completa el rango: 2,5 kg con barra o máquina pesada, 1 kg en lo liviano. */
export function incremento(kg: number): number {
  return kg >= 20 ? 2.5 : 1;
}

/**
 * Doble progresión, como dice el plan: con el mismo peso se suman repeticiones;
 * cuando todas las series llegan al tope del rango, se sube el peso.
 * `ultimas` son las series de la última sesión completada con ese ejercicio.
 */
export function sugerencia(ejercicio: Pick<EjercicioDelPlan, "series" | "repsMin" | "repsMax">, ultimas: Serie[]): Sugerencia {
  const hechas = ultimas.filter(esValida).sort((a, b) => a.numero - b.numero);
  if (hechas.length === 0) {
    return {
      tipo: "primera",
      texto: `Primera vez: elegí un peso que te deje hacer ${ejercicio.repsMin}–${ejercicio.repsMax} repeticiones con 2–3 en reserva.`,
    };
  }
  const ultima = hechas.map((s) => ({ kg: s.kg, reps: s.reps }));
  const pesoMax = Math.max(...hechas.map((s) => s.kg));
  const conPesoMax = hechas.filter((s) => s.kg === pesoMax);
  const completo = conPesoMax.length >= ejercicio.series && conPesoMax.every((s) => s.reps >= ejercicio.repsMax);
  if (completo) {
    const kg = r1(pesoMax + incremento(pesoMax));
    return {
      tipo: "subir",
      kg,
      ultima,
      texto: `Llegaste a ${ejercicio.repsMax} en todas las series: subí a ${formatoKg(kg)} y volvé a ${ejercicio.repsMin} repeticiones.`,
    };
  }
  return {
    tipo: "mantener",
    kg: pesoMax,
    ultima,
    texto: `Mantené ${formatoKg(pesoMax)} y buscá sumar repeticiones hasta llegar a ${ejercicio.repsMax} en todas las series.`,
  };
}

/** Las series de la última sesión completada (anterior a `antesDe`, si se da) que tuvo ese ejercicio. */
export function ultimasSeries(sesiones: Sesion[], series: Serie[], clave: string, antesDe?: string): Serie[] {
  const candidatas = sesiones
    .filter((s) => s.estado === "completada" && s.id !== antesDe)
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.inicio.localeCompare(a.inicio));
  for (const sesion of candidatas) {
    const propias = series.filter((s) => s.sesionId === sesion.id && s.ejercicio === clave && esValida(s));
    if (propias.length) return propias;
  }
  return [];
}

export type Semana = { lunes: string; sesiones: number; volumen: number };

/** Las últimas `cuantas` semanas (lunes a domingo) hasta la de `hoy`, con sesiones completadas y volumen. */
export function semanas(sesiones: Sesion[], series: Serie[], hoy: string, cuantas: number): Semana[] {
  const actual = lunesDe(hoy);
  const lista: Semana[] = Array.from({ length: cuantas }, (_, i) => ({
    lunes: sumarDias(actual, -7 * (cuantas - 1 - i)),
    sesiones: 0,
    volumen: 0,
  }));
  const indice = new Map(lista.map((s, i) => [s.lunes, i]));
  const semanaDeSesion = new Map<string, number>();
  for (const sesion of sesiones) {
    if (sesion.estado !== "completada") continue;
    const i = indice.get(lunesDe(sesion.fecha));
    if (i === undefined) continue;
    lista[i].sesiones += 1;
    semanaDeSesion.set(sesion.id, i);
  }
  for (const s of series) {
    const i = semanaDeSesion.get(s.sesionId);
    if (i !== undefined && esValida(s)) lista[i].volumen += s.kg * s.reps;
  }
  return lista.map((s) => ({ ...s, volumen: r1(s.volumen) }));
}

export type Marca = { ejercicio: string; nombre: string; kg: number; reps: number; anterior: number | null };

/**
 * Los ejercicios en los que esta sesión movió más peso que en cualquier sesión completada anterior.
 * La primera vez que se hace un ejercicio no es récord: no hay contra qué comparar.
 */
export function marcasDeSesion(sesion: Sesion, sesiones: Sesion[], series: Serie[]): Marca[] {
  const anteriores = new Set(
    sesiones
      .filter((s) => s.estado === "completada" && s.id !== sesion.id && (s.fecha < sesion.fecha || (s.fecha === sesion.fecha && s.inicio < sesion.inicio)))
      .map((s) => s.id),
  );
  const mejorPrevio = new Map<string, number>();
  for (const s of series) {
    if (!anteriores.has(s.sesionId) || !esValida(s)) continue;
    mejorPrevio.set(s.ejercicio, Math.max(mejorPrevio.get(s.ejercicio) ?? 0, s.kg));
  }
  const propias = new Map<string, SerieValida>();
  for (const s of series) {
    if (s.sesionId !== sesion.id || !esValida(s)) continue;
    const previa = propias.get(s.ejercicio);
    if (!previa || s.kg > previa.kg || (s.kg === previa.kg && s.reps > previa.reps)) propias.set(s.ejercicio, s);
  }
  const marcas: Marca[] = [];
  for (const [ejercicio, mejor] of propias) {
    const previo = mejorPrevio.get(ejercicio);
    if (previo !== undefined && mejor.kg > previo) {
      marcas.push({ ejercicio, nombre: mejor.ejercicioNombre, kg: mejor.kg, reps: mejor.reps, anterior: previo });
    }
  }
  return marcas;
}

/** "62,5 kg", "60 kg". */
export function formatoKg(kg: number): string {
  return `${kg.toLocaleString("es-AR", { maximumFractionDigits: 2 })} kg`;
}

/** Volumen grande abreviado: "12.450 kg", "1,2 t". */
export function formatoVolumen(kg: number): string {
  if (kg >= 10_000) return `${(kg / 1000).toLocaleString("es-AR", { maximumFractionDigits: 1 })} t`;
  return `${Math.round(kg).toLocaleString("es-AR")} kg`;
}

/** Interpreta lo que se escribe en el campo de peso: acepta coma o punto. Vacío o inválido da null. */
export function leerNumero(texto: string): number | null {
  const limpio = texto.trim().replace(",", ".");
  if (!limpio) return null;
  const n = Number(limpio);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
