"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDescanso } from "@/lib/descanso";
import { duracion } from "@/lib/fechas";
import { useDatos } from "@/lib/gym";
import { dia } from "@/lib/plan";
import { formatoKg, formatoVolumen, marcasDeSesion, volumen } from "@/lib/progreso";
import type { Sesion } from "@/lib/tipos";
import { EditorSesion } from "../EditorSesion";
import { IconoAtras, IconoTrofeo } from "../iconos";
import { Boton, Confirmar, Tarjeta, Vacio } from "../ui";

export function tituloDeSesion(s: Pick<Sesion, "dia">): string {
  return s.dia === "libre" ? "Entrenamiento libre" : `Día ${s.dia} · ${dia(s.dia).titulo}`;
}

/** Mantiene la pantalla prendida mientras se entrena, donde el navegador lo permite. */
function usePantallaPrendida(activa: boolean) {
  useEffect(() => {
    if (!activa || !("wakeLock" in navigator)) return;
    let candado: WakeLockSentinel | null = null;
    let vigente = true;
    const pedir = () => {
      if (document.visibilityState !== "visible") return;
      navigator.wakeLock
        .request("screen")
        .then((c) => {
          if (vigente) candado = c;
          else void c.release();
        })
        .catch(() => {});
    };
    pedir();
    document.addEventListener("visibilitychange", pedir);
    return () => {
      vigente = false;
      document.removeEventListener("visibilitychange", pedir);
      void candado?.release();
    };
  }, [activa]);
}

function useMinutos(desde: string | undefined) {
  const [ahora, setAhora] = useState(() => new Date().toISOString());
  useEffect(() => {
    if (!desde) return;
    const id = setInterval(() => setAhora(new Date().toISOString()), 15_000);
    return () => clearInterval(id);
  }, [desde]);
  return desde ? duracion(desde, ahora) : "";
}

export function VistaEntrenar() {
  const router = useRouter();
  const { sesiones, series, terminarSesion, borrarSesion } = useDatos();
  const { saltar } = useDescanso();
  const [terminadaId, setTerminadaId] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState<"terminar" | "descartar" | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  const sesion = sesiones.find((s) => (terminadaId ? s.id === terminadaId : s.estado === "en_curso"));
  const transcurrido = useMinutos(sesion?.estado === "en_curso" ? sesion.inicio : undefined);
  usePantallaPrendida(sesion?.estado === "en_curso");

  if (!sesion) {
    return (
      <Tarjeta className="mt-4">
        <Vacio titulo="No hay un entrenamiento en curso" texto="Empezá uno desde Hoy.">
          <Link href="/" className="mt-2 font-semibold text-acento">
            Ir a Hoy
          </Link>
        </Vacio>
      </Tarjeta>
    );
  }

  if (terminadaId) return <Resumen sesion={sesion} onListo={() => router.push("/")} />;

  const propias = series.filter((s) => s.sesionId === sesion.id);
  const hechas = propias.filter((s) => s.hecha).length;

  async function descartar() {
    setOcupado(true);
    setError("");
    try {
      await borrarSesion(sesion!.id);
      saltar();
      router.push("/");
    } catch {
      setError("No pude descartarlo. Revisá la conexión y probá de nuevo.");
      setOcupado(false);
      setConfirmar(null);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-20 -mx-4 mb-4 px-4 pt-[max(env(safe-area-inset-top),0.5rem)] pb-3 lg:static lg:mx-0 lg:px-0 lg:pt-0">
        <div className="cristal flex items-center gap-2 rounded-[22px] p-2">
          <Link href="/" className="grid size-11 shrink-0 place-items-center rounded-full text-tinta-suave" aria-label="Volver a Hoy (el entrenamiento sigue)">
            <IconoAtras />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-bold">{tituloDeSesion(sesion)}</p>
            <p className="cifras text-[13px] text-tinta-suave">
              {transcurrido} · {hechas} {hechas === 1 ? "serie" : "series"}
            </p>
          </div>
          <Boton className="h-11 px-4 text-[15px]" onClick={() => setConfirmar(hechas > 0 ? "terminar" : "descartar")}>
            Terminar
          </Boton>
        </div>
      </header>

      {error && (
        <p role="alert" className="mb-3 rounded-2xl bg-rojo/10 px-4 py-3 text-[14px] text-rojo">
          {error}
        </p>
      )}

      <EditorSesion sesion={sesion} vivo />

      <div className="mt-6 grid justify-items-center">
        <button type="button" onClick={() => setConfirmar("descartar")} className="h-11 rounded-full px-4 text-[15px] font-semibold text-rojo">
          Descartar entrenamiento
        </button>
      </div>

      <Confirmar
        abierto={confirmar === "terminar"}
        titulo="¿Terminaste?"
        texto={
          <>
            Se guarda el entrenamiento con {hechas} {hechas === 1 ? "serie hecha" : "series hechas"} y {formatoVolumen(volumen(propias))} de volumen. Las series
            sin marcar no cuentan. Después lo podés corregir desde Historial.
          </>
        }
        confirmar="Terminar"
        onCancelar={() => setConfirmar(null)}
        onConfirmar={() => {
          terminarSesion(sesion.id);
          saltar();
          setTerminadaId(sesion.id);
          setConfirmar(null);
        }}
      />
      <Confirmar
        abierto={confirmar === "descartar"}
        titulo="¿Descartar el entrenamiento?"
        texto={
          hechas > 0
            ? `Se borra "${tituloDeSesion(sesion)}" de hoy con sus ${hechas} series. No se puede deshacer.`
            : `No marcaste ninguna serie. Se borra "${tituloDeSesion(sesion)}" de hoy y no queda en el historial.`
        }
        confirmar="Descartar"
        peligro
        ocupado={ocupado}
        onCancelar={() => setConfirmar(null)}
        onConfirmar={descartar}
      />
    </>
  );
}

function Resumen({ sesion, onListo }: { sesion: Sesion; onListo: () => void }) {
  const { sesiones, series } = useDatos();
  const propias = series.filter((s) => s.sesionId === sesion.id && s.hecha);
  const marcas = marcasDeSesion(sesion, sesiones, series);
  const ejercicios = new Set(propias.map((s) => s.ejercicio)).size;

  return (
    <div className="grid animate-aparecer gap-4 pt-6">
      <div className="px-1">
        <p className="text-[13px] font-semibold tracking-wide text-tinta-suave uppercase">Entrenamiento terminado</p>
        <h1 className="text-[32px] leading-tight font-bold tracking-[-0.025em]">¡Bien ahí!</h1>
        <p className="mt-1 text-[17px] text-tinta-suave">{tituloDeSesion(sesion)}</p>
      </div>
      <Tarjeta>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Dato titulo="Duración" valor={sesion.fin ? duracion(sesion.inicio, sesion.fin) : "—"} />
          <Dato titulo="Ejercicios" valor={String(ejercicios)} />
          <Dato titulo="Series" valor={String(propias.length)} />
          <Dato titulo="Volumen" valor={formatoVolumen(volumen(propias))} />
        </dl>
      </Tarjeta>
      {marcas.length > 0 && (
        <Tarjeta>
          <h2 className="flex items-center gap-2 text-[17px] font-bold">
            <IconoTrofeo className="size-5 text-acento" /> {marcas.length === 1 ? "Nuevo récord" : `${marcas.length} récords nuevos`}
          </h2>
          <ul className="mt-3 grid gap-2">
            {marcas.map((m) => (
              <li key={m.ejercicio} className="flex items-baseline justify-between gap-3 text-[15px]">
                <span className="min-w-0">{m.nombre}</span>
                <span className="cifras shrink-0 font-semibold">
                  {formatoKg(m.kg)} <span className="font-normal text-tinta-tenue">(antes {formatoKg(m.anterior ?? 0)})</span>
                </span>
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}
      <Boton onClick={onListo}>Listo</Boton>
    </div>
  );
}

export function Dato({ titulo, valor, detalle }: { titulo: string; valor: string; detalle?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[13px] text-tinta-suave">{titulo}</dt>
      <dd className="cifras mt-0.5 truncate text-[22px] font-bold tracking-tight">{valor}</dd>
      {detalle && <dd className="mt-0.5 text-[13px] text-tinta-tenue">{detalle}</dd>}
    </div>
  );
}
