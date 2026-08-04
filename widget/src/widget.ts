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

import { renderAnswer } from "./format";

interface Message {
  role: "user" | "bot";
  text: string;
  sources?: string[];
}

const script = document.currentScript as HTMLScriptElement;
const API_URL = script?.dataset.api ?? "/api/chat";
const ACCENT = script?.dataset.accent ?? "#6d28d9";
const TITLE = script?.dataset.title ?? "Ask about Kalkidan & Tibeb Labs";
const GREETING =
  script?.dataset.greeting ??
  "Hi! I can answer questions about Kalkidan's skills and experience, and about Tibeb Labs — his studio's products and services. What would you like to know?";

/** data-theme="dark|light" wins; else the host's <html> class; else OS preference. */
function resolveTheme(): "light" | "dark" {
  const t = script?.dataset.theme;
  if (t === "dark" || t === "light") return t;
  const cls = document.documentElement.classList;
  if (cls.contains("dark")) return "dark";
  if (cls.contains("light")) return "light";
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const DARK = resolveTheme() === "dark";
const P = DARK
  ? { panel: "#17141f", log: "#100d16", botBg: "#1e1a29", botBorder: "#2e2840",
      text: "#ece8f6", strong: "#ffffff", dim: "#9a90b8", inputBg: "#1e1a29",
      inputBorder: "#332c48", srcBg: "#242030", head: "#17141f" }
  : { panel: "#ffffff", log: "#f8f7fb", botBg: "#ffffff", botBorder: "#e6e3ef",
      text: "#1f2430", strong: "#14101f", dim: "#6b6880", inputBg: "#ffffff",
      inputBorder: "#ddd8ea", srcBg: "#edeaf5", head: "#ffffff" };

const CHAT_ICON =
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
const CLOSE_ICON =
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';

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
    background: ${P.panel}; border-radius: 16px; overflow: hidden;
    box-shadow: 0 12px 40px rgba(0,0,0,${DARK ? ".55" : ".3"});
    ${DARK ? `border: 1px solid ${P.botBorder};` : ""}
    display: none; flex-direction: column;
  }
  .panel.open { display: flex; }
  .head { background: ${ACCENT}; color: #fff; padding: 14px 16px; font-size: 15px; font-weight: 600; }
  .head small { display: block; font-weight: 400; opacity: .85; font-size: 12px; margin-top: 2px; }
  .log { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; background: ${P.log}; }
  .msg { max-width: 85%; padding: 9px 13px; border-radius: 14px; font-size: 14px; line-height: 1.45; word-wrap: break-word; }
  .user { align-self: flex-end; background: ${ACCENT}; color: #fff; border-bottom-right-radius: 4px; white-space: pre-wrap; }
  .bot  { align-self: flex-start; background: ${P.botBg}; color: ${P.text}; border: 1px solid ${P.botBorder}; border-bottom-left-radius: 4px; }
  .bot p { margin: 0 0 8px; }
  .bot p:last-child, .bot ul:last-child { margin-bottom: 0; }
  .bot ul { margin: 2px 0 8px 18px; padding: 0; }
  .bot li { margin-bottom: 3px; }
  .bot a { color: ${ACCENT}; text-underline-offset: 2px; filter: ${DARK ? "brightness(1.5)" : "none"}; }
  .bot strong { color: ${P.strong}; }
  .src  { align-self: flex-start; display: flex; gap: 6px; margin-top: -4px; }
  .src span { font-size: 11px; color: ${P.dim}; background: ${P.srcBg}; border-radius: 8px; padding: 2px 8px; }
  .typing { align-self: flex-start; color: ${P.dim}; font-size: 13px; padding: 4px 13px; }
  form { display: flex; gap: 8px; padding: 10px; border-top: 1px solid ${P.botBorder}; background: ${P.head}; }
  input {
    flex: 1; border: 1px solid ${P.inputBorder}; border-radius: 10px; padding: 10px 12px;
    font-size: 14px; outline: none; color: ${P.text}; background: ${P.inputBg};
  }
  input::placeholder { color: ${P.dim}; }
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
  bubble.innerHTML = CHAT_ICON;

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
    if (m.role === "bot") div.innerHTML = renderAnswer(m.text);
    else div.textContent = m.text;
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
    bubble.innerHTML = open ? CLOSE_ICON : CHAT_ICON;
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
