/* eslint-disable @typescript-eslint/no-var-requires */
import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
const express = require("express");
export const app = express();

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const gamesRoute = require("./Routes/Games");
const massagingRoute = require("./Routes/Messaging");
app.use("/games", gamesRoute);
app.use("/messaging", massagingRoute);

app.get("/", (req: any, res: any) => {
  res.send("Hello !");
});

exports.callToArmsApi = onRequest(
  { secrets: ["TWITCH_SECRET"], cors: true },
  app
);
