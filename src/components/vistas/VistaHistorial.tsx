"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { duracion, fechaCorta, fechaRelativa, lunesDe } from "@/lib/fechas";
import { useDatos } from "@/lib/gym";
import { formatoVolumen, volumen } from "@/lib/progreso";
import type { Sesion } from "@/lib/tipos";
import { EditorSesion } from "../EditorSesion";
import { IconoFlecha } from "../iconos";
import { Boton, Confirmar, cx, Encabezado, Tarjeta, Vacio } from "../ui";
import { tituloDeSesion } from "./VistaEntrenar";

export function VistaHistorial() {
  const { sesiones, hoy } = useDatos();
  // Se puede llegar con /historial#id desde Hoy: esa sesión arranca abierta.
  const [abierta, setAbierta] = useState<string | null>(() => decodeURIComponent(window.location.hash.slice(1)) || null);

  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) requestAnimationFrame(() => document.getElementById(`sesion-${id}`)?.scrollIntoView({ block: "start" }));
  }, []);

  const visibles = sesiones.filter((s) => s.estado !== "en_curso");
  const enCurso = sesiones.find((s) => s.estado === "en_curso");
  const grupos = new Map<string, Sesion[]>();
  for (const s of visibles) {
    const lunes = lunesDe(s.fecha);
    grupos.set(lunes, [...(grupos.get(lunes) ?? []), s]);
  }

  return (
    <>
      <Encabezado titulo="Historial" />
      {enCurso && (
        <Link href="/entrenar" className="cristal mb-4 flex items-center justify-between rounded-[22px] px-5 py-4">
          <span>
            <span className="block text-[13px] font-semibold text-acento uppercase">En curso</span>
            <span className="text-[16px] font-semibold">{tituloDeSesion(enCurso)}</span>
          </span>
          <IconoFlecha />
        </Link>
      )}
      {visibles.length === 0 ? (
        <Tarjeta>
          <Vacio titulo="Sin entrenamientos" texto="Cuando termines tu primer entrenamiento, aparece acá." />
        </Tarjeta>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {[...grupos.entries()].map(([lunes, lista]) => (
            <section key={lunes} aria-label={`Semana del ${fechaCorta(lunes, hoy)}`}>
              <h2 className="mb-2 px-1 text-[13px] font-semibold tracking-wide text-tinta-suave uppercase">
                {lunes === lunesDe(hoy) ? "Esta semana" : `Semana del ${fechaCorta(lunes, hoy)}`}
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {lista.map((s) => (
                  <FilaSesion key={s.id} sesion={s} abierta={abierta === s.id} onAlternar={() => setAbierta((a) => (a === s.id ? null : s.id))} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function FilaSesion({ sesion, abierta, onAlternar }: { sesion: Sesion; abierta: boolean; onAlternar: () => void }) {
  const { series, hoy } = useDatos();
  const propias = series.filter((s) => s.sesionId === sesion.id && s.hecha);
  const ejercicios = new Set(propias.map((s) => s.ejercicio)).size;

  return (
    <article id={`sesion-${sesion.id}`} className={cx("scroll-mt-4 rounded-[24px]", abierta ? "" : "cristal")}>
      <button
        type="button"
        onClick={onAlternar}
        aria-expanded={abierta}
        className={cx("flex w-full items-center gap-3 px-5 py-4 text-left", abierta && "cristal rounded-[24px]")}
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-acento-suave text-[17px] font-bold text-acento">
          {sesion.dia === "libre" ? "L" : sesion.dia}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[16px] font-semibold">{tituloDeSesion(sesion)}</span>
          <span className="cifras block text-[14px] text-tinta-suave">
            {fechaRelativa(sesion.fecha, hoy)}
            {sesion.fin ? ` · ${duracion(sesion.inicio, sesion.fin)}` : ""} · {ejercicios} ej. · {propias.length} series · {formatoVolumen(volumen(propias))}
            {sesion.estado === "cancelada" ? " · cancelada" : ""}
          </span>
        </span>
        <IconoFlecha className={cx("size-4 shrink-0 text-tinta-tenue transition-transform", abierta && "rotate-90")} />
      </button>
      {abierta && <DetalleSesion sesion={sesion} />}
    </article>
  );
}

function DetalleSesion({ sesion }: { sesion: Sesion }) {
  const { actualizarSesion, borrarSesion, hoy, series } = useDatos();
  const [notas, setNotas] = useState(sesion.notas);
  const [confirmar, setConfirmar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const cantidad = series.filter((s) => s.sesionId === sesion.id).length;

  async function borrar() {
    setOcupado(true);
    setError("");
    try {
      await borrarSesion(sesion.id);
    } catch {
      setError("No pude borrarlo. Revisá la conexión y probá de nuevo.");
      setOcupado(false);
      setConfirmar(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 pt-4">
      <Tarjeta className="grid grid-cols-1 gap-3">
        <p className="text-[14px] text-tinta-suave">Corregí lo que haga falta: cada cambio se guarda solo y queda registrado.</p>
        <label className="grid grid-cols-1 gap-1 text-[13px] text-tinta-suave">
          Fecha
          <input
            type="date"
            value={sesion.fecha}
            max={hoy}
            onChange={(e) => e.target.value && actualizarSesion(sesion.id, { fecha: e.target.value })}
            className="h-11 rounded-xl border border-linea bg-campo px-3 text-[16px] text-tinta"
          />
        </label>
        <label className="grid grid-cols-1 gap-1 text-[13px] text-tinta-suave">
          Notas
          <textarea
            value={notas}
            maxLength={2000}
            rows={2}
            onChange={(e) => setNotas(e.target.value)}
            onBlur={() => notas !== sesion.notas && actualizarSesion(sesion.id, { notas })}
            placeholder="Cómo te sentiste, molestias, cambios…"
            className="rounded-xl border border-linea bg-campo px-3 py-2 text-[16px] text-tinta outline-none focus:border-acento"
          />
        </label>
      </Tarjeta>
      <EditorSesion sesion={sesion} vivo={false} />
      {error && (
        <p role="alert" className="text-[14px] text-rojo">
          {error}
        </p>
      )}
      <Boton variante="peligro" onClick={() => setConfirmar(true)}>
        Borrar este entrenamiento
      </Boton>
      <Confirmar
        abierto={confirmar}
        titulo="¿Borrar el entrenamiento?"
        texto={`Se borra "${tituloDeSesion(sesion)}" del ${fechaCorta(sesion.fecha, hoy)} con sus ${cantidad} series. Deja de contar en tu progreso y no se puede deshacer.`}
        confirmar="Borrar"
        peligro
        ocupado={ocupado}
        onCancelar={() => setConfirmar(false)}
        onConfirmar={borrar}
      />
    </div>
  );
}
