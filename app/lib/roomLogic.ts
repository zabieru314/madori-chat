import { FloorPlan, Room, Direction, FloorAction } from "./types";
import { MIN_SIZE } from "./initialFloor";

export function cloneFloor(floor: FloorPlan): FloorPlan {
  return {
    ...floor,
    rooms: floor.rooms.map((r) => ({ ...r })),
    doors: floor.doors ? [...floor.doors] : [],
    windows: floor.windows ? [...floor.windows] : [],
  };
}

// targetの指定方向の境界と接触している部屋を返す
function getAdjacentRooms(floor: FloorPlan, target: Room, dir: Direction): Room[] {
  const TOL = 1;
  return floor.rooms.filter((r) => {
    if (r.id === target.id) return false;
    // 縦方向に重なっているか
    const overlapH = r.x < target.x + target.width - TOL && r.x + r.width > target.x + TOL;
    // 横方向に重なっているか
    const overlapV = r.y < target.y + target.height - TOL && r.y + r.height > target.y + TOL;
    switch (dir) {
      case "left":  return Math.abs(r.x + r.width - target.x) <= TOL && overlapV;
      case "right": return Math.abs(r.x - (target.x + target.width)) <= TOL && overlapV;
      case "up":    return Math.abs(r.y + r.height - target.y) <= TOL && overlapH;
      case "down":  return Math.abs(r.y - (target.y + target.height)) <= TOL && overlapH;
    }
  });
}

export function applyAction(
  floor: FloorPlan,
  action: FloorAction
): { floor: FloorPlan; errorMessage?: string } | null {
  if (action.type === "no_change" || !action.direction || !action.delta) return null;

  const next = cloneFloor(floor);
  const target = next.rooms.find((r) => r.id === action.target_room);
  if (!target) return null;

  const delta = Math.abs(action.delta);
  const dir = action.direction;
  const isExpand = action.type === "expand";

  // expandの場合: 隣接部屋を縮めてtargetを拡張
  // shrinkの場合: targetを縮めて隣接部屋を拡張
  const adjacents = getAdjacentRooms(floor, target, dir).map(
    (a) => next.rooms.find((r) => r.id === a.id)!
  );

  if (isExpand) {
    if (adjacents.length === 0) {
      return { floor: next, errorMessage: "その方向には壁があって広げられません" };
    }
    // 隣接部屋の最小サイズチェック（均等削り）
    const perRoom = delta / adjacents.length;
    for (const adj of adjacents) {
      const isHoriz = dir === "left" || dir === "right";
      if (isHoriz && adj.width - perRoom < MIN_SIZE) {
        return { floor: next, errorMessage: `「${adj.name}」がこれ以上狭くできません` };
      }
      if (!isHoriz && adj.height - perRoom < MIN_SIZE) {
        return { floor: next, errorMessage: `「${adj.name}」がこれ以上狭くできません` };
      }
    }

    // 隣接部屋を縮め、targetを拡張
    if (dir === "left") {
      // target左辺を左にdelta移動
      // 隣: widthを削る（右辺はそのままなのでxは変わらない）
      for (const adj of adjacents) adj.width -= delta / adjacents.length;
      target.x -= delta;
      target.width += delta;
    } else if (dir === "right") {
      // target右辺を右にdelta移動
      // 隣: xを右にずらし、widthを削る
      for (const adj of adjacents) {
        adj.x += delta;
        adj.width -= delta / adjacents.length;
      }
      target.width += delta;
    } else if (dir === "up") {
      // target上辺を上にdelta移動
      // 隣: heightを削る（下辺はそのままなのでyは変わらない）
      for (const adj of adjacents) adj.height -= delta / adjacents.length;
      target.y -= delta;
      target.height += delta;
    } else if (dir === "down") {
      // target下辺を下にdelta移動
      // 隣: yを下にずらし、heightを削る
      for (const adj of adjacents) {
        adj.y += delta;
        adj.height -= delta / adjacents.length;
      }
      target.height += delta;
    }
  } else {
    // shrink
    const isHoriz = dir === "left" || dir === "right";
    if (isHoriz && target.width - delta < MIN_SIZE) {
      return { floor: next, errorMessage: `「${target.name}」がこれ以上狭くできません` };
    }
    if (!isHoriz && target.height - delta < MIN_SIZE) {
      return { floor: next, errorMessage: `「${target.name}」がこれ以上狭くできません` };
    }

    if (dir === "left") {
      // target左辺を右にdelta移動（widthが縮む）
      target.x += delta;
      target.width -= delta;
      // 隣接部屋（left側）の右辺を伸ばす
      for (const adj of adjacents) adj.width += delta / (adjacents.length || 1);
    } else if (dir === "right") {
      // target右辺を左にdelta移動
      target.width -= delta;
      // 隣接部屋（right側）のxを左にずらし、widthを増やす
      for (const adj of adjacents) {
        adj.x -= delta;
        adj.width += delta / (adjacents.length || 1);
      }
    } else if (dir === "up") {
      target.y += delta;
      target.height -= delta;
      for (const adj of adjacents) adj.height += delta / (adjacents.length || 1);
    } else if (dir === "down") {
      target.height -= delta;
      for (const adj of adjacents) {
        adj.y -= delta;
        adj.height += delta / (adjacents.length || 1);
      }
    }
  }

  return { floor: next };
}
