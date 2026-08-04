/**
 * Full-page ChatGPT-style chat for the standalone demo site.
 * The embeddable bubble (widget.ts) is for tibeblabs.com / portfolio;
 * this is the primary UI at the deployment root.
 */

const API_URL = "/api/chat";

const SUGGESTIONS = [
  "What products has Tibeb Labs built?",
  "What's Kalkidan's experience with AI and LLMs?",
  "How does pricing work at Tibeb Labs?",
  "Has Kalkidan worked at large companies?",
];

const app = document.getElementById("app") as HTMLDivElement;

app.innerHTML = `
  <header class="top">
    <div class="brand">Tibeb<span>Chat</span></div>
    <a class="gh" href="https://github.com/KaluBekalu/tibeb-rag-chat" target="_blank" rel="noopener">GitHub ↗</a>
  </header>
  <main class="scroll" id="scroll">
    <div class="thread" id="thread">
      <div class="hero" id="hero">
        <h1>Ask me about <em>Tibeb Labs</em><br>&amp; Kalkidan Aleme</h1>
        <p>RAG-powered answers grounded in real docs — projects, services, pricing, skills, and experience. Recruiters welcome.</p>
        <div class="chips" id="chips"></div>
      </div>
    </div>
  </main>
  <footer class="composer">
    <form id="form">
      <textarea id="input" rows="1" maxlength="500" placeholder="Ask a question…" aria-label="Your question"></textarea>
      <button id="send" type="submit" aria-label="Send">↑</button>
    </form>
    <div class="fine">Answers come only from the project's knowledge base · <a href="https://tibeblabs.com" target="_blank" rel="noopener">tibeblabs.com</a></div>
  </footer>
`;

const scroll = document.getElementById("scroll") as HTMLElement;
const thread = document.getElementById("thread") as HTMLDivElement;
const hero = document.getElementById("hero") as HTMLDivElement;
const chips = document.getElementById("chips") as HTMLDivElement;
const form = document.getElementById("form") as HTMLFormElement;
const input = document.getElementById("input") as HTMLTextAreaElement;
const send = document.getElementById("send") as HTMLButtonElement;

for (const s of SUGGESTIONS) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chip";
  b.textContent = s;
  b.addEventListener("click", () => {
    input.value = s;
    form.requestSubmit();
  });
  chips.appendChild(b);
}

function addRow(role: "user" | "bot", text: string, sources?: string[]): HTMLDivElement {
  const row = document.createElement("div");
  row.className = `row ${role}`;
  if (role === "bot") {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "ቲ";
    row.appendChild(avatar);
  }
  const body = document.createElement("div");
  body.className = "body";
  const msg = document.createElement("div");
  msg.className = "text";
  msg.textContent = text;
  body.appendChild(msg);
  if (sources?.length) {
    const src = document.createElement("div");
    src.className = "sources";
    src.innerHTML = sources.map((s) => `<span>${s}</span>`).join("");
    body.appendChild(src);
  }
  row.appendChild(body);
  thread.appendChild(row);
  scroll.scrollTop = scroll.scrollHeight;
  return msg as HTMLDivElement;
}

async function ask(question: string): Promise<void> {
  hero.style.display = "none";
  addRow("user", question);
  send.disabled = true;
  const pending = addRow("bot", "");
  pending.classList.add("thinking");
  pending.textContent = "Thinking…";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    pending.classList.remove("thinking");
    if (res.ok && data.answer) {
      pending.textContent = data.answer;
      if (data.sources?.length) {
        const src = document.createElement("div");
        src.className = "sources";
        src.innerHTML = data.sources.map((s: string) => `<span>${s}</span>`).join("");
        pending.parentElement!.appendChild(src);
      }
    } else {
      pending.textContent = data.error ?? "Sorry, something went wrong. Please try again.";
    }
  } catch {
    pending.classList.remove("thinking");
    pending.textContent = "Couldn't reach the server — please try again in a moment.";
  } finally {
    send.disabled = false;
    scroll.scrollTop = scroll.scrollHeight;
    input.focus();
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = input.value.trim();
  if (!q || send.disabled) return;
  input.value = "";
  input.style.height = "auto";
  void ask(q);
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
});

input.focus();
