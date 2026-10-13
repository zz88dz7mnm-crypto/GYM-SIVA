// Genera los íconos de la app: la pesa de GYM. Uso: node scripts/iconos.mjs
import sharp from "sharp";

// La pesa ocupa la mitad del lado: entra en la zona segura de los íconos "maskable".
const icono = (lado) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 96 96">
    <rect width="96" height="96" fill="#c2410c"/>
    <g transform="translate(24 24) scale(2)" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round">
      <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>
    </g>
  </svg>`;

const salidas = [
  ["public/iconos/gym-192.png", 192],
  ["public/iconos/gym-512.png", 512],
  ["src/app/apple-icon.png", 180],
  ["src/app/icon.png", 96],
];

for (const [ruta, lado] of salidas) {
  await sharp(Buffer.from(icono(lado))).png().toFile(ruta);
  console.log(ruta);
}
