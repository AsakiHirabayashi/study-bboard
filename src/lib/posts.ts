import {
  FirestoreError,
  Timestamp,
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { getDb } from "./firebase";

export function mapFirestoreError(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    if (error.code === "permission-denied") {
      return "Firestore の権限がありません。Firebase コンソールで firestore.rules を公開してください。";
    }
    if (error.code === "unavailable") {
      return "Firestore に接続できません。ネットワークを確認してください。";
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "不明なエラーが発生しました。";
}

export type PostDoc = {
  displayName: string;
  text: string;
  clientId: string;
  createdAt: Timestamp;
};

export type Post = PostDoc & {
  id: string;
};

const POST_LIMIT = 200;

export function postsCollectionPath(roomId: string) {
  return `rooms/${roomId}/posts`;
}

export function subscribePosts(
  roomId: string,
  onData: (posts: Post[]) => void,
  onError: (error: Error) => void,
) {
  const db = getDb();
  const q = query(
    collection(db, "rooms", roomId, "posts"),
    orderBy("createdAt", "asc"),
    limit(POST_LIMIT),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const posts: Post[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as PostDoc),
      }));
      onData(posts);
    },
    (err) => onError(new Error(mapFirestoreError(err))),
  );
}

export async function sendPost(params: {
  roomId: string;
  displayName: string;
  text: string;
  clientId: string;
}) {
  const db = getDb();
  await addDoc(collection(db, "rooms", params.roomId, "posts"), {
    displayName: params.displayName,
    text: params.text,
    clientId: params.clientId,
    createdAt: serverTimestamp(),
  });
}

export function formatPostTime(ts: Timestamp | null | undefined): string {
  if (!ts) return "--:--";
  const d = ts.toDate();
  return d.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
