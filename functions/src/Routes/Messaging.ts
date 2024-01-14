/* eslint-disable @typescript-eslint/no-var-requires */
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import * as express from "express";
import { MessageDTO } from "../models/MessageDTO";
export const messagingRoutes = express.Router();

messagingRoutes.post("/send", async (req, res) => {
  const message = Object.assign(new MessageDTO(), req.body) as MessageDTO;

  let usersIds = [...message.users];
  let communitiesUsersSnap;
  if (message.communities.length) {
    communitiesUsersSnap = await getFirestore()
      .collectionGroup("members")
      .where("communityId", "in", message.communities)
      .get();
    communitiesUsersSnap.forEach((doc) => {
      usersIds.push(doc.data().userId);
    });
  }

  usersIds = [...new Set(usersIds)];

  let snap;
  if (usersIds.length) {
    snap = await getFirestore()
      .collection("messagingTokens")
      .where("userId", "in", usersIds)
      .get();
  } else {
    snap = await getFirestore().collection("messagingTokens").get();
  }

  const registrationTokens: string[] = [];
  snap.forEach((res) => {
    const token = res.data().token;
    if (token) registrationTokens.push(...res.data().token);
  });

  if (!registrationTokens.length) res.status(200);
  const notification = {
    notification: {
      title: message.title,
      body: message.body,
    },
    tokens: registrationTokens,
  };

  getMessaging()
    .sendEachForMulticast(notification)
    .then((response) => {
      console.log(response.successCount + " messages were sent successfully");
      res
        .status(200)
        .send(response.successCount + " messages were sent successfully");
    })
    .catch(() => {
      res.status(500);
    });
});
