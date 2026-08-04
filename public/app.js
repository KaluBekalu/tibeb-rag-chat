(()=>{function h(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}var g=/([\w.+-]+@[\w-]+\.[a-z][\w]*(?:\.[a-z][\w]*)*)|(\bhttps?:\/\/[^\s<)]+|\b(?:[a-z0-9-]+\.)+(?:com|dev|app|io|ai|org|net)\b(?:\/[^\s<),]*)?)/gi;function f(n){return n.replace(g,(e,s)=>{let t=e.replace(/[.,]$/,""),r=e.slice(t.length);return s?`<a href="mailto:${t}">${t}</a>${r}`:`<a href="${t.startsWith("http")?t:`https://${t}`}" target="_blank" rel="noopener">${t}</a>${r}`})}function m(n){let e=h(n.trim()).split(`
`),s=[],t=!1;for(let r of e){let a=r.trim(),i=/^[-*•]\s+(.*)/.exec(a);if(i){t||(s.push("<ul>"),t=!0),s.push(`<li>${i[1]}</li>`);continue}t&&(s.push("</ul>"),t=!1),a&&s.push(`<p>${a}</p>`)}return t&&s.push("</ul>"),f(s.join("")).replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>")}var b="/api/chat",v=["What's Kalkidan's experience with AI and LLMs?","What products has he built and monetized?","Tell me about his enterprise work at Kimberly-Clark","What's his frontend & design-system experience?","Has he built native macOS apps?","Is he open to new opportunities?"],y=document.getElementById("app");y.innerHTML=`
  <header class="top">
    <div class="brand">Tibeb<span>Chat</span></div>
    <a class="gh" href="https://github.com/KaluBekalu/tibeb-rag-chat" target="_blank" rel="noopener">GitHub \u2197</a>
  </header>
  <main class="scroll" id="scroll">
    <div class="thread" id="thread">
      <div class="hero" id="hero">
        <h1>Ask me about <em>Kalkidan Aleme</em></h1>
        <p>Senior full-stack / product engineer \u2014 and founder of Tibeb Labs, his independent studio. RAG-powered answers grounded in his real resume, projects, and products. Recruiters welcome.</p>
        <div class="chips" id="chips"></div>
      </div>
    </div>
  </main>
  <footer class="composer">
    <form id="form">
      <textarea id="input" rows="1" maxlength="500" placeholder="Ask a question\u2026" aria-label="Your question"></textarea>
      <button id="send" type="submit" aria-label="Send">\u2191</button>
    </form>
    <div class="fine">Answers come only from the project's knowledge base \xB7 <a href="https://tibeblabs.com" target="_blank" rel="noopener">tibeblabs.com</a></div>
  </footer>
`;var l=document.getElementById("scroll"),E=document.getElementById("thread"),L=document.getElementById("hero"),w=document.getElementById("chips"),p=document.getElementById("form"),o=document.getElementById("input"),d=document.getElementById("send");for(let n of v){let e=document.createElement("button");e.type="button",e.className="chip",e.textContent=n,e.addEventListener("click",()=>{o.value=n,p.requestSubmit()}),w.appendChild(e)}function u(n,e,s){let t=document.createElement("div");if(t.className=`row ${n}`,n==="bot"){let i=document.createElement("div");i.className="avatar",i.textContent="\u1272",t.appendChild(i)}let r=document.createElement("div");r.className="body";let a=document.createElement("div");if(a.className="text",a.textContent=e,r.appendChild(a),s!=null&&s.length){let i=document.createElement("div");i.className="sources",i.innerHTML=s.map(c=>`<span>${c}</span>`).join(""),r.appendChild(i)}return t.appendChild(r),E.appendChild(t),l.scrollTop=l.scrollHeight,a}async function T(n){var s,t;L.style.display="none",u("user",n),d.disabled=!0;let e=u("bot","");e.classList.add("thinking"),e.textContent="Thinking\u2026";try{let r=await fetch(b,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:n})}),a=await r.json();if(e.classList.remove("thinking"),r.ok&&a.answer){if(e.innerHTML=m(a.answer),(s=a.sources)!=null&&s.length){let i=document.createElement("div");i.className="sources",i.innerHTML=a.sources.map(c=>`<span>${c}</span>`).join(""),e.parentElement.appendChild(i)}}else e.textContent=(t=a.error)!=null?t:"Sorry, something went wrong. Please try again."}catch{e.classList.remove("thinking"),e.textContent="Couldn't reach the server \u2014 please try again in a moment."}finally{d.disabled=!1,l.scrollTop=l.scrollHeight,o.focus()}}p.addEventListener("submit",n=>{n.preventDefault();let e=o.value.trim();!e||d.disabled||(o.value="",o.style.height="auto",T(e))});o.addEventListener("keydown",n=>{n.key==="Enter"&&!n.shiftKey&&(n.preventDefault(),p.requestSubmit())});o.addEventListener("input",()=>{o.style.height="auto",o.style.height=`${Math.min(o.scrollHeight,160)}px`});o.focus();})();
