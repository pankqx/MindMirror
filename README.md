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

## Demo on stage

1. Start the hub, then the app. The top bar shows **Hub live** when they can talk.
2. On the welcome screen tap **Explore with sample data** (Asha, 3 weeks, Soft rain). That first tap also unlocks the laptop speaker.
3. Home → Insights (Sleep "needs care" with its proof) → hold the necklace button and speak. A "Thinking" card appears, then the reply is **spoken through the laptop speaker** and shows up in the app.
4. Backup if the necklace is quiet: open **Talk** and hold the mic button (or hold the **Space bar**). Same hub, same voice.
5. Play room → pop a few bubbles. Support → Tele-MANAS 14416.

Sun/moon button in the top bar switches light and dark. Settings (gear) has: laptop voice on/off and a test button, counsellor number, reload sample data, delete all data.

## Who owns what

| Folder | Owner |
|---|---|
| `hub/`, `firmware/mindmirror_necklace/`, `src/lib/`, Home / Insights / Companion / Planner screens | Pankaj |
| `src/games/`, `src/screens/Play.tsx`, `src/screens/Support.tsx`, `src/content/copy.ts`, `docs/research.md` | Merel |
| `src/components/`, `src/screens/CheckIn.tsx`, `src/screens/Breathe.tsx`, `firmware/tests/`, `docs/hardware-photos/` | Kishore |

## How we work

Everyone works on their own branch (`pankaj/core`, `merel/play`, `kishore/ui`), commits under their own GitHub account, pushes at least every hour and opens a pull request. Only Pankaj merges into `main`.

MindMirror is not a medical device and does not diagnose. If you are struggling, call Tele-MANAS **14416** (free, 24×7) or **112**.
