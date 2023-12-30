import { User } from "@/models/User";
import { getAuth } from "firebase/auth";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

// Initialize Cloud Firestore and get a reference to the service
const COLLECTION_NAME = "users";

class UsersDB {
  auth = getAuth();
  db = getFirestore();
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
    const auth = getAuth();
    const db = getFirestore();
    try {
      if (!auth.currentUser?.uid) return;
      const friend = await this.getUserByName(friendName);
      if (!friend) return;
      const userRef = doc(db, COLLECTION_NAME, auth.currentUser?.uid);
      await updateDoc(userRef, {
        friends: arrayUnion(friend.id),
      });
    } catch (err: any) {
      console.log(err);
    }
  }
  async getUserByName(userName: string) {
    try {
      const q = query(
        collection(this.db, COLLECTION_NAME),
        where("name", "==", userName)
      );
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
      if (!this.auth.currentUser?.uid) return;
      const userRef = doc(this.db, COLLECTION_NAME, this.auth.currentUser?.uid);
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) return null;
      const user = docSnap.data() as User;
      return await this.getUsers(user.friends);
    } catch (err: any) {
      console.log(err);
    }
  }
  async getUsers(ids: string[]) {
    try {
      if (!this.auth.currentUser?.uid) return;
      const q = query(
        collection(this.db, COLLECTION_NAME),
        where("id", "in", ids)
      );
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
