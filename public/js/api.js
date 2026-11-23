/*
 * api.js
 * One small wrapper around fetch() for every call to the server.
 * The server answers errors as { error: "..." } (built by friendlyError),
 * so failures are turned into an Error carrying that readable message.
 */

export async function api(method, url, body) {
  const options = { method, headers: {} };
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error("Cannot reach the server. Is it still running?");
  }

  // Some failures (e.g. a proxy error) may not be JSON, so parse defensively
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (HTTP ${response.status}).`);
  }
  return data;
}
