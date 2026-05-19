"use client";

import { FloorPlan, Room, DoorSpec, WindowSpec } from "../lib/types";

interface Props {
  floor: FloorPlan;
}

const SVG_W = 680;
const SVG_H = 460;
const PAD = 28;

// フォント上限
const MAX_FONT = 12;
const MIN_FONT = 8;

export default function FloorPlanView({ floor }: Props) {
  const sx = (SVG_W - PAD * 2) / floor.total_width;
  const sy = (SVG_H - PAD * 2) / floor.total_height;

  const px = (x: number) => PAD + x * sx;
  const py = (y: number) => PAD + y * sy;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      style={{ display: "block", background: "#f0ede8" }}
    >
      <defs>
        {floor.rooms.map((r) => (
          <clipPath key={`cp-${r.id}`} id={`cp-${r.id}`}>
            <rect x={px(r.x) + 1} y={py(r.y) + 1} width={r.width * sx - 2} height={r.height * sy - 2} />
          </clipPath>
        ))}
      </defs>

      {/* 建物背景 */}
      <rect x={PAD} y={PAD} width={SVG_W - PAD * 2} height={SVG_H - PAD * 2} fill="#e8e3dc" />

      {/* 各部屋 */}
      {floor.rooms.map((r) => <RoomRect key={r.id} room={r} px={px} py={py} sx={sx} sy={sy} />)}

      {/* 窓（部屋の上に描く） */}
      {(floor.windows ?? []).map((w, i) => {
        const room = floor.rooms.find((r) => r.id === w.roomId);
        if (!room) return null;
        return <WindowMark key={i} win={w} room={room} px={px} py={py} sx={sx} sy={sy} />;
      })}

      {/* ドア（窓の上に描く） */}
      {(floor.doors ?? []).map((d, i) => {
        const room = floor.rooms.find((r) => r.id === d.roomId);
        if (!room) return null;
        return <DoorMark key={i} door={d} room={room} px={px} py={py} sx={sx} sy={sy} />;
      })}

      {/* LDKのキッチンカウンター */}
      <KitchenCounter floor={floor} px={px} py={py} sx={sx} sy={sy} />

      {/* 部屋ラベル（最前面） */}
      {floor.rooms.map((r) => <RoomLabel key={`lbl-${r.id}`} room={r} px={px} py={py} sx={sx} sy={sy} />)}

      {/* 外壁（最前面で上書き） */}
      <rect x={PAD} y={PAD} width={SVG_W - PAD * 2} height={SVG_H - PAD * 2} fill="none" stroke="#1a1a1a" strokeWidth={5} />
    </svg>
  );
}

/* ─── 部屋の矩形 ─── */
function RoomRect({ room, px, py, sx, sy }: { room: Room; px: (n: number) => number; py: (n: number) => number; sx: number; sy: number }) {
  return (
    <rect
      x={px(room.x)}
      y={py(room.y)}
      width={room.width * sx}
      height={room.height * sy}
      fill={room.color}
      stroke="#666"
      strokeWidth={1}
      style={{ transition: "x 0.5s ease, y 0.5s ease, width 0.5s ease, height 0.5s ease" }}
    />
  );
}

/* ─── 部屋ラベル ─── */
function RoomLabel({ room, px, py, sx, sy }: { room: Room; px: (n: number) => number; py: (n: number) => number; sx: number; sy: number }) {
  const rw = room.width * sx;
  const rh = room.height * sy;
  const cx = px(room.x) + rw / 2;
  const cy = py(room.y) + rh / 2;
  const minSide = Math.min(rw, rh);
  const fs = Math.max(MIN_FONT, Math.min(MAX_FONT, minSide * 0.17));

  if (minSide < 22) return null;

  return (
    <text
      x={cx}
      y={cy}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={fs}
      fontFamily="'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif"
      fontWeight="600"
      fill="#2a2a2a"
      clipPath={`url(#cp-${room.id})`}
      style={{ userSelect: "none", pointerEvents: "none", transition: "x 0.5s ease, y 0.5s ease" }}
    >
      {room.name}
    </text>
  );
}

/* ─── ドア ─── */
function DoorMark({ door, room, px, py, sx, sy }: {
  door: DoorSpec; room: Room;
  px: (n: number) => number; py: (n: number) => number;
  sx: number; sy: number;
}) {
  const { wall, offset, size } = door;

  if (wall === "left" || wall === "right") {
    const wallX = wall === "left" ? px(room.x) : px(room.x + room.width);
    const y1 = py(room.y + offset);
    const ds = size * sy;
    const y2 = y1 + ds;
    const arcDir = wall === "left" ? 1 : -1; // 室内方向（left壁なら右＝+1）

    return (
      <g>
        {/* 開口部（壁を白で消す） */}
        <line x1={wallX} y1={y1} x2={wallX} y2={y2} stroke="#f0ede8" strokeWidth={5} />
        {/* ドアの板 */}
        <line x1={wallX} y1={y1} x2={wallX + arcDir * ds} y2={y1} stroke="#888" strokeWidth={1} />
        {/* 開く軌跡の弧 */}
        <path
          d={`M ${wallX + arcDir * ds},${y1} A ${ds},${ds} 0 0,${wall === "left" ? 0 : 1} ${wallX},${y2}`}
          stroke="#999"
          strokeWidth={0.8}
          fill="none"
          strokeDasharray="3,2"
        />
      </g>
    );
  } else {
    // up / down
    const wallY = wall === "up" ? py(room.y) : py(room.y + room.height);
    const x1 = px(room.x + offset);
    const ds = size * sx;
    const x2 = x1 + ds;
    const arcDir = wall === "up" ? 1 : -1; // 室内方向（up壁なら下＝+1）

    return (
      <g>
        <line x1={x1} y1={wallY} x2={x2} y2={wallY} stroke="#f0ede8" strokeWidth={5} />
        <line x1={x1} y1={wallY} x2={x1} y2={wallY + arcDir * ds} stroke="#888" strokeWidth={1} />
        <path
          d={`M ${x1},${wallY + arcDir * ds} A ${ds},${ds} 0 0,${wall === "up" ? 1 : 0} ${x2},${wallY}`}
          stroke="#999"
          strokeWidth={0.8}
          fill="none"
          strokeDasharray="3,2"
        />
      </g>
    );
  }
}

/* ─── 窓 ─── */
function WindowMark({ win, room, px, py, sx, sy }: {
  win: WindowSpec; room: Room;
  px: (n: number) => number; py: (n: number) => number;
  sx: number; sy: number;
}) {
  const { wall, offset, size } = win;
  const GAP = 4; // 二重線の間隔

  if (wall === "left" || wall === "right") {
    const wallX = wall === "left" ? px(room.x) : px(room.x + room.width);
    const y1 = py(room.y + offset);
    const ws = size * sy;
    const y2 = y1 + ws;

    return (
      <g>
        <line x1={wallX - GAP / 2} y1={y1} x2={wallX - GAP / 2} y2={y2} stroke="#7ab" strokeWidth={3} />
        <line x1={wallX + GAP / 2} y1={y1} x2={wallX + GAP / 2} y2={y2} stroke="#7ab" strokeWidth={3} />
        <line x1={wallX - GAP / 2} y1={(y1 + y2) / 2} x2={wallX + GAP / 2} y2={(y1 + y2) / 2} stroke="#7ab" strokeWidth={1.5} />
      </g>
    );
  } else {
    // up / down
    const wallY = wall === "up" ? py(room.y) : py(room.y + room.height);
    const x1 = px(room.x + offset);
    const ws = size * sx;
    const x2 = x1 + ws;

    return (
      <g>
        <line x1={x1} y1={wallY - GAP / 2} x2={x2} y2={wallY - GAP / 2} stroke="#7ab" strokeWidth={3} />
        <line x1={x1} y1={wallY + GAP / 2} x2={x2} y2={wallY + GAP / 2} stroke="#7ab" strokeWidth={3} />
        <line x1={(x1 + x2) / 2} y1={wallY - GAP / 2} x2={(x1 + x2) / 2} y2={wallY + GAP / 2} stroke="#7ab" strokeWidth={1.5} />
      </g>
    );
  }
}

/* ─── キッチンカウンター（LDK内固定） ─── */
function KitchenCounter({ floor, px, py, sx, sy }: {
  floor: FloorPlan;
  px: (n: number) => number; py: (n: number) => number;
  sx: number; sy: number;
}) {
  const ldk = floor.rooms.find((r) => r.id === "ldk");
  if (!ldk) return null;

  // LDKの左下にL字カウンター
  const cW = ldk.width * 0.45 * sx;  // カウンター横幅
  const cH = ldk.height * 0.18 * sy; // カウンター奥行き
  const cX = px(ldk.x);
  const cY = py(ldk.y + ldk.height) - cH;

  // シンクの位置（カウンター右側）
  const sinkX = cX + cW * 0.6;
  const sinkW = cW * 0.25;
  const sinkH = cH * 0.55;
  const sinkY = cY + cH * 0.2;

  return (
    <g style={{ transition: "all 0.5s ease" }}>
      {/* カウンター本体 */}
      <rect x={cX + 1} y={cY} width={cW} height={cH} fill="#f5ead0" stroke="#bba" strokeWidth={1} />
      {/* 区切り線 */}
      <line x1={cX + 1} y1={cY + cH * 0.5} x2={cX + cW} y2={cY + cH * 0.5} stroke="#ccc" strokeWidth={0.8} />
      {/* シンク */}
      <rect x={sinkX} y={sinkY} width={sinkW} height={sinkH} fill="none" stroke="#bba" strokeWidth={1} rx={2} />
      <line x1={sinkX + sinkW / 2} y1={sinkY} x2={sinkX + sinkW / 2} y2={sinkY + sinkH} stroke="#ccc" strokeWidth={0.8} />
      {/* ラベル */}
      <text
        x={cX + cW / 3}
        y={cY + cH / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={Math.min(9, cH * 0.4)}
        fill="#888"
        fontFamily="sans-serif"
        style={{ userSelect: "none" }}
      >
        キッチン
      </text>
    </g>
  );
}
