import type { OAuth2Client } from "google-auth-library";

import * as admin from "firebase-admin";

admin.initializeApp();

interface User extends Record<string, any> {
  email?: string;
  email_verified?: boolean;
  sub?: string;
}

export async function createCustomToken(user: User) {
  if (user.email_verified) {
    const customToken = await admin.auth().createCustomToken(user.email);
    console.log({ customToken });
    return customToken;
  } else {
    return null;
  }
}

export async function verifyIdToken(idToken: string) {
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  return decodedToken;
}
