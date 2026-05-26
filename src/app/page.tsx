"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function clampName(input: string) {
  return input.replace(/\s+/g, " ").trim().slice(0, 16);
}

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [displayName, setDisplayName] = useState("");

  const canEnter = useMemo(() => {
    return joinCode.trim().length >= 2 && clampName(displayName).length >= 1;
  }, [joinCode, displayName]);

  function onEnter() {
    const safeName = clampName(displayName);
    if (!safeName || joinCode.trim().length < 2) return;
    sessionStorage.setItem("sb_name", safeName);
    sessionStorage.setItem("sb_code", joinCode.trim());
    router.push("/chat");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <main className="w-full max-w-[420px]">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-[#171717]">
            Study Board
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            参加コードを共有したメンバーだけがアクセスできる共有ボードです。
          </p>
        </div>

        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h2 className="text-sm font-medium text-[#171717]">ボードに参加</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              表示名と参加コードを入力してください。
            </p>
          </div>

          <div className="px-5 py-5 space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-[#404040]">参加コード</span>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                inputMode="text"
                autoComplete="off"
                placeholder="例：team-alpha-2026"
                className="mt-1.5 w-full rounded border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-[#171717] outline-none placeholder:text-[#a3a3a3] focus:border-[var(--border-strong)] focus:ring-1 focus:ring-[#d4d4d4]"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-[#404040]">表示名</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                inputMode="text"
                autoComplete="off"
                placeholder="例：山田 太郎"
                className="mt-1.5 w-full rounded border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-[#171717] outline-none placeholder:text-[#a3a3a3] focus:border-[var(--border-strong)] focus:ring-1 focus:ring-[#d4d4d4]"
              />
              <span className="mt-1 block text-xs text-[var(--muted)]">最大16文字</span>
            </label>

            <button
              type="button"
              onClick={onEnter}
              disabled={!canEnter}
              className="w-full rounded border border-[#525252] bg-[#404040] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#262626] disabled:border-[var(--border)] disabled:bg-[var(--muted-bg)] disabled:text-[#a3a3a3] disabled:cursor-not-allowed"
            >
              共有ボードを開く
            </button>
          </div>
        </div>

        <p className="mt-6 text-xs text-[var(--muted)] leading-relaxed">
          Firebase Firestore と接続すると、同一参加コードのメンバーとリアルタイムで投稿を共有できます。セットアップは{" "}
          <code className="text-[11px] bg-[var(--muted-bg)] px-1 py-0.5 rounded">docs/FIREBASE_SETUP.md</code>{" "}
          を参照してください。
        </p>
      </main>
    </div>
  );
}
