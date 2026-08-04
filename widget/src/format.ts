/**
 * Minimal, safe answer formatter shared by the page and the widget.
 * Escapes HTML first, then renders: **bold**, bullet lists, URLs, emails,
 * and bare domains (tibeblabs.com, linkedin.com/in/...) as links.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// One combined pass so emails and URLs can't re-match inside generated hrefs.
const LINKS =
  /([\w.+-]+@[\w-]+\.[a-z][\w]*(?:\.[a-z][\w]*)*)|(\bhttps?:\/\/[^\s<)]+|\b(?:[a-z0-9-]+\.)+(?:com|dev|app|io|ai|org|net)\b(?:\/[^\s<),]*)?)/gi;

function linkify(escaped: string): string {
  return escaped.replace(LINKS, (match, email: string | undefined) => {
    const m = match.replace(/[.,]$/, "");
    const tail = match.slice(m.length);
    if (email) return `<a href="mailto:${m}">${m}</a>${tail}`;
    const href = m.startsWith("http") ? m : `https://${m}`;
    return `<a href="${href}" target="_blank" rel="noopener">${m}</a>${tail}`;
  });
}

export function renderAnswer(text: string): string {
  const lines = escapeHtml(text.trim()).split("\n");
  const out: string[] = [];
  let inList = false;
  for (const raw of lines) {
    const line = raw.trim();
    const bullet = /^[-*•]\s+(.*)/.exec(line);
    if (bullet) {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`<li>${bullet[1]}</li>`);
      continue;
    }
    if (inList) { out.push("</ul>"); inList = false; }
    if (line) out.push(`<p>${line}</p>`);
  }
  if (inList) out.push("</ul>");
  return linkify(out.join("")).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}
