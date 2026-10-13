import { describe, expect, it } from "vitest";
import { diasEntre, fechaRelativa, hoyEn, horaEn, lunesDe, semanaDelPlan, sumarDias, duracion } from "./fechas";
import { claveDeNombre, DIAS, dia, diaQueSigue, ejerciciosDelPlan, faseDeSemana, textoDescanso, textoSeries } from "./plan";
import { formatoKg, historiaDeEjercicio, leerNumero, maximoEstimado, marcasDeSesion, semanas, sugerencia, ultimasSeries, volumen } from "./progreso";
import type { Serie, Sesion } from "./tipos";

let n = 0;
function sesion(fecha: string, cambios: Partial<Sesion> = {}): Sesion {
  n += 1;
  return {
    id: `s${n}`,
    dia: "A",
    fecha,
    inicio: `${fecha}T21:00:00.000Z`,
    fin: `${fecha}T22:00:00.000Z`,
    estado: "completada",
    semana: null,
    notas: "",
    ...cambios,
  };
}
function serie(sesionId: string, ejercicio: string, numero: number, kg: number | null, reps: number | null, hecha = true): Serie {
  return { id: `${sesionId}-${ejercicio}-${numero}`, sesionId, ejercicio, ejercicioNombre: ejercicio, orden: 0, numero, kg, reps, hecha };
}

describe("plan", () => {
  it("tiene los tres días con ocho ejercicios cada uno", () => {
    expect(DIAS.map((d) => d.clave)).toEqual(["A", "B", "C"]);
    for (const d of DIAS) expect(d.ejercicios).toHaveLength(8);
  });

  it("une el mismo ejercicio entre días", () => {
    const laterales = ejerciciosDelPlan().find((e) => e.clave === "elevaciones-laterales");
    expect(laterales?.dias).toEqual(["A", "B", "C"]);
    const claves = ejerciciosDelPlan().map((e) => e.clave);
    expect(new Set(claves).size).toBe(claves.length);
  });

  it("rota A → B → C → A", () => {
    expect(diaQueSigue(null)).toBe("A");
    expect(diaQueSigue("A")).toBe("B");
    expect(diaQueSigue("B")).toBe("C");
    expect(diaQueSigue("C")).toBe("A");
  });

  it("escribe series y descansos como el PDF", () => {
    const [banca, inclinado, remo] = dia("A").ejercicios;
    expect(textoSeries(banca)).toBe("3 × 6–10");
    expect(textoDescanso(banca)).toBe("2–3 min");
    expect(textoDescanso(inclinado)).toBe("2 min");
    expect(textoDescanso(remo)).toBe("90–120 s");
    expect(textoSeries(dia("C").ejercicios[7])).toBe("2 × 8–12 por pierna");
  });

  it("ubica la fase de cada semana", () => {
    expect(faseDeSemana(1)?.objetivo).toBe("Adaptación y técnica");
    expect(faseDeSemana(4)?.objetivo).toBe("Descarga si hace falta");
    expect(faseDeSemana(10)?.objetivo).toBe("Bloque de crecimiento");
    expect(faseDeSemana(12)?.objetivo).toBe("Evaluación");
    expect(faseDeSemana(13)).toBeNull();
  });

  it("arma claves para ejercicios agregados a mano", () => {
    expect(claveDeNombre("  Fondos en Paralelas ")).toBe("fondos-en-paralelas");
    expect(claveDeNombre("Extensión de tríceps")).toBe("extension-de-triceps");
  });
});

describe("fechas", () => {
  it("cuenta la semana desde el lunes", () => {
    expect(lunesDe("2026-10-12")).toBe("2026-10-12"); // lunes
    expect(lunesDe("2026-10-18")).toBe("2026-10-12"); // domingo
    expect(lunesDe("2026-10-19")).toBe("2026-10-19");
  });

  it("calcula la semana del plan", () => {
    expect(semanaDelPlan("2026-10-12", "2026-10-12")).toBe(1);
    expect(semanaDelPlan("2026-10-12", "2026-10-18")).toBe(1);
    expect(semanaDelPlan("2026-10-12", "2026-10-19")).toBe(2);
    expect(semanaDelPlan("2026-10-14", "2026-10-19")).toBe(2); // si arrancó un miércoles, la semana igual empieza el lunes
    expect(semanaDelPlan("2026-10-12", "2027-01-04")).toBe(13);
  });

  it("suma y resta días cruzando meses", () => {
    expect(sumarDias("2026-10-30", 3)).toBe("2026-11-02");
    expect(diasEntre("2026-12-30", "2027-01-02")).toBe(3);
  });

  it("usa la hora de Argentina", () => {
    const ahora = new Date("2026-10-13T01:30:00Z"); // 22:30 del 12 en Buenos Aires
    expect(hoyEn(undefined, ahora)).toBe("2026-10-12");
    expect(horaEn(undefined, ahora)).toBe(22);
  });

  it("describe fechas y duraciones", () => {
    expect(fechaRelativa("2026-10-12", "2026-10-12")).toBe("Hoy");
    expect(fechaRelativa("2026-10-11", "2026-10-12")).toBe("Ayer");
    expect(fechaRelativa("2026-10-08", "2026-10-12")).toBe("jueves 8 oct");
    expect(duracion("2026-10-12T21:00:00Z", "2026-10-12T21:52:00Z")).toBe("52 min");
    expect(duracion("2026-10-12T21:00:00Z", "2026-10-12T22:05:00Z")).toBe("1 h 05 min");
  });
});

describe("progreso", () => {
  it("solo cuenta series hechas y completas", () => {
    const s = [serie("x", "e", 1, 60, 10), serie("x", "e", 2, 60, 8), serie("x", "e", 3, 60, null), serie("x", "e", 4, 60, 10, false)];
    expect(volumen(s)).toBe(1080);
  });

  it("estima el máximo con Epley", () => {
    expect(maximoEstimado(100, 1)).toBe(100);
    expect(maximoEstimado(60, 10)).toBe(80);
  });

  it("arma la historia de un ejercicio, ignorando canceladas y en curso", () => {
    const a = sesion("2026-10-05");
    const b = sesion("2026-10-08");
    const c = sesion("2026-10-10", { estado: "cancelada" });
    const d = sesion("2026-10-12", { estado: "en_curso", fin: null });
    const series = [
      serie(b.id, "banca", 1, 62.5, 8),
      serie(b.id, "banca", 2, 62.5, 7),
      serie(a.id, "banca", 1, 60, 10),
      serie(a.id, "banca", 2, 60, 9),
      serie(c.id, "banca", 1, 100, 10),
      serie(d.id, "banca", 1, 100, 10),
      serie(a.id, "otro", 1, 20, 10),
    ];
    const historia = historiaDeEjercicio([b, c, a, d], series, "banca");
    expect(historia.map((p) => p.fecha)).toEqual(["2026-10-05", "2026-10-08"]);
    expect(historia[0]).toMatchObject({ pesoMax: 60, repsConPesoMax: 10, volumen: 1140, series: 2, maximoEstimado: 80 });
    expect(historia[1].pesoMax).toBe(62.5);
  });

  describe("doble progresión", () => {
    const banca = { series: 3, repsMin: 6, repsMax: 10 };

    it("la primera vez sugiere elegir un peso", () => {
      expect(sugerencia(banca, []).tipo).toBe("primera");
    });

    it("sube el peso cuando todas las series llegan al tope", () => {
      const s = sugerencia(banca, [serie("x", "b", 1, 60, 10), serie("x", "b", 2, 60, 10), serie("x", "b", 3, 60, 11)]);
      expect(s).toMatchObject({ tipo: "subir", kg: 62.5 });
      expect(s.texto).toContain("62,5 kg");
    });

    it("mantiene el peso si alguna serie no llegó", () => {
      expect(sugerencia(banca, [serie("x", "b", 1, 60, 10), serie("x", "b", 2, 60, 10), serie("x", "b", 3, 60, 8)])).toMatchObject({
        tipo: "mantener",
        kg: 60,
      });
    });

    it("mantiene el peso si se hicieron menos series que las del plan", () => {
      expect(sugerencia(banca, [serie("x", "b", 1, 60, 10), serie("x", "b", 2, 60, 10)])).toMatchObject({ tipo: "mantener" });
    });

    it("sube de a 1 kg en lo liviano", () => {
      const laterales = { series: 2, repsMin: 12, repsMax: 20 };
      expect(sugerencia(laterales, [serie("x", "l", 1, 8, 20), serie("x", "l", 2, 8, 20)])).toMatchObject({ tipo: "subir", kg: 9 });
    });
  });

  it("toma las series de la última sesión completada que tuvo el ejercicio", () => {
    const a = sesion("2026-10-01");
    const b = sesion("2026-10-05");
    const c = sesion("2026-10-08"); // no hizo banca
    const series = [serie(a.id, "banca", 1, 55, 10), serie(b.id, "banca", 1, 60, 10), serie(c.id, "otro", 1, 10, 10)];
    expect(ultimasSeries([a, b, c], series, "banca").map((s) => s.kg)).toEqual([60]);
    expect(ultimasSeries([a, b, c], series, "banca", b.id).map((s) => s.kg)).toEqual([55]);
  });

  it("agrupa por semana de lunes a domingo", () => {
    const s1 = sesion("2026-10-05");
    const s2 = sesion("2026-10-07");
    const s3 = sesion("2026-10-12");
    const s4 = sesion("2026-10-13", { estado: "cancelada" });
    const lista = semanas([s1, s2, s3, s4], [serie(s1.id, "b", 1, 50, 10), serie(s3.id, "b", 1, 10, 10), serie(s4.id, "b", 1, 99, 10)], "2026-10-14", 3);
    expect(lista).toEqual([
      { lunes: "2026-09-28", sesiones: 0, volumen: 0 },
      { lunes: "2026-10-05", sesiones: 2, volumen: 500 },
      { lunes: "2026-10-12", sesiones: 1, volumen: 100 },
    ]);
  });

  it("detecta récords contra sesiones anteriores", () => {
    const a = sesion("2026-10-01");
    const b = sesion("2026-10-05");
    const series = [
      serie(a.id, "banca", 1, 60, 10),
      serie(a.id, "remo", 1, 50, 10),
      serie(b.id, "banca", 1, 62.5, 6),
      serie(b.id, "remo", 1, 50, 12),
      serie(b.id, "nuevo", 1, 30, 10),
    ];
    expect(marcasDeSesion(b, [a, b], series)).toEqual([{ ejercicio: "banca", nombre: "banca", kg: 62.5, reps: 6, anterior: 60 }]);
    expect(marcasDeSesion(a, [a, b], series)).toEqual([]);
  });

  it("lee y escribe pesos con coma", () => {
    expect(leerNumero("62,5")).toBe(62.5);
    expect(leerNumero(" 60 ")).toBe(60);
    expect(leerNumero("")).toBeNull();
    expect(leerNumero("abc")).toBeNull();
    expect(leerNumero("-5")).toBeNull();
    expect(formatoKg(62.5)).toBe("62,5 kg");
  });
});
