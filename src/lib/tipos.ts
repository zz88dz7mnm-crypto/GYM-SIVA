import type { ClaveDia } from "./plan";

/** Una sesión arranca "en curso" y termina completada o cancelada. Las canceladas no cuentan en las métricas. */
export type EstadoSesion = "en_curso" | "completada" | "cancelada";

export type Sesion = {
  id: string;
  /** "libre" es un entrenamiento fuera del plan. */
  dia: ClaveDia | "libre";
  /** Día local (Argentina) en que se entrenó, AAAA-MM-DD. */
  fecha: string;
  inicio: string;
  fin: string | null;
  estado: EstadoSesion;
  /** Semana del plan en la que cayó, si el plan tenía fecha de inicio. */
  semana: number | null;
  notas: string;
};

export type Serie = {
  id: string;
  sesionId: string;
  /** Clave del ejercicio: une el progreso del mismo ejercicio entre días. */
  ejercicio: string;
  /** Copia del nombre al momento de entrenar. */
  ejercicioNombre: string;
  /** Posición del ejercicio dentro de la sesión. */
  orden: number;
  /** Número de serie dentro del ejercicio, desde 1. */
  numero: number;
  kg: number | null;
  reps: number | null;
  /** Solo las series hechas cuentan para las métricas. */
  hecha: boolean;
};

export type Ajustes = {
  /** Lunes en que arrancó el plan de 12 semanas. Sin fecha, no se calcula la semana. */
  inicioPlan: string | null;
  sonido: boolean;
};

export type PesoCorporal = { fecha: string; kg: number };
