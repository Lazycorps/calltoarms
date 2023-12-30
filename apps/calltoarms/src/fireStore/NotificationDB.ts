import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  getFirestore,
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
}

export const notificationDB = new NotificationsDb();
