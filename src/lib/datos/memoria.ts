import { lunesDe, sumarDias } from "../fechas";
import { DIAS } from "../plan";
import type { Ajustes, PesoCorporal, Serie, Sesion } from "../tipos";
import { ErrorDeDatos, type Repositorio } from "./repositorio";

type Estado = { ajustes: Ajustes; sesiones: Sesion[]; series: Serie[]; pesos: PesoCorporal[] };

/** Repositorio en memoria, para las pruebas y la demo. Copia todo al entrar y al salir, como haría una base. */
export function repositorioEnMemoria(inicial?: Partial<Estado>): Repositorio {
  const estado: Estado = {
    ajustes: { inicioPlan: null, sonido: true },
    sesiones: [],
    series: [],
    pesos: [],
    ...structuredClone(inicial ?? {}),
  };
  const copia = <T>(x: T): T => structuredClone(x);

  return {
    async ajustes() {
      return copia(estado.ajustes);
    },
    async guardarAjustes(cambios) {
      estado.ajustes = { ...estado.ajustes, ...cambios };
    },
    async sesiones() {
      return copia([...estado.sesiones].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.inicio.localeCompare(a.inicio)));
    },
    async series() {
      return copia(estado.series);
    },
    async guardarSesion(s) {
      if (estado.sesiones.some((x) => x.id === s.id)) return;
      if (s.estado === "en_curso" && estado.sesiones.some((x) => x.estado === "en_curso")) {
        throw new ErrorDeDatos("Ya hay una sesión en curso", "23505");
      }
      estado.sesiones.push(copia(s));
    },
    async actualizarSesion(id, cambios) {
      estado.sesiones = estado.sesiones.map((s) => (s.id === id ? { ...s, ...cambios } : s));
    },
    async borrarSesion(id) {
      estado.sesiones = estado.sesiones.filter((s) => s.id !== id);
      estado.series = estado.series.filter((s) => s.sesionId !== id);
    },
    async guardarSerie(serie) {
      const i = estado.series.findIndex((s) => s.id === serie.id);
      if (i === -1) estado.series.push(copia(serie));
      else estado.series[i] = copia(serie);
    },
    async borrarSerie(id) {
      estado.series = estado.series.filter((s) => s.id !== id);
    },
    async pesos() {
      return copia([...estado.pesos].sort((a, b) => a.fecha.localeCompare(b.fecha)));
    },
    async guardarPeso(p) {
      estado.pesos = [...estado.pesos.filter((x) => x.fecha !== p.fecha), copia(p)];
    },
    async borrarPeso(fecha) {
      estado.pesos = estado.pesos.filter((x) => x.fecha !== fecha);
    },
  };
}

/** Cuatro semanas de entrenamiento inventadas, con progresión, para ver la app con datos. */
export function datosDeMuestra(hoy: string): Estado {
  const inicio = sumarDias(lunesDe(hoy), -28);
  const sesiones: Sesion[] = [];
  const series: Serie[] = [];
  const pesoInicial: Record<string, number> = {};
  const offsets = [0, 2, 4];
  let n = 0;
  for (let semana = 0; semana < 5; semana++) {
    for (let k = 0; k < 3; k++) {
      const fecha = sumarDias(inicio, semana * 7 + offsets[k]);
      if (fecha >= hoy) continue;
      const d = DIAS[k];
      n += 1;
      const id = `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
      sesiones.push({
        id,
        dia: d.clave,
        fecha,
        inicio: `${fecha}T21:10:00.000Z`,
        fin: `${fecha}T22:15:00.000Z`,
        estado: "completada",
        semana: semana + 1,
        notas: "",
      });
      d.ejercicios.forEach((e, orden) => {
        pesoInicial[e.clave] ??= e.repsMin <= 6 ? 50 : e.repsMin >= 12 ? 8 : 25;
        const base = pesoInicial[e.clave];
        const subidas = Math.floor(semana / 2);
        const kg = base + subidas * (base >= 20 ? 2.5 : 1);
        for (let numero = 1; numero <= e.series; numero++) {
          const reps = Math.min(e.repsMax, e.repsMin + 2 * (semana % 2) + (numero === e.series ? 0 : 1));
          series.push({ id: `${id}-${orden}-${numero}`, sesionId: id, ejercicio: e.clave, ejercicioNombre: e.nombre, orden, numero, kg, reps, hecha: true });
        }
      });
    }
  }
  const pesos: PesoCorporal[] = Array.from({ length: 8 }, (_, i) => ({
    fecha: sumarDias(inicio, i * 4),
    kg: Math.round((76 + i * 0.25 + (i % 2) * 0.2) * 10) / 10,
  }));
  return { ajustes: { inicioPlan: inicio, sonido: true }, sesiones, series, pesos };
}
