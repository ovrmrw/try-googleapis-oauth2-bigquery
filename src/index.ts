require("dotenv").config();

import express from "express";
import { requiresAuth } from "express-openid-connect";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { generateOAuth2AuthUrl, getOAuth2Client } from "./oauth2";
import { createCustomToken, verifyIdToken } from "./firebase-admin";
import { signIn } from "./firebase-client";
import { queryBatch } from "./bigquery";
import { openidConnectAuthMiddleware } from "./auth";
import { refreshAccessToken } from "./api";
import { safeJsonParse } from "./utils";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(openidConnectAuthMiddleware);

// req.isAuthenticated is provided from the auth router
app.get("/", (req, res) => {
  const loggedIn = req.oidc.isAuthenticated();
  const idToken = req.query.token;
  res.json({ loggedIn, idToken });
});
app.get("/login", (req, res) => {
  const mode = req.query.mode as string;
  res.oidc.login({ returnTo: `/login_firebase?mode=${mode}` });
});
app.get("/login_firebase", async (req, res) => {
  console.log(req.headers);
  let auth0User: Record<string, any>;
  try {
    auth0User = JSON.parse(req.get("AUTH0-USER"));
  } catch (e) {
    throw e;
  }
  const mode = req.query.mode as string;
  // const customToken = await createCustomToken(req.oidc.user);
  const customToken = await createCustomToken(auth0User);
  if (mode === "spa") {
    return res.json({ customToken });
  }

  const user = await signIn(customToken);

  const decodedToken = await verifyIdToken(await user.getIdToken());
  console.log({ uidFromClient: user.uid, uidFromAdmin: decodedToken.uid });

  const idToken = await user.getIdToken();
  res.redirect(`/?token=${encodeURIComponent(idToken)}`);
});
app.get("/profile", (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});

/**
 * Google OAuth2 の認証画面で許可をした場合のリダイレクト先。
 * ここからさらに管理画面にリダイレクトする。
 */
app.get("/oauth2callback", async (req, res) => {
  const { redirectUrl } = safeJsonParse(req.query.state);
  const code = req.query.code as string;
  const { tokens } = await getOAuth2Client().getToken(code);
  res
    .cookie("google_oauth2_access_token", tokens.access_token, {
      expires: new Date(tokens.expiry_date),
      httpOnly: true,
      secure: true,
    })
    .cookie("google_oauth2_refresh_token", tokens.refresh_token, {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: true,
    })
    .redirect(redirectUrl || "http://localhost:4000");
});

/**
 * Google OAuth2 認証画面の URL を返す。
 * TODO: Auth0 のユーザー情報は Auth0 の API を叩いて取得できないだろうか？
 *   Auth0 と Firebase のユーザー情報を比較している処理がダサい。
 */
app.get("/google_oauth2_url", async (req, res) => {
  const redirectUrl = req.get("REDIRECT-URL");
  const auth0User = safeJsonParse(req.get("AUTH0-USER"));
  const [, idToken] = req.get("Authorization").match(/Bearer ([^$]+)/);
  const decodedToken = await verifyIdToken(idToken);
  const authUrl = generateOAuth2AuthUrl(redirectUrl);
  console.log({ auth0User, decodedToken });
  if (auth0User.email !== decodedToken.user_id) {
    res.status(401).send();
  } else {
    res.json({ authUrl });
  }
});

/**
 * Google OAuth2 のアクセストークンを使って BigQuery にクエリを実行する。
 */
app.get("/query", async (req, res) => {
  const query = req.query.query as string;
  const accessToken = req.cookies["google_oauth2_access_token"] as string;
  // const query = req.get("QUERY") as string;
  if (!accessToken) {
    res.status(401).send();
  }
  try {
    const { schema, rows } = await queryBatch(accessToken, query);
    res.json({ schema, rows });
  } catch (e) {
    console.error(e);
    res.status(500).send();
  }
});

/**
 * リフレッシュトークンを使って Google OAuth2 のアクセストークンを更新する。
 */
app.get("/refresh_access_token", async (req, res) => {
  const refreshToken = req.cookies["google_oauth2_refresh_token"] as string;
  if (!refreshToken) {
    res.send("Refresh token is not set.");
  }
  try {
    const data = await refreshAccessToken(refreshToken);
    res
      .cookie("google_oauth2_access_token", data.access_token, {
        expires: new Date(Date.now() + data.expires_in * 1000),
        httpOnly: true,
        secure: true,
      })
      .json(data);
  } catch (e) {
    console.error(e);
    res.status(500).send();
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
  // console.log(authUrl);
});
