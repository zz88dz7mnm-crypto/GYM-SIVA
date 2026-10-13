import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GYM",
    short_name: "GYM",
    description: "Tu plan de entrenamiento, tus pesos y tu progreso.",
    lang: "es-AR",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f2f3f7",
    theme_color: "#f2f3f7",
    icons: [
      { src: "/iconos/gym-192.png", sizes: "192x192", type: "image/png" },
      { src: "/iconos/gym-512.png", sizes: "512x512", type: "image/png" },
      { src: "/iconos/gym-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
