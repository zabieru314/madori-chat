export interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface FloorPlan {
  total_width: number;
  total_height: number;
  rooms: Room[];
}

// AIが返すアクション
export type Direction = "left" | "right" | "up" | "down";

export interface FloorAction {
  type: "expand" | "shrink" | "no_change";
  target_room: string;
  direction?: Direction;
  delta?: number;
  message: string;
}

// チャット履歴の1エントリ
export interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  snapshot?: FloorPlan; // assistantメッセージ時に変形後の図面スナップショットを保存
}
