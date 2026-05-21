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

function MessageBubble({ entry, onRestoreSnapshot }: { entry: ChatEntry; onRestoreSnapshot: (floor: FloorPlan) => void }) {
  const isUser = entry.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
        isUser
          ? "bg-blue-500 text-white rounded-br-sm"
          : "bg-gray-100 text-gray-700 rounded-bl-sm"
      }`}>
        <p className="leading-relaxed whitespace-pre-wrap">{entry.content}</p>
        {!isUser && entry.snapshot && (
          <button
            onClick={() => onRestoreSnapshot(entry.snapshot!)}
            className="mt-2 text-xs text-blue-500 hover:text-blue-700 underline"
          >
            この図面に戻す
          </button>
        )}
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const sec = (Date.now() - start) / 1000;
      setElapsed(sec);
      // 3秒で75%まで急速に上がり、以降はゆっくり90%に近づく
      setProgress(Math.min(90, sec < 3 ? (sec / 3) * 75 : 75 + (sec - 3) * 2.5));
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-gray-500 w-52">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span>AIが考え中...</span>
          <span className="tabular-nums">{elapsed.toFixed(1)}秒</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-400 h-1.5 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function ChatPanel({ floor, history, onAction, onRestoreSnapshot, isLoading }: Props) {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
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

  const handleCopyAll = () => {
    if (history.length === 0) return;
    const text = history
      .map((e) => `${e.role === "user" ? "【あなた】" : "【AI】"}\n${e.content}`)
      .join("\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* ヘッダー */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-gray-700 text-sm">AIチャット</h2>
          <p className="text-xs text-gray-400 mt-0.5">「LDKを広くして」「洋室を右に縮めて」など自由に指示してください</p>
        </div>
        <button
          onClick={handleCopyAll}
          disabled={history.length === 0}
          className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 mt-0.5"
        >
          {copied ? "コピー済み" : "履歴コピー"}
        </button>
      </div>

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-8">
            間取りに関する指示を入力してください
          </div>
        )}
        {history.map((entry) => (
          <MessageBubble key={entry.id} entry={entry} onRestoreSnapshot={onRestoreSnapshot} />
        ))}
        {isLoading && <ThinkingIndicator />}
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
