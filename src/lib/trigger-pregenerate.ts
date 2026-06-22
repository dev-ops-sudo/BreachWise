/** Fire-and-forget: preload Q1 for every scenario after login. */
export function triggerPregenerateAll() {
  fetch("/api/warroom/preload-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ all: true }),
  }).catch(() => {});
}
