# Cross Talk

**Two models. One conversation. No human in the middle.**

[![Made with pollinations.ai](https://raw.githubusercontent.com/pollinations/pollinations/main/packages/ui/src/brand/badge-made-with.svg)](https://pollinations.ai/?ref=badge)

Live: **https://rekty.github.io/cross-talk/**

Set a scene, pick two models and press start. A speaks, B answers, A answers that — turn by turn
until the turn budget runs out. The page only relays the transcript: every line on screen came from
the model named above it, in the order it was spoken.

## What you can stage

| Scene | Who A is | Who B is |
|---|---|---|
| Job interview | Interviewer | Candidate |
| First meeting | First | Second |
| Negotiation | Buyer | Seller |
| Old friends who disagree | Friend A | Friend B |

Plus your own situation line (up to 240 characters), two to twelve turns.

## How it spends Pollen

- **Bring your own Pollen.** Every turn is one browser `POST https://gen.pollinations.ai/v1/chat/completions`
  carrying the reader's own `sk_` key. The key stays in this tab's `sessionStorage` and is sent nowhere else.
- **Real cost per turn.** `GET /models` supplies the per-token prices, and the label above each turn shows
  the latency, the model and the Pollen that turn actually cost, computed from the `usage` the API returns.
- **Nothing extra.** No judge call, no summariser, no hidden turns. The only calls the page makes are the
  turns you asked for.

Six short turns usually come to a fraction of one Pollen.

## Models

One per lab, so A and B never quietly become the same lab:

`openai/gpt-5.4-nano` · `anthropic/claude-haiku-5.5` · `google/gemini-4-argon` ·
`meta/muse-wonder-1.0` · `deepseek/deepseek-v4.1-flash-1017` · `stepfun/step-5-preview`

## Files

| Piece | File | Does |
|---|---|---|
| Scene, transcript and turn order | `shared/room.js` | Pure functions: scenes, `buildMessages`, `nextSpeaker`, turn clamping |
| BYOP client | `shared/pollen.js` | Device flow, key handling, one chat completion with usage and timing |
| Page | `app.js` | Setup controls, the turn loop, live cost, error reporting per turn |
| Styles | `style.css` | Two-sided stage: A on the left, B on the right |

## Run locally

```bash
python -m http.server 8091
# → http://127.0.0.1:8091
```

A static server is enough; there is no build step and no backend. The page talks to
`gen.pollinations.ai` itself, so nothing here needs an owner key. **Never commit an `sk_` key.**

## Tests

```bash
node --test
```

Covers transcript roles (a model must see its own lines as `assistant`), per-speaker personas,
refusal of unknown scenes and speakers, turn clamping and cost formatting.

## Deploy

GitHub Pages serves `main` from the repository root. Push and it is live.

## License

MIT
