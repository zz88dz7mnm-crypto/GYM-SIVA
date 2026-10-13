"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

/**
 * El temporizador de descanso. Guarda la hora de fin (no los segundos que faltan):
 * así sigue bien aunque la pantalla se bloquee, se cambie de vista o se recargue la app.
 */
export type Descanso = { fin: number; total: number; etiqueta: string };

type ValorDescanso = {
  descanso: Descanso | null;
  /** Segundos que faltan, redondeados hacia arriba. 0 cuando terminó. */
  restante: number;
  /** Recién terminó: se muestra el aviso unos segundos. */
  terminado: boolean;
  iniciar(segundos: number, etiqueta: string): void;
  sumar(segundos: number): void;
  saltar(): void;
};

const CLAVE = "gym-descanso";
const Contexto = createContext<ValorDescanso | null>(null);

function leerGuardado(): Descanso | null {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const d = JSON.parse(crudo) as Descanso;
    return typeof d.fin === "number" && d.fin > Date.now() - 10_000 ? d : null;
  } catch {
    return null;
  }
}

function guardar(d: Descanso | null) {
  try {
    if (d) localStorage.setItem(CLAVE, JSON.stringify(d));
    else localStorage.removeItem(CLAVE);
  } catch {
    // Sin almacenamiento el temporizador igual funciona; solo no sobrevive a una recarga.
  }
}

/** Dos pitidos cortos. El contexto de audio se crea con un toque del usuario, si no iOS no deja sonar. */
function pitar(audio: AudioContext | null) {
  if (!audio) return;
  const ahora = audio.currentTime;
  for (const [desde, frecuencia] of [
    [0, 880],
    [0.22, 1175],
  ] as const) {
    const osc = audio.createOscillator();
    const vol = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = frecuencia;
    vol.gain.setValueAtTime(0.0001, ahora + desde);
    vol.gain.exponentialRampToValueAtTime(0.35, ahora + desde + 0.02);
    vol.gain.exponentialRampToValueAtTime(0.0001, ahora + desde + 0.18);
    osc.connect(vol).connect(audio.destination);
    osc.start(ahora + desde);
    osc.stop(ahora + desde + 0.2);
  }
}

export function ProveedorDescanso({ sonido, children }: { sonido: boolean; children: React.ReactNode }) {
  // Este proveedor se monta recién en el navegador (después de iniciar sesión): puede leer lo guardado al arrancar.
  const [descanso, setDescanso] = useState<Descanso | null>(leerGuardado);
  const [ahora, setAhora] = useState(() => Date.now());
  const [terminado, setTerminado] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const avisado = useRef<number | null>(null);

  useEffect(() => {
    if (!descanso) return;
    const id = setInterval(() => setAhora(Date.now()), 250);
    return () => clearInterval(id);
  }, [descanso]);

  const restante = descanso ? Math.max(0, Math.ceil((descanso.fin - ahora) / 1000)) : 0;

  useEffect(() => {
    if (!descanso || restante > 0 || avisado.current === descanso.fin) return;
    avisado.current = descanso.fin;
    // Si terminó hace rato (la app estaba en segundo plano), no tiene sentido sonar ahora.
    const reciente = Date.now() - descanso.fin < 5_000;
    if (reciente) {
      if (sonido) pitar(audio.current);
      navigator.vibrate?.([200, 100, 200]);
    }
    setTerminado(true);
  }, [descanso, restante, sonido]);

  useEffect(() => {
    if (!terminado) return;
    const id = setTimeout(() => {
      setTerminado(false);
      setDescanso(null);
      guardar(null);
    }, 4_000);
    return () => clearTimeout(id);
  }, [terminado]);

  const iniciar = useCallback((segundos: number, etiqueta: string) => {
    try {
      audio.current ??= new AudioContext();
      void audio.current.resume();
    } catch {
      audio.current = null;
    }
    const d = { fin: Date.now() + segundos * 1000, total: segundos, etiqueta };
    avisado.current = null;
    setTerminado(false);
    setAhora(Date.now());
    setDescanso(d);
    guardar(d);
  }, []);

  const sumar = useCallback((segundos: number) => {
    setDescanso((d) => {
      if (!d) return d;
      const fin = Math.max(Date.now() + 1000, d.fin + segundos * 1000);
      const nuevo = { ...d, fin, total: Math.max(1, d.total + segundos) };
      guardar(nuevo);
      return nuevo;
    });
  }, []);

  const saltar = useCallback(() => {
    setDescanso(null);
    setTerminado(false);
    guardar(null);
  }, []);

  const valor = useMemo(() => ({ descanso, restante, terminado, iniciar, sumar, saltar }), [descanso, restante, terminado, iniciar, sumar, saltar]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useDescanso(): ValorDescanso {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useDescanso fuera de ProveedorDescanso");
  return valor;
}

/** "1:30". */
export function reloj(segundos: number): string {
  const s = Math.max(0, Math.round(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
