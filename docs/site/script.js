// These groups explain the product rule. They do not call or simulate the AI.
const scenarios = {
  class: {
    questions: [
      "Will climate change affect ocean life?",
      "How does climate change affect ocean life?",
      "What can we do to protect ocean life?",
      "Why was this winter so cold?",
    ],
    shared: "How does climate change affect ocean life?",
    explanation:
      "The first two questions need the same explanation. Protective actions and local weather need different answers.",
  },
  meeting: {
    questions: [
      "When will the new park open?",
      "What is the opening date for the park?",
      "Will the park have wheelchair access?",
      "How will the town pay for the park?",
    ],
    shared: "When will the new park open?",
    explanation:
      "The first two questions need the same date. Access and funding need different answers.",
  },
  event: {
    questions: [
      "One more song, please!",
      "Can you play an encore?",
      "Can you play my favorite song?",
      "Where can I buy your album?",
    ],
    shared: "Can you play one more song?",
    explanation:
      "In this example, the first two requests ask for an extra song. A specific song and an album purchase need different actions.",
  },
};

let scenario = "class";
let grouped = false;
let split = false;
let votes = [false, false, false, false];
const queue = document.querySelector("#demo-queue");
const groupButton = document.querySelector("#group-button");
const status = document.querySelector("#demo-status");

function makeVote(indices) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "vote-button";
  const supported = indices.some((index) => votes[index]);
  button.textContent = `+${indices.length + (supported ? 1 : 0)}`;
  button.setAttribute(
    "aria-label",
    `${supported ? "Remove your support from" : "Support"} this ${indices.length > 1 ? "group" : "question"}`,
  );
  button.setAttribute("aria-pressed", String(supported));
  button.addEventListener("click", () => {
    // Supporting a group adds one browser's support, rather than one per original.
    indices.forEach((index) => {
      votes[index] = false;
    });
    votes[indices[0]] = !supported;
    renderQueue();
    status.textContent = supported
      ? "Your support was removed from this example."
      : "Your +1 shows that you also want this response.";
    const replacement = queue.querySelector(
      `[data-question="${indices[0]}"] .vote-button`,
    );
    replacement?.focus();
  });
  return button;
}

function makeQuestion(index) {
  const card = document.createElement("div");
  card.className = "question-card";
  card.dataset.question = String(index);
  const number = document.createElement("span");
  number.className = "question-number";
  number.textContent = String(index + 1).padStart(2, "0");
  const copy = document.createElement("p");
  copy.className = "question-copy";
  copy.textContent = scenarios[scenario].questions[index];
  card.append(number, copy, makeVote([index]));
  return card;
}

function renderQueue() {
  queue.replaceChildren();
  if (grouped) {
    const card = document.createElement("div");
    card.className = "question-card grouped";
    card.dataset.question = "0";
    const copy = document.createElement("div");
    copy.className = "question-copy";
    const tag = document.createElement("span");
    tag.className = "group-tag";
    tag.textContent = "2 QUESTIONS · ONE ANSWER";
    const title = document.createElement("p");
    title.textContent = scenarios[scenario].shared;
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "See original questions";
    const originals = document.createElement("ul");
    scenarios[scenario].questions.slice(0, 2).forEach((question) => {
      const item = document.createElement("li");
      item.textContent = question;
      originals.append(item);
    });
    details.append(summary, originals);
    const splitButton = document.createElement("button");
    splitButton.type = "button";
    splitButton.className = "split-button";
    splitButton.textContent = "Keep these separate";
    splitButton.addEventListener("click", () => {
      grouped = false;
      split = true;
      renderQueue();
      status.textContent =
        "You split the group. In the live app, a manual split also prevents these questions from grouping again.";
      document.querySelector("#reset-button").focus();
    });
    copy.append(tag, title, details, splitButton);
    card.append(copy, makeVote([0, 1]));
    queue.append(card, makeQuestion(2), makeQuestion(3));
  } else {
    scenarios[scenario].questions.forEach((_, index) =>
      queue.append(makeQuestion(index)),
    );
  }
  document.querySelector("#queue-label").textContent = grouped
    ? "After · 3 questions to answer"
    : split
      ? "Split · 4 separate questions"
      : "Before · 4 separate questions";
  groupButton.disabled = grouped || split;
  groupButton.textContent = grouped
    ? "Questions grouped ✓"
    : split
      ? "Split kept · reset to try again"
      : "Group questions ↗";
}

function resetDemo() {
  grouped = false;
  split = false;
  votes = [false, false, false, false];
  renderQueue();
  status.textContent = "Four posts. Some need the same answer.";
}
document.querySelectorAll("[data-scenario]").forEach((button) => {
  button.addEventListener("click", () => {
    scenario = button.dataset.scenario;
    document
      .querySelectorAll("[data-scenario]")
      .forEach((option) =>
        option.setAttribute("aria-pressed", String(option === button)),
      );
    resetDemo();
  });
});
groupButton.addEventListener("click", () => {
  grouped = true;
  renderQueue();
  status.textContent = scenarios[scenario].explanation;
  queue.querySelector("summary")?.focus();
});
document.querySelector("#reset-button").addEventListener("click", resetDemo);

const pairs = [
  {
    questions: [
      "Will climate change affect ocean life?",
      "How does climate change affect ocean life?",
    ],
    answer: "yes",
    explanation: "One explanation of the effects can answer both questions.",
  },
  {
    questions: [
      "How does climate change affect ocean life?",
      "What can we do to protect ocean life?",
    ],
    answer: "no",
    explanation:
      "One asks about effects. The other asks about protective actions. They need different answers.",
  },
  {
    questions: [
      "When will the new park open?",
      "What is the opening date for the park?",
    ],
    answer: "yes",
    explanation: "One opening date answers both questions.",
  },
];
let pairIndex = 0;
function renderPair() {
  const container = document.querySelector("#quiz-pair");
  container.replaceChildren();
  pairs[pairIndex].questions.forEach((question) => {
    const copy = document.createElement("p");
    copy.className = "quiz-question";
    copy.textContent = `“${question}”`;
    container.append(copy);
  });
  document.querySelector("#quiz-progress").textContent =
    `${pairIndex + 1} / ${pairs.length}`;
  document
    .querySelectorAll("[data-answer]")
    .forEach((button) => button.setAttribute("aria-pressed", "false"));
  const feedback = document.querySelector("#quiz-feedback");
  feedback.className = "quiz-feedback";
  feedback.textContent = "Think about what the organizer must explain or do.";
}
document.querySelectorAll("[data-answer]").forEach((button) => {
  button.addEventListener("click", () => {
    const correct = button.dataset.answer === pairs[pairIndex].answer;
    document
      .querySelectorAll("[data-answer]")
      .forEach((choice) =>
        choice.setAttribute("aria-pressed", String(choice === button)),
      );
    const feedback = document.querySelector("#quiz-feedback");
    feedback.className = `quiz-feedback ${correct ? "correct" : "incorrect"}`;
    feedback.textContent = `${correct ? "Yes, that follows the rule." : "Try the other choice."} ${pairs[pairIndex].explanation}`;
  });
});
document.querySelector("#next-pair").addEventListener("click", () => {
  pairIndex = (pairIndex + 1) % pairs.length;
  renderPair();
});
renderQueue();
renderPair();
