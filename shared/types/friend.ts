export enum FriendStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  BLOCKED = "BLOCKED",
}

export class FriendDTO {
  id = 0;
  userId = "";
  friendId = "";
  status: FriendStatus = FriendStatus.PENDING;
  createdAt = new Date();
  updatedAt = new Date();
  user?: {
    id: string;
    name: string;
    slug: string;
  };
  friend?: {
    id: string;
    name: string;
    slug: string;
  };
  isSender = false;
}
