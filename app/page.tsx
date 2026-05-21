"use client";

import { useState, useCallback } from "react";
import { FloorPlan, ChatEntry, FloorAction } from "./lib/types";
import { INITIAL_FLOOR, GRID_TO_M } from "./lib/initialFloor";
import { applyAction, cloneFloor } from "./lib/roomLogic";
import FloorPlanView from "./components/FloorPlan";
import ChatPanel from "./components/ChatPanel";

let entryIdCounter = 0;
function makeId() {
  return String(++entryIdCounter);
}

export default function Home() {
  const [floor, setFloor] = useState<FloorPlan>(cloneFloor(INITIAL_FLOOR));
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = useCallback(
    async (message: string) => {
      const userEntry: ChatEntry = { id: makeId(), role: "user", content: message };
      setHistory((h) => [...h, userEntry]);
      setIsLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, floor }),
        });
        const { action, error } = await res.json();

        if (error) {
          setHistory((h) => [
            ...h,
            { id: makeId(), role: "assistant", content: `エラーが発生しました: ${error}` },
          ]);
          return;
        }

        const floorAction = action as FloorAction;

        if (floorAction.type === "no_change" || floorAction.type === "ask") {
          setHistory((h) => [
            ...h,
            { id: makeId(), role: "assistant", content: floorAction.message },
          ]);
          return;
        }

        const result = applyAction(floor, floorAction);
        if (!result) {
          setHistory((h) => [
            ...h,
            { id: makeId(), role: "assistant", content: "変形の適用に失敗しました。" },
          ]);
          return;
        }

        if (result.errorMessage) {
          setHistory((h) => [
            ...h,
            {
              id: makeId(),
              role: "assistant",
              content: `${floorAction.message}\n\n⚠️ ${result.errorMessage}`,
            },
          ]);
          return;
        }

        const prevSnapshot = cloneFloor(floor);
        setFloor(result.floor);
        setHistory((h) => [
          ...h,
          {
            id: makeId(),
            role: "assistant",
            content: floorAction.message,
            snapshot: prevSnapshot,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [floor]
  );

  const handleRestoreSnapshot = useCallback((snapshot: FloorPlan) => {
    setFloor(cloneFloor(snapshot));
    setHistory((h) => [
      ...h,
      { id: makeId(), role: "assistant", content: "図面を前の状態に戻しました。" },
    ]);
  }, []);

  const handleDownloadPng = () => {
    const svg = document.getElementById("floor-plan-svg") as SVGSVGElement | null;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = 680 * scale;
    canvas.height = 460 * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f0ede8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => {
        if (!b) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = `floor-plan-${new Date().toISOString().slice(0, 10)}.png`;
        a.click();
      }, "image/png");
    };
    img.src = url;
  };

  const handleReset = () => {
    setFloor(cloneFloor(INITIAL_FLOOR));
    setHistory((h) => [
      ...h,
      { id: makeId(), role: "assistant", content: "初期の間取りに戻しました。" },
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Madori Chat</h1>
          <p className="text-xs text-gray-400">AIと話しながら間取りをシミュレーション</p>
        </div>
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          初期化
        </button>
      </header>

      <main className="flex-1 flex gap-4 p-4 max-w-6xl mx-auto w-full">
        <div className="flex-1 flex flex-col gap-3">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-700 text-sm">間取り図</h2>
              <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadPng}
                className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 transition-colors"
              >
                PNG保存
              </button>
              <span className="text-xs text-gray-400">
                全体: {(floor.total_width * GRID_TO_M).toFixed(1)} × {(floor.total_height * GRID_TO_M).toFixed(1)}m
                &nbsp;（延床 {(floor.total_width * floor.total_height * GRID_TO_M * GRID_TO_M).toFixed(1)}㎡ /{" "}
                {(floor.total_width * floor.total_height * GRID_TO_M * GRID_TO_M / 3.305785).toFixed(1)}坪）
              </span>
              </div>
            </div>
            <FloorPlanView floor={floor} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">部屋データ</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {floor.rooms.map((r) => (
                <div key={r.id} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1.5">
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: r.color, border: "1px solid #ccc" }}
                  />
                  <span className="font-medium">{r.name}</span>
                  <span className="text-gray-400 ml-auto">
                    {(r.width * GRID_TO_M).toFixed(1)}×{(r.height * GRID_TO_M).toFixed(1)}m
                    &nbsp;{(r.width * r.height * GRID_TO_M * GRID_TO_M).toFixed(1)}㎡
                    /{(r.width * r.height * GRID_TO_M * GRID_TO_M / 3.305785).toFixed(1)}坪
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-80 flex flex-col">
          <ChatPanel
            floor={floor}
            history={history}
            onAction={handleAction}
            onRestoreSnapshot={handleRestoreSnapshot}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  );
}
