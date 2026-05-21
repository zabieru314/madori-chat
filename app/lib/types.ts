export interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

// ドア定義（壁の相対位置）
export interface DoorSpec {
  roomId: string;
  wall: "left" | "right" | "up" | "down";
  offset: number; // 壁始点からのグリッド単位
  size: number;   // ドア幅（グリッド単位）
}

// 窓定義（外壁面の相対位置）
export interface WindowSpec {
  roomId: string;
  wall: "left" | "right" | "up" | "down";
  offset: number;
  size: number;
}

export interface FloorPlan {
  total_width: number;
  total_height: number;
  rooms: Room[];
  doors: DoorSpec[];
  windows: WindowSpec[];
}

export type Direction = "left" | "right" | "up" | "down";

export interface FloorAction {
  type: "expand" | "shrink" | "no_change" | "ask";
  target_room: string;
  direction?: Direction;
  delta?: number;
  message: string;
}

export interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  snapshot?: FloorPlan;
}
