"use client";

import { useEffect } from "react";
import { MARCA_DEMO } from "./Aplicacion";

export function EntrarDemo() {
  useEffect(() => {
    sessionStorage.setItem(MARCA_DEMO, "1");
    window.location.replace("/");
  }, []);
  return null;
}
