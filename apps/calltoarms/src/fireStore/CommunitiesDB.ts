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

        await addDoc(
          collection(
            this.db,
            "users",
            this.auth.currentUser?.uid,
            "communities"
          ),
          { communityId: newCommRef.id, joinDate: serverTimestamp() }
        );
      }
    } catch (err: any) {
      console.log(err);
    }
  }

  async getUserCommunities(): Promise<Community[]> {
    const q = query(
      collection(
        this.db,
        "users",
        this.auth.currentUser?.uid ?? "",
        "communities"
      )
    );
    const querySnapshot = await getDocs(q);
    const communitiesIds: string[] = [];
    const communities: Community[] = [];
    querySnapshot.forEach((doc) => communitiesIds.push(doc.data().communityId));

    const communitiesQuery = query(
      this.communitiesCollection,
      where("__name__", "in", communitiesIds)
    );
    const queryCommSnapshot = await getDocs(communitiesQuery);
    queryCommSnapshot.forEach((doc) => {
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
      // Ajout au niveau de la community
      await addDoc(communityMembersCollection, {
        userId: this.auth.currentUser?.uid,
        joinDate: serverTimestamp(),
      });
      // Ajout au niveau du user
      await addDoc(
        collection(this.db, "users", this.auth.currentUser?.uid, "communities"),
        { communityId, joinDate: serverTimestamp() }
      );
    } catch (err: any) {
      console.log(err);
    }
  }

  async leaveCommunity(communityId: string): Promise<void> {
    try {
      if (!this.auth.currentUser?.uid) return;
      const communityRef = doc(this.db, COLLECTION_NAME, communityId);
      if (!communityRef) return;
      // Delete dans communities
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
      // Delete dans users
      const q2 = query(
        collection(this.db, "users", this.auth.currentUser?.uid, "communities"),
        where("communityId", "==", communityRef.id)
      );
      const querySnapshot2 = await getDocs(q2);
      if (querySnapshot2.empty) return;
      querySnapshot2.forEach((data) => {
        const docUserToDelete = doc(
          this.db,
          "users",
          this.auth.currentUser?.uid ?? "",
          "communities",
          data.id
        );
        deleteDoc(docUserToDelete);
      });
    } catch (err: any) {
      console.log(err);
    }
  }
}

export const communitiesDB = new CommunitiesDB();
