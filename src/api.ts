import axios from "axios";

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

interface Response {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export function refreshAccessToken(refreshToken: string): Promise<Response> {
  const endpoint = "https://oauth2.googleapis.com/token";
  return axios
    .post(endpoint, {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    })
    .then((res) => res.data);
}
