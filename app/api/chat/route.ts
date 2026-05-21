import { NextRequest, NextResponse } from "next/server";
import { FloorPlan } from "@/app/lib/types";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

const SYSTEM_PROMPT = `あなたはAI間取り図チャットアシスタントです。
ユーザーのチャット指示と現在の間取りJSONを受け取り、どの部屋をどう変形するかを判定してJSONで返します。

【絶対ルール】
- 返答は必ず以下のJSON形式のみ。説明文や余分なテキストは一切不要。
- type は "expand"（広げる）、"shrink"（縮める）、"no_change"（変更なし）のいずれか
- direction は "left" | "right" | "up" | "down"（expandまたはshrinkの場合のみ）
- target_room は rooms の id（ldk, room1, room2, room3, bath, toilet, hall）
- delta は変化量（グリッド単位、1〜20の整数を推奨）
- message はユーザーへの日本語メッセージ（1〜2文）

【レイアウト概要（中廊下型）】
廊下(hall)が建物中央を水平に貫通。上段に洋室①・浴室・トイレ、下段に洋室②③、右端にLDK。
  上段: [洋室①][浴室・洗面][トイレ][LDK]
  中段: [────────── 廊下 ──────────][LDK]
  下段: [洋室②  ][洋室③  ][LDK        ]

【部屋ID一覧】
- ldk: LDK（右端・全高・バルコニー側）
- room1: 洋室①（左上・廊下の上）
- room2: 洋室②（左下・廊下の下）
- room3: 洋室③（中下・廊下の下）
- bath: 浴室・洗面（上段中央・廊下の上）
- toilet: トイレ（上段右・廊下の上）
- hall: 廊下（水平・中央帯・玄関含む）

【判定ルール】
- 「LDKを広くして」→ LDKをどの方向に広げるか判断（隣接関係を考慮）
- 部屋名が日本語で来ても適切なIDに変換する
- 実現不可能な要求（L字形など）はno_changeで返す

【レスポンスJSON形式】
{"type":"expand","target_room":"ldk","direction":"left","delta":10,"message":"LDKを左に広げます。隣の洋室が少し狭くなります。"}
または
{"type":"no_change","message":"ご要望の変形はMVP版では対応していません。四角形の変形のみ可能です。"}`;

export async function POST(req: NextRequest) {
  const { message, floor } = (await req.json()) as { message: string; floor: FloorPlan };

  const floorSummary = floor.rooms
    .map((r) => `${r.id}(${r.name}): x=${r.x},y=${r.y},w=${r.width},h=${r.height}`)
    .join(" / ");

  const userContent = `現在の間取り: ${floorSummary}\n\nユーザーの指示: ${message}`;

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
        { role: "user", content: userContent },
      ],
      temperature: 0.3,
      max_tokens: 200,
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
