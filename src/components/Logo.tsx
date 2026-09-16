import { useState } from 'react';

const madesaMark = '/assets/images_(2).png';

function MadesaMark({ size }: { size: number }) {
  const [imageAvailable, setImageAvailable] = useState(true);

  if (!imageAvailable) {
    return (
      <span
        className="flex items-center justify-center rounded-md bg-[#ed1c24] text-white font-bold leading-none"
        style={{ width: size, height: size, fontSize: size * 0.72 }}
        aria-label="Madesa"
      >
        m
      </span>
    );
  }

  return (
    <img
      src={madesaMark}
      alt="Madesa"
      onError={() => setImageAvailable(false)}
      className="rounded-md object-cover shrink-0 shadow-sm"
      style={{ width: size, height: size }}
    />
  );
}

export function MadesaLogo({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <MadesaMark size={size} />
      <div className="leading-none">
        <div
          className="font-display font-extrabold text-gray-900 tracking-[-0.04em]"
          style={{ fontSize: size * 0.5 }}
        >
          Madesa
        </div>
        <div
          className="font-display text-gray-400 font-semibold uppercase"
          style={{ fontSize: size * 0.27, letterSpacing: '0.16em', marginTop: size * 0.12 }}
        >
          Benchmark
        </div>
      </div>
    </div>
  );
}

export function MadesaLogoCompact({ size = 36 }: { size?: number }) {
  return (
    <MadesaMark size={size} />
  );
}

export function CompetitorAvatar({ name, size = 40, logoUrl }: { name: string; size?: number; logoUrl?: string | null }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className="rounded-lg shrink-0 border border-gray-200 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 font-semibold shrink-0 border border-gray-200"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}
