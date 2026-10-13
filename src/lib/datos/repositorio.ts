import type { Ajustes, PesoCorporal, Serie, Sesion } from "../tipos";

export type CambiosSesion = Partial<Pick<Sesion, "dia" | "fecha" | "fin" | "estado" | "semana" | "notas">>;

/**
 * Todo lo que GYM guarda o lee. Hay una versión real (Supabase) y otra en memoria.
 * Las altas usan ids generados en la app: repetir un guardado actualiza en vez de duplicar.
 */
export interface Repositorio {
  ajustes(): Promise<Ajustes>;
  guardarAjustes(cambios: Partial<Ajustes>): Promise<void>;

  /** Todas las sesiones, de la más nueva a la más vieja. */
  sesiones(): Promise<Sesion[]>;
  /** Todas las series de todas las sesiones. */
  series(): Promise<Serie[]>;
  /** Crea la sesión, o la deja como está si ya existía con ese id. */
  guardarSesion(sesion: Sesion): Promise<void>;
  actualizarSesion(id: string, cambios: CambiosSesion): Promise<void>;
  /** Borra la sesión y sus series. No se puede deshacer (queda en la auditoría). */
  borrarSesion(id: string): Promise<void>;
  /** Crea o actualiza la serie con ese id. */
  guardarSerie(serie: Serie): Promise<void>;
  borrarSerie(id: string): Promise<void>;

  /** Registros de peso corporal, del más viejo al más nuevo. */
  pesos(): Promise<PesoCorporal[]>;
  /** Uno por día: si ya había un registro ese día, lo reemplaza. */
  guardarPeso(peso: PesoCorporal): Promise<void>;
  borrarPeso(fecha: string): Promise<void>;
}

/** Error de la base, con su código para distinguir los casos que tienen arreglo. */
export class ErrorDeDatos extends Error {
  constructor(
    mensaje: string,
    readonly codigo?: string,
  ) {
    super(mensaje);
  }

  /** La base no tiene una tabla o columna que la app necesita: falta correr el SQL. */
  get baseDesactualizada(): boolean {
    return ["42703", "42P01", "42883", "PGRST202", "PGRST204", "PGRST205"].includes(this.codigo ?? "");
  }

  /** Ya hay otra sesión en curso (puede haberse empezado en otro dispositivo). */
  get yaHayEnCurso(): boolean {
    return this.codigo === "23505";
  }
}
