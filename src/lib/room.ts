/** 参加コードからルームID（SHA-256）を生成。Firestoreのパスに使う。 */
export async function joinCodeToRoomId(joinCode: string): Promise<string> {
  const normalized = joinCode.trim().toLowerCase();
  const data = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** 自分の投稿かどうか判定用（端末ごとに1つ） */
export function getClientId(): string {
  if (typeof window === "undefined") return "";
  const key = "sb_client_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}
