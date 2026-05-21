import { NextRequest, NextResponse } from "next/server";
import { FloorPlan, ChatEntry } from "@/app/lib/types";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

const SYSTEM_PROMPT = `あなたはAI間取り図アシスタントです。
ユーザーと会話しながら間取りを変形します。直前の会話の文脈を必ず引き継いでください。

【絶対ルール】
- 返答は必ずJSON形式のみ。説明文は一切不要。
- type: "expand"（広げる）| "shrink"（縮める）| "no_change"（変更なし）| "ask"（確認）
- direction: "left" | "right" | "up" | "down"（expand/shrinkのみ）
- target_room: ldk | room1 | room2 | room3 | bath | toilet | hall
- delta: 変化量（内部グリッド単位の整数。1m=10グリッド）
- message: ユーザーへの日本語メッセージ。単位は必ず「m（メートル）」を使う。「グリッド」という言葉は絶対に使わない。

【レイアウト（中廊下型）】
  上段: [洋室①][浴室・洗面][トイレ][LDK]
  中段: [────────── 廊下 ──────────][LDK]
  下段: [洋室②  ][洋室③  ][LDK        ]

【部屋ID】ldk / room1 / room2 / room3 / bath / toilet / hall

【判定ルール】
- 前のメッセージで部屋・方向が確定している場合、数値だけ来ても（「2m」「1m」等）前の意図（expand/shrink）を継続してそのdeltaで実行する
- 「1mだけにして」「1mで」「1mにして」は、前の文脈が「広げる」なら expand、「縮める」なら shrink を維持する。絶対値への変更ではない
- 量が完全に不明な場合のみ type:"ask" で聞き返す
- 「もっと」=2m、「少し」=0.5m、「大きく」=1.5m のデフォルト値で即実行
- 部屋名が日本語でも適切なIDに変換する

【文脈継続の例】
  会話: 「LDKを広くして」→「1mだけにして」 → LDKを1m広げる（expandを継続）
  会話: 「洋室を縮めて」→「2m」 → 洋室を2m縮める（shrinkを継続）

【deltaの変換】1m = delta 10。2m = delta 20。0.5m = delta 5。3m = delta 30

【レスポンス例】
{"type":"expand","target_room":"ldk","direction":"left","delta":20,"message":"LDKを左に2m広げます。"}
{"type":"ask","target_room":"ldk","message":"LDKをどのくらい広げますか？1m・2m・3mから選ぶか教えてください。"}
{"type":"no_change","message":"その変形は対応できません。"}`;

export async function POST(req: NextRequest) {
  const { message, floor, history } = (await req.json()) as {
    message: string;
    floor: FloorPlan;
    history?: ChatEntry[];
  };

  const floorSummary = floor.rooms
    .map((r) => `${r.id}(${r.name}): x=${r.x},y=${r.y},w=${r.width},h=${r.height}`)
    .join(" / ");

  // 直近6件の会話履歴をDeepSeekに渡す
  const recentHistory = (history ?? []).slice(-6);
  const conversationMessages = recentHistory.map((h) => ({
    role: h.role as "user" | "assistant",
    content: h.content,
  }));

  const userContent = `現在の間取り: ${floorSummary}\n\n指示: ${message}`;

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...conversationMessages,
        { role: "user", content: userContent },
      ],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `DeepSeek API error: ${err}` }, { status: 500 });
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "{}";

  let action;
  try {
    action = JSON.parse(raw);
    if (!action.type) throw new Error("type field missing");
  } catch {
    console.error("parse error, raw:", raw);
    action = { type: "no_change", message: `AIの返答を解析できませんでした（raw: ${raw.slice(0, 80)}）` };
  }

  return NextResponse.json({ action });
}
