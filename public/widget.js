(()=>{var e=document.currentScript,h,E=(h=e==null?void 0:e.dataset.api)!=null?h:"/api/chat",y,l=(y=e==null?void 0:e.dataset.accent)!=null?y:"#6d28d9",w,T=(w=e==null?void 0:e.dataset.title)!=null?w:"Ask about Tibeb Labs & Kalkidan",v,L=(v=e==null?void 0:e.dataset.greeting)!=null?v:"Hi! I can answer questions about Tibeb Labs' projects, services, and Kalkidan's skills & experience. What would you like to know?",S=`
  :host { all: initial; }
  * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .bubble {
    position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px;
    border-radius: 50%; border: none; cursor: pointer; z-index: 999999;
    background: ${l}; color: #fff; font-size: 26px; line-height: 1;
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
  .head { background: ${l}; color: #fff; padding: 14px 16px; font-size: 15px; font-weight: 600; }
  .head small { display: block; font-weight: 400; opacity: .85; font-size: 12px; margin-top: 2px; }
  .log { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; background: #f8f7fb; }
  .msg { max-width: 85%; padding: 9px 13px; border-radius: 14px; font-size: 14px; line-height: 1.45; white-space: pre-wrap; word-wrap: break-word; }
  .user { align-self: flex-end; background: ${l}; color: #fff; border-bottom-right-radius: 4px; }
  .bot  { align-self: flex-start; background: #fff; color: #1f2430; border: 1px solid #e6e3ef; border-bottom-left-radius: 4px; }
  .src  { align-self: flex-start; display: flex; gap: 6px; margin-top: -4px; }
  .src span { font-size: 11px; color: #6b6880; background: #edeaf5; border-radius: 8px; padding: 2px 8px; }
  .typing { align-self: flex-start; color: #8a86a0; font-size: 13px; padding: 4px 13px; }
  form { display: flex; gap: 8px; padding: 10px; border-top: 1px solid #eee; background: #fff; }
  input {
    flex: 1; border: 1px solid #ddd8ea; border-radius: 10px; padding: 10px 12px;
    font-size: 14px; outline: none; color: #1f2430; background: #fff;
  }
  input:focus { border-color: ${l}; }
  form button {
    border: none; background: ${l}; color: #fff; border-radius: 10px;
    padding: 0 16px; font-size: 14px; cursor: pointer;
  }
  form button:disabled { opacity: .5; cursor: default; }
`;function m(){let u=document.createElement("div");u.id="tibeb-chat-widget";let b=u.attachShadow({mode:"open"});document.body.appendChild(u);let g=document.createElement("style");g.textContent=S,b.appendChild(g);let s=document.createElement("button");s.className="bubble",s.setAttribute("aria-label","Open chat"),s.textContent="\u{1F4AC}";let o=document.createElement("div");o.className="panel",o.innerHTML=`
    <div class="head">${T}<small>RAG-powered \xB7 answers grounded in real docs</small></div>
    <div class="log"></div>
    <form><input type="text" maxlength="500" placeholder="Ask a question\u2026" aria-label="Your question"><button type="submit">Send</button></form>
  `,b.append(s,o);let a=o.querySelector(".log"),k=o.querySelector("form"),p=o.querySelector("input"),x=o.querySelector("form button"),d=t=>{var n;let r=document.createElement("div");if(r.className=`msg ${t.role}`,r.textContent=t.text,a.appendChild(r),(n=t.sources)!=null&&n.length){let i=document.createElement("div");i.className="src",i.innerHTML=t.sources.map(c=>`<span>${c}</span>`).join(""),a.appendChild(i)}a.scrollTop=a.scrollHeight};s.addEventListener("click",()=>{let t=o.classList.toggle("open");s.textContent=t?"\u2715":"\u{1F4AC}",t&&p.focus()}),d({role:"bot",text:L}),k.addEventListener("submit",async t=>{var i;t.preventDefault();let r=p.value.trim();if(!r||x.disabled)return;d({role:"user",text:r}),p.value="",x.disabled=!0;let n=document.createElement("div");n.className="typing",n.textContent="Thinking\u2026",a.appendChild(n),a.scrollTop=a.scrollHeight;try{let c=await fetch(E,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:r})}),f=await c.json();n.remove(),c.ok&&f.answer?d({role:"bot",text:f.answer,sources:f.sources}):d({role:"bot",text:(i=f.error)!=null?i:"Sorry, something went wrong. Please try again."})}catch{n.remove(),d({role:"bot",text:"Couldn't reach the server \u2014 please try again in a moment."})}finally{x.disabled=!1,p.focus()}})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",m):m();})();
