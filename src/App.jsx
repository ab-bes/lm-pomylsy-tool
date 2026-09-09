import { useState, useRef } from "react";

const TOTAL_STEPS = 5;

const FORMAT_OPTIONS = [
  { value: "PDF / Checklista", label: "PDF / Checklista" },
  { value: "Wideo", label: "Wideo" },
  { value: "Krótki quiz / test", label: "Krótki quiz / test" },
  { value: "Nie jestem pewna", label: "Nie jestem pewna" },
];

const NIE_PEWNA = "Nie jestem pewna";

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
        title="Ta przeglądarka nie obsługuje wprowadzania głosowego - otwórz stronę w Chrome"
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
  const [klientka, setKlientka] = useState("");
  const [problem, setProblem] = useState("");
  const [malyEfekt, setMalyEfekt] = useState("");
  const [formaty, setFormaty] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ideas, setIdeas] = useState(null);

  function currentValid() {
    if (step === 0) return branza.trim();
    if (step === 1) return klientka.trim();
    if (step === 2) return problem.trim();
    if (step === 3) return malyEfekt.trim();
    if (step === 4) return formaty.length > 0;
    return false;
  }

  function toggleFormat(value) {
    setError("");
    setFormaty((prev) => {
      if (value === NIE_PEWNA) {
        return prev.includes(NIE_PEWNA) ? [] : [NIE_PEWNA];
      }
      const withoutNiePewna = prev.filter((v) => v !== NIE_PEWNA);
      return withoutNiePewna.includes(value)
        ? withoutNiePewna.filter((v) => v !== value)
        : [...withoutNiePewna, value];
    });
  }

  function handleNext() {
    if (!currentValid()) {
      setError(
        step === 4
          ? "Zaznacz przynajmniej jeden format."
          : "Odpowiedz na pytanie, zanim przejdziesz dalej."
      );
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
    setKlientka("");
    setProblem("");
    setMalyEfekt("");
    setFormaty([]);
    setIdeas(null);
    setError("");
    setStep(0);
  }

  async function generateIdeas() {
    setError("");
    setLoading(true);

    const formatyText = formaty.join(", ");
    const niePewna = formaty.includes(NIE_PEWNA);

    const prompt = `Jesteś strategiem marketingowym dla kobiet, które chcą zbudować lead magnet (darmowy prezent), aby zbierać adresy e-mail. Uczestniczki pochodzą z bardzo różnych branż, nie tylko z branży zdrowotnej.

Odpowiedzi użytkowniczki:
- Branża i specjalizacja: ${branza}
- Wymarzona klientka: ${klientka}
- Największy problem wymarzonej klientki: ${problem}
- Mały, szybki efekt, który może jej dać za darmo (krok w stronę rozwiązania tego problemu): ${malyEfekt}
- Wybrane formaty: ${formatyText}

Wygeneruj 5 konkretnych koncepcji lead magnetów na podstawie tych odpowiedzi. Każda koncepcja musi zawierać:
- Gotowy, chwytliwy tytuł (żadnych ogólnych nazw typu "Twój przewodnik po...")
- Format ${
      niePewna
        ? "dobrany przez Ciebie - wybierz najlepszy dla danego pomysłu i urozmaicaj formaty między koncepcjami"
        : `wybrany wyłącznie z listy wskazanej przez użytkowniczkę (${formatyText}); jeśli do pomysłu pasuje kilka, wybierz najlepszy`
    }
- Jedno zdanie opisu, co dokładnie zawiera
- Propozycję pierwszego zdania nagłówka na landing page, który promuje ten lead magnet

Każdy pomysł ma rozwiązywać część największego problemu wymarzonej klientki i dawać jej szybki, odczuwalny efekt.

Preferuj konkretne liczby i ramy czasowe w tytule (np. "3 kroki", "test w 5 minut"), jeśli pasują do specjalizacji.

Unikaj ogólnych sformułowań typu "Otrzymaj cenne wskazówki" lub "Twoja droga do...". Zamiast tego używaj języka, którego użyłaby sama wymarzona klientka.

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
      <h1>Twój generator pomysłów na lead magnet</h1>
      <div className="sub">
        5 krótkich pytań. 5 gotowych pomysłów na lead magnet, dopasowanych do Twojej wymarzonej klientki.
      </div>

      {!ideas && !loading && (
        <>
          <div className="progress">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={"dot" + (i === step ? " active" : "") + (i < step ? " done" : "")}
              />
            ))}
          </div>

          <div className="card">
            {step === 0 && (
              <div className="step">
                <div className="step-number">Pytanie 1 z 5</div>
                <label>W jakiej branży pracujesz i w czym dokładnie się specjalizujesz?</label>
                <div className="hint">Krótko: branża i Twoja specjalizacja.</div>
                <div className="input-row">
                  <textarea
                    rows={3}
                    placeholder='np. "Fizjoterapia, specjalizacja: ból pleców po porodzie" lub "Doradztwo żywieniowe dla kobiet w okresie menopauzy"'
                    value={branza}
                    onChange={(e) => setBranza(e.target.value)}
                  />
                  <MicButton onResult={(t) => setBranza((v) => (v ? v.trim() + " " + t : t))} />
                </div>
                <div className="mic-note">Kliknij mikrofon, aby odpowiedzieć głosowo zamiast pisać.</div>
              </div>
            )}

            {step === 1 && (
              <div className="step">
                <div className="step-number">Pytanie 2 z 5</div>
                <label>Kim dokładnie jest Twoja wymarzona klientka?</label>
                <div className="hint">Wiek, sytuacja, etap - im konkretniej, tym lepiej.</div>
                <div className="input-row">
                  <textarea
                    rows={3}
                    placeholder='np. "Kobiety w wieku 35-50 lat, które od lat zmagają się z bólem pleców" lub "Doradczynie żywieniowe na początku działalności"'
                    value={klientka}
                    onChange={(e) => setKlientka(e.target.value)}
                  />
                  <MicButton onResult={(t) => setKlientka((v) => (v ? v.trim() + " " + t : t))} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="step">
                <div className="step-number">Pytanie 3 z 5</div>
                <label>
                  Z jakim największym problemem mierzy się Twoja wymarzona klientka, zanim w ogóle o Tobie pomyśli?
                </label>
                <div className="hint">Ból, nie rozwiązanie.</div>
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

            {step === 3 && (
              <div className="step">
                <div className="step-number">Pytanie 4 z 5</div>
                <label>
                  Jaki mały, konkretny efekt możesz jej dać za darmo, żeby zbliżyła się do rozwiązania tego problemu?
                </label>
                <div className="hint">
                  Mały, szybki wynik - nie całe rozwiązanie. To materiał na lead magnet, nie na płatną ofertę.
                </div>
                <div className="input-row">
                  <textarea
                    rows={3}
                    placeholder='np. "5-minutowe ćwiczenie na każdy dzień, które w tydzień zmniejsza napięcie w plecach"'
                    value={malyEfekt}
                    onChange={(e) => setMalyEfekt(e.target.value)}
                  />
                  <MicButton onResult={(t) => setMalyEfekt((v) => (v ? v.trim() + " " + t : t))} />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="step">
                <div className="step-number">Pytanie 5 z 5</div>
                <label>Jakie formaty wchodzą w grę?</label>
                <div className="hint">Możesz zaznaczyć kilka.</div>
                <div className="format-options">
                  {FORMAT_OPTIONS.map((opt) => {
                    const checked = formaty.includes(opt.value);
                    return (
                      <div
                        key={opt.value}
                        className={"format-option" + (checked ? " selected" : "")}
                        onClick={() => toggleFormat(opt.value)}
                        role="checkbox"
                        aria-checked={checked}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === " " || e.key === "Enter") {
                            e.preventDefault();
                            toggleFormat(opt.value);
                          }
                        }}
                      >
                        <span className="box">{checked ? "✓" : ""}</span>
                        <span>{opt.label}</span>
                      </div>
                    );
                  })}
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
          Claude przygotowuje Twoje pomysły...
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
                  <b>Nagłówek landing page:</b> {idea.headline}
                </div>
              </div>
            ))}
          </div>
          <button className="reset" onClick={handleReset}>
            Zacznij od nowa
          </button>
        </>
      )}
    </div>
  );
}
