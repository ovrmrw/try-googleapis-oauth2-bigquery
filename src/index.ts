require("dotenv").config();

import express from "express";
import { oauth2Client, authUrl } from "./oauth2";
import { queryBatch } from "./bigquery";

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.redirect(authUrl);
});
app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code as string;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const { schema, rows } = await queryBatch(oauth2Client);
  res.json({ credentials: oauth2Client.credentials, schema, rows });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
  console.log(authUrl);
});
