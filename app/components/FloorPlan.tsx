"use client";

import { FloorPlan } from "../lib/types";

interface Props {
  floor: FloorPlan;
}

const SVG_WIDTH = 640;
const SVG_HEIGHT = 400;
const PADDING = 24;

// 最大フォントサイズ
const MAX_FONT = 13;
const MIN_FONT = 8;

// 部屋名を2行に分割するマッピング
const NAME_LINES: Record<string, string[]> = {
  "浴室・洗面": ["浴室", "洗面"],
  "玄関・廊下": ["玄関", "廊下"],
  "洋室(上)": ["洋室", "（上）"],
  "洋室(左下)": ["洋室", "（左下）"],
  "洋室(中下)": ["洋室", "（中下）"],
};

export default function FloorPlanView({ floor }: Props) {
  const scaleX = (SVG_WIDTH - PADDING * 2) / floor.total_width;
  const scaleY = (SVG_HEIGHT - PADDING * 2) / floor.total_height;

  const toSvgX = (x: number) => PADDING + x * scaleX;
  const toSvgY = (y: number) => PADDING + y * scaleY;
  const toSvgW = (w: number) => w * scaleX;
  const toSvgH = (h: number) => h * scaleY;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      style={{ display: "block", background: "#f8f6f1", borderRadius: "6px" }}
    >
      <defs>
        {/* 各部屋のクリップパス */}
        {floor.rooms.map((room) => (
          <clipPath key={`clip-${room.id}`} id={`clip-${room.id}`}>
            <rect
              x={toSvgX(room.x) + 2}
              y={toSvgY(room.y) + 2}
              width={toSvgW(room.width) - 4}
              height={toSvgH(room.height) - 4}
            />
          </clipPath>
        ))}
      </defs>

      {/* 背景塗り（外壁の内側） */}
      <rect
        x={PADDING}
        y={PADDING}
        width={SVG_WIDTH - PADDING * 2}
        height={SVG_HEIGHT - PADDING * 2}
        fill="#e8e4dc"
      />

      {/* 各部屋 */}
      {floor.rooms.map((room) => {
        const rx = toSvgX(room.x);
        const ry = toSvgY(room.y);
        const rw = toSvgW(room.width);
        const rh = toSvgH(room.height);
        const cx = rx + rw / 2;
        const cy = ry + rh / 2;

        // 部屋の最小辺に基づくフォントサイズ（上限・下限あり）
        const minSide = Math.min(rw, rh);
        const fontSize = Math.max(MIN_FONT, Math.min(MAX_FONT, minSide * 0.18));

        // 2行表示するか
        const lines = NAME_LINES[room.name] ?? [room.name];
        const tooSmall = minSide < 30; // 小さすぎる部屋はテキスト非表示
        const lineHeight = fontSize * 1.3;

        return (
          <g key={room.id}>
            {/* 部屋塗り */}
            <rect
              x={rx}
              y={ry}
              width={rw}
              height={rh}
              fill={room.color}
              stroke="#888"
              strokeWidth={1}
              style={{ transition: "x 0.5s ease, y 0.5s ease, width 0.5s ease, height 0.5s ease" }}
            />

            {/* 部屋名（clipPathで確実にはみ出しなし） */}
            {!tooSmall && (
              <g clipPath={`url(#clip-${room.id})`}>
                {lines.map((line, i) => {
                  const offsetY = lines.length === 1
                    ? 0
                    : (i - (lines.length - 1) / 2) * lineHeight;
                  return (
                    <text
                      key={i}
                      x={cx}
                      y={cy + offsetY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={fontSize}
                      fontFamily="'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif"
                      fontWeight="600"
                      fill="#2d2d2d"
                      letterSpacing="-0.3"
                      style={{
                        transition: "x 0.5s ease, y 0.5s ease",
                        userSelect: "none",
                        pointerEvents: "none",
                      }}
                    >
                      {line}
                    </text>
                  );
                })}
              </g>
            )}

            {/* 小さい部屋の省略ラベル */}
            {tooSmall && minSide >= 18 && (
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={MIN_FONT}
                fontFamily="sans-serif"
                fill="#444"
                style={{ userSelect: "none", pointerEvents: "none" }}
              >
                {room.name.slice(0, 2)}
              </text>
            )}
          </g>
        );
      })}

      {/* 外壁（一番上に重ねて太く描く） */}
      <rect
        x={PADDING}
        y={PADDING}
        width={SVG_WIDTH - PADDING * 2}
        height={SVG_HEIGHT - PADDING * 2}
        fill="none"
        stroke="#222"
        strokeWidth={4}
      />
    </svg>
  );
}
