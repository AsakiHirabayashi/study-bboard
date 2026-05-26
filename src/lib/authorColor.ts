export type AuthorCardColors = {
  backgroundColor: string;
  borderColor: string;
};

/** 他人の投稿用（白・薄グレー・薄ブルー・薄グリーン系） */
const OTHERS: AuthorCardColors[] = [
  { backgroundColor: "#ffffff", borderColor: "#e5e5e5" },
  { backgroundColor: "#f7f7f7", borderColor: "#e8e8e8" },
  { backgroundColor: "#f0f4f8", borderColor: "#dce4ed" },
  { backgroundColor: "#f2f7f4", borderColor: "#dce8e0" },
  { backgroundColor: "#f5f5f5", borderColor: "#e0e0e0" },
  { backgroundColor: "#f4f8f6", borderColor: "#dde8e4" },
];

/** 自分の投稿（やや濃いグレー） */
const MINE: AuthorCardColors = {
  backgroundColor: "#ebebeb",
  borderColor: "#d4d4d4",
};

function hashClientId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** clientId から安定した色を返す（同じ投稿者＝同じ色） */
export function getAuthorCardColors(clientId: string, isMine: boolean): AuthorCardColors {
  if (isMine) return MINE;
  const index = hashClientId(clientId || "unknown") % OTHERS.length;
  return OTHERS[index]!;
}
