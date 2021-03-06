import type { OAuth2Client } from "google-auth-library";

import { google } from "googleapis";
import { BigQuery } from "@google-cloud/bigquery";
import { getOAuth2Client } from "./oauth2";

const bigquery = google.bigquery("v2");

export async function queryBatch(accessToken: string, query: string) {
  const { email } = await getOAuth2Client().getTokenInfo(accessToken);
  const config = {
    projectId: process.env.PROJECT_ID,
    // auth: oauth2Client,
    oauth_token: accessToken,
    quotaUser: email,
  };

  const res = await bigquery.jobs.insert({
    ...config,
    requestBody: {
      configuration: {
        query: {
          query: query || process.env.QUERY,
          useLegacySql: false,
          priority: "BATCH",
        },
      },
    },
  });
  console.log(res);

  let state = "RUNNING";
  while (true) {
    const job = await bigquery.jobs.get({ ...config, jobId: res.data.jobReference.jobId });
    state = job.data.status.state;
    if (state !== "RUNNING") {
      console.log(job);
      break;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  const result = await bigquery.jobs.getQueryResults({ ...config, jobId: res.data.jobReference.jobId });
  console.log(result);
  const rows = BigQuery.mergeSchemaWithRows_(result.data.schema, result.data.rows, false);
  return { schema: result.data.schema, rows };
}
