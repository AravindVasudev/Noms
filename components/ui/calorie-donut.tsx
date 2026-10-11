import React from 'react';
import Svg, { Circle } from 'react-native-svg';

export type DonutSegment = {
  /** Share of the full circle, 0..1. Segments are laid clockwise from the top. */
  fraction: number;
  color: string;
};

type Props = {
  size: number;
  strokeWidth?: number;
  trackColor?: string;
  segments: DonutSegment[];
};

export default function CalorieDonut({ size, strokeWidth = 16, trackColor = '#E5E5EA', segments }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const visible = segments.filter((seg) => seg.fraction > 0.001);
  const arcs = visible.map((seg, i) => {
    const start = visible.slice(0, i).reduce((acc, s) => acc + s.fraction, 0);
    const len = seg.fraction * circumference;
    return (
      <Circle
        key={i}
        cx={center}
        cy={center}
        r={radius}
        stroke={seg.color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="butt"
        strokeDasharray={`${len} ${circumference}`}
        strokeDashoffset={-start * circumference}
        transform={`rotate(-90 ${center} ${center})`}
      />
    );
  });

  return (
    <Svg width={size} height={size}>
      <Circle cx={center} cy={center} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
      {arcs}
    </Svg>
  );
}
