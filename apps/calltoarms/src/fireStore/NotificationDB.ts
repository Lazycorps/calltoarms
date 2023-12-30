import { getAuth } from "firebase/auth";
import {
  DocumentData,
  Query,
  addDoc,
  collection,
  getFirestore,
  query,
  where,
  getDocs
} from "firebase/firestore";

const COLLECTION_NAME = "notifications";

export class Message {
  senderId = "";
  receiverIds = [];
  gameId = 0;
  gameCover = "";
  title = "";
  body = "";
  date = new Date().toUTCString();
}

class NotificationsDb {
  async addMessage(message: Message) {
    const auth = getAuth();
    const db = getFirestore();
    try {
      if (auth.currentUser?.uid)
        await addDoc(collection(db, COLLECTION_NAME), message);
    } catch (err: any) {
      console.log(err);
    }
  }

  async getSend(): Promise<Message[]> {
    const auth = getAuth();
    const db = getFirestore();
    const q = query(collection(db, COLLECTION_NAME), where("senderId", "==", auth.currentUser?.uid));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => d.data() as Message);
  }
}

export const notificationDB = new NotificationsDb();
