import { User } from "@/models/User";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { useCurrentUser } from "vuefire";

export function useUserDB() {
  const db = getFirestore();
  const currentUser = useCurrentUser();
  const usersCollection = collection(db, "users");

  async function addCurrentUser() {
    try {
      if (!currentUser.value) return;
      await setDoc(
        doc(db, "users", currentUser.value.uid),
        {
          id: currentUser.value.uid,
          name: currentUser.value.displayName,
          creationDate: serverTimestamp(),
        },
        { mergeFields: ["id", "name"] }
      );
    } catch (err: any) {
      console.log(err);
    }
  }

  async function getUserByName(userName: string) {
    try {
      const q = query(usersCollection, where("name", "==", userName));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty)
        return querySnapshot.docs.map((d) => d.data() as User)[0];
      else return null;
    } catch (err: any) {
      console.log(err);
    }
  }

  async function getUsers(ids: string[]) {
    try {
      if (!currentUser.value) return;
      const users: User[] = [];
      for (let id of ids) {
        console.log(id);
        const document = await getDoc(doc(db, "users", id));
        console.log(document.data());
        if (document.exists()) users.push(document.data() as User);
      }
      return users;
    } catch (err: any) {
      console.log(err);
    }
  }

  return {
    addCurrentUser,
    getUserByName,
    getUsers,
  };
}
