import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  getFirestore,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

const COLLECTION_NAME = "notifications";

export class Message {
  senderId = "";
  receiverIds: string[] = [];
  gameId = 0;
  gameCover = "";
  title = "";
  body = "";
  date: Timestamp | null = null;
}

class NotificationsDb {
  async addMessage(message: Message) {
    const auth = getAuth();
    const db = getFirestore();
    try {
      if (auth.currentUser?.uid)
        await addDoc(collection(db, COLLECTION_NAME), {
          ...message,
          date: serverTimestamp(),
        });
    } catch (err: any) {
      console.log(err);
    }
  }

  async getSent(): Promise<Message[]> {
    const auth = getAuth();
    const db = getFirestore();
    const q = query(
      collection(db, COLLECTION_NAME),
      where("senderId", "==", auth.currentUser?.uid),
      orderBy("date", "desc"),
      limit(50)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((d) => d.data() as Message);
  }

  async getReceived(): Promise<Message[]> {
    const auth = getAuth();
    const db = getFirestore();
    const q = query(
      collection(db, COLLECTION_NAME),
      where("receiverIds", "array-contains", auth.currentUser?.uid),
      orderBy("date", "desc"),
      limit(50)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((d) => d.data() as Message);
  }
}

export const notificationDB = new NotificationsDb();
