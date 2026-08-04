(()=>{var h="/api/chat",u=["What products has Tibeb Labs built?","What's Kalkidan's experience with AI and LLMs?","How does pricing work at Tibeb Labs?","Has Kalkidan worked at large companies?"],b=document.getElementById("app");b.innerHTML=`
  <header class="top">
    <div class="brand">Tibeb<span>Chat</span></div>
    <a class="gh" href="https://github.com/KaluBekalu/tibeb-rag-chat" target="_blank" rel="noopener">GitHub \u2197</a>
  </header>
  <main class="scroll" id="scroll">
    <div class="thread" id="thread">
      <div class="hero" id="hero">
        <h1>Ask me about <em>Tibeb Labs</em><br>&amp; Kalkidan Aleme</h1>
        <p>RAG-powered answers grounded in real docs \u2014 projects, services, pricing, skills, and experience. Recruiters welcome.</p>
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
`;var l=document.getElementById("scroll"),g=document.getElementById("thread"),v=document.getElementById("hero"),E=document.getElementById("chips"),m=document.getElementById("form"),a=document.getElementById("input"),c=document.getElementById("send");for(let t of u){let e=document.createElement("button");e.type="button",e.className="chip",e.textContent=t,e.addEventListener("click",()=>{a.value=t,m.requestSubmit()}),E.appendChild(e)}function p(t,e,i){let o=document.createElement("div");if(o.className=`row ${t}`,t==="bot"){let n=document.createElement("div");n.className="avatar",n.textContent="\u1272",o.appendChild(n)}let r=document.createElement("div");r.className="body";let s=document.createElement("div");if(s.className="text",s.textContent=e,r.appendChild(s),i!=null&&i.length){let n=document.createElement("div");n.className="sources",n.innerHTML=i.map(d=>`<span>${d}</span>`).join(""),r.appendChild(n)}return o.appendChild(r),g.appendChild(o),l.scrollTop=l.scrollHeight,s}async function f(t){var i,o;v.style.display="none",p("user",t),c.disabled=!0;let e=p("bot","");e.classList.add("thinking"),e.textContent="Thinking\u2026";try{let r=await fetch(h,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:t})}),s=await r.json();if(e.classList.remove("thinking"),r.ok&&s.answer){if(e.textContent=s.answer,(i=s.sources)!=null&&i.length){let n=document.createElement("div");n.className="sources",n.innerHTML=s.sources.map(d=>`<span>${d}</span>`).join(""),e.parentElement.appendChild(n)}}else e.textContent=(o=s.error)!=null?o:"Sorry, something went wrong. Please try again."}catch{e.classList.remove("thinking"),e.textContent="Couldn't reach the server \u2014 please try again in a moment."}finally{c.disabled=!1,l.scrollTop=l.scrollHeight,a.focus()}}m.addEventListener("submit",t=>{t.preventDefault();let e=a.value.trim();!e||c.disabled||(a.value="",a.style.height="auto",f(e))});a.addEventListener("keydown",t=>{t.key==="Enter"&&!t.shiftKey&&(t.preventDefault(),m.requestSubmit())});a.addEventListener("input",()=>{a.style.height="auto",a.style.height=`${Math.min(a.scrollHeight,160)}px`});a.focus();})();
