/**
 * El plan de hipertrofia de 12 semanas, tal como está en el PDF del usuario.
 * Vive en el código porque es fijo: las sesiones guardan la clave del ejercicio y
 * una copia de su nombre, así el historial no cambia si el plan se edita algún día.
 */

export type ClaveDia = "A" | "B" | "C";

export type EjercicioDelPlan = {
  /** Identificador estable. El mismo ejercicio en distintos días comparte clave, así su progreso es uno solo. */
  clave: string;
  nombre: string;
  series: number;
  repsMin: number;
  repsMax: number;
  /** Descanso sugerido, en segundos. El temporizador arranca con `descanso`. */
  descanso: number;
  descansoMax: number;
  enfoque: string;
  /** "por pierna", por ejemplo. */
  aclaracion?: string;
};

export type DiaDelPlan = {
  clave: ClaveDia;
  titulo: string;
  enfoque: string;
  prioridad: string;
  ejercicios: EjercicioDelPlan[];
};

export type Fase = {
  desde: number;
  hasta: number;
  objetivo: string;
  indicaciones: string;
};

const min = (m: number) => m * 60;

export const DIAS: DiaDelPlan[] = [
  {
    clave: "A",
    titulo: "Pecho y tríceps",
    enfoque: "Pecho pesado y tríceps",
    prioridad: "Pecho y trabajo fuerte de tríceps.",
    ejercicios: [
      {
        clave: "press-banca-plano",
        nombre: "Press de banca plano",
        series: 3,
        repsMin: 6,
        repsMax: 10,
        descanso: min(2),
        descansoMax: min(3),
        enfoque: "Pecho, tríceps y deltoides anterior.",
      },
      {
        clave: "press-inclinado-mancuernas",
        nombre: "Press inclinado con mancuernas",
        series: 3,
        repsMin: 8,
        repsMax: 12,
        descanso: min(2),
        descansoMax: min(2),
        enfoque: "Énfasis en la región superior del pectoral.",
      },
      {
        clave: "remo-sentado-polea",
        nombre: "Remo sentado en polea",
        series: 3,
        repsMin: 8,
        repsMax: 12,
        descanso: 90,
        descansoMax: 120,
        enfoque: "Espalda y equilibrio del trabajo de empuje.",
      },
      {
        clave: "extension-triceps-cuerda",
        nombre: "Extensión de tríceps en polea con cuerda",
        series: 3,
        repsMin: 10,
        repsMax: 15,
        descanso: 60,
        descansoMax: 90,
        enfoque: "Extensión controlada, sin balancear el cuerpo.",
      },
      {
        clave: "extension-triceps-cabeza",
        nombre: "Extensión de tríceps por encima de la cabeza",
        series: 2,
        repsMin: 10,
        repsMax: 15,
        descanso: 60,
        descansoMax: 90,
        enfoque: "Trabajo del tríceps en posición alargada.",
      },
      {
        clave: "elevaciones-laterales",
        nombre: "Elevaciones laterales",
        series: 3,
        repsMin: 12,
        repsMax: 20,
        descanso: 60,
        descansoMax: 90,
        enfoque: "Énfasis en deltoides lateral.",
      },
      {
        clave: "prensa-piernas",
        nombre: "Prensa de piernas",
        series: 3,
        repsMin: 8,
        repsMax: 12,
        descanso: min(2),
        descansoMax: min(2),
        enfoque: "Trabajo general de piernas.",
      },
      {
        clave: "curl-biceps-sentado",
        nombre: "Curl de bíceps sentado con mancuernas",
        series: 2,
        repsMin: 10,
        repsMax: 15,
        descanso: 60,
        descansoMax: 90,
        enfoque: "Bíceps con bajada controlada.",
      },
    ],
  },
  {
    clave: "B",
    titulo: "Hombros, brazos y espalda",
    enfoque: "Hombros, espalda y piernas",
    prioridad: "Anchura de hombros y desarrollo equilibrado de los brazos.",
    ejercicios: [
      {
        clave: "press-hombros-sentado",
        nombre: "Press de hombros sentado",
        series: 3,
        repsMin: 6,
        repsMax: 10,
        descanso: min(2),
        descansoMax: min(2),
        enfoque: "Hombros y tríceps; recorrido cómodo.",
      },
      { clave: "jalon-pecho", nombre: "Jalón al pecho", series: 3, repsMin: 8, repsMax: 12, descanso: 90, descansoMax: 120, enfoque: "Dorsales y espalda." },
      {
        clave: "press-pecho-maquina",
        nombre: "Press de pecho en máquina",
        series: 2,
        repsMin: 10,
        repsMax: 12,
        descanso: 90,
        descansoMax: 120,
        enfoque: "Estímulo moderado adicional para pecho.",
      },
      {
        clave: "elevaciones-laterales",
        nombre: "Elevaciones laterales",
        series: 3,
        repsMin: 12,
        repsMax: 20,
        descanso: 60,
        descansoMax: 90,
        enfoque: "Volumen específico para deltoides lateral.",
      },
      {
        clave: "extension-triceps-cabeza-polea",
        nombre: "Extensión de tríceps por encima de la cabeza en polea",
        series: 3,
        repsMin: 10,
        repsMax: 15,
        descanso: 60,
        descansoMax: 90,
        enfoque: "Énfasis en la cabeza larga del tríceps.",
      },
      {
        clave: "aperturas-inversas-maquina",
        nombre: "Aperturas inversas en máquina",
        series: 2,
        repsMin: 12,
        repsMax: 20,
        descanso: 60,
        descansoMax: 90,
        enfoque: "Deltoides posterior y equilibrio del hombro.",
      },
      {
        clave: "curl-femoral-sentado",
        nombre: "Curl femoral sentado",
        series: 3,
        repsMin: 10,
        repsMax: 15,
        descanso: 90,
        descansoMax: 90,
        enfoque: "Isquiotibiales.",
      },
      {
        clave: "curl-martillo-sentado",
        nombre: "Curl martillo sentado",
        series: 3,
        repsMin: 10,
        repsMax: 15,
        descanso: 60,
        descansoMax: 90,
        enfoque: "Bíceps y braquial para grosor del brazo.",
      },
    ],
  },
  {
    clave: "C",
    titulo: "Pecho, tríceps y brazos",
    enfoque: "Segundo estímulo fuerte de pecho y tríceps",
    prioridad: "Segundo estímulo fuerte de pecho y tercera sesión de tríceps.",
    ejercicios: [
      {
        clave: "press-inclinado-barra",
        nombre: "Press inclinado con barra",
        series: 3,
        repsMin: 6,
        repsMax: 10,
        descanso: min(2),
        descansoMax: min(3),
        enfoque: "Principal movimiento de empuje de la sesión.",
      },
      {
        clave: "aperturas-maquina-poleas",
        nombre: "Aperturas en máquina o poleas",
        series: 2,
        repsMin: 12,
        repsMax: 15,
        descanso: 60,
        descansoMax: 90,
        enfoque: "Complemento de los presses; recorrido cómodo.",
      },
      {
        clave: "remo-sentado-neutro",
        nombre: "Remo sentado con agarre neutro",
        series: 3,
        repsMin: 8,
        repsMax: 12,
        descanso: 90,
        descansoMax: 120,
        enfoque: "Espalda y control escapular.",
      },
      {
        clave: "extension-triceps-cuerda",
        nombre: "Extensión de tríceps con cuerda",
        series: 3,
        repsMin: 10,
        repsMax: 15,
        descanso: 60,
        descansoMax: 90,
        enfoque: "Trabajo directo con técnica controlada.",
      },
      {
        clave: "press-banca-cerrado",
        nombre: "Press de banca con agarre cerrado",
        series: 2,
        repsMin: 8,
        repsMax: 10,
        descanso: min(2),
        descansoMax: min(2),
        enfoque: "Pecho y tríceps; agarre cómodo.",
      },
      {
        clave: "elevaciones-laterales",
        nombre: "Elevaciones laterales",
        series: 2,
        repsMin: 15,
        repsMax: 20,
        descanso: 60,
        descansoMax: 90,
        enfoque: "Tercer estímulo semanal de hombros.",
      },
      {
        clave: "curl-biceps-sentado",
        nombre: "Curl de bíceps sentado",
        series: 2,
        repsMin: 10,
        repsMax: 15,
        descanso: 60,
        descansoMax: 90,
        enfoque: "Volumen adicional de bíceps.",
      },
      {
        clave: "sentadilla-bulgara",
        nombre: "Sentadilla búlgara",
        series: 2,
        repsMin: 8,
        repsMax: 12,
        descanso: 90,
        descansoMax: 120,
        enfoque: "Piernas y estabilidad unilateral.",
        aclaracion: "por pierna",
      },
    ],
  },
];

export const FASES: Fase[] = [
  {
    desde: 1,
    hasta: 3,
    objetivo: "Adaptación y técnica",
    indicaciones: "Elegí cargas que te dejen terminar con 2–3 repeticiones en reserva. Priorizá la técnica y la ejecución consistente.",
  },
  {
    desde: 4,
    hasta: 4,
    objetivo: "Descarga si hace falta",
    indicaciones: "Si hay fatiga acumulada o molestias, reducí las series un 30–40 % y evitá acercarte al fallo. No es obligatoria si recuperás bien.",
  },
  {
    desde: 5,
    hasta: 7,
    objetivo: "Progresión",
    indicaciones: "Sumá repeticiones con la misma carga. Mantené 1–2 repeticiones en reserva en la mayoría de las series.",
  },
  { desde: 8, hasta: 8, objetivo: "Revisión de fatiga", indicaciones: "Evaluá rendimiento, sueño y articulaciones; descargá si lo necesitás." },
  {
    desde: 9,
    hasta: 11,
    objetivo: "Bloque de crecimiento",
    indicaciones: "Seguí progresando en cargas o repeticiones. Acercate al fallo principalmente en ejercicios de aislamiento.",
  },
  {
    desde: 12,
    hasta: 12,
    objetivo: "Evaluación",
    indicaciones: "Compará fotos, perímetros y rendimiento con la primera semana. No hace falta probar máximos.",
  },
];

export const SEMANAS_DEL_PLAN = 12;
export const SESIONES_POR_SEMANA = 3;

export const OBJETIVO = "Priorizar el crecimiento de tríceps, hombros y pectorales, manteniendo un desarrollo equilibrado de espalda, bíceps y piernas.";

export const REGLA_DOBLE_PROGRESION =
  "Empezá con una carga que te permita hacer el extremo bajo del rango con buena técnica. Sumá repeticiones de a poco. Cuando completes el extremo alto en todas las series, subí un poco el peso y volvé al extremo bajo.";

export const CONSEJOS = [
  "Hacé series de calentamiento antes de los ejercicios principales; las series del plan son efectivas y no las incluyen.",
  "Controlá la bajada, usá un recorrido cómodo y no sacrifiques técnica por más peso.",
  "Pará o cambiá cualquier ejercicio que te dé dolor articular.",
  "Dejá al menos un día de descanso entre sesiones cuando puedas.",
  "Proteína: 1,6–2,2 g por kg de peso corporal al día.",
  "Calorías: superávit moderado de 200–300 kcal diarias; ajustá según el promedio semanal de peso.",
  "Sueño: apuntá a 8–9 horas por noche.",
];

export function dia(clave: ClaveDia): DiaDelPlan {
  return DIAS.find((d) => d.clave === clave)!;
}

export function esDia(valor: string): valor is ClaveDia {
  return valor === "A" || valor === "B" || valor === "C";
}

/** Todos los ejercicios distintos del plan, en el orden en que aparecen por primera vez. */
export function ejerciciosDelPlan(): { clave: string; nombre: string; dias: ClaveDia[] }[] {
  const vistos = new Map<string, { clave: string; nombre: string; dias: ClaveDia[] }>();
  for (const d of DIAS) {
    for (const e of d.ejercicios) {
      const previo = vistos.get(e.clave);
      if (previo) previo.dias.push(d.clave);
      else vistos.set(e.clave, { clave: e.clave, nombre: e.nombre, dias: [d.clave] });
    }
  }
  return [...vistos.values()];
}

export function faseDeSemana(semana: number): Fase | null {
  return FASES.find((f) => semana >= f.desde && semana <= f.hasta) ?? null;
}

/** Qué día toca después del último completado: A → B → C → A. Sin historial, arranca por A. */
export function diaQueSigue(ultimo: ClaveDia | null): ClaveDia {
  if (ultimo === "A") return "B";
  if (ultimo === "B") return "C";
  return "A";
}

/** "2 min", "90–120 s", "2–3 min". */
export function textoDescanso(e: Pick<EjercicioDelPlan, "descanso" | "descansoMax">): string {
  const enMin = (s: number) => (s % 60 === 0 && s >= 120 ? s / 60 : null);
  const a = enMin(e.descanso);
  const b = enMin(e.descansoMax);
  if (a !== null && b !== null) return a === b ? `${a} min` : `${a}–${b} min`;
  return e.descanso === e.descansoMax ? `${e.descanso} s` : `${e.descanso}–${e.descansoMax} s`;
}

/** "3 × 8–12", "2 × 8–12 por pierna". */
export function textoSeries(e: Pick<EjercicioDelPlan, "series" | "repsMin" | "repsMax" | "aclaracion">): string {
  const reps = e.repsMin === e.repsMax ? `${e.repsMin}` : `${e.repsMin}–${e.repsMax}`;
  return `${e.series} × ${reps}${e.aclaracion ? ` ${e.aclaracion}` : ""}`;
}

/** Clave para un ejercicio agregado a mano: el nombre en minúsculas, sin tildes y con guiones. */
export function claveDeNombre(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
