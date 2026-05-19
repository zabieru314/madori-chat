import { FloorPlan } from "./types";

export const INITIAL_FLOOR: FloorPlan = {
  total_width: 100,
  total_height: 60,
  rooms: [
    { id: "ldk",    name: "LDK",      x: 65, y: 0,  width: 35, height: 60, color: "#ffebcd" },
    { id: "room1",  name: "洋室(上)", x: 35, y: 0,  width: 30, height: 30, color: "#e6e6fa" },
    { id: "room2",  name: "洋室(左下)", x: 0, y: 25, width: 25, height: 35, color: "#e6e6fa" },
    { id: "room3",  name: "洋室(中下)", x: 35, y: 30, width: 30, height: 30, color: "#e6e6fa" },
    { id: "bath",   name: "浴室・洗面", x: 15, y: 0, width: 20, height: 20, color: "#e0ffff" },
    { id: "toilet", name: "トイレ",    x: 25, y: 30, width: 10, height: 15, color: "#e0ffff" },
    { id: "hall",   name: "玄関・廊下", x: 0, y: 0, width: 15, height: 25, color: "#f5f5f5" },
  ],
};

export const MIN_SIZE = 8;
