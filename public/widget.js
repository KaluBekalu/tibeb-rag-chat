(()=>{function L(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}var T=/([\w.+-]+@[\w-]+\.[a-z][\w]*(?:\.[a-z][\w]*)*)|(\bhttps?:\/\/[^\s<)]+|\b(?:[a-z0-9-]+\.)+(?:com|dev|app|io|ai|org|net)\b(?:\/[^\s<),]*)?)/gi;function $(s){return s.replace(T,(d,r)=>{let e=d.replace(/[.,]$/,""),t=d.slice(e.length);return r?`<a href="mailto:${e}">${e}</a>${t}`:`<a href="${e.startsWith("http")?e:`https://${e}`}" target="_blank" rel="noopener">${e}</a>${t}`})}function h(s){let d=L(s.trim()).split(`
`),r=[],e=!1;for(let t of d){let o=t.trim(),f=/^[-*•]\s+(.*)/.exec(o);if(f){e||(r.push("<ul>"),e=!0),r.push(`<li>${f[1]}</li>`);continue}e&&(r.push("</ul>"),e=!1),o&&r.push(`<p>${o}</p>`)}return e&&r.push("</ul>"),$(r.join("")).replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>")}var n=document.currentScript,w,S=(w=n==null?void 0:n.dataset.api)!=null?w:"/api/chat",v,c=(v=n==null?void 0:n.dataset.accent)!=null?v:"#6d28d9",k,C=(k=n==null?void 0:n.dataset.title)!=null?k:"Ask about Kalkidan & Tibeb Labs",E,z=(E=n==null?void 0:n.dataset.greeting)!=null?E:"Hi! I can answer questions about Kalkidan's skills and experience, and about Tibeb Labs \u2014 his studio's products and services. What would you like to know?",H=`
  :host { all: initial; }
  * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .bubble {
    position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px;
    border-radius: 50%; border: none; cursor: pointer; z-index: 999999;
    background: ${c}; color: #fff; font-size: 26px; line-height: 1;
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
  .head { background: ${c}; color: #fff; padding: 14px 16px; font-size: 15px; font-weight: 600; }
  .head small { display: block; font-weight: 400; opacity: .85; font-size: 12px; margin-top: 2px; }
  .log { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; background: #f8f7fb; }
  .msg { max-width: 85%; padding: 9px 13px; border-radius: 14px; font-size: 14px; line-height: 1.45; word-wrap: break-word; }
  .user { align-self: flex-end; background: ${c}; color: #fff; border-bottom-right-radius: 4px; white-space: pre-wrap; }
  .bot  { align-self: flex-start; background: #fff; color: #1f2430; border: 1px solid #e6e3ef; border-bottom-left-radius: 4px; }
  .bot p { margin: 0 0 8px; }
  .bot p:last-child, .bot ul:last-child { margin-bottom: 0; }
  .bot ul { margin: 2px 0 8px 18px; padding: 0; }
  .bot li { margin-bottom: 3px; }
  .bot a { color: ${c}; text-underline-offset: 2px; }
  .bot strong { color: #14101f; }
  .src  { align-self: flex-start; display: flex; gap: 6px; margin-top: -4px; }
  .src span { font-size: 11px; color: #6b6880; background: #edeaf5; border-radius: 8px; padding: 2px 8px; }
  .typing { align-self: flex-start; color: #8a86a0; font-size: 13px; padding: 4px 13px; }
  form { display: flex; gap: 8px; padding: 10px; border-top: 1px solid #eee; background: #fff; }
  input {
    flex: 1; border: 1px solid #ddd8ea; border-radius: 10px; padding: 10px 12px;
    font-size: 14px; outline: none; color: #1f2430; background: #fff;
  }
  input:focus { border-color: ${c}; }
  form button {
    border: none; background: ${c}; color: #fff; border-radius: 10px;
    padding: 0 16px; font-size: 14px; cursor: pointer;
  }
  form button:disabled { opacity: .5; cursor: default; }
`;function y(){let s=document.createElement("div");s.id="tibeb-chat-widget";let d=s.attachShadow({mode:"open"});document.body.appendChild(s);let r=document.createElement("style");r.textContent=H,d.appendChild(r);let e=document.createElement("button");e.className="bubble",e.setAttribute("aria-label","Open chat"),e.textContent="\u{1F4AC}";let t=document.createElement("div");t.className="panel",t.innerHTML=`
    <div class="head">${C}<small>RAG-powered \xB7 answers grounded in real docs</small></div>
    <div class="log"></div>
    <form><input type="text" maxlength="500" placeholder="Ask a question\u2026" aria-label="Your question"><button type="submit">Send</button></form>
  `,d.append(e,t);let o=t.querySelector(".log"),f=t.querySelector("form"),b=t.querySelector("input"),m=t.querySelector("form button"),u=a=>{var l;let i=document.createElement("div");if(i.className=`msg ${a.role}`,a.role==="bot"?i.innerHTML=h(a.text):i.textContent=a.text,o.appendChild(i),(l=a.sources)!=null&&l.length){let p=document.createElement("div");p.className="src",p.innerHTML=a.sources.map(x=>`<span>${x}</span>`).join(""),o.appendChild(p)}o.scrollTop=o.scrollHeight};e.addEventListener("click",()=>{let a=t.classList.toggle("open");e.textContent=a?"\u2715":"\u{1F4AC}",a&&b.focus()}),u({role:"bot",text:z}),f.addEventListener("submit",async a=>{var p;a.preventDefault();let i=b.value.trim();if(!i||m.disabled)return;u({role:"user",text:i}),b.value="",m.disabled=!0;let l=document.createElement("div");l.className="typing",l.textContent="Thinking\u2026",o.appendChild(l),o.scrollTop=o.scrollHeight;try{let x=await fetch(S,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:i})}),g=await x.json();l.remove(),x.ok&&g.answer?u({role:"bot",text:g.answer,sources:g.sources}):u({role:"bot",text:(p=g.error)!=null?p:"Sorry, something went wrong. Please try again."})}catch{l.remove(),u({role:"bot",text:"Couldn't reach the server \u2014 please try again in a moment."})}finally{m.disabled=!1,b.focus()}})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",y):y();})();
