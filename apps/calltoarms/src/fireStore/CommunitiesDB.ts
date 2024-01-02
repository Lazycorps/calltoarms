import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  getFirestore,
  query,
  where,
  getDocs,
  and,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

const COLLECTION_NAME = "communities";

export class Community {
  id = "";
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
    const communities: Community[] = [];
    querySnapshot.forEach((doc) => {
      const community = doc.data() as Community;
      community.id = doc.id;
      communities.push(community);
    });
    return communities;
  }

  async searchCommunities(search: string): Promise<Community[]> {
    const db = getFirestore();
    const q = query(
      collection(db, COLLECTION_NAME),
      and(
        where("name_insensitive", ">=", search.toLowerCase()),
        where("name_insensitive", "<=", search.toLowerCase() + "\uf8ff")
      )
    );

    const querySnapshot = await getDocs(q);
    const communities: Community[] = [];
    querySnapshot.forEach((doc) => {
      const community = doc.data() as Community;
      community.id = doc.id;
      communities.push(community);
    });
    return communities;
  }

  async joinCommunity(communityId: string): Promise<void> {
    const db = getFirestore();
    const auth = getAuth();

    try {
      if (!auth.currentUser?.uid) return;
      const communityRef = doc(db, COLLECTION_NAME, communityId);
      if (!communityRef) return;
      await updateDoc(communityRef, {
        membersIds: arrayUnion(auth.currentUser?.uid),
      });
    } catch (err: any) {
      console.log(err);
    }
  }

  async leaveCommunity(communityId: string): Promise<void> {
    const db = getFirestore();
    const auth = getAuth();

    try {
      if (!auth.currentUser?.uid) return;
      const communityRef = doc(db, COLLECTION_NAME, communityId);
      if (!communityRef) return;
      await updateDoc(communityRef, {
        membersIds: arrayRemove(auth.currentUser?.uid),
      });
    } catch (err: any) {
      console.log(err);
    }
  }
}

export const communitiesDB = new CommunitiesDB();
