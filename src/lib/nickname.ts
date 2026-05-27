const NICKNAME_KEY = "sb_nickname";

export function clampNickname(input: string) {
  return input.replace(/\s+/g, " ").trim().slice(0, 16);
}

/** localStorage に保存されたニックネーム */
export function getStoredNickname(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(NICKNAME_KEY) ?? "";
}

/** ニックネームを localStorage と sessionStorage に保存 */
export function saveNickname(nickname: string) {
  const safe = clampNickname(nickname);
  if (!safe) return;
  localStorage.setItem(NICKNAME_KEY, safe);
  sessionStorage.setItem("sb_name", safe);
}

/** チャット画面用（セッション → localStorage の順で取得） */
export function getActiveNickname(): string {
  if (typeof window === "undefined") return "";
  const fromSession =
    sessionStorage.getItem("sb_name") ?? sessionStorage.getItem("hc_name") ?? "";
  if (fromSession.trim()) return clampNickname(fromSession);
  return getStoredNickname();
}
