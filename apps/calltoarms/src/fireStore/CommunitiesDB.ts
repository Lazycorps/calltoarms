import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  getFirestore,
  query,
  where,
  getDocs,
  and,
} from "firebase/firestore";

const COLLECTION_NAME = "communities";

export class Community {
  creatorId = "";
  name = "";
  name_insensitive = ""; // used for case insensitive query
  description = "";
  membersIds: string[] = [];
}

class CommunitiesDB {
  async addCommunity(community: Community) {
    const auth = getAuth();
    const db = getFirestore();

    try {
      if (auth.currentUser?.uid)
        await addDoc(collection(db, COLLECTION_NAME), community);
    } catch (err: any) {
      console.log(err);
    }
  }

  async getUserCommunities(): Promise<Community[]> {
    const auth = getAuth();
    const db = getFirestore();
    const q = query(
      collection(db, COLLECTION_NAME),
      where("membersIds", "array-contains", auth.currentUser?.uid)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((d) => d.data() as Community);
  }

  async searchCommunities(search: string): Promise<Community[]> {
    const db = getFirestore();
    const q = query(
      collection(db, COLLECTION_NAME),
      and(
        where("name_insensitive", ">=", search.toLowerCase()),
        where("name_insensitive", "<=", search.toLowerCase() + "\uf8ff")
      )
      // where("name", "==", search)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((d) => d.data() as Community);
  }
}

export const communitiesDB = new CommunitiesDB();
