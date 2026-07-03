# Generator Pomysłów na Lead Magnet (wersja polska)

Ta sama aplikacja co wersja niemiecka, przetłumaczona na język polski (pytania, etykiety, prompt
do API generuje teraz koncepcje po polsku).

## Struktura projektu

```
├── index.html
├── package.json
├── vite.config.js
├── netlify.toml
├── README.md
├── .gitignore
├── src/
│   ├── main.jsx
│   ├── App.jsx           Logika wizarda (4 pytania, wejście głosowe, wywołanie API)
│   └── index.css          Style (różowy branding)
└── netlify/
    └── functions/
        └── generate-ideas.js   Funkcja serwerowa, przechowuje klucz API bezpiecznie
```

## Wdrożenie na Netlify

1. Cały ten folder wgraj na GitHub.
2. Na [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project** → wybierz repo.
3. Ustawienia builda są pobierane automatycznie z `netlify.toml` (`npm run build`, folder `dist`).
4. **Site configuration → Environment variables → Add a variable**
   - Klucz: `ANTHROPIC_API_KEY`
   - Wartość: Twój klucz API z [console.anthropic.com](https://console.anthropic.com)
5. **Deploys → Trigger deploy → Clear cache and deploy site**

## Ważne: Ta sama pułapka co w wersji niemieckiej

- Nazwy folderów **muszą** być pisane małymi literami: `netlify/functions/`, nie `Netlify/functions/`
  (Linux, na którym działa Netlify, rozróżnia wielkość liter)
- Nie może istnieć plik o nazwie `netlify` bez rozszerzenia `.toml` obok `netlify.toml`
- Klucz API wpisujesz wyłącznie w panelu Netlify, nigdy w kodzie
- Po ustawieniu klucza konieczny jest nowy deploy ("Clear cache and deploy site"), inaczej
  zmienna środowiskowa nie zostanie uwzględniona

## Osadzenie jako iframe

```html
<iframe
  src="https://twoj-projekt.netlify.app"
  width="100%"
  height="750"
  style="border: none; border-radius: 16px;"
  title="Generator Pomysłów na Lead Magnet"
  allow="microphone"
></iframe>
```

`allow="microphone"` jest konieczne, żeby wejście głosowe działało w osadzonej ramce.

## Lokalny rozwój

```bash
npm install
npm run dev
```

## Schemat kolorów

```
--blush: #fdf2f6
--lavender: #f7e9f1
--rose: #e793bb
--rose-deep: #d1548f
--plum: #4a2540
--plum-soft: #7a5570
--white: #ffffff
```
