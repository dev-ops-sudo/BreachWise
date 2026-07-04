/** Fire-and-forget: warm Q1 for all scenarios using a dedicated login session id. */
export function triggerPregenerateAll() {
  const sessionId = crypto.randomUUID();
  sessionStorage.setItem("pregenerate_warmup_session_id", sessionId);
  fetch("/api/pregenerate/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  }).catch(() => {});
}
