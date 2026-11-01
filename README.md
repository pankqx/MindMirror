# MindMirror

A calm web app plus a talking AI necklace that helps college students **notice early signs of stress**, compared with **their own normal**, understand their patterns and find support, **without diagnosing**.

Team **HTTP Dino** (K S Pankaj, Merel Riha Dsouza, A B Kishore Krishna), St Aloysius. CODE MEET 2026 Round 2, Problem 2: Mind Check.

> **Disclosure.** Built during CODE MEET 2026 Round 2. Uses open-source libraries (listed in package.json), Groq and Microsoft Edge TTS APIs, and AI coding assistants (Claude, ChatGPT). Hardware reference code was prepared from our own design before the event.

## Run it

```bash
npm install
npm run dev          # app on http://localhost:5173
```

The hub (AI + voice + necklace link), in a second terminal:

```bash
cd hub
npm install
cp .env.example .env # Windows: copy .env.example .env, then paste the Groq key
npm start            # http://localhost:8787/health should say ok
```

No key or no internet: `npm run mock` with `MOCK_AI=1`.

## Who owns what

| Folder | Owner |
|---|---|
| `hub/`, `firmware/mindmirror_necklace/`, `src/lib/`, Home / Insights / Companion / Planner screens | Pankaj |
| `src/games/`, `src/screens/Play.tsx`, `src/screens/Support.tsx`, `src/content/copy.ts`, `docs/research.md` | Merel |
| `src/components/`, `src/screens/CheckIn.tsx`, `src/screens/Breathe.tsx`, `firmware/tests/`, `docs/hardware-photos/` | Kishore |

## How we work

Everyone works on their own branch (`pankaj/core`, `merel/play`, `kishore/ui`), commits under their own GitHub account, pushes at least every hour and opens a pull request. Only Pankaj merges into `main`.

MindMirror is not a medical device and does not diagnose. If you are struggling, call Tele-MANAS **14416** (free, 24×7) or **112**.
