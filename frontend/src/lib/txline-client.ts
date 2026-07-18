/**
 * txline-client.ts
 *
 * Axios client pre-configured for TxLINE's dev API.
 * Uses a custom httpsAgent with rejectUnauthorized: false because
 * txline-dev.txodds.com presents a self-signed / intermediate cert that
 * Node's undici-based fetch rejects (NODE_TLS_REJECT_UNAUTHORIZED has no
 * effect on undici). Axios uses Node's built-in https module which does
 * respect a custom agent.
 */
import axios from "axios";
import https from "https";

const txlineAgent = new https.Agent({ rejectUnauthorized: false });

export const txlineClient = axios.create({
  baseURL: "https://txline-dev.txodds.com/api",
  httpsAgent: txlineAgent,
  timeout: 5000,
});

/** Attach auth headers to every request */
export function withAuth(jwt: string, apiToken: string) {
  return {
    headers: {
      Authorization: `Bearer ${jwt}`,
      "X-Api-Token": apiToken,
    },
  };
}
