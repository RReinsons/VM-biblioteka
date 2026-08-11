(() => {
  "use strict";
  const cfg = window.VM_CONFIG || {};
  const state = {books:[], filtered:[], pins:new Set(JSON.parse(localStorage.getItem("vm-pins")||"[]")), page:1, pageSize:Number(localStorage.getItem("vm-page-size")||cfg.pageSize||12), view:localStorage.getItem("vm-view")||"grid", lang:localStorage.getItem("vm-lang")||"lv"};
  const $ = s => document.querySelector(s);
  const tr = {
    lv:{books:"Grāmatas",about:"Par bibliotēku",search:"Meklēt",searchPlaceholder:"Meklēt pēc nosaukuma, autora, tēmas, atslēgvārda…",pinNote:"Piespraustās grāmatas tiek rādītas vispirms.",clearPins:"Noņemt piespraustās grāmatas",sortBy:"Kārtot pēc:",perPage:"Grāmatas lapā:",aboutText:"Valodu Mājas katalogā apkopotas grāmatas par valodu apguvi, mācīšanu un daudzvalodību. Izmantojiet meklētāju un filtrus, lai atrastu piemērotāko izdevumu.",author:"Autors",year:"Gads",language:"Valoda",topic:"Tēma",copies:"Eksemplāri",available:"Pieejams",noResults:"Neviena grāmata neatbilst izvēlētajiem filtriem.",loading:"Ielādē katalogu…",results:n=>`${n} grāmatas`,prev:"Iepriekšējā",next:"Nākamā",all:"Visi",filterTopic:"Tēma",filterLanguage:"Valoda",filterYear:"Gads",sortNewest:"Jaunākie vispirms",sortOldest:"Vecākie vispirms",sortTitle:"Nosaukums A–Z",sortAuthor:"Autors A–Z",pin:"Piespraust",unpin:"Atspraust"},
    en:{books:"Books",about:"About the library",search:"Search",searchPlaceholder:"Search by title, author, topic or keyword…",pinNote:"Pinned books are shown first.",clearPins:"Remove pinned books",sortBy:"Sort by:",perPage:"Books per page:",aboutText:"The Valodu Māja catalogue brings together books on language learning, teaching and multilingualism. Use search and filters to find a suitable title.",author:"Author",year:"Year",language:"Language",topic:"Topic",copies:"Copies",available:"Available",noResults:"No books match the selected filters.",loading:"Loading catalogue…",results:n=>`${n} books`,prev:"Previous",next:"Next",all:"All",filterTopic:"Topic",filterLanguage:"Language",filterYear:"Year",sortNewest:"Newest first",sortOldest:"Oldest first",sortTitle:"Title A–Z",sortAuthor:"Author A–Z",pin:"Pin",unpin:"Unpin"}
  };
  const t = k => tr[state.lang][k];
  const esc = s => String(s??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const placeholder = title => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 340"><rect width="240" height="340" fill="#f3ede8"/><path d="M22 25h196v290H22z" fill="none" stroke="#fa4b16" stroke-width="4"/><text x="120" y="145" text-anchor="middle" font-family="sans-serif" font-size="17" fill="#444">VALODU MĀJA</text><text x="120" y="180" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#777">${esc(title).slice(0,24)}</text></svg>`)}`;

  async function load(){
    $("#status").textContent=t("loading");
    try{
      if(!cfg.apiUrl) throw new Error("sample");
      const res=await fetch(`${cfg.apiUrl}${cfg.apiUrl.includes("?")?"&":"?"}action=books`);
      if(!res.ok) throw new Error(`API ${res.status}`);
      const json=await res.json(); if(!json.ok) throw new Error(json.error||"API error");
      state.books=json.books;
    }catch(err){state.books=window.VM_SAMPLE_BOOKS||[]; if(err.message!=="sample") console.warn("Using sample data:",err);}
    buildFilters(); apply(); applyLanguage();
  }
  const pinSvg = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.2 3.5h7.6l-1 5.1 3.2 3.2v1.7H6v-1.7l3.2-3.2-1-5.1Z"/><path d="M12 13.5V21"/></svg>`;
  function buildFilters(){
    const previous={}; document.querySelectorAll("#filters select").forEach(s=>previous[s.dataset.key]=s.value);
    const defs=[["topic",t("filterTopic")],["language",t("filterLanguage")],["year",t("filterYear")]];
    $("#filters").innerHTML=defs.map(([key,label])=>{const lastValue=key==="language"?"other":key==="topic"?"annet":"";const vals=[...new Set(state.books.map(b=>b[key]).filter(Boolean))].sort((a,b)=>{const aLast=String(a).trim().toLowerCase()===lastValue,bLast=String(b).trim().toLowerCase()===lastValue;if(aLast!==bLast)return aLast?1:-1;return String(a).localeCompare(String(b),"lv",{numeric:true})});return `<div class="filter"><label for="filter-${key}">${label}</label><select id="filter-${key}" data-key="${key}"><option value="">${t("all")}</option>${vals.map(v=>`<option>${esc(v)}</option>`).join("")}</select></div>`}).join("");
    document.querySelectorAll("#filters select").forEach(s=>{if(previous[s.dataset.key])s.value=previous[s.dataset.key]});
    $("#filters").onchange=()=>{state.page=1;apply()};
  }
  function apply(){
    const q=$("#query").value.trim().toLocaleLowerCase("lv"); const selected={}; document.querySelectorAll("#filters select").forEach(s=>selected[s.dataset.key]=s.value);
    state.filtered=state.books.filter(b=>(!q||Object.values(b).join(" ").toLocaleLowerCase("lv").includes(q))&&Object.entries(selected).every(([k,v])=>!v||String(b[k])===v));
    const sort=$("#sort").value; state.filtered.sort((a,b)=>{const pinned=Number(state.pins.has(b.id))-Number(state.pins.has(a.id));if(pinned)return pinned;if(sort==="newest")return (+b.year||0)-(+a.year||0);if(sort==="oldest")return (+a.year||0)-(+b.year||0);return String(a[sort]||a.title).localeCompare(String(b[sort]||b.title),"lv")}); render();
  }
  function render(){
    $("#status").textContent=t("results")(state.filtered.length); const size=state.pageSize, pages=Math.max(1,Math.ceil(state.filtered.length/size)); state.page=Math.min(state.page,pages); const rows=state.filtered.slice((state.page-1)*size,state.page*size);
    $("#gridView").classList.toggle("active",state.view==="grid"); $("#listView").classList.toggle("active",state.view==="list");
    if(!rows.length){$("#results").innerHTML=`<div class="empty">${t("noResults")}</div>`;$("#pagination").innerHTML="";return;}
    $("#results").innerHTML=state.view==="grid"?`<div class="cards">${rows.map(card).join("")}</div>`:table(rows);
    document.querySelectorAll(".cover").forEach(img=>img.onerror=()=>{img.onerror=null;img.src=placeholder(img.dataset.title)});
    document.querySelectorAll(".pin").forEach(btn=>btn.addEventListener("click",()=>togglePin(btn.dataset.id)));
    pagination(pages);
  }
  function pinButton(b){return `<button class="pin ${state.pins.has(b.id)?"active":""}" data-id="${esc(b.id)}" aria-label="${state.pins.has(b.id)?t("unpin"):t("pin")} ${esc(b.title)}" aria-pressed="${state.pins.has(b.id)}">${pinSvg}</button>`}
  function card(b){const cover=b.cover||placeholder(b.title);return `<article class="book-card">${pinButton(b)}<img class="cover" src="${esc(cover)}" data-title="${esc(b.title)}" alt="${esc(b.title)} vāks" loading="lazy"><div class="card-copy"><h2>${esc(b.title)}</h2><p class="author">${esc(b.author||"—")}</p>${b.level?`<span class="level tag">${esc(b.level)}</span>`:""}<dl><dt>${t("language")}:</dt><dd>${esc(b.language||"—")}</dd><dt>${t("topic")}:</dt><dd>${esc(b.topic||"—")}</dd><dt>${t("year")}:</dt><dd>${esc(b.year||"—")}</dd></dl><p class="availability">${t("available")}: ${esc(b.copies||"—")}</p></div></article>`}
  function table(rows){return `<div style="overflow:auto"><table class="list-table"><thead><tr><th>${t("books")}</th><th>${t("author")}</th><th>${t("year")}</th><th>${t("topic")}</th><th>${t("language")}</th><th>${t("copies")}</th><th></th></tr></thead><tbody>${rows.map(b=>`<tr><td><div class="list-title"><img class="cover" src="${esc(b.cover||placeholder(b.title))}" data-title="${esc(b.title)}" alt=""><span>${esc(b.title)}</span></div></td><td>${esc(b.author||"—")}</td><td>${esc(b.year||"—")}</td><td>${esc(b.topic||"—")}</td><td>${esc(b.language||"—")}</td><td>${esc(b.copies||"—")}</td><td>${pinButton(b)}</td></tr>`).join("")}</tbody></table></div>`}
  function pagination(pages){const nav=$("#pagination"); if(pages<=1){nav.innerHTML="";return;}let html=`<button data-page="${state.page-1}" ${state.page===1?"disabled":""}>‹ ${t("prev")}</button>`;for(let p=1;p<=pages;p++)if(p===1||p===pages||Math.abs(p-state.page)<=1)html+=`<button data-page="${p}" class="${p===state.page?"active":""}">${p}</button>`;else if(p===2||p===pages-1)html+=`<span>…</span>`;html+=`<button data-page="${state.page+1}" ${state.page===pages?"disabled":""}>${t("next")} ›</button>`;nav.innerHTML=html;nav.querySelectorAll("button").forEach(b=>b.onclick=()=>{state.page=+b.dataset.page;render();document.querySelector("#catalog").scrollIntoView()})}
  function togglePin(id){state.pins.has(id)?state.pins.delete(id):state.pins.add(id);localStorage.setItem("vm-pins",JSON.stringify([...state.pins]));apply()}
  function setView(v){state.view=v;localStorage.setItem("vm-view",v);render()}
  function applyLanguage(){document.documentElement.lang=state.lang;document.querySelectorAll("[data-i18n]").forEach(el=>el.textContent=t(el.dataset.i18n));$("#langToggle").textContent=state.lang==="lv"?"LV / EN":"EN / LV";$("#query").placeholder=t("searchPlaceholder");const sort=$("#sort"),value=sort.value;sort.innerHTML=`<option value="newest">${t("sortNewest")}</option><option value="oldest">${t("sortOldest")}</option><option value="title">${t("sortTitle")}</option><option value="author">${t("sortAuthor")}</option>`;sort.value=value;buildFilters();document.querySelector(".pin-note-icon").innerHTML=pinSvg;apply()}
  $("#searchForm").onsubmit=e=>{e.preventDefault();state.page=1;apply()}; $("#query").addEventListener("input",()=>{state.page=1;apply()}); $("#sort").onchange=apply; $("#pageSize").value=String(state.pageSize); $("#pageSize").onchange=e=>{state.pageSize=Number(e.target.value);state.page=1;localStorage.setItem("vm-page-size",state.pageSize);render()}; $("#gridView").onclick=()=>setView("grid"); $("#listView").onclick=()=>setView("list"); $("#clearPins").onclick=()=>{state.pins.clear();localStorage.removeItem("vm-pins");apply()};
  $("#themeToggle").onclick=()=>{const next=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=next;localStorage.setItem("vm-theme",next)};document.documentElement.dataset.theme=localStorage.getItem("vm-theme")||"light";
  let font=Number(localStorage.getItem("vm-font")||16); const setFont=n=>{font=Math.max(14,Math.min(20,n));document.documentElement.style.setProperty("--base",`${font}px`);localStorage.setItem("vm-font",font)};setFont(font);$("#fontDown").onclick=()=>setFont(font-1);$("#fontUp").onclick=()=>setFont(font+1);
  $("#langToggle").onclick=()=>{state.lang=state.lang==="lv"?"en":"lv";localStorage.setItem("vm-lang",state.lang);applyLanguage()}; load();
})();
