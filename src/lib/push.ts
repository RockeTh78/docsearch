export async function sendPushNotifications(tokens: string[], title: string, body: string) {
  if (!tokens.length) return;
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(
      tokens.map(token => ({ to: token, title, body, sound: "default", badge: 1 }))
    ),
  }).catch(() => {});
}
