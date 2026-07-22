// Shared Plaid HTTP helper. We call Plaid's REST API directly so we don't need
// the plaid-node SDK (which pulls in Node built-ins that don't run cleanly in Deno).

const ENV = (Deno.env.get("PLAID_ENV") ?? "sandbox").toLowerCase();
const HOSTS: Record<string, string> = {
  sandbox: "https://sandbox.plaid.com",
  development: "https://development.plaid.com",
  production: "https://production.plaid.com",
};
export const PLAID_HOST = HOSTS[ENV] ?? HOSTS.sandbox;

export async function plaidFetch<T = any>(path: string, body: Record<string, unknown>): Promise<T> {
  const clientId = Deno.env.get("PLAID_CLIENT_ID");
  const secret = Deno.env.get("PLAID_SECRET");
  if (!clientId || !secret) throw new Error("Plaid credentials not configured");
  const res = await fetch(`${PLAID_HOST}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, secret, ...body }),
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  if (!res.ok) {
    const msg = json?.error_message || json?.error_code || text || `Plaid ${res.status}`;
    throw new Error(`Plaid error: ${msg}`);
  }
  return json as T;
}
