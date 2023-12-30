/* eslint-disable @typescript-eslint/no-var-requires */
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import * as express from "express";
import { MessageDTO } from "../models/MessageDTO";
export const messagingRoutes = express.Router();

messagingRoutes.post("/send", async (req, res) => {
  const message = Object.assign(new MessageDTO(), req.body);

  let snap;
  if (!message.body) {
    snap = await getFirestore()
      .collection("messagingTokens")
      .where("userId", "in", message.users)
      .get();
  } else {
    snap = await getFirestore().collection("messagingTokens").get();
  }

  const registrationTokens: string[] = [];
  snap.forEach((res) => {
    const token = res.data().token;
    if (token) registrationTokens.push(...res.data().token);
  });

  const notification = {
    notification: {
      title: message.title,
      body: message.message,
    },
    tokens: registrationTokens,
  };
  console.log(registrationTokens);
  getMessaging()
    .sendEachForMulticast(notification)
    .then((response) => {
      res
        .status(200)
        .send(response.successCount + " messages were sent successfully");
    })
    .catch(() => {
      res.status(500);
    });
});
