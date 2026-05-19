import { FloorPlan } from "./types";

// 全体: 100 × 65
// 左端に縦廊下(hall)、その右に浴室・トイレ・洋室②が縦に並ぶ
// 上段右に洋室①、下段右に洋室③、右端にLDK
export const INITIAL_FLOOR: FloorPlan = {
  total_width: 100,
  total_height: 65,
  rooms: [
    { id: "ldk",    name: "LDK",      x: 60, y: 0,  width: 40, height: 65, color: "#fff8e7" },
    { id: "room1",  name: "洋室①",   x: 30, y: 0,  width: 30, height: 32, color: "#ede7f6" },
    { id: "room2",  name: "洋室②",   x: 12, y: 32, width: 18, height: 33, color: "#ede7f6" },
    { id: "room3",  name: "洋室③",   x: 30, y: 32, width: 30, height: 33, color: "#ede7f6" },
    { id: "bath",   name: "浴室・洗面", x: 12, y: 0, width: 18, height: 22, color: "#e0f7fa" },
    { id: "toilet", name: "トイレ",   x: 12, y: 22, width: 18, height: 10, color: "#e8f5e9" },
    { id: "hall",   name: "廊下",     x: 0,  y: 0,  width: 12, height: 65, color: "#f5f5f0" },
  ],
  doors: [
    // 玄関（廊下の下壁・外から）
    { roomId: "hall",   wall: "down",  offset: 2,  size: 7 },
    // 廊下 → 浴室・洗面
    { roomId: "bath",   wall: "left",  offset: 5,  size: 7 },
    // 廊下 → トイレ
    { roomId: "toilet", wall: "left",  offset: 2,  size: 5 },
    // 廊下 → 洋室②
    { roomId: "room2",  wall: "left",  offset: 8,  size: 7 },
    // 浴室側 → 洋室①（廊下から浴室脇を通る動線）
    { roomId: "room1",  wall: "left",  offset: 12, size: 7 },
    // 洋室③ → 廊下側（下廊下想定）
    { roomId: "room3",  wall: "left",  offset: 5,  size: 7 },
    // LDK入口
    { roomId: "ldk",    wall: "left",  offset: 26, size: 8 },
  ],
  windows: [
    // LDK右壁（バルコニー側）2枚
    { roomId: "ldk",    wall: "right", offset: 5,  size: 22 },
    { roomId: "ldk",    wall: "right", offset: 38, size: 18 },
    // LDK下壁
    { roomId: "ldk",    wall: "down",  offset: 5,  size: 20 },
    // 洋室①上壁
    { roomId: "room1",  wall: "up",    offset: 7,  size: 14 },
    // 洋室②下壁
    { roomId: "room2",  wall: "down",  offset: 3,  size: 10 },
    // 洋室③下壁
    { roomId: "room3",  wall: "down",  offset: 5,  size: 13 },
    // 浴室上壁（換気窓）
    { roomId: "bath",   wall: "up",    offset: 4,  size: 8  },
  ],
};

export const MIN_SIZE = 8;
