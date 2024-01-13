import { getFirestore } from "firebase-admin/firestore";
import { defineString } from "firebase-functions/params";
import * as express from "express";
export const gamesRoutes = express.Router();

const clientIdEnv = defineString("TWITCH_CLIENT_ID");

gamesRoutes.get("/search", async (request, response) => {
  const search = request.query.name as string;

  let twitchToken = await GetToken();
  let gameResponse = await GetGames(search.toString(), twitchToken);
  if (gameResponse.status == 401) {
    twitchToken = await GetToken(true);
    gameResponse = await GetGames(search, twitchToken);
  }
  const gamesBody = await gameResponse.json();

  const gamesArray = [...gamesBody];
  gamesArray.forEach((g) => {
    g.cover.url = g.cover?.url?.replaceAll("t_thumb", "t_cover_big");
  });
  const gameSort = gamesArray.sort(function (a, b) {
    return a.total_rating_count > b.total_rating_count ? -1 : 1;
  });
  response.json(gameSort);
});

async function GetToken(getNew = false) {
  const clientId = clientIdEnv.value();
  const secret = process.env.TWITCH_SECRET;

  const appSettings = await getFirestore()
    .collection("settings")
    .doc("AppSettings")
    .get();

  const twitchToken = appSettings.data()?.twitchToken;
  if (getNew || !twitchToken) {
    const tokenResponse = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${secret}&grant_type=client_credentials`,
      { method: "POST" }
    );
    const body = await tokenResponse.json();
    await getFirestore()
      .collection("settings")
      .doc("AppSettings")
      .set({ twitchToken: body.access_token });
    return body.access_token;
  } else {
    return twitchToken;
  }
}

async function GetGames(search: string, twitchToken: string) {
  const clientId = clientIdEnv.value();

  const requestHeaders: HeadersInit = new Headers();
  requestHeaders.set("Client-ID", `${clientId?.toString()}`);
  requestHeaders.set("Authorization", `Bearer ${twitchToken}`);

  let gameQuery = `fields id,name,slug,cover.url,total_rating_count; limit 60; where version_parent = null; where total_rating_count > 20;`;
  if (search) gameQuery = `${gameQuery} search "${search}";`;
  else gameQuery = `${gameQuery} sort total_rating_count desc;`;

  const gameResponse = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: requestHeaders,
    body: gameQuery,
  });
  return gameResponse;
}
