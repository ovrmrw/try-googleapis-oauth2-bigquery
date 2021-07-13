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

export const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
);

export const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: scopes,
  prompt: "consent",
});
