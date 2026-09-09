// netlify/functions/generate-ideas.js
//
// Ta funkcja działa po stronie serwera na Netlify. Klucz API Anthropic NIGDY
// nie trafia do przeglądarki - pozostaje w zmiennej środowiskowej
// ANTHROPIC_API_KEY, którą ustawiasz w panelu Netlify
// (Site configuration -> Environment variables).

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Dozwolona jest tylko metoda POST." }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Klucz ANTHROPIC_API_KEY nie jest ustawiony w Netlify." }),
    };
  }

  let prompt;
  try {
    const body = JSON.parse(event.body || "{}");
    prompt = body.prompt;
    if (!prompt || typeof prompt !== "string") {
      return { statusCode: 400, body: JSON.stringify({ error: "Pole 'prompt' jest puste lub nieprawidłowe." }) };
    }
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Nieprawidłowy JSON w treści żądania." }) };
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
        body: JSON.stringify({ error: data.error?.message || "Błąd API Anthropic." }),
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
