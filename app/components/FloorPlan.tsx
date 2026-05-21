"use client";

import { FloorPlan, Room, DoorSpec, WindowSpec } from "../lib/types";
import { GRID_TO_M } from "../lib/initialFloor";

interface Props {
  floor: FloorPlan;
}

const SVG_W = 680;
const SVG_H = 460;
const PAD = 28;

const MAX_FONT = 12;
const MIN_FONT = 8;
const DOOMA_RATIO = 0.18; // 土間エリアの割合（hallの左18%）

export default function FloorPlanView({ floor }: Props) {
  const sx = (SVG_W - PAD * 2) / floor.total_width;
  const sy = (SVG_H - PAD * 2) / floor.total_height;

  const px = (x: number) => PAD + x * sx;
  const py = (y: number) => PAD + y * sy;

  return (
    <svg
      id="floor-plan-svg"
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
        <pattern id="tile-pattern" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
          <rect width="14" height="14" fill="#dde3ec" />
          <rect width="14" height="14" fill="none" stroke="#c8d0dc" strokeWidth="0.7" />
        </pattern>
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

      {/* 玄関・土間 */}
      <EntranceArea floor={floor} px={px} py={py} sx={sx} sy={sy} />

      {/* キッチン */}
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
  // hallは土間エリアを除いた廊下部分の中央にラベルを表示
  const doomaW = room.id === "hall" ? rw * DOOMA_RATIO : 0;
  const cx = room.id === "hall"
    ? px(room.x) + doomaW + (rw - doomaW) / 2
    : px(room.x) + rw / 2;
  const cy = py(room.y) + rh / 2;
  const minSide = Math.min(rw, rh);
  const fs = Math.max(MIN_FONT, Math.min(MAX_FONT, minSide * 0.17));

  if (minSide < 22) return null;

  const mW = (room.width * GRID_TO_M).toFixed(1);
  const mH = (room.height * GRID_TO_M).toFixed(1);
  const sqM = (room.width * room.height * GRID_TO_M * GRID_TO_M).toFixed(1);
  const tsubo = (room.width * room.height * GRID_TO_M * GRID_TO_M / 3.305785).toFixed(1);
  const showDims = rh > 50 && rw > 35;

  const lineH = fs * 1.4;
  const baseY = showDims ? cy - lineH : cy;

  const commonProps = {
    textAnchor: "middle" as const,
    fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
    fill: "#2a2a2a",
    clipPath: `url(#cp-${room.id})`,
    style: { userSelect: "none" as const, pointerEvents: "none" as const, transition: "x 0.5s ease, y 0.5s ease" },
  };

  return (
    <text x={cx} y={baseY} {...commonProps}>
      <tspan x={cx} dy="0" fontSize={fs} fontWeight="600">{room.name}</tspan>
      {showDims && (
        <>
          <tspan x={cx} dy={lineH} fontSize={fs * 0.88} fontWeight="400">{mW}×{mH}m</tspan>
          <tspan x={cx} dy={lineH * 0.95} fontSize={fs * 0.85} fontWeight="400">{sqM}㎡/{tsubo}坪</tspan>
        </>
      )}
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

/* ─── キッチンカウンター ─── */
function KitchenCounter({ floor, px, py, sx, sy }: {
  floor: FloorPlan;
  px: (n: number) => number; py: (n: number) => number;
  sx: number; sy: number;
}) {
  const ldk = floor.rooms.find((r) => r.id === "ldk");
  if (!ldk) return null;

  const lW = ldk.width * sx;
  const lH = ldk.height * sy;
  const lX = px(ldk.x);
  const lY = py(ldk.y);

  // LDK上端に横置き（廊下接続点 y=25〜35 から遠い上側に配置して導線を確保）
  const len   = lW * 0.72;       // 長さ（x方向）
  const depth = lH * 0.11;       // 奥行き（y方向） ≈ LDK高さの1/9
  const kX = lX + 1;             // 左壁密着
  const kY = lY + 1;             // 上壁密着

  // シンク（左寄り・小さめ）
  const sW = len * 0.20;
  const sH = depth * 0.55;
  const sX = kX + len * 0.08;
  const sY = kY + (depth - sH) / 2;

  // コンロ3口（三角配置・右寄り）
  const br = Math.min(len, depth) * 0.075;
  const bcx = kX + len * 0.68;
  const bcy = kY + depth / 2;
  const burners = [
    { x: bcx - br * 1.5, y: bcy - br * 0.9 },
    { x: bcx + br * 1.5, y: bcy - br * 0.9 },
    { x: bcx,            y: bcy + br * 1.1  },
  ];

  return (
    <g style={{ transition: "all 0.5s ease" }}>
      {/* カウンター本体 */}
      <rect x={kX} y={kY} width={len} height={depth} fill="#c4bdb5" stroke="#9a9088" strokeWidth={1} rx={1} />
      {/* 前面ライン（カウンター下端） */}
      <line x1={kX + 1} y1={kY + depth} x2={kX + len - 1} y2={kY + depth} stroke="#9a9088" strokeWidth={2} />

      {/* シンク */}
      <rect x={sX} y={sY} width={sW} height={sH} fill="#a8cfe0" stroke="#6fa8c0" strokeWidth={0.8} rx={2} />
      <circle cx={sX + sW / 2} cy={sY + sH / 2} r={sH * 0.2} fill="none" stroke="#6fa8c0" strokeWidth={0.6} />

      {/* コンロ3口 */}
      {burners.map((b, i) => (
        <g key={i}>
          <circle cx={b.x} cy={b.y} r={br} fill="#444" stroke="#333" strokeWidth={0.6} />
          <circle cx={b.x} cy={b.y} r={br * 0.5} fill="none" stroke="#666" strokeWidth={0.5} />
        </g>
      ))}
    </g>
  );
}

/* ─── 玄関・土間 ─── */
function EntranceArea({ floor, px, py, sx, sy }: {
  floor: FloorPlan;
  px: (n: number) => number; py: (n: number) => number;
  sx: number; sy: number;
}) {
  const hall = floor.rooms.find((r) => r.id === "hall");
  if (!hall) return null;

  const hX = px(hall.x);
  const hY = py(hall.y);
  const hW = hall.width * sx;
  const hH = hall.height * sy;

  const dW = hW * DOOMA_RATIO;       // 土間幅
  const kamachiX = hX + dW;          // 上がり框X

  return (
    <g style={{ transition: "all 0.5s ease" }}>
      {/* 土間（タイルパターン） */}
      <rect x={hX + 1} y={hY + 1} width={dW - 1} height={hH - 2} fill="url(#tile-pattern)" />

      {/* 上がり框（二重線） */}
      <line x1={kamachiX} y1={hY + 1} x2={kamachiX} y2={hY + hH - 1} stroke="#94a3b8" strokeWidth={3} />
      <line x1={kamachiX + 3} y1={hY + 2} x2={kamachiX + 3} y2={hY + hH - 2} stroke="#64748b" strokeWidth={1} />

      {/* 玄関テキスト */}
      <text
        x={hX + dW / 2}
        y={hY + hH / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={Math.max(7, Math.min(9, hH * 0.22))}
        fontFamily="'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif"
        fontWeight="600"
        fill="#475569"
        style={{ userSelect: "none", pointerEvents: "none" } as React.CSSProperties}
      >
        玄関
      </text>
    </g>
  );
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

