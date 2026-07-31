import { Circle, Path, Svg, Text, Text as SvgText, View } from "@react-pdf/renderer";

import { color, font, size } from "./theme";

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const rad = ((deg - 90) * Math.PI) / 180; // 0° au sommet du cercle
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

/**
 * react-pdf ne gère pas `strokeDashoffset` : l'arc est un `Path` calculé plutôt
 * qu'un cercle en pointillés décalé.
 */
const arcPath = (cx: number, cy: number, r: number, endDeg: number) => {
  const start = polar(cx, cy, r, 0);
  const end = polar(cx, cy, r, endDeg);
  const largeArc = endDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
};

export function Donut({
  score,
  diameter = 132,
  stroke = 11,
  trackColor = "#2E2A24",
  arcColor = color.goldBright,
  valueColor = color.cream,
}: {
  score: number;
  diameter?: number;
  stroke?: number;
  trackColor?: string;
  arcColor?: string;
  valueColor?: string;
}) {
  const r = (diameter - stroke) / 2;
  const c = diameter / 2;
  // 360° dégénère un arc SVG (départ et arrivée confondus) : on borne juste avant.
  const sweep = Math.min(Math.max(score, 0) * 3.6, 359.9);

  return (
    <View style={{ width: diameter, height: diameter, position: "relative" }}>
      <Svg width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`}>
        <Circle cx={c} cy={c} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        {sweep > 0 ? (
          <Path
            d={arcPath(c, c, r, sweep)}
            stroke={arcColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
          />
        ) : null}
        <SvgText
          x={c}
          y={c + 9}
          textAnchor="middle"
          fill={valueColor}
          stroke="none"
          style={{ fontFamily: font.sans, fontWeight: 700, fontSize: 30 }}
        >
          {String(Math.round(score))}
        </SvgText>
        <SvgText
          x={c}
          y={c + 24}
          textAnchor="middle"
          fill={color.goldBright}
          stroke="none"
          style={{ fontFamily: font.sans, fontSize: 9 }}
        >
          / 100
        </SvgText>
      </Svg>
    </View>
  );
}

/** Répartition des publications sur la semaine, en colonnes proportionnelles. */
export function WeekBars({
  data,
  height = 34,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end" }} wrap={false}>
      {data.map((d) => (
        <View key={d.label} style={{ flex: 1, alignItems: "center" }}>
          <View
            style={{
              width: 14,
              height: Math.max(2, (d.value / max) * height),
              backgroundColor: d.value === max ? color.gold : color.goldSoft,
              borderRadius: 2,
            }}
          />
          <Text
            style={{
              fontFamily: font.sans,
              fontSize: size.micro,
              color: color.muted,
              marginTop: 4,
            }}
          >
            {d.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
