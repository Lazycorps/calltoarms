import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  serverTimestamp,
} from "firebase/firestore";
import { useCurrentUser, useFirestore } from "vuefire";
import { useUserDB } from "./UserDB";

export function useUserFriendsDB() {
  const db = useFirestore();
  const currentUser = useCurrentUser();
  const usersDb = useUserDB();

  const userFriendsCollection =
    currentUser.value?.uid &&
    collection(db, "users", currentUser.value?.uid, "friends");

  async function addFriends(friendName: string) {
    try {
      if (!currentUser.value) return;
      const friend = await usersDb.getUserByName(friendName);
      if (!friend) return;
      await addDoc(collection(db, "users", currentUser.value?.uid, "friends"), {
        id: friend.id,
        creationDate: serverTimestamp(),
      });
    } catch (err: any) {
      console.log(err);
    }
  }

  async function getMyFriends() {
    try {
      if (!userFriendsCollection) return;
      const querySnap = await getDocs(userFriendsCollection);
      const friendsIds: string[] = [];
      querySnap.forEach((doc) => {
        friendsIds.push(doc.data().id);
      });
      return await usersDb.getUsers(friendsIds);
    } catch (err: any) {
      console.log(err);
    }
  }

  return {
    addFriends,
    getMyFriends,
  };
}
