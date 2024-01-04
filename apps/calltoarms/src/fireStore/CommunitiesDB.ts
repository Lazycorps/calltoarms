import { getAuth } from "firebase/auth";
import { remove } from "firebase/database";
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
  serverTimestamp,
  deleteDoc,
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
  auth = getAuth();
  db = getFirestore();
  communitiesCollection = collection(this.db, COLLECTION_NAME);

  async addCommunity(community: Community) {
    try {
      if (this.auth.currentUser?.uid) {
        const newCommRef = await addDoc(this.communitiesCollection, community);
        await addDoc(
          collection(this.db, COLLECTION_NAME, newCommRef.id, "members"),
          {
            userId: this.auth.currentUser?.uid,
            joinDate: serverTimestamp(),
          }
        );
      }
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
    try {
      if (!this.auth.currentUser?.uid) return;
      const communityRef = doc(this.db, COLLECTION_NAME, communityId);
      if (!communityRef) return;
      const communityMembersCollection = collection(
        this.db,
        COLLECTION_NAME,
        communityRef.id,
        "members"
      );
      const q = query(
        communityMembersCollection,
        where("userId", "==", this.auth.currentUser?.uid)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) return;

      await addDoc(communityMembersCollection, {
        userId: this.auth.currentUser?.uid,
        joinDate: serverTimestamp(),
      });
    } catch (err: any) {
      console.log(err);
    }
  }

  async leaveCommunity(communityId: string): Promise<void> {
    try {
      if (!this.auth.currentUser?.uid) return;
      const communityRef = doc(this.db, COLLECTION_NAME, communityId);
      if (!communityRef) return;

      const q = query(
        collection(this.db, COLLECTION_NAME, communityRef.id, "members"),
        where("userId", "==", this.auth.currentUser?.uid)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return;
      querySnapshot.forEach((data) => {
        const docToDelete = doc(
          this.db,
          COLLECTION_NAME,
          communityRef.id,
          "members",
          data.id
        );
        deleteDoc(docToDelete);
      });
    } catch (err: any) {
      console.log(err);
    }
  }
}

export const communitiesDB = new CommunitiesDB();
