"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  formatPostTime,
  mapFirestoreError,
  sendPost,
  subscribePosts,
  type Post,
} from "@/lib/posts";
import { getAuthorCardColors } from "@/lib/authorColor";
import { clampNickname, getActiveNickname } from "@/lib/nickname";
import { getClientId, joinCodeToRoomId } from "@/lib/room";

export default function BoardPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [clientId, setClientId] = useState("");
  const [text, setText] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const n = clampNickname(getActiveNickname());
    const c = sessionStorage.getItem("sb_code") ?? sessionStorage.getItem("hc_pass") ?? "";
    if (!n || !c.trim()) {
      router.replace("/");
      return;
    }
    setNickname(n);
    setJoinCode(c);
    setClientId(getClientId());
  }, [router]);

  useEffect(() => {
    if (!joinCode.trim()) return;

    if (!isFirebaseConfigured()) {
      setError(
        "Firebase が未設定です。study-board/.env.local に接続情報を設定し、開発サーバーを再起動してください。",
      );
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const id = await joinCodeToRoomId(joinCode);
        setRoomId(id);
        unsubscribe = subscribePosts(
          id,
          (next) => {
            setPosts(next);
            setLoading(false);
            setError(null);
          },
          (err) => {
            setError(err.message || "投稿の取得に失敗しました。");
            setLoading(false);
          },
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "ルームの準備に失敗しました。");
        setLoading(false);
      }
    })();

    return () => unsubscribe?.();
  }, [joinCode]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [posts.length]);

  const boardLabel = useMemo(() => {
    if (joinCode.trim()) return `参加コード：${joinCode.trim()}`;
    return "参加コード未設定";
  }, [joinCode]);

  async function submit() {
    const t = text.replace(/\s+/g, " ").trim();
    if (!t || !roomId || isSending || !nickname) return;

    setIsSending(true);
    try {
      await sendPost({
        roomId,
        displayName: nickname,
        text: t,
        clientId,
      });
      setText("");
    } catch (e) {
      setError(mapFirestoreError(e));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex flex-1 min-h-dvh bg-[var(--background)]">
      <div className="flex flex-1 flex-col w-full max-w-3xl mx-auto">
        <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="h-12 px-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="h-8 w-8 shrink-0 grid place-items-center rounded border border-transparent text-[#525252] hover:bg-[var(--muted-bg)] hover:border-[var(--border)]"
              aria-label="戻る"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[#171717] truncate">共有ボード</div>
              <div className="text-xs text-[var(--muted)] truncate">{boardLabel}</div>
            </div>

            <div className="shrink-0 text-xs text-[#525252] border border-[var(--border)] rounded px-2.5 py-1 bg-[var(--muted-bg)]">
              {nickname}
            </div>
          </div>
        </header>

        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-4 py-5"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="space-y-3">
            {error && (
              <div className="rounded border border-[#d4d4d4] bg-[#fafafa] px-4 py-3 text-xs text-[#525252] leading-relaxed">
                {error}
              </div>
            )}

            {loading && !error && (
              <div className="text-xs text-[var(--muted)]">投稿を読み込み中…</div>
            )}

            {!loading && !error && posts.length === 0 && (
              <div className="rounded border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 text-xs text-[var(--muted)]">
                まだ投稿がありません。最初のメモを投稿してください。
              </div>
            )}

            {posts.map((p) => {
              const isMine = p.clientId === clientId;
              const cardColors = getAuthorCardColors(p.clientId, isMine);
              return (
                <article
                  key={p.id}
                  className="rounded border px-4 py-3"
                  style={{
                    backgroundColor: cardColors.backgroundColor,
                    borderColor: cardColors.borderColor,
                  }}
                >
                  <div className="flex items-baseline justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-[#404040]">{p.displayName}</span>
                    <time className="text-[11px] text-[var(--muted)] tabular-nums shrink-0">
                      {formatPostTime(p.createdAt)}
                    </time>
                  </div>
                  <p className="text-sm text-[#171717] leading-relaxed whitespace-pre-wrap break-words">
                    {p.text}
                  </p>
                </article>
              );
            })}
          </div>
        </div>

        <div className="sticky bottom-0 z-10 border-t border-[var(--border)] bg-[var(--surface)] safe-bottom">
          <div className="px-4 py-3">
            <label className="block text-xs font-medium text-[#404040] mb-1.5">投稿</label>
            <div className="flex items-end gap-2">
              <div className="flex-1 rounded border border-[var(--border)] bg-white px-3 py-2 focus-within:border-[var(--border-strong)] focus-within:ring-1 focus-within:ring-[#d4d4d4]">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void submit();
                    }
                  }}
                  rows={2}
                  disabled={!roomId || isSending || Boolean(error && !isFirebaseConfigured())}
                  placeholder="内容を入力（Enterで投稿、Shift+Enterで改行）"
                  className="w-full resize-none bg-transparent outline-none text-sm leading-relaxed text-[#171717] placeholder:text-[#a3a3a3] max-h-32 disabled:opacity-50"
                />
              </div>

              <button
                type="button"
                onClick={() => void submit()}
                disabled={!text.trim() || !roomId || isSending}
                className="shrink-0 h-[42px] px-4 rounded border border-[#525252] bg-[#404040] text-sm font-medium text-white hover:bg-[#262626] disabled:border-[var(--border)] disabled:bg-[var(--muted-bg)] disabled:text-[#a3a3a3] disabled:cursor-not-allowed"
              >
                {isSending ? "送信中" : "投稿"}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-[var(--muted)]">
              同一参加コードのメンバーとリアルタイムで同期されます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
