const loginCard = document.querySelector("#loginCard");
const loginForm = document.querySelector("#adminLoginForm");
const usernameInput = document.querySelector("#adminUsername");
const passwordInput = document.querySelector("#adminPassword");
const loginButton = document.querySelector("#loginButton");
const dashboard = document.querySelector("#adminDashboard");
const signedInAs = document.querySelector("#signedInAs");
const logoutButton = document.querySelector("#logoutButton");
const loadButton = document.querySelector("#loadPending");
const list = document.querySelector("#pendingList");
const message = document.querySelector("#moderationMessage");
const loadDiscussionButton = document.querySelector("#loadDiscussion");
const discussionList = document.querySelector("#discussionModerationList");

function text(parent, tag, value, className) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.textContent = value || "";
  parent.appendChild(el);
  return el;
}
function setMessage(value, type = "") {
  message.textContent = value;
  message.className = `moderation-message ${type}`;
}
async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
  return result;
}
function showDashboard(username) {
  loginCard.hidden = true;
  dashboard.hidden = false;
  signedInAs.textContent = `Signed in as ${username || "administrator"}`;
}
function showLogin() {
  dashboard.hidden = true;
  loginCard.hidden = false;
  passwordInput.value = "";
}

async function checkSession() {
  try {
    const result = await api("/api/admin/session", { method: "GET", headers: {} });
    if (result.authenticated) {
      showDashboard(result.username);
      await loadPending();
    } else showLogin();
  } catch (error) {
    showLogin();
    setMessage("Unable to check your sign-in status. Refresh the page and try again.", "error");
  }
}

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  loginButton.disabled = true;
  setMessage("Signing in…");
  try {
    const result = await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ username: usernameInput.value.trim(), password: passwordInput.value })
    });
    passwordInput.value = "";
    showDashboard(result.username);
    setMessage("Signed in successfully.", "success");
    await loadPending();
  } catch (error) {
    setMessage(error.message, "error");
  } finally {
    loginButton.disabled = false;
  }
});

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  try {
    await api("/api/admin/logout", { method: "POST", body: "{}" });
    list.replaceChildren();
    discussionList.replaceChildren();
    showLogin();
    setMessage("You have signed out.", "success");
  } catch (error) {
    setMessage(error.message, "error");
  } finally {
    logoutButton.disabled = false;
  }
});

function renderReport(report) {
  const card = document.createElement("article");
  card.className = "moderation-card";
  text(card, "h2", `${report.category} · ${report.experience}`);
  text(card, "p", `Channel: ${report.channel} | Outcome: ${report.outcome}`, "small-muted");
  text(card, "h3", "Private original draft — review carefully");
  text(card, "p", report.description || "No description provided.", "private-draft");
  if (report.lesson) text(card, "p", `Original lesson: ${report.lesson}`, "private-draft");
  text(card, "p", "Copy only safe, non-identifying details into the public fields below. Never publish names, contact details, account information, passwords, codes, or identifying accusations.", "small-muted");
  const lessonLabel = text(card, "label", "Reviewed public lesson (required)");
  const lesson = document.createElement("textarea"); lesson.maxLength = 1000; lesson.required = true; lesson.value = report.lesson || ""; lessonLabel.htmlFor = `lesson-${report.id}`; lesson.id = `lesson-${report.id}`; card.appendChild(lesson);
  const descriptionLabel = text(card, "label", "Reviewed public description (required; may be shortened)");
  const description = document.createElement("textarea"); description.maxLength = 3000; description.required = true; description.value = report.description || ""; descriptionLabel.htmlFor = `description-${report.id}`; description.id = `description-${report.id}`; card.appendChild(description);
  const actions = document.createElement("div"); actions.className = "moderation-actions";
  const approve = text(actions, "button", "Approve and publish"); approve.type = "button"; approve.className = "button button-green";
  const reject = text(actions, "button", "Reject submission"); reject.type = "button"; reject.className = "button-danger";
  approve.addEventListener("click", async () => {
    approve.disabled = true;
    try {
      const result = await api(`/api/moderation/${encodeURIComponent(report.id)}/approve`, { method: "POST", body: JSON.stringify({ lesson: lesson.value.trim(), description: description.value.trim() }) });
      card.remove(); setMessage(result.message, "success");
    } catch (error) { setMessage(error.message, "error"); approve.disabled = false; }
  });
  reject.addEventListener("click", async () => {
    if (!window.confirm("Reject this submission? It will not be published.")) return;
    reject.disabled = true;
    try {
      const result = await api(`/api/moderation/${encodeURIComponent(report.id)}/reject`, { method: "POST", body: "{}" });
      card.remove(); setMessage(result.message, "success");
    } catch (error) { setMessage(error.message, "error"); reject.disabled = false; }
  });
  card.appendChild(actions);
  return card;
}

async function loadPending() {
  loadButton.disabled = true;
  list.replaceChildren();
  setMessage("Loading pending submissions…");
  try {
    const result = await api("/api/moderation/pending", { method: "GET", headers: {} });
    if (!result.reports || result.reports.length === 0) text(list, "p", "No pending submissions. Approved stories appear on the public homepage.", "moderation-card");
    else result.reports.forEach(report => list.appendChild(renderReport(report)));
    setMessage(`${(result.reports || []).length} pending submission(s) loaded.`, "success");
  } catch (error) {
    if (error.message.toLowerCase().includes("sign in")) { showLogin(); setMessage("Your session expired. Please sign in again.", "error"); }
    else setMessage(error.message, "error");
  } finally { loadButton.disabled = false; }
}
loadButton.addEventListener("click", loadPending);

async function loadDiscussionForModeration() {
  loadDiscussionButton.disabled = true;
  discussionList.replaceChildren();
  try {
    const result = await api("/api/moderation/discussion", { method: "GET", headers: {} });
    if (!result.messages || result.messages.length === 0) text(discussionList, "p", "No discussion messages to review.", "small-muted");
    result.messages.forEach(item => {
      const row = document.createElement("article");
      row.className = "discussion-admin-message";
      const content = document.createElement("div");
      text(content, "strong", item.guestLabel);
      text(content, "p", item.message);
      text(content, "small", new Date(item.createdAt).toLocaleString(), "small-muted");
      row.appendChild(content);
      const remove = text(row, "button", "Remove");
      remove.type = "button"; remove.className = "button-danger";
      remove.addEventListener("click", async () => {
        if (!window.confirm("Remove this message for everyone?")) return;
        remove.disabled = true;
        try {
          const removed = await api(`/api/moderation/discussion/${encodeURIComponent(item.id)}`, { method: "DELETE" });
          row.remove(); setMessage(removed.message, "success");
        } catch (error) { setMessage(error.message, "error"); remove.disabled = false; }
      });
      discussionList.appendChild(row);
    });
    setMessage(`${(result.messages || []).length} recent discussion message(s) loaded.`, "success");
  } catch (error) {
    if (error.message.toLowerCase().includes("sign in")) { showLogin(); setMessage("Your session expired. Please sign in again.", "error"); }
    else setMessage(error.message, "error");
  } finally { loadDiscussionButton.disabled = false; }
}
loadDiscussionButton.addEventListener("click", loadDiscussionForModeration);

checkSession();
