/* eslint-disable @typescript-eslint/no-var-requires */
import * as admin from "firebase-admin";
import * as express from "express";
import { onRequest } from "firebase-functions/v2/https";
import { gamesRoutes } from "./Routes/Games";
import { messagingRoutes } from "./Routes/Messaging";
export const app = express();
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

app.use(express.json());

app.use("/games", gamesRoutes);
app.use("/messaging", messagingRoutes);

app.get("/", (req, res) => {
  res.send("Hello !");
});

exports.callToArmsApi = onRequest(
  { secrets: ["TWITCH_SECRET"], cors: true },
  app
);
