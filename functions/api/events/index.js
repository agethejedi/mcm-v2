// functions/api/events/index.js
// Returns the library index (array) for v2 events

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
}

function getKV(env) {
  if (env.MCM_KV) return env.MCM_KV;
  if (env.KV) return env.KV;
  for (const k of Object.keys(env || {})) {
    const v = env[k];
    if (v && typeof v.get === "function" && typeof v.put === "function") return v;
  }
  return null;
}

export async function onRequestGet({ env }) {
  const kv = getKV(env);
  if (!kv) return json({ error: "Missing KV binding (expected env.MCM_KV)" }, 500);

  const idx = await kv.get("mcm:v2:events:index", "json");
  return json(Array.isArray(idx) ? idx : []);
}
