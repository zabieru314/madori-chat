"use client";

import { FloorPlan } from "../lib/types";

interface Props {
  floor: FloorPlan;
}

const SVG_WIDTH = 600;
const SVG_HEIGHT = 360;
const PADDING = 20;

export default function FloorPlanView({ floor }: Props) {
  const scaleX = (SVG_WIDTH - PADDING * 2) / floor.total_width;
  const scaleY = (SVG_HEIGHT - PADDING * 2) / floor.total_height;

  const toSvgX = (x: number) => PADDING + x * scaleX;
  const toSvgY = (y: number) => PADDING + y * scaleY;
  const toSvgW = (w: number) => w * scaleX;
  const toSvgH = (h: number) => h * scaleY;

  return (
    <svg
      width={SVG_WIDTH}
      height={SVG_HEIGHT}
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      className="w-full h-full"
      style={{ background: "#fafafa", border: "2px solid #ccc", borderRadius: "8px" }}
    >
      {/* 外枠 */}
      <rect
        x={PADDING}
        y={PADDING}
        width={SVG_WIDTH - PADDING * 2}
        height={SVG_HEIGHT - PADDING * 2}
        fill="none"
        stroke="#333"
        strokeWidth={3}
      />

      {/* 各部屋 */}
      {floor.rooms.map((room) => (
        <g key={room.id}>
          <rect
            x={toSvgX(room.x)}
            y={toSvgY(room.y)}
            width={toSvgW(room.width)}
            height={toSvgH(room.height)}
            fill={room.color}
            stroke="#555"
            strokeWidth={1.5}
            style={{ transition: "all 0.5s ease" }}
          />
          {/* 部屋名ラベル */}
          <text
            x={toSvgX(room.x) + toSvgW(room.width) / 2}
            y={toSvgY(room.y) + toSvgH(room.height) / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={Math.min(toSvgW(room.width), toSvgH(room.height)) * 0.22}
            fill="#333"
            fontWeight="500"
            style={{ transition: "all 0.5s ease", userSelect: "none" }}
          >
            {room.name}
          </text>
          {/* サイズ表示（小さいテキスト） */}
          <text
            x={toSvgX(room.x) + toSvgW(room.width) / 2}
            y={toSvgY(room.y) + toSvgH(room.height) / 2 + Math.min(toSvgW(room.width), toSvgH(room.height)) * 0.18}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={Math.min(toSvgW(room.width), toSvgH(room.height)) * 0.14}
            fill="#666"
            style={{ transition: "all 0.5s ease", userSelect: "none" }}
          >
            {room.width.toFixed(0)}×{room.height.toFixed(0)}
          </text>
        </g>
      ))}
    </svg>
  );
}
