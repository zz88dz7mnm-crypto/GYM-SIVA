"use client";

import Link from "next/link";
import { useMemo } from "react";
import { duracion, fechaCorta, fechaRelativa, semanaDelPlan } from "@/lib/fechas";
import { useDatos } from "@/lib/gym";
import { faseDeSemana, SEMANAS_DEL_PLAN, SESIONES_POR_SEMANA } from "@/lib/plan";
import { formatoKg, formatoVolumen, historiaDeEjercicio, semanas, volumen } from "@/lib/progreso";
import { GraficoBarras, GraficoLinea, TablaDeDatos } from "../Grafico";
import { Encabezado, Tarjeta, Vacio, cx } from "../ui";
import { Dato, tituloDeSesion } from "./VistaEntrenar";
import { useEjerciciosConDatos } from "./VistaProgreso";

/** Los básicos que conviene mirar primero, si tienen datos. */
const PRINCIPALES = ["press-banca-plano", "press-inclinado-barra", "press-hombros-sentado", "jalon-pecho", "extension-triceps-cuerda", "elevaciones-laterales"];

export function VistaPanel() {
  const { ajustes, sesiones, series, hoy } = useDatos();
  const lista = useMemo(() => semanas(sesiones, series, hoy, 12), [sesiones, series, hoy]);
  const actual = lista.at(-1)!;
  const anterior = lista.at(-2)!;
  const semanaPlan = ajustes.inicioPlan ? semanaDelPlan(ajustes.inicioPlan, hoy) : null;
  const fase = semanaPlan ? faseDeSemana(semanaPlan) : null;
  const completadas = sesiones.filter((s) => s.estado === "completada");
  const ultima = completadas[0];
  const variacion = anterior.volumen > 0 ? Math.round(((actual.volumen - anterior.volumen) / anterior.volumen) * 100) : null;

  return (
    <>
      <Encabezado sobre="GYM" titulo="Panel" />
      <div className="grid grid-cols-1 gap-4">
        <Tarjeta>
          <dl className="grid grid-cols-2 gap-5 md:grid-cols-4">
            <Dato
              titulo="Semana del plan"
              valor={
                semanaPlan === null
                  ? "—"
                  : semanaPlan < 1
                    ? "Por arrancar"
                    : semanaPlan > SEMANAS_DEL_PLAN
                      ? "Terminado"
                      : `${semanaPlan} de ${SEMANAS_DEL_PLAN}`
              }
              detalle={fase?.objetivo ?? (semanaPlan === null ? "Sin fecha de inicio" : undefined)}
            />
            <Dato titulo="Esta semana" valor={`${actual.sesiones} de ${SESIONES_POR_SEMANA}`} detalle="entrenamientos" />
            <Dato
              titulo="Volumen semanal"
              valor={formatoVolumen(actual.volumen)}
              detalle={
                variacion === null ? (
                  "sin semana anterior para comparar"
                ) : (
                  <span className={cx(variacion > 0 ? "text-verde" : variacion < 0 ? "text-rojo" : "")}>
                    {variacion > 0 ? "▲ +" : variacion < 0 ? "▼ " : ""}
                    {variacion}% vs. semana anterior
                  </span>
                )
              }
            />
            <Dato
              titulo="Último entrenamiento"
              valor={ultima ? fechaRelativa(ultima.fecha, hoy) : "—"}
              detalle={ultima ? tituloDeSesion(ultima) : "Sin registros"}
            />
          </dl>
        </Tarjeta>

        <div className="grid gap-4 md:grid-cols-2">
          <Tarjeta>
            <h2 className="text-[17px] font-bold">Entrenamientos por semana</h2>
            {lista.some((s) => s.sesiones > 0) ? (
              <div className="mt-3">
                <GraficoBarras
                  nombre="Entrenamientos por semana, últimas 12 semanas"
                  barras={lista.map((s) => ({ etiqueta: fechaCorta(s.lunes, hoy), valor: s.sesiones, detalle: `Semana del ${fechaCorta(s.lunes, hoy)}` }))}
                  formato={(n) => `${n} ${n === 1 ? "entrenamiento" : "entrenamientos"}`}
                  objetivo={SESIONES_POR_SEMANA}
                />
              </div>
            ) : (
              <Vacio titulo="Sin registros" texto="Todavía no hay entrenamientos terminados." />
            )}
          </Tarjeta>
          <Tarjeta>
            <h2 className="text-[17px] font-bold">Volumen por semana</h2>
            {lista.some((s) => s.volumen > 0) ? (
              <div className="mt-3">
                <GraficoBarras
                  nombre="Volumen por semana, últimas 12 semanas"
                  barras={lista.map((s) => ({ etiqueta: fechaCorta(s.lunes, hoy), valor: s.volumen, detalle: `${s.sesiones} entrenamientos` }))}
                  formato={formatoVolumen}
                />
              </div>
            ) : (
              <Vacio titulo="Sin registros" texto="El volumen es kilos × repeticiones de las series hechas." />
            )}
          </Tarjeta>
        </div>

        <Principales />
        <Recientes />
      </div>
    </>
  );
}

function Principales() {
  const { sesiones, series, hoy } = useDatos();
  const ejercicios = useEjerciciosConDatos();
  const elegidos = useMemo(() => {
    const conDatos = ejercicios.filter((e) => e.conDatos);
    const orden = [...conDatos.filter((e) => PRINCIPALES.includes(e.clave)), ...conDatos.filter((e) => !PRINCIPALES.includes(e.clave))];
    return orden.slice(0, 6).map((e) => ({ ...e, historia: historiaDeEjercicio(sesiones, series, e.clave) }));
  }, [ejercicios, sesiones, series]);

  if (elegidos.length === 0) return null;

  return (
    <section aria-labelledby="principales">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 id="principales" className="text-[17px] font-bold">
          Peso máximo por ejercicio
        </h2>
        <Link href="/progreso" className="text-[14px] font-semibold text-acento">
          Ver todos
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {elegidos.map((e) => {
          const primero = e.historia[0];
          const ultimo = e.historia.at(-1)!;
          const cambio = e.historia.length > 1 ? Math.round((ultimo.pesoMax - primero.pesoMax) * 10) / 10 : null;
          return (
            <Tarjeta key={e.clave} className="p-4">
              <h3 className="truncate text-[15px] font-semibold">{e.nombre}</h3>
              <p className="cifras mt-0.5 text-[22px] font-bold tracking-tight">{formatoKg(ultimo.pesoMax)}</p>
              <p className={cx("cifras text-[13px]", cambio && cambio > 0 ? "text-verde" : "text-tinta-suave")}>
                {cambio === null
                  ? "Un solo registro"
                  : cambio === 0
                    ? `Igual desde el ${fechaCorta(primero.fecha, hoy)}`
                    : `${cambio > 0 ? "+" : ""}${formatoKg(cambio)} desde el ${fechaCorta(primero.fecha, hoy)}`}
              </p>
              <div className="mt-2">
                <GraficoLinea
                  alto={110}
                  nombre={`Peso máximo en ${e.nombre}`}
                  formato={formatoKg}
                  puntos={e.historia.map((p) => ({ etiqueta: fechaCorta(p.fecha, hoy), valor: p.pesoMax, detalle: `× ${p.repsConPesoMax}` }))}
                />
              </div>
            </Tarjeta>
          );
        })}
      </div>
    </section>
  );
}

function Recientes() {
  const { sesiones, series, hoy } = useDatos();
  const recientes = sesiones.filter((s) => s.estado === "completada").slice(0, 10);
  return (
    <Tarjeta>
      <div className="flex items-baseline justify-between">
        <h2 className="text-[17px] font-bold">Últimos entrenamientos</h2>
        <Link href="/historial" className="text-[14px] font-semibold text-acento">
          Historial
        </Link>
      </div>
      {recientes.length === 0 ? (
        <Vacio titulo="Sin registros" texto="Todavía no terminaste ningún entrenamiento." />
      ) : (
        <TablaDeDatos
          className="mt-2"
          titulo="Últimos entrenamientos"
          columnas={["Entrenamiento", "Fecha", "Duración", "Series", "Volumen"]}
          filas={recientes.map((s) => {
            const propias = series.filter((x) => x.sesionId === s.id && x.hecha);
            return [
              tituloDeSesion(s),
              fechaCorta(s.fecha, hoy),
              s.fin ? duracion(s.inicio, s.fin) : "—",
              String(propias.length),
              formatoVolumen(volumen(propias)),
            ];
          })}
        />
      )}
    </Tarjeta>
  );
}
