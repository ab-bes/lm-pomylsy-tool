import { useState, useRef } from "react";

const TOTAL_STEPS = 4;

const FORMAT_OPTIONS = [
  { value: "PDF/Checklista", label: "PDF / Checklista" },
  { value: "Wideo", label: "Wideo" },
  { value: "Quiz/Test", label: "Krótki quiz / test" },
  { value: "nie jestem pewna", label: "Nie jestem pewna" },
];

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

function MicButton({ onResult }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  if (!SpeechRecognitionAPI) {
    return (
      <button
        type="button"
        className="mic-btn"
        style={{ opacity: 0.4, cursor: "not-allowed" }}
        title="Wprowadzanie głosowe nie jest obsługiwane w tej przeglądarce, otwórz w Chrome"
      >
        <MicIcon />
      </button>
    );
  }

  const handleClick = () => {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "pl-PL";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <button
      type="button"
      className={"mic-btn" + (listening ? " listening" : "")}
      onClick={handleClick}
      title="Nagraj odpowiedź głosowo"
    >
      <MicIcon />
    </button>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z" />
      <path d="M19 11a1 1 0 10-2 0 5 5 0 01-10 0 1 1 0 10-2 0 7 7 0 006 6.92V20H9a1 1 0 100 2h6a1 1 0 100-2h-2v-2.08A7 7 0 0019 11z" />
    </svg>
  );
}

export default function App() {
  const [step, setStep] = useState(0);
  const [branza, setBranza] = useState("");
  const [grupaDocelowa, setGrupaDocelowa] = useState("");
  const [problem, setProblem] = useState("");
  const [pierwszyKrok, setPierwszyKrok] = useState("");
  const [format, setFormat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ideas, setIdeas] = useState(null);

  function currentValid() {
    if (step === 0) return branza.trim() && grupaDocelowa.trim();
    if (step === 1) return problem.trim();
    if (step === 2) return pierwszyKrok.trim();
    if (step === 3) return !!format;
    return false;
  }

  function handleNext() {
    if (!currentValid()) {
      setError("Odpowiedz na pytanie, zanim przejdziesz dalej.");
      return;
    }
    setError("");
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      generateIdeas();
    }
  }

  function handleBack() {
    setError("");
    if (step > 0) setStep(step - 1);
  }

  function handleReset() {
    setBranza("");
    setGrupaDocelowa("");
    setProblem("");
    setPierwszyKrok("");
    setFormat(null);
    setIdeas(null);
    setError("");
    setStep(0);
  }

  async function generateIdeas() {
    setError("");
    setLoading(true);

    const prompt = `Jesteś strategiem marketingowym dla kobiet, które chcą zbudować lead magnet (darmowy prezent), aby zbierać adresy e-mail. Uczestniczki pochodzą z bardzo różnych branż, nie tylko z branży zdrowotnej.

Odpowiedzi użytkowniczki:
- Branża i specjalizacja: ${branza}
- Grupa docelowa: ${grupaDocelowa}
- Największy problem wymarzonej klientki: ${problem}
- Pierwszy mały krok, który by zaoferowała: ${pierwszyKrok}
- Preferowany format: ${format}

Wygeneruj 5 konkretnych koncepcji lead magnetów na podstawie tych odpowiedzi. Każda koncepcja musi zawierać:
- Gotowy, chwytliwy tytuł (żadnych ogólnych nazw typu "Twój przewodnik po...")
- Format (dopasowany do odpowiedzi, chyba że wybrano "nie jestem pewna", wtedy urozmaicaj)
- Jedno zdanie opisu, co dokładnie zawiera
- Propozycję pierwszego zdania nagłówka na landing page, które promuje ten lead magnet

Preferuj konkretne liczby i ramy czasowe w tytule (np. "3 kroki", "5-minutowy test"), jeśli pasują do specjalizacji.

Unikaj ogólnych sformułowań typu "Otrzymaj cenne wskazówki" lub "Twoja droga do...". Zamiast tego używaj języka, którego użyłaby sama wpisana grupa docelowa.

Odpowiedz WYŁĄCZNIE tablicą JSON, bez wstępu, bez tekstu, bez bloków markdown. Format:
[{"title": "...", "format": "...", "description": "...", "headline": "..."}]`;

    try {
      const response = await fetch("/.netlify/functions/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Żądanie nie powiodło się (${response.status})`);
      }

      const data = await response.json();
      const textBlocks = data.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      const cleaned = textBlocks.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      setIdeas(parsed);
    } catch (err) {
      setError("Coś poszło nie tak: " + err.message + ". Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <h1>Twój Generator Pomysłów na Lead Magnet</h1>
      <div className="sub">4 krótkie pytania. 5 gotowych koncepcji lead magnetu, dopasowanych do Twojej grupy docelowej.</div>

      {!ideas && !loading && (
        <>
          <div className="progress">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={"dot" + (i === step ? " active" : "") + (i < step ? " done" : "")}
              />
            ))}
          </div>

          <div className="card">
            {step === 0 && (
              <div className="step">
                <div className="step-number">Pytanie 1 z 4</div>
                <label>W jakiej branży pracujesz i w czym dokładnie się specjalizujesz?</label>
                <div className="hint">Napisz, w jakiej jesteś branży i czym się zajmujesz</div>
                <div className="input-row">
                  <textarea
                    rows={3}
                    placeholder='np. "Fizjoterapia, specjalizacja: bóle pleców po porodzie" lub "Doradztwo żywieniowe dla kobiet w okresie menopauzy"'
                    value={branza}
                    onChange={(e) => setBranza(e.target.value)}
                  />
                  <MicButton onResult={(t) => setBranza((v) => (v ? v.trim() + " " + t : t))} />
                </div>
                <div className="mic-note">Kliknij mikrofon, aby nagrać odpowiedź głosowo zamiast pisać.</div>

                <label style={{ marginTop: 20 }}>Kim dokładnie jest Twoja grupa docelowa?</label>
                <div className="hint">Kim dokładnie jest Twoja wymarzona klientka?</div>
                <div className="input-row">
                  <textarea
                    rows={2}
                    placeholder='np. "Kobiety w wieku 35-50 lat, które od lat zmagają się z bólem pleców" lub "Świeżo samozatrudnione doradczynie żywieniowe"'
                    value={grupaDocelowa}
                    onChange={(e) => setGrupaDocelowa(e.target.value)}
                  />
                  <MicButton onResult={(t) => setGrupaDocelowa((v) => (v ? v.trim() + " " + t : t))} />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="step">
                <div className="step-number">Pytanie 2 z 4</div>
                <label>Jaki jest największy problem Twojej wymarzonej klientki, zanim w ogóle pomyśli o Tobie?</label>
                <div className="hint">Punkt bólu, nie rozwiązanie</div>
                <div className="input-row">
                  <textarea
                    rows={3}
                    placeholder='np. "Czuje się wyczerpana i nie wie, jak odzyskać energię"'
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                  />
                  <MicButton onResult={(t) => setProblem((v) => (v ? v.trim() + " " + t : t))} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="step">
                <div className="step-number">Pytanie 3 z 4</div>
                <label>Jaki jest pierwszy mały krok, który dałabyś jej, gdyby jeszcze nie chciała się u Ciebie zapisać?</label>
                <div className="hint">Pokazuje, co nadaje się na lead magnet, a nie na płatną ofertę</div>
                <div className="input-row">
                  <textarea
                    rows={3}
                    placeholder='np. "Proste ćwiczenie na pierwszy tydzień"'
                    value={pierwszyKrok}
                    onChange={(e) => setPierwszyKrok(e.target.value)}
                  />
                  <MicButton onResult={(t) => setPierwszyKrok((v) => (v ? v.trim() + " " + t : t))} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="step">
                <div className="step-number">Pytanie 4 z 4</div>
                <label>Jaki format najbardziej Ci odpowiada?</label>
                <div className="format-options">
                  {FORMAT_OPTIONS.map((opt) => (
                    <div
                      key={opt.value}
                      className={"format-option" + (format === opt.value ? " selected" : "")}
                      onClick={() => setFormat(opt.value)}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <div className="error">{error}</div>}

            <div className="nav-row">
              <button
                className="nav back"
                onClick={handleBack}
                style={{ visibility: step === 0 ? "hidden" : "visible" }}
              >
                Wstecz
              </button>
              <button className="nav next" onClick={handleNext}>
                {step === TOTAL_STEPS - 1 ? "Wygeneruj 5 pomysłów" : "Dalej"}
              </button>
            </div>
          </div>
        </>
      )}

      {loading && (
        <div className="loading">
          <div className="spinner" />
          Claude wymyśla Twoje koncepcje...
        </div>
      )}

      {ideas && !loading && (
        <>
          <div className="results">
            {ideas.map((idea, i) => (
              <div className="result-card" key={i}>
                <div className="result-meta">{idea.format}</div>
                <div className="result-title">{idea.title}</div>
                <div className="result-desc">{idea.description}</div>
                <div className="result-headline">
                  <b>Nagłówek strony docelowej:</b> {idea.headline}
                </div>
              </div>
            ))}
          </div>
          <button className="reset" onClick={handleReset}>
            Wprowadź nowe odpowiedzi
          </button>
        </>
      )}
    </div>
  );
}
