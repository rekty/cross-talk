import * as pollen from "./shared/pollen.js";
import {
  SCENES,
  clampTurns,
  buildMessages,
  nextSpeaker,
  formatPollen,
} from "./shared/room.js";

// One model per lab, so A and B never quietly turn into the same lab.
const MODELS = [
  ["openai/gpt-5.4-nano", "A · OpenAI gpt-5.4-nano"],
  ["anthropic/claude-haiku-5.5", "B · Anthropic haiku-5.5"],
  ["google/gemini-4-argon", "C · Google gemini-4-argon"],
  ["meta/muse-wonder-1.0", "D · Meta muse-wonder"],
  ["deepseek/deepseek-v4.1-flash-1017", "E · DeepSeek v4.1-flash"],
  ["stepfun/step-5-preview", "F · StepFun step-5"],
];

const $ = (id) => document.getElementById(id);
const stage = $("stage");
const state = {
  scene: "interview",
  turns: 6,
  log: [],
  running: false,
  stopped: false,
  pricing: new Map(),
};

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

function pollenCost(model, usage) {
  const row = state.pricing.get(model);
  if (!row || !usage) return null;
  const prompt = Number(row.promptTextTokens || 0);
  const completion = Number(row.completionTextTokens || 0);
  return (usage.prompt_tokens || 0) * prompt + (usage.completion_tokens || 0) * completion;
}

function totalCost() {
  return state.log.reduce((sum, turn) => sum + (turn.cost || 0), 0);
}

function renderScenes() {
  const box = $("scenes");
  box.replaceChildren();
  for (const [key, scene] of Object.entries(SCENES)) {
    const chip = el("button", `chip${state.scene === key ? " on" : ""}`, scene.label);
    chip.type = "button";
    chip.dataset.scene = key;
    chip.title = scene.blurb;
    chip.setAttribute("aria-pressed", String(state.scene === key));
    chip.addEventListener("click", () => {
      state.scene = key;
      renderScenes();
      $("hint").textContent = `${scene.a.name} and ${scene.b.name} — ${scene.blurb}. Each turn is one chat completion on your own Pollen.`;
    });
    box.append(chip);
  }
}

function fillModels() {
  for (const id of ["model-a", "model-b"]) {
    const select = $(id);
    select.replaceChildren();
    MODELS.forEach(([modelId, label], index) => {
      const option = el("option", null, label);
      option.value = modelId;
      select.append(option);
      if ((id === "model-a" && index === 0) || (id === "model-b" && index === 1)) select.value = modelId;
    });
  }
}

function renderPill() {
  const pill = $("pollen");
  const on = pollen.connected();
  pill.textContent = on ? "Pollen connected" : "Connect Pollen";
  pill.classList.toggle("on", on);
}

function turnNode(speaker, model) {
  const scene = SCENES[state.scene];
  const node = el("article", `turn ${speaker} pending`);
  const head = el("div", "turn-head");
  const left = el("b", null, `${speaker.toUpperCase()} · ${scene[speaker].name}`);
  const right = el("span", "meta", "thinking…");
  head.append(left, right);
  const body = el("p", "text", "");
  node.append(head, body);
  node.dataset.model = model;
  node.title = model;
  return node;
}

function updateTotal() {
  const turns = state.log.length;
  if (!turns) {
    $("total").textContent = "No turns yet.";
    return;
  }
  const spent = formatPollen(totalCost()) || "cost unknown";
  $("total").textContent = `${turns} turn${turns === 1 ? "" : "s"} · ${spent} total`;
}

async function loadPricing() {
  try {
    const list = await pollen.models();
    for (const row of list) {
      const id = row.id || row.name;
      if (id) state.pricing.set(id, row);
    }
  } catch {
    /* without prices the cost line simply stays empty */
  }
}

async function run() {
  if (state.running) return;
  if (!pollen.connected()) {
    openConnect();
    return;
  }
  const topic = $("topic").value.trim();
  if (!topic) {
    $("topic").focus();
    return;
  }
  const modelA = $("model-a").value;
  const modelB = $("model-b").value;
  state.turns = clampTurns($("turns").value);
  state.log = [];
  state.running = true;
  state.stopped = false;
  stage.replaceChildren();
  $("run").disabled = true;
  $("stop").hidden = false;
  $("stop").textContent = "Stop after this turn";

  try {
    for (let index = 0; index < state.turns; index++) {
      if (state.stopped) break;
      const speaker = nextSpeaker(state.log, "a");
      const model = speaker === "a" ? modelA : modelB;
      const node = turnNode(speaker, model);
      stage.append(node);
      node.scrollIntoView({ block: "end", behavior: "smooth" });
      try {
        const reply = await pollen.chat({
          model,
          messages: buildMessages(state.scene, topic, state.log, speaker),
          maxTokens: 240,
        });
        const cost = pollenCost(model, reply.usage);
        state.log.push({ speaker, text: reply.text, model, cost, ms: reply.ms });
        node.classList.remove("pending");
        node.querySelector(".meta").textContent =
          `${reply.ms} ms · ${formatPollen(cost) || "cost unknown"} · ${model}`;
        node.querySelector(".text").textContent = reply.text;
      } catch (error) {
        node.classList.remove("pending");
        node.classList.add("failed");
        node.querySelector(".meta").textContent = "failed";
        node.querySelector(".text").textContent = `⚠︎ ${error.message}`;
        break;
      }
      updateTotal();
    }
  } finally {
    state.running = false;
    $("run").disabled = false;
    $("stop").hidden = true;
    updateTotal();
  }
}

function openConnect() {
  const modal = $("modal");
  const body = $("modal-body");
  modal.hidden = false;
  body.replaceChildren(el("p", null, "Starting the Pollen device flow…"));

  pollen
    .startDevice()
    .then(({ userCode, verify }) => {
      body.replaceChildren();
      body.append(el("p", null, "Open this page and confirm the code:"));
      const link = el("a", null, verify);
      link.href = verify;
      link.target = "_blank";
      link.rel = "noopener";
      body.append(link, el("p", null, "Or paste an sk_ key you already have:"));
      const code = el("div", "code", userCode);
      body.append(code);
      const input = document.createElement("input");
      input.placeholder = "sk_…";
      input.autocomplete = "off";
      const save = el("button", "go", "Use this key");
      save.type = "button";
      save.addEventListener("click", () => {
        try {
          pollen.useKey(input.value);
          modal.hidden = true;
          renderPill();
          loadPricing();
        } catch (error) {
          input.value = "";
          input.placeholder = error.message;
        }
      });
      const row = el("div", "row");
      row.append(input, save);
      body.append(row);
      const wait = setInterval(async () => {
        const status = await pollen.pollDevice();
        if (status.state === "connected") {
          clearInterval(wait);
          modal.hidden = true;
          renderPill();
          loadPricing();
        } else if (status.state === "error" || status.state === "expired") {
          clearInterval(wait);
          body.append(el("p", null, `Device flow: ${status.message || status.state}. Paste a key instead.`));
        }
      }, 3000);
      modal.addEventListener("hidden", () => clearInterval(wait), { once: true });
    })
    .catch((error) => {
      body.replaceChildren(el("p", null, `Device flow unavailable (${error.message}). Paste an sk_ key instead.`));
      const input = document.createElement("input");
      input.placeholder = "sk_…";
      const save = el("button", "go", "Use this key");
      save.type = "button";
      save.addEventListener("click", () => {
        try {
          pollen.useKey(input.value);
          modal.hidden = true;
          renderPill();
          loadPricing();
        } catch (error2) {
          input.value = "";
          input.placeholder = error2.message;
        }
      });
      const row = el("div", "row");
      row.append(input, save);
      body.append(row);
    });
}

function shareLink() {
  const params = new URLSearchParams({
    scene: state.scene,
    topic: $("topic").value.trim(),
    a: $("model-a").value,
    b: $("model-b").value,
    turns: String(clampTurns($("turns").value)),
  });
  return `${location.origin}${location.pathname}#${params.toString()}`;
}

function readHash() {
  const hash = location.hash.replace(/^#/, "");
  if (!hash) return;
  const params = new URLSearchParams(hash);
  const scene = params.get("scene");
  if (scene && SCENES[scene]) state.scene = scene;
  if (params.get("topic")) $("topic").value = params.get("topic");
  for (const key of ["a", "b"]) {
    const value = params.get(key);
    const target = key === "a" ? "model-a" : "model-b";
    if (value && MODELS.some(([id]) => id === value)) $(target).value = value;
  }
  if (params.get("turns")) $("turns").value = String(clampTurns(params.get("turns")));
}

$("run").addEventListener("click", run);
$("stop").addEventListener("click", () => {
  state.stopped = true;
  $("stop").textContent = "Stopping…";
});
$("pollen").addEventListener("click", () => {
  if (pollen.connected()) {
    pollen.signOut();
    renderPill();
    return;
  }
  openConnect();
});
$("modal-close").addEventListener("click", () => ($("modal").hidden = true));
$("modal").addEventListener("click", (event) => {
  if (event.target === $("modal")) $("modal").hidden = true;
});
$("share").addEventListener("click", async () => {
  const link = shareLink();
  history.replaceState(null, "", `#${link.split("#")[1]}`);
  try {
    await navigator.clipboard.writeText(link);
    $("share").textContent = "Link copied";
    setTimeout(() => ($("share").textContent = "Copy link to this setup"), 1800);
  } catch {
    $("share").textContent = link;
  }
});

readHash();
fillModels();
renderScenes();
renderPill();
if (pollen.connected()) loadPricing();
