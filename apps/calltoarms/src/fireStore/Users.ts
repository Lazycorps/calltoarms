import { firebaseApp } from "@/plugins/firebase";
import { getAuth } from "firebase/auth";
import { doc, getFirestore, setDoc } from "firebase/firestore";

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(firebaseApp);
const auth = getAuth();

const COLLECTION_NAME = "users";

export const addCurrentUser = async () => {
  try {
    if (auth.currentUser?.uid)
      await setDoc(doc(db, COLLECTION_NAME, auth.currentUser?.uid), {
        name: auth.currentUser.displayName,
      });
  } catch (err: any) {
    console.log(err);
  }
};
