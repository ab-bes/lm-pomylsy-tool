// netlify/functions/generate-ideas.js
//
// Diese Funktion läuft serverseitig auf Netlify. Der Anthropic-API-Key wird
// NIEMALS an den Browser geschickt, er bleibt in der Umgebungsvariable
// ANTHROPIC_API_KEY, die du im Netlify-Dashboard hinterlegst
// (Site configuration -> Environment variables).

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Nur POST erlaubt" }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "ANTHROPIC_API_KEY ist auf Netlify nicht gesetzt." }),
    };
  }

  let prompt;
  try {
    const body = JSON.parse(event.body || "{}");
    prompt = body.prompt;
    if (!prompt || typeof prompt !== "string") {
      return { statusCode: 400, body: JSON.stringify({ error: "Feld 'prompt' fehlt oder ist ungültig." }) };
    }
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Ungültiges JSON im Request-Body." }) };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error?.message || "Anthropic-API-Fehler" }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
