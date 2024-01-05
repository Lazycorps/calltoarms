import {
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { useCollection, useCurrentUser, useFirestore } from "vuefire";

export class Message {
  senderId = "";
  receiverIds: string[] = [];
  gameId = 0;
  gameCover = "";
  title = "";
  body = "";
  date: Timestamp | null = null;
}

export function useNotificationsDb() {
  const db = useFirestore();
  const currentUser = useCurrentUser();

  const notificationsSendQuery = query(
    collection(db, "notifications"),
    where("senderId", "==", currentUser.value?.uid),
    orderBy("date", "desc"),
    limit(50)
  );

  const notificationsReceivedQuery = query(
    collection(db, "notifications"),
    where("receiverIds", "array-contains", currentUser.value?.uid),
    orderBy("date", "desc"),
    limit(50)
  );

  const notificationsSend = useCollection<Message>(notificationsSendQuery, {
    ssrKey: "no-warning",
  });
  const notificationsReceived = useCollection<Message>(
    notificationsReceivedQuery,
    {
      ssrKey: "no-warning",
    }
  );

  async function addMessage(message: Message) {
    try {
      if (currentUser.value?.uid)
        await addDoc(collection(db, "notifications"), {
          ...message,
          date: serverTimestamp(),
        });
    } catch (err: any) {
      console.log(err);
    }
  }

  return {
    addMessage,
    notificationsSend,
    notificationsReceived,
    notificationsSendQuery,
    notificationsReceivedQuery,
  };
}
