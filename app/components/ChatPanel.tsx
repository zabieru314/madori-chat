"use client";

import { useState, useRef, useEffect } from "react";
import { ChatEntry, FloorPlan } from "../lib/types";

interface Props {
  floor: FloorPlan;
  history: ChatEntry[];
  onAction: (message: string) => Promise<void>;
  onRestoreSnapshot: (floor: FloorPlan) => void;
  isLoading: boolean;
}

export default function ChatPanel({ floor, history, onAction, onRestoreSnapshot, isLoading }: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || isLoading) return;
    setInput("");
    await onAction(msg);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* ヘッダー */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
        <h2 className="font-semibold text-gray-700 text-sm">AIチャット</h2>
        <p className="text-xs text-gray-400 mt-0.5">「LDKを広くして」「洋室を右に縮めて」など自由に指示してください</p>
      </div>

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-8">
            間取りに関する指示を入力してください
          </div>
        )}
        {history.map((entry) => (
          <div key={entry.id} className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                entry.role === "user"
                  ? "bg-blue-500 text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-700 rounded-bl-sm"
              }`}
            >
              <p className="leading-relaxed whitespace-pre-wrap">{entry.content}</p>
              {entry.role === "assistant" && entry.snapshot && (
                <button
                  onClick={() => onRestoreSnapshot(entry.snapshot!)}
                  className="mt-2 text-xs text-blue-500 hover:text-blue-700 underline"
                >
                  この図面に戻す
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力欄 */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例: LDKを広くして"
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-5 py-2.5 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            送信
          </button>
        </div>
      </form>
    </div>
  );
}
