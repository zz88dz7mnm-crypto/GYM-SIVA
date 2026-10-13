type Props = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** La pesa de GYM. */
export function Pesa({ className = "size-6" }: Props) {
  return (
    <svg {...base} className={className} strokeWidth={2.2}>
      <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
    </svg>
  );
}

export function IconoHoy({ className = "size-6" }: Props) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconoHistorial({ className = "size-6" }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <circle cx="4" cy="6" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconoProgreso({ className = "size-6" }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 19.5h17" />
      <path d="m4.5 15 4.5-4.5 3.5 3.5 7-7" />
      <path d="M15 7h4.5v4.5" />
    </svg>
  );
}

export function IconoPlan({ className = "size-6" }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M7 3.5h10a2 2 0 0 1 2 2v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-14a2 2 0 0 1 2-2Z" />
      <path d="M9 8.5h6M9 12.5h6M9 16.5h3.5" />
    </svg>
  );
}

export function IconoPanel({ className = "size-6" }: Props) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="3.5" width="7" height="9" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="5" rx="2" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="2" />
      <rect x="3.5" y="15.5" width="7" height="5" rx="2" />
    </svg>
  );
}

export function IconoCheck({ className = "size-5" }: Props) {
  return (
    <svg {...base} className={className} strokeWidth={2.6}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function IconoMas({ className = "size-5" }: Props) {
  return (
    <svg {...base} className={className} strokeWidth={2.2}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconoMenos({ className = "size-5" }: Props) {
  return (
    <svg {...base} className={className} strokeWidth={2.2}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconoReloj({ className = "size-5" }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 9.5V13l2.5 1.5M10 2.5h4" />
    </svg>
  );
}

export function IconoAtras({ className = "size-5" }: Props) {
  return (
    <svg {...base} className={className} strokeWidth={2.2}>
      <path d="m14.5 5-7 7 7 7" />
    </svg>
  );
}

export function IconoFlecha({ className = "size-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function IconoTrofeo({ className = "size-5" }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H5a2.5 2.5 0 0 0 3 4M16 6h3a2.5 2.5 0 0 1-3 4M12 13v4M8.5 20.5h7M10 17h4" />
    </svg>
  );
}

export function IconoSubir({ className = "size-4" }: Props) {
  return (
    <svg {...base} className={className} strokeWidth={2.4}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}
