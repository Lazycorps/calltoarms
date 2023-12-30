import { getAuth } from "firebase/auth";
import { arrayUnion, doc, getFirestore, setDoc } from "firebase/firestore";

const COLLECTION_NAME = "messagingTokens";

class MessagingTokensDb {
  async addMessagingToken(token: string) {
    const auth = getAuth();
    const db = getFirestore();
    try {
      if (auth.currentUser?.uid)
        await setDoc(
          doc(db, COLLECTION_NAME, auth.currentUser?.uid),
          {
            token: arrayUnion(token),
            userId: auth.currentUser?.uid,
          },
          { merge: true }
        );
    } catch (err: any) {
      console.log(err);
    }
  }
}

export const messagingTokensDB = new MessagingTokensDb();