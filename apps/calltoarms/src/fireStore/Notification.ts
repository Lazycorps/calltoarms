import { getAuth } from "firebase/auth";
import { arrayUnion, doc, getFirestore, setDoc } from "firebase/firestore";

const COLLECTION_NAME = "notifications";

export const addMessagingToken = async (token: string) => {
  const auth = getAuth();
  const db = getFirestore();
  try {
    if (auth.currentUser?.uid)
      await setDoc(doc(db, COLLECTION_NAME, auth.currentUser?.uid), {
        token: arrayUnion(token),
      });
  } catch (err: any) {
    console.log(err);
  }
};
