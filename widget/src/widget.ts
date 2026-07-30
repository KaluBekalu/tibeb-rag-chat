/**
 * Tibeb Chat — embeddable RAG chat widget.
 *
 * Usage (one line, any site):
 *   <script src="https://<deployment>/widget.js"
 *           data-api="https://<deployment>/api/chat"
 *           data-accent="#6d28d9" defer></script>
 *
 * Renders a floating chat bubble inside a Shadow DOM so host-page CSS can't
 * leak in (and ours can't leak out).
 */

interface Message {
  role: "user" | "bot";
  text: string;
  sources?: string[];
}

const script = document.currentScript as HTMLScriptElement;
const API_URL = script?.dataset.api ?? "/api/chat";
const ACCENT = script?.dataset.accent ?? "#6d28d9";
const TITLE = script?.dataset.title ?? "Ask about Tibeb Labs & Kalkidan";
const GREETING =
  script?.dataset.greeting ??
  "Hi! I can answer questions about Tibeb Labs' projects, services, and Kalkidan's skills & experience. What would you like to know?";

const STYLES = `
  :host { all: initial; }
  * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .bubble {
    position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px;
    border-radius: 50%; border: none; cursor: pointer; z-index: 999999;
    background: ${ACCENT}; color: #fff; font-size: 26px; line-height: 1;
    box-shadow: 0 4px 16px rgba(0,0,0,.25); transition: transform .15s;
    display: flex; align-items: center; justify-content: center;
  }
  .bubble:hover { transform: scale(1.08); }
  .panel {
    position: fixed; bottom: 92px; right: 24px; width: 360px; max-width: calc(100vw - 32px);
    height: 480px; max-height: calc(100vh - 120px); z-index: 999999;
    background: #fff; border-radius: 16px; overflow: hidden;
    box-shadow: 0 12px 40px rgba(0,0,0,.3);
    display: none; flex-direction: column;
  }
  .panel.open { display: flex; }
  .head { background: ${ACCENT}; color: #fff; padding: 14px 16px; font-size: 15px; font-weight: 600; }
  .head small { display: block; font-weight: 400; opacity: .85; font-size: 12px; margin-top: 2px; }
  .log { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; background: #f8f7fb; }
  .msg { max-width: 85%; padding: 9px 13px; border-radius: 14px; font-size: 14px; line-height: 1.45; white-space: pre-wrap; word-wrap: break-word; }
  .user { align-self: flex-end; background: ${ACCENT}; color: #fff; border-bottom-right-radius: 4px; }
  .bot  { align-self: flex-start; background: #fff; color: #1f2430; border: 1px solid #e6e3ef; border-bottom-left-radius: 4px; }
  .src  { align-self: flex-start; display: flex; gap: 6px; margin-top: -4px; }
  .src span { font-size: 11px; color: #6b6880; background: #edeaf5; border-radius: 8px; padding: 2px 8px; }
  .typing { align-self: flex-start; color: #8a86a0; font-size: 13px; padding: 4px 13px; }
  form { display: flex; gap: 8px; padding: 10px; border-top: 1px solid #eee; background: #fff; }
  input {
    flex: 1; border: 1px solid #ddd8ea; border-radius: 10px; padding: 10px 12px;
    font-size: 14px; outline: none; color: #1f2430; background: #fff;
  }
  input:focus { border-color: ${ACCENT}; }
  form button {
    border: none; background: ${ACCENT}; color: #fff; border-radius: 10px;
    padding: 0 16px; font-size: 14px; cursor: pointer;
  }
  form button:disabled { opacity: .5; cursor: default; }
`;

function mount(): void {
  const host = document.createElement("div");
  host.id = "tibeb-chat-widget";
  const root = host.attachShadow({ mode: "open" });
  document.body.appendChild(host);

  const style = document.createElement("style");
  style.textContent = STYLES;
  root.appendChild(style);

  const bubble = document.createElement("button");
  bubble.className = "bubble";
  bubble.setAttribute("aria-label", "Open chat");
  bubble.textContent = "💬";

  const panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="head">${TITLE}<small>RAG-powered · answers grounded in real docs</small></div>
    <div class="log"></div>
    <form><input type="text" maxlength="500" placeholder="Ask a question…" aria-label="Your question"><button type="submit">Send</button></form>
  `;

  root.append(bubble, panel);

  const log = panel.querySelector(".log") as HTMLDivElement;
  const form = panel.querySelector("form") as HTMLFormElement;
  const input = panel.querySelector("input") as HTMLInputElement;
  const send = panel.querySelector("form button") as HTMLButtonElement;

  const add = (m: Message): void => {
    const div = document.createElement("div");
    div.className = `msg ${m.role}`;
    div.textContent = m.text;
    log.appendChild(div);
    if (m.sources?.length) {
      const src = document.createElement("div");
      src.className = "src";
      src.innerHTML = m.sources.map((s) => `<span>${s}</span>`).join("");
      log.appendChild(src);
    }
    log.scrollTop = log.scrollHeight;
  };

  bubble.addEventListener("click", () => {
    const open = panel.classList.toggle("open");
    bubble.textContent = open ? "✕" : "💬";
    if (open) input.focus();
  });

  add({ role: "bot", text: GREETING });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const question = input.value.trim();
    if (!question || send.disabled) return;
    add({ role: "user", text: question });
    input.value = "";
    send.disabled = true;

    const typing = document.createElement("div");
    typing.className = "typing";
    typing.textContent = "Thinking…";
    log.appendChild(typing);
    log.scrollTop = log.scrollHeight;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      typing.remove();
      if (res.ok && data.answer) {
        add({ role: "bot", text: data.answer, sources: data.sources });
      } else {
        add({ role: "bot", text: data.error ?? "Sorry, something went wrong. Please try again." });
      }
    } catch {
      typing.remove();
      add({ role: "bot", text: "Couldn't reach the server — please try again in a moment." });
    } finally {
      send.disabled = false;
      input.focus();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
