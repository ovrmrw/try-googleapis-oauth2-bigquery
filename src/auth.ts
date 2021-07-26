import { auth } from "express-openid-connect";

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: "a long, randomly-generated string stored in env",
  baseURL: "http://localhost:3000",
  clientID: "4mWNDOcWk4dJ7D8SE5jKnI7gaJRW2EJO",
  issuerBaseURL: "https://dev-0i26y1kj.jp.auth0.com",
};

export const openidConnectAuthMiddleware = auth({
  ...config,
  routes: {
    login: false,
  },
});
