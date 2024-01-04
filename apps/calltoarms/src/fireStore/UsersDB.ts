import { User } from "@/models/User";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

// Initialize Cloud Firestore and get a reference to the service
const COLLECTION_NAME = "users";

class UsersDB {
  auth = getAuth();
  db = getFirestore();
  usersCollection = collection(this.db, "users");
  userFriendsCollection =
    this.auth.currentUser?.uid &&
    collection(this.db, "users", this.auth.currentUser?.uid, "friends");

  async addCurrentUser() {
    try {
      if (!this.auth.currentUser?.uid) return;
      await setDoc(
        doc(this.db, COLLECTION_NAME, this.auth.currentUser?.uid),
        {
          id: this.auth.currentUser?.uid,
          name: this.auth.currentUser.displayName,
          creationDate: serverTimestamp(),
        },
        { mergeFields: ["id", "name"] }
      );
    } catch (err: any) {
      console.log(err);
    }
  }
  async addFriends(friendName: string) {
    try {
      if (!this.auth.currentUser?.uid) return;
      const friend = await this.getUserByName(friendName);
      if (!friend) return;
      await addDoc(
        collection(
          this.db,
          COLLECTION_NAME,
          this.auth.currentUser?.uid,
          "friends"
        ),
        {
          id: friend.id,
          creationDate: serverTimestamp(),
        }
      );
    } catch (err: any) {
      console.log(err);
    }
  }
  async getUserByName(userName: string) {
    try {
      const q = query(this.usersCollection, where("name", "==", userName));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty)
        return querySnapshot.docs.map((d) => d.data() as User)[0];
      else return null;
    } catch (err: any) {
      console.log(err);
    }
  }
  async getMyFriends() {
    try {
      if (!this.userFriendsCollection) return;
      const querySnap = await getDocs(this.userFriendsCollection);
      const friendsIds: string[] = [];
      querySnap.forEach((doc) => {
        friendsIds.push(doc.data().id);
      });
      return await this.getUsers(friendsIds);
    } catch (err: any) {
      console.log(err);
    }
  }
  async getUsers(ids: string[]) {
    try {
      if (!this.auth.currentUser?.uid) return;
      const q = query(this.usersCollection, where("id", "in", ids));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty)
        return querySnapshot.docs.map((d) => d.data() as User);
      else return null;
    } catch (err: any) {
      console.log(err);
    }
  }
}

export const usersDB = new UsersDB();
