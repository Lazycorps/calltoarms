import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { useCollection, useCurrentUser, useFirestore } from "vuefire";
import { useUserDB } from "./UserDB";
import { computed } from "vue";
import { User } from "@/models/User";

export function useUserFriendsDB() {
  const db = useFirestore();
  const currentUser = useCurrentUser();
  const usersDb = useUserDB();

  const userFriendsCollection =
    currentUser.value?.uid &&
    collection(db, "users", currentUser.value?.uid, "friends");

  async function addFriend(friendName: string) {
    try {
      if (!currentUser.value) return;
      const friend = await usersDb.getUserByName(friendName);
      if (!friend) return;

      await setDoc(
        doc(db, "users", currentUser.value?.uid, "friends", friend.id),
        {
          id: friend.id,
          creationDate: serverTimestamp(),
        }
      );
    } catch (err: any) {
      console.log(err);
    }
  }

  async function deleteFriend(friendId: string) {
    try {
      if (!currentUser.value || !friendId) return;
      await deleteDoc(
        doc(db, "users", currentUser.value?.uid, "friends", friendId)
      );
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
      if (!friendsIds.length) return [];
      return await usersDb.getUsers(friendsIds);
    } catch (err: any) {
      console.log(err);
    }
  }

  return {
    addFriend,
    deleteFriend,
    getMyFriends,
  };
}
