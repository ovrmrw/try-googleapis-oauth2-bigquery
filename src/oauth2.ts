import { google } from "googleapis";

const scopes = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/cloud-platform",
  "https://www.googleapis.com/auth/appengine.admin",
  "https://www.googleapis.com/auth/compute",
  "https://www.googleapis.com/auth/accounts.reauth",
  "https://www.googleapis.com/auth/drive",
];

const oauth2Client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URL);

export function getOAuth2Client() {
  return new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URL);
}

export const authUrl = getOAuth2Client().generateAuthUrl({
  access_type: "offline",
  scope: scopes,
  prompt: "consent",
});

export function generateOAuth2AuthUrl(redirectUrl: string) {
  return getOAuth2Client().generateAuthUrl({
    state: JSON.stringify({ redirectUrl }),
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });
}
