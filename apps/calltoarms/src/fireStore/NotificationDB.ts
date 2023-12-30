import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  setDoc,
} from "firebase/firestore";

const COLLECTION_NAME = "notifications";

export class Message {
  senderId = "";
  receiverId = [];
  gamesId = "";
  gamesCover = "";
  title = "";
  body = "";
  date = new Date();
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
