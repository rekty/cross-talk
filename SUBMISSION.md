# Submission form values — quest #19178

Paste these into
[the app submission form](https://github.com/pollinations/pollinations/issues/new?template=app-submission.yml).
The title becomes `[App Submission] Cross Talk` automatically.

| Field | Value |
|---|---|
| **App Name** | `Cross Talk` |
| **App Description** | `Pick two models and a scene: one interviews, argues or negotiates with the other, turn by turn, with every turn's latency and real Pollen cost shown.` |
| **App URL** | `https://rekty.github.io/cross-talk/` |
| **GitHub Repository URL** | `https://github.com/rekty/cross-talk` |
| **Screenshot** | `assets/screenshot.png` (1920×1040, a real four-turn run) |
| **App Category** | `chat` |
| **Platform** | `web` |
| **App Language** | `en` |
| **Discord Username** | *(optional — leave empty)* |
| **Quest** | `#19178` |

Description length: 147 characters (limit is 200).

## Pollinations integration (evidence)

```
Static site only: index.html, app.js, style.css, shared/*.js. No backend, no
server-side secret, no database.

- Two labs, one transcript. A and B are picked independently from
  openai/gpt-5.4-nano, meta/muse-spark-open, deepseek/deepseek-v4.1-flash,
  mistralai/mistral-large-3, x-ai/grok-4.6, nvidia/nemotron-3.5-lightning — all free
  according to GET /models, so free Pollen can run every pairing.
- Calls. Each turn is one browser POST https://gen.pollinations.ai/v1/chat/completions
  with the transcript so far. shared/room.js builds the messages and gives the
  speaking model its own past lines as `assistant` and the other side's as `user`,
  so a model answers the other one instead of answering itself.
- Scenes. Job interview, first meeting, negotiation and old friends who disagree,
  each with a persona per side, plus a free-text situation line.
- Payment. Every request carries the reader's own sk_ key (Bring your own Pollen),
  kept in this tab's sessionStorage and sent only to gen.pollinations.ai. The owner
  never pays for a reader's run.
- Real cost per turn. GET /models supplies the per-token prices (nested under each
  model's `pricing`), and every turn prints its latency, its model and the Pollen
  that turn actually cost, computed from the `usage` block the API returns. The
  screenshot run: four turns, 0.06 / 0.07 / 0.07 / 0.11 mPollen, 0.31 mPollen total.
- Nothing invented. No judge call, no summariser and no extra turns: the page only
  relays what the models said, and a failed turn is reported as failed instead of
  being filled in.
- Shareable setup. "Copy link" stores scene, situation, both models and the turn
  budget in the URL hash; answers are never in the link because they cost the next
  reader their own Pollen.
- Credit. The page footer links to pollinations.ai and the README carries the
  "Made with pollinations.ai" badge.
- Tests. `node --test` → 9 passing (transcript roles, per-speaker personas, unknown
  scene/speaker refusal, turn clamping, cost formatting).
```

## Verified before filling the form

- `https://rekty.github.io/cross-talk/` returns HTTP 200 and boots without console errors.
- Real run: device-flow sign-in approved, then OpenAI and Anthropic played a job interview
  for four turns, each turn showing its own latency and cost.
- `node --test`: 9 pass, 0 fail.

## Checklist

- [x] App live and URL matches the live site
- [x] Screenshot is a real screen at ~16:9
- [x] `Quest` field: `#19178`
- [x] README badge present
- [x] Visible pollinations.ai link in the page footer
