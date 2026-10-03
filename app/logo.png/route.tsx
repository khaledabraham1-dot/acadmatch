import { ImageResponse } from "next/og";

/**
 * Logo carré à URL stable (/logo.png), exigé par les données structurées
 * « Organization » (au moins 112 px). Reprend la marque « Radar » du site
 * (components/shell/Logo.tsx) : un secteur à 87 % sur fond clair.
 */
export const dynamic = "force-static";

const SIZE = 512;
const CENTER = SIZE / 2;
const RADIUS = SIZE; // assez grand pour couvrir tout le carré
const FILL = 0.87;

function sectorPath(): string {
  const angle = FILL * 2 * Math.PI;
  const x = CENTER + RADIUS * Math.sin(angle);
  const y = CENTER - RADIUS * Math.cos(angle);
  return `M ${CENTER} ${CENTER} L ${CENTER} ${CENTER - RADIUS} A ${RADIUS} ${RADIUS} 0 1 1 ${x.toFixed(1)} ${y.toFixed(1)} Z`;
}

export function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", borderRadius: 150, overflow: "hidden", background: "#dce3df" }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <path d={sectorPath()} fill="#0a7d55" />
        </svg>
      </div>
    ),
    { width: SIZE, height: SIZE },
  );
}
