import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { esDia } from "../plan";
import type { Ajustes, PesoCorporal, Serie, Sesion } from "../tipos";
import { ErrorDeDatos, type CambiosSesion, type Repositorio } from "./repositorio";

type FilaSesion = {
  id: string;
  dia: string;
  fecha: string;
  inicio: string;
  fin: string | null;
  estado: Sesion["estado"];
  semana: number | null;
  notas: string;
};

type FilaSerie = {
  id: string;
  sesion_id: string;
  ejercicio: string;
  ejercicio_nombre: string;
  orden: number;
  numero: number;
  kg: number | string | null;
  reps: number | null;
  hecha: boolean;
};

const COLUMNAS_SESION = "id, dia, fecha, inicio, fin, estado, semana, notas";
const COLUMNAS_SERIE = "id, sesion_id, ejercicio, ejercicio_nombre, orden, numero, kg, reps, hecha";
const FILAS_POR_PAGINA = 1000;

const aSesion = (f: FilaSesion): Sesion => ({
  id: f.id,
  dia: esDia(f.dia) ? f.dia : "libre",
  fecha: f.fecha,
  inicio: f.inicio,
  fin: f.fin,
  estado: f.estado,
  semana: f.semana,
  notas: f.notas,
});

// Postgres devuelve los numeric como texto.
const aSerie = (f: FilaSerie): Serie => ({
  id: f.id,
  sesionId: f.sesion_id,
  ejercicio: f.ejercicio,
  ejercicioNombre: f.ejercicio_nombre,
  orden: f.orden,
  numero: f.numero,
  kg: f.kg === null ? null : Number(f.kg),
  reps: f.reps,
  hecha: f.hecha,
});

function fallar(error: PostgrestError | null): void {
  if (error) throw new ErrorDeDatos(error.message, error.code);
}

export function repositorioSupabase(db: SupabaseClient, usuarioId: string): Repositorio {
  /** Trae todas las filas de a páginas: Supabase corta en 1000 por consulta. */
  async function todas<T>(consulta: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>): Promise<T[]> {
    const filas: T[] = [];
    for (let pagina = 0; ; pagina++) {
      const { data, error } = await consulta(pagina * FILAS_POR_PAGINA, (pagina + 1) * FILAS_POR_PAGINA - 1);
      fallar(error);
      filas.push(...(data ?? []));
      if ((data?.length ?? 0) < FILAS_POR_PAGINA) return filas;
    }
  }

  return {
    async ajustes() {
      const { data, error } = await db.from("gym_ajustes").select("inicio_plan, sonido").eq("usuario_id", usuarioId).maybeSingle();
      fallar(error);
      if (data) return { inicioPlan: data.inicio_plan, sonido: data.sonido };
      const inicial: Ajustes = { inicioPlan: null, sonido: true };
      const { error: alta } = await db
        .from("gym_ajustes")
        .upsert({ usuario_id: usuarioId, inicio_plan: null, sonido: true }, { onConflict: "usuario_id", ignoreDuplicates: true });
      fallar(alta);
      return inicial;
    },

    async guardarAjustes(cambios) {
      const fila: Record<string, unknown> = { usuario_id: usuarioId };
      if ("inicioPlan" in cambios) fila.inicio_plan = cambios.inicioPlan;
      if ("sonido" in cambios) fila.sonido = cambios.sonido;
      const { error } = await db.from("gym_ajustes").upsert(fila, { onConflict: "usuario_id" });
      fallar(error);
    },

    async sesiones() {
      const filas = await todas<FilaSesion>((desde, hasta) =>
        db
          .from("gym_sesiones")
          .select(COLUMNAS_SESION)
          .eq("usuario_id", usuarioId)
          .order("fecha", { ascending: false })
          .order("inicio", { ascending: false })
          .range(desde, hasta),
      );
      return filas.map(aSesion);
    },

    async series() {
      const filas = await todas<FilaSerie>((desde, hasta) =>
        db.from("gym_series").select(COLUMNAS_SERIE).eq("usuario_id", usuarioId).order("id").range(desde, hasta),
      );
      return filas.map(aSerie);
    },

    async guardarSesion(s) {
      const { error } = await db
        .from("gym_sesiones")
        .upsert(
          { id: s.id, usuario_id: usuarioId, dia: s.dia, fecha: s.fecha, inicio: s.inicio, fin: s.fin, estado: s.estado, semana: s.semana, notas: s.notas },
          { onConflict: "id", ignoreDuplicates: true },
        );
      fallar(error);
    },

    async actualizarSesion(id, cambios: CambiosSesion) {
      const { error } = await db.from("gym_sesiones").update(cambios).eq("id", id).eq("usuario_id", usuarioId);
      fallar(error);
    },

    async borrarSesion(id) {
      const { error } = await db.from("gym_sesiones").delete().eq("id", id).eq("usuario_id", usuarioId);
      fallar(error);
    },

    async guardarSerie(s) {
      const { error } = await db.from("gym_series").upsert(
        {
          id: s.id,
          usuario_id: usuarioId,
          sesion_id: s.sesionId,
          ejercicio: s.ejercicio,
          ejercicio_nombre: s.ejercicioNombre,
          orden: s.orden,
          numero: s.numero,
          kg: s.kg,
          reps: s.reps,
          hecha: s.hecha,
        },
        { onConflict: "id" },
      );
      fallar(error);
    },

    async borrarSerie(id) {
      const { error } = await db.from("gym_series").delete().eq("id", id).eq("usuario_id", usuarioId);
      fallar(error);
    },

    async pesos() {
      const filas = await todas<{ fecha: string; kg: number | string }>((desde, hasta) =>
        db.from("gym_peso_corporal").select("fecha, kg").eq("usuario_id", usuarioId).order("fecha").range(desde, hasta),
      );
      return filas.map((f): PesoCorporal => ({ fecha: f.fecha, kg: Number(f.kg) }));
    },

    async guardarPeso(p) {
      const { error } = await db.from("gym_peso_corporal").upsert({ usuario_id: usuarioId, fecha: p.fecha, kg: p.kg }, { onConflict: "usuario_id,fecha" });
      fallar(error);
    },

    async borrarPeso(fecha) {
      const { error } = await db.from("gym_peso_corporal").delete().eq("usuario_id", usuarioId).eq("fecha", fecha);
      fallar(error);
    },
  };
}
