(()=>{function S(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}var M=/([\w.+-]+@[\w-]+\.[a-z][\w]*(?:\.[a-z][\w]*)*)|(\bhttps?:\/\/[^\s<)]+|\b(?:[a-z0-9-]+\.)+(?:com|dev|app|io|ai|org|net)\b(?:\/[^\s<),]*)?)/gi;function H(n){return n.replace(M,(l,s)=>{let e=l.replace(/[.,]$/,""),r=l.slice(e.length);return s?`<a href="mailto:${e}">${e}</a>${r}`:`<a href="${e.startsWith("http")?e:`https://${e}`}" target="_blank" rel="noopener">${e}</a>${r}`})}function k(n){let l=S(n.trim()).split(`
`),s=[],e=!1;for(let r of l){let a=r.trim(),g=/^[-*•]\s+(.*)/.exec(a);if(g){e||(s.push("<ul>"),e=!0),s.push(`<li>${g[1]}</li>`);continue}e&&(s.push("</ul>"),e=!1),a&&s.push(`<p>${a}</p>`)}return e&&s.push("</ul>"),H(s.join("")).replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>")}var t=document.currentScript,T,z=(T=t==null?void 0:t.dataset.api)!=null?T:"/api/chat",L,f=(L=t==null?void 0:t.dataset.accent)!=null?L:"#6d28d9",E,N=(E=t==null?void 0:t.dataset.title)!=null?E:"Ask about Kalkidan & Tibeb Labs",B,A=(B=t==null?void 0:t.dataset.greeting)!=null?B:"Hi! I can answer questions about Kalkidan's skills and experience, and about Tibeb Labs \u2014 his studio's products and services. What would you like to know?";function I(){let n=t==null?void 0:t.dataset.theme;if(n==="dark"||n==="light")return n;let l=document.documentElement.classList;return l.contains("dark")?"dark":l.contains("light")?"light":matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}var C,$=parseInt((C=t==null?void 0:t.dataset.offset)!=null?C:"24",10)||24,m=I()==="dark",o=m?{panel:"#17141f",log:"#100d16",botBg:"#1e1a29",botBorder:"#2e2840",text:"#ece8f6",strong:"#ffffff",dim:"#9a90b8",inputBg:"#1e1a29",inputBorder:"#332c48",srcBg:"#242030",head:"#17141f"}:{panel:"#ffffff",log:"#f8f7fb",botBg:"#ffffff",botBorder:"#e6e3ef",text:"#1f2430",strong:"#14101f",dim:"#6b6880",inputBg:"#ffffff",inputBorder:"#ddd8ea",srcBg:"#edeaf5",head:"#ffffff"},y='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',q='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',O=`
  :host { all: initial; }
  * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .bubble {
    position: fixed; bottom: ${$}px; right: 24px; width: 56px; height: 56px;
    border-radius: 50%; border: none; cursor: pointer; z-index: 999999;
    background: ${f}; color: #fff; font-size: 26px; line-height: 1;
    box-shadow: 0 4px 16px rgba(0,0,0,.25); transition: transform .15s;
    display: flex; align-items: center; justify-content: center;
  }
  .bubble:hover { transform: scale(1.08); }
  .panel {
    position: fixed; bottom: ${$+68}px; right: 24px; width: 360px; max-width: calc(100vw - 32px);
    height: 480px; max-height: calc(100vh - ${$+96}px); z-index: 999999;
    background: ${o.panel}; border-radius: 16px; overflow: hidden;
    box-shadow: 0 12px 40px rgba(0,0,0,${m?".55":".3"});
    ${m?`border: 1px solid ${o.botBorder};`:""}
    display: none; flex-direction: column;
  }
  .panel.open { display: flex; }
  .head { background: ${f}; color: #fff; padding: 14px 16px; font-size: 15px; font-weight: 600; }
  .head small { display: block; font-weight: 400; opacity: .85; font-size: 12px; margin-top: 2px; }
  .log { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; background: ${o.log}; }
  .msg { max-width: 85%; padding: 9px 13px; border-radius: 14px; font-size: 14px; line-height: 1.45; word-wrap: break-word; }
  .user { align-self: flex-end; background: ${f}; color: #fff; border-bottom-right-radius: 4px; white-space: pre-wrap; }
  .bot  { align-self: flex-start; background: ${o.botBg}; color: ${o.text}; border: 1px solid ${o.botBorder}; border-bottom-left-radius: 4px; }
  .bot p { margin: 0 0 8px; }
  .bot p:last-child, .bot ul:last-child { margin-bottom: 0; }
  .bot ul { margin: 2px 0 8px 18px; padding: 0; }
  .bot li { margin-bottom: 3px; }
  .bot a { color: ${f}; text-underline-offset: 2px; filter: ${m?"brightness(1.5)":"none"}; }
  .bot strong { color: ${o.strong}; }
  .src  { align-self: flex-start; display: flex; gap: 6px; margin-top: -4px; }
  .src span { font-size: 11px; color: ${o.dim}; background: ${o.srcBg}; border-radius: 8px; padding: 2px 8px; }
  .typing { align-self: flex-start; color: ${o.dim}; font-size: 13px; padding: 4px 13px; }
  form { display: flex; gap: 8px; padding: 10px; border-top: 1px solid ${o.botBorder}; background: ${o.head}; }
  input {
    flex: 1; border: 1px solid ${o.inputBorder}; border-radius: 10px; padding: 10px 12px;
    font-size: 14px; outline: none; color: ${o.text}; background: ${o.inputBg};
  }
  input::placeholder { color: ${o.dim}; }
  input:focus { border-color: ${f}; }
  form button {
    border: none; background: ${f}; color: #fff; border-radius: 10px;
    padding: 0 16px; font-size: 14px; cursor: pointer;
  }
  form button:disabled { opacity: .5; cursor: default; }
`;function v(){let n=document.createElement("div");n.id="tibeb-chat-widget";let l=n.attachShadow({mode:"open"});document.body.appendChild(n);let s=document.createElement("style");s.textContent=O,l.appendChild(s);let e=document.createElement("button");e.className="bubble",e.setAttribute("aria-label","Open chat"),e.innerHTML=y;let r=document.createElement("div");r.className="panel",r.innerHTML=`
    <div class="head">${N}<small>RAG-powered \xB7 answers grounded in real docs</small></div>
    <div class="log"></div>
    <form><input type="text" maxlength="500" placeholder="Ask a question\u2026" aria-label="Your question"><button type="submit">Send</button></form>
  `,l.append(e,r);let a=r.querySelector(".log"),g=r.querySelector("form"),b=r.querySelector("input"),w=r.querySelector("form button"),u=i=>{var c;let d=document.createElement("div");if(d.className=`msg ${i.role}`,i.role==="bot"?d.innerHTML=k(i.text):d.textContent=i.text,a.appendChild(d),(c=i.sources)!=null&&c.length){let p=document.createElement("div");p.className="src",p.innerHTML=i.sources.map(x=>`<span>${x}</span>`).join(""),a.appendChild(p)}a.scrollTop=a.scrollHeight};e.addEventListener("click",()=>{let i=r.classList.toggle("open");e.innerHTML=i?q:y,i&&b.focus()}),u({role:"bot",text:A}),g.addEventListener("submit",async i=>{var p;i.preventDefault();let d=b.value.trim();if(!d||w.disabled)return;u({role:"user",text:d}),b.value="",w.disabled=!0;let c=document.createElement("div");c.className="typing",c.textContent="Thinking\u2026",a.appendChild(c),a.scrollTop=a.scrollHeight;try{let x=await fetch(z,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:d})}),h=await x.json();c.remove(),x.ok&&h.answer?u({role:"bot",text:h.answer,sources:h.sources}):u({role:"bot",text:(p=h.error)!=null?p:"Sorry, something went wrong. Please try again."})}catch{c.remove(),u({role:"bot",text:"Couldn't reach the server \u2014 please try again in a moment."})}finally{w.disabled=!1,b.focus()}})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",v):v();})();
