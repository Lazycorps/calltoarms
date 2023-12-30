/* eslint-disable @typescript-eslint/no-var-requires */
import * as admin from "firebase-admin";
import * as express from "express";
import { onRequest } from "firebase-functions/v2/https";
import { gamesRoutes } from "./Routes/Games";
import { messagingRoutes } from "./Routes/Messaging";
const cookieParser = require("cookie-parser")();

export const app = express();
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const validateFirebaseIdToken = async (req: any, res: any, next: any) => {
  if (
    (!req.headers.authorization ||
      !req.headers.authorization.startsWith("Bearer ")) &&
    !(req.cookies && req.cookies.__session)
  ) {
    res.status(403).send("Unauthorized");
    return;
  }

  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else if (req.cookies) {
    idToken = req.cookies.__session;
  } else {
    res.status(403).send("Unauthorized");
    return;
  }

  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedIdToken;
    next();
    return;
  } catch (error) {
    res.status(403).send("Unauthorized");
    return;
  }
};

app.use(express.json());
app.use(cookieParser);
app.use(validateFirebaseIdToken);
app.use("/games", gamesRoutes);
app.use("/messaging", messagingRoutes);

app.get("/", (req, res) => {
  res.send("Hello !");
});

exports.callToArmsApi = onRequest(
  { secrets: ["TWITCH_SECRET"], cors: true },
  app
);
