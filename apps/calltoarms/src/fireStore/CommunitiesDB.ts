import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  getFirestore,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const COLLECTION_NAME = "communities";

export class Community {
  creatorId = "";
  name = "";
  description = "";
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
}

export const communitiesDB = new CommunitiesDB();
