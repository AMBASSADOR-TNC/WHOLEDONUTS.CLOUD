// Road to The Counter: a young person shows their growth, the owner reviews and grants entry.
// Nothing is stored or sent by this page. It only builds a message the visitor copies.

// Owner sets the request inbox here (a role address, not a personal one). Empty = not yet published.
const COUNTER_REQUEST_INBOX = "";

const MIN_WORDS = 15;

function wordCount(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function validateRequest(answers) {
  const missing = [];
  if (answers.mode === "other") {
    // Speaking, video, sign language, drawing, in person or a helper: no typing minimum.
    if (!answers.otherWay) missing.push("which way you will show your growth");
  } else {
    if (wordCount(answers.principles) < MIN_WORDS) missing.push("the principles you understand");
    if (wordCount(answers.effort) < MIN_WORDS) missing.push("the effort you kept up");
    if (wordCount(answers.sharing) < MIN_WORDS) missing.push("what you shared");
  }
  if (!answers.adultKnows) missing.push("confirming an adult you trust has read this with you");
  return missing;
}

function buildRequest(answers) {
  const year = String(answers.gradYear || "").trim();
  const adult = String(answers.adultRole || "").trim();
  return [
    "Request: invitation to The Counter",
    "",
    year ? `Graduation year: ${year}` : "Graduation year: (not given)",
    adult ? `Adult who knows my effort: ${adult}` : "Adult who knows my effort: (role not given)",
    "",
    answers.mode === "other" ? `I will show my growth by: ${answers.otherWay}` : "I wrote my growth below.",
    "",
    "1. Principles I understand",
    String(answers.principles || "").trim() || "(shown another way)",
    "",
    "2. Effort I kept up",
    String(answers.effort || "").trim() || "(shown another way)",
    "",
    "3. What I shared",
    String(answers.sharing || "").trim() || "(shown another way)",
    "",
    "I understand The Counter is a more real-world place for learning life skills,",
    "and that the owner reviews every request before inviting anyone in."
  ].join("\n");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { validateRequest, buildRequest, wordCount, MIN_WORDS, COUNTER_REQUEST_INBOX };
}

if (typeof document !== "undefined") {
  const $ = id => document.getElementById(id);
  const form = $("counterPathForm");
  const output = $("requestOutput");
  const message = $("pathMessage");
  const copyButton = $("copyRequest");
  const inboxNote = $("inboxNote");

  const otherWays = $("otherWays");
  document.querySelectorAll('input[name="showMode"]').forEach(r => r.addEventListener("change", () => {
    otherWays.hidden = document.querySelector('input[name="showMode"]:checked').value !== "other";
  }));

  inboxNote.textContent = COUNTER_REQUEST_INBOX
    ? `Send it, together with your adult, to ${COUNTER_REQUEST_INBOX}.`
    : "The owner's request address will appear here once it is published. Keep your message until then.";

  form.addEventListener("submit", event => {
    event.preventDefault();
    const answers = {
      mode: document.querySelector('input[name="showMode"]:checked').value,
      otherWay: $("otherWay").value,
      gradYear: $("pathGradYear").value,
      adultRole: $("adultRole").value,
      principles: $("principles").value,
      effort: $("effort").value,
      sharing: $("sharing").value,
      adultKnows: $("adultKnows").checked
    };
    const missing = validateRequest(answers);
    if (missing.length) {
      message.textContent = `Not yet. Add more about: ${missing.join("; ")}.` +
        (answers.mode === "other" ? "" : ` Each written part needs at least ${MIN_WORDS} words in your own voice, or choose "show it another way".`);
      message.setAttribute("tabindex", "-1");
      message.focus();
      output.hidden = true;
      copyButton.hidden = true;
      return;
    }
    output.value = buildRequest(answers);
    output.hidden = false;
    copyButton.hidden = false;
    message.textContent = "Your request is ready. Read it with your adult, copy it, and send it. The owner reviews every request personally.";
  });

  copyButton.addEventListener("click", async () => {
    output.select();
    try {
      await navigator.clipboard.writeText(output.value);
      message.textContent = "Copied. Nothing was saved or sent by this page.";
    } catch (error) {
      message.textContent = "Select the text above and copy it yourself. Nothing was saved or sent by this page.";
    }
  });
}
