import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  serverTimestamp,
} from "firebase/firestore";
import { useCurrentUser } from "vuefire";
import { useUserDB } from "./UserDB";
import { computed } from "vue";

export function useUserFriendsDB() {
  const COLLECTION_NAME = "users";
  const db = getFirestore();
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
      await addDoc(
        collection(db, COLLECTION_NAME, currentUser.value?.uid, "friends"),
        {
          id: friend.id,
          creationDate: serverTimestamp(),
        }
      );
    } catch (err: any) {
      console.log(err);
    }
  }

  const myFriends = computed(async () => {
    if (!userFriendsCollection) return;
    const querySnap = await getDocs(userFriendsCollection);
    const friendsIds: string[] = [];
    querySnap.forEach((doc) => {
      friendsIds.push(doc.data().id);
    });
    return await usersDb.getUsers(friendsIds);
  });
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
    myFriends,
  };
}
