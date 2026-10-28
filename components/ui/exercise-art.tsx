import React from 'react';
import Svg, { Circle, Ellipse, Line, Rect } from 'react-native-svg';

type HighlightKind =
  | 'chest'
  | 'shoulders'
  | 'back'
  | 'legs'
  | 'glutes'
  | 'biceps'
  | 'triceps'
  | 'none';

type BarGlyph =
  | 'flat'
  | 'incline'
  | 'overhead'
  | 'wide'
  | 'low'
  | 'shoulder'
  | 'footplate'
  | 'hip'
  | 'cable'
  | 'dumbbells'
  | 'dipbars'
  | null;

const KIND_BY_IMAGE: Record<string, HighlightKind> = {
  'bench-press': 'chest',
  'incline-bench-press': 'chest',
  dips: 'chest',
  'overhead-press': 'shoulders',
  'lateral-raise': 'shoulders',
  'barbell-row': 'back',
  'lat-pulldown': 'back',
  'pull-up': 'back',
  deadlift: 'back',
  squat: 'legs',
  'leg-press': 'legs',
  'hip-thrust': 'glutes',
  'bicep-curl': 'biceps',
  'triceps-pushdown': 'triceps',
};

const BAR_BY_IMAGE: Record<string, BarGlyph> = {
  'bench-press': 'flat',
  'incline-bench-press': 'incline',
  dips: 'dipbars',
  'overhead-press': 'overhead',
  'lateral-raise': 'dumbbells',
  'barbell-row': 'low',
  'lat-pulldown': 'wide',
  'pull-up': 'overhead',
  deadlift: 'low',
  squat: 'shoulder',
  'leg-press': 'footplate',
  'hip-thrust': 'hip',
  'bicep-curl': 'dumbbells',
  'triceps-pushdown': 'cable',
};

function Highlight({ kind, color }: { kind: HighlightKind; color: string }) {
  const fill = { fill: color, fillOpacity: 0.4 };
  switch (kind) {
    case 'chest':
      return (
        <>
          <Ellipse cx={27.5} cy={33} rx={4.5} ry={6} transform="rotate(-15 27.5 33)" {...fill} />
          <Ellipse cx={36.5} cy={33} rx={4.5} ry={6} transform="rotate(15 36.5 33)" {...fill} />
        </>
      );
    case 'shoulders':
      return (
        <>
          <Circle cx={22} cy={25} r={4.5} {...fill} />
          <Circle cx={42} cy={25} r={4.5} {...fill} />
        </>
      );
    case 'back':
      return (
        <>
          <Ellipse cx={22.5} cy={40} rx={3.5} ry={10} transform="rotate(8 22.5 40)" {...fill} />
          <Ellipse cx={41.5} cy={40} rx={3.5} ry={10} transform="rotate(-8 41.5 40)" {...fill} />
        </>
      );
    case 'legs':
      return (
        <>
          <Rect x={23.5} y={66} width={7} height={11} rx={3} {...fill} />
          <Rect x={33.5} y={66} width={7} height={11} rx={3} {...fill} />
        </>
      );
    case 'glutes':
      return <Ellipse cx={32} cy={60.5} rx={8} ry={5} {...fill} />;
    case 'biceps':
      return (
        <>
          <Line x1={21.5} y1={28} x2={19.5} y2={37} stroke={color} strokeWidth={5} strokeLinecap="round" opacity={0.45} />
          <Line x1={42.5} y1={28} x2={44.5} y2={37} stroke={color} strokeWidth={5} strokeLinecap="round" opacity={0.45} />
        </>
      );
    case 'triceps':
      return (
        <>
          <Line x1={19.5} y1={37} x2={17.5} y2={45} stroke={color} strokeWidth={5} strokeLinecap="round" opacity={0.45} />
          <Line x1={44.5} y1={37} x2={46.5} y2={45} stroke={color} strokeWidth={5} strokeLinecap="round" opacity={0.45} />
        </>
      );
    case 'none':
      return null;
  }
}

function Bar({ glyph, color }: { glyph: BarGlyph; color: string }) {
  const s = { stroke: color, strokeWidth: 2.5, strokeLinecap: 'round' as const };
  const plate = { fill: color };
  switch (glyph) {
    case 'flat':
      return (
        <>
          <Line x1={16} y1={26} x2={48} y2={26} {...s} />
          <Rect x={13.5} y={22.5} width={3} height={7} rx={1} {...plate} />
          <Rect x={47.5} y={22.5} width={3} height={7} rx={1} {...plate} />
        </>
      );
    case 'incline':
      return (
        <>
          <Line x1={18} y1={32} x2={46} y2={20} {...s} />
          <Rect x={15} y={29} width={3} height={7} rx={1} transform="rotate(-24 16.5 32.5)" {...plate} />
          <Rect x={46} y={17} width={3} height={7} rx={1} transform="rotate(-24 47.5 20.5)" {...plate} />
        </>
      );
    case 'overhead':
      return (
        <>
          <Line x1={14} y1={13} x2={50} y2={13} {...s} />
          <Rect x={11.5} y={9.5} width={3} height={7} rx={1} {...plate} />
          <Rect x={49.5} y={9.5} width={3} height={7} rx={1} {...plate} />
        </>
      );
    case 'wide':
      return <Line x1={12} y1={11} x2={52} y2={11} {...s} />;
    case 'low':
      return (
        <>
          <Line x1={16} y1={82} x2={48} y2={82} {...s} />
          <Rect x={13.5} y={78.5} width={3} height={7} rx={1} {...plate} />
          <Rect x={47.5} y={78.5} width={3} height={7} rx={1} {...plate} />
        </>
      );
    case 'shoulder':
      return <Line x1={17} y1={20} x2={47} y2={20} {...s} />;
    case 'footplate':
      return <Rect x={18} y={88} width={28} height={3} rx={1.5} {...plate} />;
    case 'hip':
      return (
        <>
          <Line x1={18} y1={58} x2={46} y2={58} {...s} />
          <Rect x={15.5} y={54.5} width={3} height={7} rx={1} {...plate} />
          <Rect x={45.5} y={54.5} width={3} height={7} rx={1} {...plate} />
        </>
      );
    case 'cable':
      return (
        <>
          <Line x1={32} y1={2} x2={32} y2={16} {...s} />
          <Line x1={26} y1={19} x2={38} y2={19} {...s} />
        </>
      );
    case 'dumbbells':
      return (
        <>
          <Rect x={11} y={54} width={7} height={4} rx={1} {...plate} />
          <Rect x={46} y={54} width={7} height={4} rx={1} {...plate} />
        </>
      );
    case 'dipbars':
      return (
        <>
          <Line x1={13} y1={48} x2={13} y2={70} {...s} />
          <Line x1={51} y1={48} x2={51} y2={70} {...s} />
        </>
      );
    case null:
      return null;
  }
}

export function ExerciseArt({
  imageKey,
  size = 40,
  stroke,
  highlight,
}: {
  imageKey: string;
  size?: number;
  stroke: string;
  highlight: string;
}) {
  const kind = KIND_BY_IMAGE[imageKey] ?? 'none';
  const bar = BAR_BY_IMAGE[imageKey] ?? null;
  const w = Math.round(size * 0.66);
  const h = Math.round(size * 0.95);
  const s = {
    stroke,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    fill: 'none' as const,
  };
  return (
    <Svg width={w} height={h} viewBox="0 0 64 96">
      <Highlight kind={kind} color={highlight} />
      <Circle cx={32} cy={9} r={6} {...s} />
      <Line x1={32} y1={15} x2={32} y2={20} {...s} />
      <Line x1={22} y1={22} x2={42} y2={22} {...s} />
      <Line x1={32} y1={20} x2={32} y2={58} {...s} />
      <Ellipse cx={32} cy={34} rx={9} ry={11} {...s} />
      <Rect x={24} y={56} width={16} height={9} rx={3} {...s} />
      <Line x1={23} y1={23} x2={18} y2={40} {...s} />
      <Line x1={18} y1={40} x2={15} y2={56} {...s} />
      <Line x1={41} y1={23} x2={46} y2={40} {...s} />
      <Line x1={46} y1={40} x2={49} y2={56} {...s} />
      <Line x1={28} y1={65} x2={27} y2={78} {...s} />
      <Line x1={27} y1={78} x2={27} y2={90} {...s} />
      <Line x1={27} y1={90} x2={31} y2={90} {...s} />
      <Line x1={36} y1={65} x2={37} y2={78} {...s} />
      <Line x1={37} y1={78} x2={37} y2={90} {...s} />
      <Line x1={37} y1={90} x2={33} y2={90} {...s} />
      <Bar glyph={bar} color={stroke} />
    </Svg>
  );
}
