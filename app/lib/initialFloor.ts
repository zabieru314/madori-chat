import { FloorPlan } from "./types";

// 中廊下型レイアウト（全体 100 × 65）
// 廊下が y=25〜35 を水平に貫通し、全室が廊下と直接接触する
//
//  x: 0    30   50  60                100
//  y=0  [room1][bath][T][--- ldk ---]
//  y=25 [------  hall(廊下) ------][ldk]
//  y=35 [room2 ][---room3---][ldk     ]
//  y=65
//
export const INITIAL_FLOOR: FloorPlan = {
  total_width: 100,
  total_height: 65,
  rooms: [
    { id: "ldk",    name: "LDK",       x: 60, y: 0,  width: 40, height: 65, color: "#fff8e7" },
    { id: "room1",  name: "洋室①",    x: 0,  y: 0,  width: 30, height: 25, color: "#ede7f6" },
    { id: "room2",  name: "洋室②",    x: 0,  y: 35, width: 30, height: 30, color: "#ede7f6" },
    { id: "room3",  name: "洋室③",    x: 30, y: 35, width: 30, height: 30, color: "#ede7f6" },
    { id: "bath",   name: "浴室・洗面", x: 30, y: 0,  width: 20, height: 25, color: "#e0f7fa" },
    { id: "toilet", name: "トイレ",    x: 50, y: 0,  width: 10, height: 25, color: "#e8f5e9" },
    { id: "hall",   name: "廊下",      x: 0,  y: 25, width: 60, height: 10, color: "#f5f5f0" },
  ],
  doors: [
    // 玄関（廊下左壁・外壁）
    { roomId: "hall",   wall: "left", offset: 1,  size: 8 },
    // 廊下上壁 → 各部屋（room1・bath・toilet は廊下の上に面する）
    { roomId: "room1",  wall: "down", offset: 18, size: 7 },
    { roomId: "bath",   wall: "down", offset: 5,  size: 7 },
    { roomId: "toilet", wall: "down", offset: 2,  size: 5 },
    // 廊下下壁 → 各部屋（room2・room3 は廊下の下に面する）
    { roomId: "room2",  wall: "up",   offset: 18, size: 7 },
    { roomId: "room3",  wall: "up",   offset: 5,  size: 7 },
    // LDK はドアなし（廊下右端と接触するが開放的な間取りとして扱う）
  ],
  windows: [
    // 洋室①：上壁・左壁（外壁）
    { roomId: "room1",  wall: "up",    offset: 8,  size: 14 },
    { roomId: "room1",  wall: "left",  offset: 5,  size: 12 },
    // 浴室：上壁（外壁）
    { roomId: "bath",   wall: "up",    offset: 4,  size: 10 },
    // トイレ：上壁（外壁）
    { roomId: "toilet", wall: "up",    offset: 2,  size: 5  },
    // 洋室②：下壁・左壁（外壁）
    { roomId: "room2",  wall: "down",  offset: 5,  size: 14 },
    { roomId: "room2",  wall: "left",  offset: 5,  size: 12 },
    // 洋室③：下壁（外壁）
    { roomId: "room3",  wall: "down",  offset: 5,  size: 14 },
    // LDK：右壁2枚（バルコニー）・上壁・下壁（外壁）
    { roomId: "ldk",    wall: "right", offset: 5,  size: 22 },
    { roomId: "ldk",    wall: "right", offset: 38, size: 18 },
    { roomId: "ldk",    wall: "up",    offset: 8,  size: 18 },
    { roomId: "ldk",    wall: "down",  offset: 8,  size: 18 },
  ],
};

export const MIN_SIZE = 3;

// 1グリッド = 0.1m（10cm）
export const GRID_TO_M = 0.1;
