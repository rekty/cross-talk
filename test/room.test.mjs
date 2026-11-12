import test from "node:test";
import assert from "node:assert/strict";
import {
  SCENES,
  MIN_TURNS,
  MAX_TURNS,
  clampTurns,
  nextSpeaker,
  buildMessages,
  wordCount,
  formatPollen,
} from "../shared/room.js";

test("a fresh conversation opens with one system message and one prompt", () => {
  const messages = buildMessages("interview", "A startup hiring its first engineer", [], "a");
  assert.equal(messages.length, 2);
  assert.equal(messages[0].role, "system");
  assert.match(messages[0].content, /A startup hiring its first engineer/);
  assert.match(messages[0].content, /Interviewer/);
  assert.equal(messages[1].role, "user");
});

test("a model sees its own turns as assistant and the other side as user", () => {
  const turns = [
    { speaker: "a", text: "Why this job?" },
    { speaker: "b", text: "Because the problem is real." },
  ];
  const forA = buildMessages("interview", "Hiring", turns, "a");
  assert.deepEqual(forA.slice(1).map((m) => m.role), ["assistant", "user"]);
  const forB = buildMessages("interview", "Hiring", turns, "b");
  assert.deepEqual(forB.slice(1).map((m) => m.role), ["user", "assistant"]);
});

test("each speaker gets their own persona, not the other one", () => {
  const a = buildMessages("negotiation", "Used car", [], "a")[0].content;
  const b = buildMessages("negotiation", "Used car", [], "b")[0].content;
  assert.match(a, /You are Buyer/);
  assert.match(b, /You are Seller/);
  assert.notEqual(a, b);
});

test("an unknown scene or speaker is refused instead of guessed", () => {
  assert.throws(() => buildMessages("speed-dating", "x", [], "a"), /unknown scene/);
  assert.throws(() => buildMessages("interview", "x", [], "c"), /unknown speaker/);
});

test("an empty situation is refused", () => {
  assert.throws(() => buildMessages("interview", "   ", [], "a"), /situation is empty/);
});

test("turn counts are clamped to what the page can afford", () => {
  assert.equal(clampTurns("6"), 6);
  assert.equal(clampTurns(1), MIN_TURNS);
  assert.equal(clampTurns(99), MAX_TURNS);
  assert.equal(clampTurns("nonsense"), MIN_TURNS);
});

test("speakers alternate starting from A", () => {
  assert.equal(nextSpeaker([], "a"), "a");
  assert.equal(nextSpeaker([{ speaker: "a", text: "hi" }]), "b");
  assert.equal(nextSpeaker([{ speaker: "b", text: "hi" }]), "a");
});

test("cost is formatted in mPollen below a hundredth of a Pollen", () => {
  assert.equal(formatPollen(0.00234), "2.34 mPollen");
  assert.equal(formatPollen(1.5), "1.500 Pollen");
  assert.equal(formatPollen(null), "");
});

test("word counting ignores extra whitespace", () => {
  assert.equal(wordCount("  one   two three\n"), 3);
  assert.equal(wordCount(""), 0);
});
