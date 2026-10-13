"use client";

import { useMemo, useRef, useState } from "react";
import { ejerciciosDeSesion, filasDeEjercicio, type EjercicioEnSesion } from "@/lib/armado";
import { reloj, useDescanso } from "@/lib/descanso";
import { useDatos } from "@/lib/gym";
import { claveDeNombre, textoDescanso, textoSeries } from "@/lib/plan";
import { formatoKg, leerNumero, sugerencia, ultimasSeries } from "@/lib/progreso";
import type { Serie, Sesion } from "@/lib/tipos";
import { IconoCheck, IconoMas, IconoMenos, IconoReloj, IconoSubir } from "./iconos";
import { Boton, cx } from "./ui";

const DESCANSO_LIBRE = 90;

function sin<T>(registro: Record<number, T>, clave: number): Record<number, T> {
  const copia = { ...registro };
  delete copia[clave];
  return copia;
}

/**
 * Las tarjetas de ejercicios de una sesión, con una fila por serie (kilos, repeticiones, hecha).
 * En vivo, marcar una serie arranca el descanso. En el historial sirve para corregir lo cargado.
 */
export function EditorSesion({ sesion, vivo }: { sesion: Sesion; vivo: boolean }) {
  const { series, sesiones } = useDatos();
  const ejercicios = useMemo(() => ejerciciosDeSesion(sesion, series), [sesion, series]);
  const [agregados, setAgregados] = useState<EjercicioEnSesion[]>([]);

  // Los agregados a mano aparecen enseguida; cuando tienen una serie guardada ya vienen de la base.
  const todos = [...ejercicios, ...agregados.filter((a) => !ejercicios.some((e) => e.clave === a.clave))];

  function agregar(nombre: string) {
    const clave = claveDeNombre(nombre);
    if (!clave || todos.some((e) => e.clave === clave)) return false;
    const orden = Math.max(-1, ...todos.map((e) => e.orden)) + 1;
    setAgregados((a) => [...a, { clave, nombre: nombre.trim(), plan: null, orden, guardadas: [] }]);
    return true;
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {todos.map((e, i) => (
        <TarjetaEjercicio
          key={e.clave}
          ejercicio={e}
          sesion={sesion}
          vivo={vivo}
          ultimo={i === todos.length - 1}
          anteriores={vivo ? ultimasSeries(sesiones, series, e.clave, sesion.id) : []}
        />
      ))}
      <AgregarEjercicio onAgregar={agregar} />
    </div>
  );
}

type Borrador = { id: string; kg: string; reps: string };

function TarjetaEjercicio({
  ejercicio,
  sesion,
  vivo,
  ultimo,
  anteriores,
}: {
  ejercicio: EjercicioEnSesion;
  sesion: Sesion;
  vivo: boolean;
  ultimo: boolean;
  anteriores: Serie[];
}) {
  const { guardarSerie, borrarSerie } = useDatos();
  const { iniciar } = useDescanso();
  const [extra, setExtra] = useState(0);
  const [borradores, setBorradores] = useState<Record<number, Borrador>>({});
  const [faltan, setFaltan] = useState<Record<number, "kg" | "reps">>({});
  const repsRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const kgRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const { plan } = ejercicio;
  const filas = filasDeEjercicio(ejercicio, extra);
  const consejo = vivo && plan ? sugerencia(plan, anteriores) : null;
  const descanso = plan?.descanso ?? DESCANSO_LIBRE;
  const hechas = ejercicio.guardadas.filter((s) => s.hecha).length;

  const guardada = (n: number) => ejercicio.guardadas.find((s) => s.numero === n);
  const anterior = (n: number) => anteriores.find((s) => s.numero === n) ?? anteriores.at(-1);
  // Lo que se propone si se marca sin escribir: el peso sugerido y las repeticiones de la vez pasada.
  const kgPropuesto = (n: number) => (consejo && consejo.tipo !== "primera" ? consejo.kg : (anterior(n)?.kg ?? null));
  const repsPropuestas = (n: number) => (consejo?.tipo === "mantener" ? (anterior(n)?.reps ?? null) : null);

  function valor(n: number, campo: "kg" | "reps"): string {
    const b = borradores[n];
    if (b) return b[campo];
    const g = guardada(n)?.[campo];
    return g === null || g === undefined ? "" : String(g).replace(".", ",");
  }

  function escribir(n: number, campo: "kg" | "reps", texto: string) {
    setFaltan((f) => sin(f, n));
    setBorradores((b) => {
      const previo = b[n] ?? { id: guardada(n)?.id ?? crypto.randomUUID(), kg: valor(n, "kg"), reps: valor(n, "reps") };
      return { ...b, [n]: { ...previo, [campo]: texto } };
    });
  }

  function armar(n: number, hecha: boolean, kg: number | null, reps: number | null): Serie {
    return {
      id: borradores[n]?.id ?? guardada(n)?.id ?? crypto.randomUUID(),
      sesionId: sesion.id,
      ejercicio: ejercicio.clave,
      ejercicioNombre: ejercicio.nombre,
      orden: ejercicio.orden,
      numero: n,
      kg,
      reps,
      hecha,
    };
  }

  function soltarBorrador(n: number) {
    setBorradores((b) => sin(b, n));
  }

  /** Al salir de un campo de una serie ya guardada, guarda la corrección. */
  function alSalir(n: number) {
    const g = guardada(n);
    const b = borradores[n];
    if (!g || !b) return;
    const kg = leerNumero(b.kg);
    const reps = leerNumero(b.reps);
    if (kg === g.kg && reps === g.reps) return soltarBorrador(n);
    if (g.hecha && (kg === null || !reps)) return; // una serie hecha necesita peso y repeticiones
    guardarSerie(armar(n, g.hecha, kg, reps === null ? null : Math.round(reps)));
    soltarBorrador(n);
  }

  function marcar(n: number) {
    const g = guardada(n);
    if (g?.hecha) {
      guardarSerie({ ...g, hecha: false });
      return;
    }
    const kg = leerNumero(valor(n, "kg")) ?? kgPropuesto(n);
    const repsLeidas = leerNumero(valor(n, "reps"));
    const reps = repsLeidas !== null ? Math.round(repsLeidas) : repsPropuestas(n);
    if (kg === null) {
      setFaltan((f) => ({ ...f, [n]: "kg" }));
      kgRefs.current[n]?.focus();
      return;
    }
    if (!reps) {
      setFaltan((f) => ({ ...f, [n]: "reps" }));
      repsRefs.current[n]?.focus();
      return;
    }
    guardarSerie(armar(n, true, kg, reps));
    soltarBorrador(n);
    if (vivo && !(ultimo && n === filas)) iniciar(descanso, ejercicio.nombre);
  }

  function quitarUltima() {
    const g = guardada(filas);
    if (g) borrarSerie(g.id);
    soltarBorrador(filas);
    if (filas > (plan?.series ?? 0)) setExtra((x) => Math.max(0, x - 1));
  }

  const puedeQuitar = filas > 1 && (filas > (plan?.series ?? 0) || !!guardada(filas));

  return (
    <article className="cristal rounded-[26px] p-4 sm:p-5" aria-labelledby={`ej-${ejercicio.clave}`}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`ej-${ejercicio.clave}`} className="text-[18px] leading-snug font-bold">
            {ejercicio.nombre}
          </h2>
          <p className="mt-0.5 text-[14px] text-tinta-suave">{plan ? `${textoSeries(plan)} · descanso ${textoDescanso(plan)}` : "Agregado a mano"}</p>
        </div>
        <span
          className={cx(
            "cifras shrink-0 rounded-full px-2.5 py-1 text-[13px] font-semibold",
            hechas >= filas && filas > 0 ? "bg-verde/15 text-verde" : "bg-tinta/5 text-tinta-suave",
          )}
        >
          {hechas}/{filas}
        </span>
      </header>

      {plan?.enfoque && <p className="mt-2 text-[14px] text-tinta-tenue">{plan.enfoque}</p>}

      {consejo && (
        <div
          className={cx(
            "mt-3 rounded-2xl px-3.5 py-2.5 text-[14px] leading-snug",
            consejo.tipo === "subir" ? "bg-verde/12 text-verde" : "bg-acento-suave text-tinta",
          )}
        >
          <p className="flex gap-2">
            {consejo.tipo === "subir" && <IconoSubir className="mt-0.5 size-4 shrink-0" />}
            <span>{consejo.texto}</span>
          </p>
          {consejo.tipo !== "primera" && (
            <p className="cifras mt-1 text-[13px] text-tinta-suave">
              La última vez: {consejo.ultima.map((s) => `${s.kg.toLocaleString("es-AR")}×${s.reps}`).join(" · ")}
            </p>
          )}
        </div>
      )}

      <div className="mt-3 grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_3rem] items-center gap-x-2 gap-y-2 text-[13px]">
        <span className="text-center text-tinta-tenue">#</span>
        <span className="pl-1 text-tinta-tenue">Kilos</span>
        <span className="pl-1 text-tinta-tenue">Reps{plan ? ` (${plan.repsMin}–${plan.repsMax})` : ""}</span>
        <span />
        {Array.from({ length: filas }, (_, i) => i + 1).map((n) => {
          const g = guardada(n);
          const hecha = !!g?.hecha;
          const kgSug = kgPropuesto(n);
          const repsSug = repsPropuestas(n);
          const campo = (falta: boolean) =>
            cx(
              "cifras h-12 w-full min-w-0 rounded-xl border bg-campo px-3 text-[18px] font-semibold text-tinta outline-none placeholder:font-normal placeholder:text-tinta-tenue focus:border-acento focus:ring-2 focus:ring-acento/20",
              falta ? "border-rojo" : "border-linea",
              hecha && "border-verde/40 bg-verde/8",
            );
          return (
            <div key={n} className="contents">
              <span className={cx("cifras text-center text-[15px] font-semibold", hecha ? "text-verde" : "text-tinta-suave")}>{n}</span>
              <input
                ref={(el) => {
                  kgRefs.current[n] = el;
                }}
                inputMode="decimal"
                enterKeyHint="next"
                aria-label={`Serie ${n}, kilos`}
                aria-invalid={faltan[n] === "kg" || undefined}
                placeholder={kgSug !== null ? String(kgSug).replace(".", ",") : "kg"}
                value={valor(n, "kg")}
                onChange={(e) => escribir(n, "kg", e.target.value)}
                onBlur={() => alSalir(n)}
                className={campo(faltan[n] === "kg")}
              />
              <input
                ref={(el) => {
                  repsRefs.current[n] = el;
                }}
                inputMode="numeric"
                enterKeyHint="done"
                aria-label={`Serie ${n}, repeticiones`}
                aria-invalid={faltan[n] === "reps" || undefined}
                placeholder={repsSug !== null ? String(repsSug) : plan ? `${plan.repsMin}–${plan.repsMax}` : "reps"}
                value={valor(n, "reps")}
                onChange={(e) => escribir(n, "reps", e.target.value.replace(/\D/g, ""))}
                onBlur={() => alSalir(n)}
                onKeyDown={(e) => e.key === "Enter" && marcar(n)}
                className={campo(faltan[n] === "reps")}
              />
              <button
                type="button"
                onClick={() => marcar(n)}
                aria-pressed={hecha}
                aria-label={hecha ? `Serie ${n} hecha. Tocá para desmarcar` : `Marcar serie ${n} como hecha`}
                className={cx(
                  "grid h-12 w-12 place-items-center rounded-xl transition-colors",
                  hecha ? "bg-verde text-white" : "border border-linea bg-campo text-tinta-tenue active:bg-acento-suave",
                )}
              >
                <IconoCheck />
              </button>
            </div>
          );
        })}
      </div>
      {Object.values(faltan).length > 0 && (
        <p role="alert" className="mt-2 text-[13px] text-rojo">
          {Object.values(faltan).includes("kg") ? "Falta el peso." : "Faltan las repeticiones."}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setExtra((x) => x + 1)}
          className="cristal-leve inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-semibold"
        >
          <IconoMas className="size-4" /> Serie
        </button>
        {puedeQuitar && (
          <button
            type="button"
            onClick={quitarUltima}
            className="cristal-leve inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-semibold text-tinta-suave"
          >
            <IconoMenos className="size-4" /> Quitar la última
          </button>
        )}
        {vivo && (
          <button
            type="button"
            onClick={() => iniciar(descanso, ejercicio.nombre)}
            className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-full bg-acento-suave px-3.5 text-[14px] font-semibold text-acento"
          >
            <IconoReloj className="size-4" /> Descanso {reloj(descanso)}
          </button>
        )}
      </div>
      {vivo && !consejo && anteriores.length > 0 && (
        <p className="cifras mt-2 text-[13px] text-tinta-tenue">La última vez: {anteriores.map((s) => `${formatoKg(s.kg ?? 0)}×${s.reps}`).join(" · ")}</p>
      )}
    </article>
  );
}

function AgregarEjercicio({ onAgregar }: { onAgregar: (nombre: string) => boolean }) {
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  return (
    <form
      className="cristal-leve grid grid-cols-1 gap-2 rounded-[22px] p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!nombre.trim()) return;
        if (onAgregar(nombre)) {
          setNombre("");
          setError("");
        } else setError("Ese ejercicio ya está en la sesión.");
      }}
    >
      <label htmlFor="nuevo-ejercicio" className="text-[14px] font-semibold text-tinta-suave">
        ¿Hiciste otro ejercicio o cambiaste uno?
      </label>
      <div className="flex gap-2">
        <input
          id="nuevo-ejercicio"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={80}
          placeholder="Ej.: Fondos en paralelas"
          className="h-11 min-w-0 flex-1 rounded-xl border border-linea bg-campo px-3 text-[16px] outline-none focus:border-acento focus:ring-2 focus:ring-acento/20"
        />
        <Boton type="submit" variante="suave" className="h-11">
          Agregar
        </Boton>
      </div>
      {error && (
        <p role="alert" className="text-[13px] text-rojo">
          {error}
        </p>
      )}
    </form>
  );
}
