import { writeFileSync } from "node:fs";

const clientID = process.env.GOOGLE_OAUTH_CLIENT_ID ?? "";
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "";

writeFileSync(
  "google_oauth_buildvars.go",
  `package main

func init() {
\tgoogleOAuthClientID = ${JSON.stringify(clientID)}
\tgoogleOAuthClientSecret = ${JSON.stringify(clientSecret)}
}
`,
  { mode: 0o600 },
);
