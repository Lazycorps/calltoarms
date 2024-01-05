import { arrayUnion, doc, setDoc } from "firebase/firestore";
import { useCurrentUser, useFirestore } from "vuefire";

export function useMessagingTokensDB() {
  const db = useFirestore();
  const currentUser = useCurrentUser();

  async function addMessagingToken(token: string) {
    try {
      if (currentUser.value?.uid)
        await setDoc(
          doc(db, "messagingTokens", currentUser.value?.uid),
          {
            token: arrayUnion(token),
            userId: currentUser.value?.uid,
          },
          { merge: true }
        );
    } catch (err: any) {
      console.log(err);
    }
  }

  return { addMessagingToken };
}
