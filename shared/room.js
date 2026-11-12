// The conversation itself: scenes, transcript -> messages, and whose turn it is.
// Everything here is pure so the browser and `node --test` run the same code.

export const MAX_TURNS = 12;
export const MIN_TURNS = 2;
export const WORDS = 60;

export const SCENES = {
  interview: {
    label: "Job interview",
    blurb: "one model is hiring, the other wants the job",
    a: {
      name: "Interviewer",
      system:
        "You are interviewing the other AI for a job. Ask one pointed question at a time, " +
        "react to the answer you were just given, and never answer on its behalf.",
    },
    b: {
      name: "Candidate",
      system:
        "You are the AI candidate in a job interview. Answer the question you were just asked, " +
        "concretely and without flattery, then stop.",
    },
  },
  strangers: {
    label: "First meeting",
    blurb: "two models meet with nothing in common but the topic",
    a: {
      name: "First",
      system:
        "You just met the other AI. Say what you actually think about the topic, ask it something " +
        "you are genuinely unsure about, and do not agree just to be polite.",
    },
    b: {
      name: "Second",
      system:
        "You just met the other AI. Answer what it asked, add the one thing it did not think of, " +
        "and disagree where you really disagree.",
    },
  },
  negotiation: {
    label: "Negotiation",
    blurb: "a buyer and a seller who both want the last word",
    a: {
      name: "Buyer",
      system:
        "You are buying and you want a better price than the one offered. Make one concrete move " +
        "per turn, name numbers, and do not fold immediately.",
    },
    b: {
      name: "Seller",
      system:
        "You are selling and you will defend your price with a reason, not a slogan. Make one " +
        "concrete counter-offer per turn and hold your ground unless the offer is genuinely good.",
    },
  },
  disagree: {
    label: "Old friends who disagree",
    blurb: "they like each other and still will not concede",
    a: {
      name: "Friend A",
      system:
        "You are arguing with an old friend about the topic. Be warm, be specific, and concede only " +
        "the part you actually think is right.",
    },
    b: {
      name: "Friend B",
      system:
        "You are arguing with an old friend about the topic. Take the opposite side seriously, " +
        "name where the other is wrong, and keep it affectionate.",
    },
  },
};

export function sceneOf(key) {
  const scene = SCENES[key];
  if (!scene) throw new Error(`unknown scene: ${key}`);
  return scene;
}

export function clampTurns(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return MIN_TURNS;
  return Math.min(MAX_TURNS, Math.max(MIN_TURNS, n));
}

// Whose turn it is: whoever did not speak last, starting with `starter`.
export function nextSpeaker(turns = [], starter = "a") {
  const last = turns[turns.length - 1];
  if (!last) return starter === "b" ? "b" : "a";
  return last.speaker === "a" ? "b" : "a";
}

// A model must not see its own past lines as the other side, or it starts
// answering itself. Its own turns become `assistant`, the rest become `user`.
export function buildMessages(sceneKey, topic, turns = [], speaker = "a") {
  const scene = sceneOf(sceneKey);
  if (speaker !== "a" && speaker !== "b") throw new Error(`unknown speaker: ${speaker}`);
  const clean = String(topic || "").trim().slice(0, 240);
  if (!clean) throw new Error("the situation is empty");
  const who = scene[speaker];
  const system =
    `${who.system}\n\nScene: ${scene.blurb}.\nSituation: ${clean}\n` +
    `You are ${who.name}. Stay in character, at most ${WORDS} words, no headings, no lists, ` +
    "no meta commentary about being a model.";
  const messages = [{ role: "system", content: system }];
  if (turns.length === 0) {
    messages.push({ role: "user", content: `Open the conversation about: ${clean}` });
    return messages;
  }
  for (const turn of turns) {
    const mine = turn.speaker === speaker;
    messages.push({ role: mine ? "assistant" : "user", content: String(turn.text || "").trim() });
  }
  return messages;
}

export function wordCount(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

export function formatPollen(value) {
  if (value == null || !Number.isFinite(value)) return "";
  if (value >= 0.01) return `${value.toFixed(3)} Pollen`;
  return `${(value * 1000).toFixed(2)} mPollen`;
}
