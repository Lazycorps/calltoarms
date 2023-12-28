import { defineString } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";

const clientIdEnv = defineString("TWITCH_CLIENT_ID");

export const searchGames = onRequest(
  { secrets: ["TWITCH_SECRET"], cors: true },
  async (request, response) => {
    const clientId = clientIdEnv.value();
    const secret = process.env.TWITCH_SECRET;
    const tokenResponse = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${secret}&grant_type=client_credentials`,
      { method: "POST" }
    );
    const body = await tokenResponse.json();
    console.log(body);
    const limit = 50;

    const requestHeaders: HeadersInit = new Headers();
    requestHeaders.set("Client-ID", `${clientId?.toString()}`);
    requestHeaders.set("Authorization", `Bearer ${body.access_token}`);

    const gameQuery = `fields id,name,slug,cover; limit ${limit}; sort follows desc;`;
    const gameResponse = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: requestHeaders,
      body: gameQuery,
    });
    const gamesBody = await gameResponse.json();

    const coverQuery = `fields game,image_id,url; limit ${limit}; where game = (${gamesBody
      .map((g: any) => g.id)
      .join(",")});`;
    const coverResponse = await fetch("https://api.igdb.com/v4/covers", {
      method: "POST",
      headers: requestHeaders,
      body: coverQuery,
    });
    const coverBody = await coverResponse.json();

    const games = [];
    for (const game of gamesBody) {
      games.push({
        id: game.id,
        name: game.name,
        coverUrl: coverBody
          .find((cover: any) => cover.game == game.id)
          ?.url?.replaceAll("t_thumb", "t_cover_big"),
      });
    }

    response.json(games);
  }
);
