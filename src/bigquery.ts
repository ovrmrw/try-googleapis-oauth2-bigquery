import type { OAuth2Client } from "google-auth-library";

import { google } from "googleapis";
import { BigQuery } from "@google-cloud/bigquery";

const bigquery = google.bigquery("v2");

export async function queryBatch(oauth2Client: OAuth2Client) {
  const { email } = await oauth2Client.getTokenInfo(oauth2Client.credentials.access_token);
  const config = {
    projectId: process.env.PROJECT_ID,
    auth: oauth2Client,
    quotaUser: email,
  };

  const res = await bigquery.jobs.insert({
    ...config,
    requestBody: {
      configuration: {
        query: {
          query: process.env.QUERY,
          useLegacySql: false,
          priority: "BATCH",
          flattenResults: true,
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
