const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

$("#year").textContent = new Date().getFullYear();

// Responsive navigation
const menuToggle = $("#menuToggle");
const navLinks = $("#navLinks");
menuToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
});
$$(".nav-links a").forEach(link => link.addEventListener("click", () => {
  navLinks.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}));

// Questionnaire: the server validates everything again.
const questionnaireForm = $("#questionnaireForm");
const formFeedback = $("#formFeedback");
const submitButton = $("#submitQuestionnaire");
const submissionSuccess = $("#submissionSuccess");
const submitAnotherExperience = $("#submitAnotherExperience");

submitAnotherExperience.addEventListener("click", () => {
  questionnaireForm.reset();
  formFeedback.textContent = "";
  formFeedback.className = "form-feedback";
  submissionSuccess.hidden = true;
  questionnaireForm.hidden = false;
  questionnaireForm.querySelector("select[name=experience]").focus();
});

questionnaireForm.addEventListener("submit", async event => {
  event.preventDefault();
  formFeedback.textContent = "";
  formFeedback.className = "form-feedback";

  const data = new FormData(questionnaireForm);
  const persuasionFactors = data.getAll("persuasionFactors");

  if (!persuasionFactors.length) {
    formFeedback.textContent = "Choose at least one persuasion factor.";
    formFeedback.classList.add("error");
    return;
  }

  const payload = {
    experience: data.get("experience"),
    category: data.get("category"),
    channel: data.get("channel"),
    persuasionFactors,
    outcome: data.get("outcome"),
    lesson: String(data.get("lesson") || "").trim(),
    description: String(data.get("description") || "").trim(),
    publicationConsent: data.get("publicationConsent") === "on"
  };

  submitButton.disabled = true;
  submitButton.textContent = "Submitting…";

  try {
    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok) throw new Error(result.error || "Unable to submit right now.");

    questionnaireForm.reset();
    questionnaireForm.hidden = true;
    submissionSuccess.hidden = false;
    submissionSuccess.focus();
  } catch (error) {
    formFeedback.textContent = error.message || "The server could not be reached. Start the Express server and try again.";
    formFeedback.classList.add("error");
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Submit for review <span aria-hidden="true">→</span>';
  }
});

// Public feed: render only plain text, never user-provided HTML.
const categoryLabels = {
  job: "Fake job",
  investment: "Investment",
  romance: "Romance scam",
  phishing: "Phishing",
  impersonation: "Impersonation",
  marketplace: "Marketplace",
  sextortion: "Sextortion",
  other: "Other"
};
const outcomeLabels = {
  recognized: "Recognized in time",
  money: "Money lost",
  information: "Information shared",
  both: "Money and information lost",
  other: "Another outcome / prefer not to say"
};
const experienceLabels = {
  targeted: "Targeted but recognized the scam",
  victim: "Fell victim to a scam",
  prevented: "Stopped before losing money or information",
  other: "Witnessed or learned about a scam affecting someone else"
};
const channelLabels = {
  social: "Social media",
  messaging: "Messaging app",
  email: "Email",
  phone: "Phone call or SMS",
  website: "Website or online marketplace",
  "in-person": "In person",
  other: "Other / not sure"
};
const persuasionLabels = {
  "easy-money": "Easy money / guaranteed returns",
  urgency: "Pressure to act quickly",
  trust: "Trust or relationship",
  authority: "Trusted organization impersonation",
  fear: "Fear or intimidation",
  opportunity: "Job, prize, or special opportunity",
  other: "Other / not sure"
};

function addText(parent, tag, text, className) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text || "";
  parent.appendChild(element);
  return element;
}

async function loadExperiences() {
  const grid = $("#storyGrid");
  const note = $("#feedNote");
  try {
    const response = await fetch("/api/experiences?page=1", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load stories");
    const result = await response.json();
    if (!result || !Array.isArray(result.experiences)) throw new Error("Invalid community stories response");
    const stories = result.experiences;
    if (!stories.length) {
      grid.replaceChildren();
      const empty = document.createElement("article");
      empty.className = "story-card story-empty";
      addText(empty, "h3", "No approved community stories yet");
      addText(empty, "p", "When a moderator reviews and approves anonymous experiences, they will appear here for everyone to learn from.");
      grid.appendChild(empty);
      note.textContent = "Only reviewed and approved stories appear in this public feed.";
      return;
    }

    grid.replaceChildren();
    stories.forEach(story => {
      const card = document.createElement("article");
      card.className = "story-card";

      const meta = document.createElement("div");
      meta.className = "story-meta";
      const tag = addText(meta, "span", categoryLabels[story.category] || "Scam experience", "tag tag-green");
      addText(meta, "span", outcomeLabels[story.outcome] || "Community experience", "status-dot");
      card.appendChild(meta);

      addText(card, "h3", story.lesson ? "A lesson shared by the community" : "A community experience");
      if (story.description) {
        const description = document.createElement("p");
        description.className = "story-description";
        description.textContent = story.description;
        card.appendChild(description);
      }

      // Show every structured questionnaire answer that is safe to publish, rather than
      // reducing each approved story to only its description and lesson.
      const details = document.createElement("dl");
      details.className = "story-details";
      const addDetail = (label, value) => {
        if (!value) return;
        addText(details, "dt", label);
        addText(details, "dd", value);
      };
      addDetail("Experience", experienceLabels[story.experience] || "Community experience");
      addDetail("Where contact happened", channelLabels[story.channel] || "Other / not sure");
      const factors = Array.isArray(story.persuasionFactors)
        ? story.persuasionFactors.map(value => persuasionLabels[value]).filter(Boolean)
        : [];
      addDetail("What made it convincing", factors.join(" · "));
      addDetail("Outcome", outcomeLabels[story.outcome] || "Another outcome / prefer not to say");
      if (details.childElementCount) card.appendChild(details);

      if (story.lesson) {
        const lesson = document.createElement("div");
        lesson.className = "story-lesson";
        addText(lesson, "strong", "Lesson learned");
        addText(lesson, "span", story.lesson);
        card.appendChild(lesson);
      }
      grid.appendChild(card);
    });
    note.textContent = `Showing ${stories.length} approved community ${stories.length === 1 ? "story" : "stories"}. These are shared after moderation; please keep privacy in mind when reading and sharing experiences.`;
  } catch {
    grid.replaceChildren();
    const errorCard = document.createElement("article");
    errorCard.className = "story-card story-empty";
    addText(errorCard, "h3", "Community stories are temporarily unavailable");
    addText(errorCard, "p", "Check the server and database connection, then refresh this page.");
    grid.appendChild(errorCard);
    note.textContent = "The public story feed could not connect to the server.";
  }
}
loadExperiences();
// Refresh the public feed periodically and when visitors return to the tab, so newly approved
// stories appear without requiring a full page reload.
window.setInterval(() => {
  if (document.visibilityState === "visible") loadExperiences();
}, 30000);
window.addEventListener("focus", loadExperiences);

// Real-time anonymous discussion. The server generates a temporary guest identity; no account is created.
const discussionMessages = $("#discussionMessages");
const discussionForm = $("#discussionForm");
const discussionInput = $("#discussionInput");
const discussionSend = $("#discussionSend");
const discussionFeedback = $("#discussionFeedback");
const discussionStatus = $("#discussionStatus");
const guestLabel = $("#guestLabel");
let currentGuestLabel = "";
const seenDiscussionIds = new Set();

function renderDiscussionMessage(item) {
  if (!item || !item.id || seenDiscussionIds.has(item.id)) return;
  seenDiscussionIds.add(item.id);
  const placeholder = $(".discussion-placeholder", discussionMessages);
  if (placeholder) placeholder.remove();
  const card = document.createElement("article");
  card.className = `discussion-message${item.guestLabel === currentGuestLabel ? " own-message" : ""}`;
  card.dataset.messageId = item.id;
  card.dataset.createdAt = String(new Date(item.createdAt).getTime() || 0);
  const head = document.createElement("div");
  head.className = "discussion-message-head";
  addText(head, "strong", item.guestLabel || "Community guest");
  const time = document.createElement("time");
  const date = new Date(item.createdAt);
  time.dateTime = date.toISOString();
  time.textContent = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  head.appendChild(time);
  card.appendChild(head);
  addText(card, "p", item.message);
  discussionMessages.appendChild(card);
  while (discussionMessages.children.length > 100) discussionMessages.firstElementChild.remove();
  discussionMessages.scrollTop = discussionMessages.scrollHeight;
}

async function loadDiscussionHistory() {
  try {
    const response = await fetch("/api/discussion/messages", { cache: "no-store" });
    if (!response.ok) throw new Error("History unavailable");
    const result = await response.json();
    const placeholder = $(".discussion-placeholder", discussionMessages);
    if (placeholder) placeholder.remove();

    (result.messages || []).forEach(renderDiscussionMessage);
    // Socket.IO connects before history is fetched. Merge both sources and sort by timestamp
    // so messages sent while history was loading are not lost or displayed out of order.
    const nodes = [...discussionMessages.querySelectorAll(".discussion-message")];
    nodes.sort((a, b) => Number(a.dataset.createdAt) - Number(b.dataset.createdAt));
    nodes.forEach(node => discussionMessages.appendChild(node));

    if (!nodes.length) {
      const empty = document.createElement("p");
      empty.className = "discussion-placeholder";
      empty.textContent = "No messages yet. Start a respectful conversation.";
      discussionMessages.appendChild(empty);
    }
  } catch {
    // Keep any live messages already received; show an error only if the list is otherwise empty.
    if (!discussionMessages.querySelector(".discussion-message")) {
      discussionMessages.replaceChildren();
      const placeholder = document.createElement("p");
      placeholder.className = "discussion-placeholder";
      placeholder.textContent = "Could not load recent messages. Live messages may still appear if connected.";
      discussionMessages.appendChild(placeholder);
    }
  }
}

let discussionSocket = null;
if (typeof window.io === "function") {
  // Establish the live connection immediately to close the gap between history fetch and connect.
  discussionSocket = window.io({ reconnection: true, reconnectionAttempts: Infinity, timeout: 10000 });
  discussionSocket.on("connect", () => {
    discussionStatus.textContent = "Connected · messages update live";
    discussionStatus.style.color = "#176b45";
  });
  discussionSocket.on("disconnect", () => {
    discussionStatus.textContent = "Disconnected · trying to reconnect…";
    discussionStatus.style.color = "#b36a1e";
  });
  discussionSocket.on("connect_error", () => {
    discussionStatus.textContent = "Live connection unavailable · retrying";
    discussionStatus.style.color = "#b36a1e";
  });
  discussionSocket.on("discussion:identity", data => {
    currentGuestLabel = data.guestLabel || "Community guest";
    guestLabel.textContent = currentGuestLabel;
  });
  discussionSocket.on("discussion:new", renderDiscussionMessage);
  discussionSocket.on("discussion:remove", data => {
    if (!data || !data.id) return;
    seenDiscussionIds.delete(data.id);
    const matching = [...discussionMessages.children].find(node => node.dataset.messageId === data.id);
    if (matching) matching.remove();
    if (!discussionMessages.querySelector(".discussion-message")) {
      const placeholder = document.createElement("p");
      placeholder.className = "discussion-placeholder";
      placeholder.textContent = "No messages yet. Start a respectful conversation.";
      discussionMessages.appendChild(placeholder);
    }
  });
  discussionSocket.on("discussion:error", data => {
    discussionFeedback.textContent = data.message || "Message could not be sent.";
    discussionFeedback.className = "discussion-feedback error";
  });

  loadDiscussionHistory();

  discussionForm.addEventListener("submit", event => {
    event.preventDefault();
    const message = discussionInput.value.trim();
    if (!message) return;
    if (message.length > 600) {
      discussionFeedback.textContent = "Please keep messages under 600 characters.";
      discussionFeedback.className = "discussion-feedback error";
      return;
    }
    if (!discussionSocket.connected) {
      discussionFeedback.textContent = "You are offline. Wait for the live connection to return, then send again.";
      discussionFeedback.className = "discussion-feedback error";
      return;
    }

    discussionSend.disabled = true;
    discussionFeedback.textContent = "Sending…";
    discussionFeedback.className = "discussion-feedback";
    discussionSocket.timeout(8000).emit("discussion:send", { message }, (timeoutError, result) => {
      discussionSend.disabled = false;
      if (timeoutError || !result || !result.ok) {
        discussionFeedback.textContent = result?.error || "No confirmation received. Check your connection and try again.";
        discussionFeedback.className = "discussion-feedback error";
        return;
      }
      discussionInput.value = "";
      discussionFeedback.textContent = "Message sent. It is visible to everyone in the public room.";
      discussionFeedback.className = "discussion-feedback success";
    });
  });
} else {
  discussionStatus.textContent = "Live discussion script did not load. Refresh the page or check the server.";
  loadDiscussionHistory();
  discussionForm.addEventListener("submit", event => {
    event.preventDefault();
    discussionFeedback.textContent = "Live discussion is unavailable because its connection script did not load.";
    discussionFeedback.className = "discussion-feedback error";
  });
}

// AI guidance chat. Messages are kept only in this page's memory and are not written to this app's database.
const chatForm = $("#chatForm");
const chatInput = $("#chatInput");
const chatMessages = $("#chatMessages");
const sendChat = $("#sendChat");
let chatHistory = [];

function appendMessage(role, text) {
  const wrapper = document.createElement("div");
  wrapper.className = `chat-message ${role === "user" ? "user-message" : "assistant-message"}`;
  addText(wrapper, "span", role === "user" ? "You" : "✦", "message-avatar");
  const content = document.createElement("div");
  addText(content, "p", text);
  addText(content, "small", role === "user" ? "You" : "ClearShield Guide");
  wrapper.appendChild(content);
  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return wrapper;
}

function setChatStatus(text) {
  const status = document.createElement("div");
  status.className = "chat-message assistant-message";
  status.dataset.status = "true";
  addText(status, "span", "✦", "message-avatar");
  const inner = document.createElement("div");
  addText(inner, "p", text);
  status.appendChild(inner);
  chatMessages.appendChild(status);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return status;
}

async function sendPrompt(text) {
  const message = text.trim();
  if (!message) return;
  if (message.length > 1500) {
    appendMessage("assistant", "Please keep your question under 1,500 characters.");
    return;
  }

  appendMessage("user", message);
  chatHistory.push({ role: "user", content: message });
  chatInput.value = "";
  sendChat.disabled = true;
  const status = setChatStatus("Thinking through your question…");

  try {
    const response = await fetch("/api/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: chatHistory.slice(-8, -1) })
    });
    const result = await response.json();
    status.remove();
    if (!response.ok) throw new Error(result.error || "AI guidance is unavailable right now.");
    const answer = result.reply || "I couldn't generate a response. Please try again.";
    appendMessage("assistant", answer);
    chatHistory.push({ role: "assistant", content: answer });
    chatHistory = chatHistory.slice(-10);
  } catch (error) {
    status.remove();
    appendMessage("assistant", `${error.message} You can still use the scam guides and FAQs while AI guidance is unavailable.`);
  } finally {
    sendChat.disabled = false;
    chatInput.focus();
  }
}

chatForm.addEventListener("submit", event => {
  event.preventDefault();
  sendPrompt(chatInput.value);
});

$$(".prompt-chip").forEach(button => {
  button.addEventListener("click", () => sendPrompt(button.dataset.prompt || ""));
});

$("#clearChat").addEventListener("click", () => {
  chatHistory = [];
  chatMessages.replaceChildren();
  appendMessage("assistant", "Chat cleared. Ask a general scam-awareness question whenever you're ready. Please don't share private information.");
});

// A short reminder is deliberately shown before users interact with the assistant.
