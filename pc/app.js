"use strict";
(() => {
 const menu=document.getElementById("site-menu"),menuButton=document.getElementById("menu-toggle");
 const searchPanel=document.getElementById("site-search"),searchButton=document.getElementById("search-toggle");
 const search=document.getElementById("product-search"),clear=document.getElementById("search-clear");
 const searchResults=document.getElementById("search-results");
 menuButton?.addEventListener("click",()=>{menu.hidden=!menu.hidden;menuButton.setAttribute("aria-expanded",String(!menu.hidden));});
 menu?.querySelectorAll('a').forEach(a=>a.addEventListener("click",()=>{menu.hidden=true;menuButton.setAttribute("aria-expanded","false");}));
 searchButton?.addEventListener("click",()=>{searchPanel.hidden=!searchPanel.hidden;searchButton.setAttribute("aria-expanded",String(!searchPanel.hidden));if(!searchPanel.hidden)search.focus();});
 const list=document.getElementById("products"),select=document.getElementById("sort-order");
 if(!list)return;
 const cards=Array.from(list.children),tabs=Array.from(document.querySelectorAll(".category-tab"));
 const allCards=Array.from(document.querySelectorAll(".product"));
 const status=document.getElementById("sort-status"),filterStatus=document.getElementById("filter-status");
 let category="all";
 if(cards.length)document.getElementById("sort-control").hidden=false;
 const norm=s=>(s||"").normalize("NFKC").toLocaleLowerCase("ja").trim();
 function render(){
  const q=norm(search?.value),mode=select.value;
  const ordered=cards.filter(c=>(category==="all"||c.dataset.category===category)&&(!q||norm(c.textContent).includes(q))).sort((a,b)=>{
   const diff=Number(b.dataset.score)-Number(a.dataset.score);
   if(mode==="discount")return (Number(b.dataset.discount||-1)-Number(a.dataset.discount||-1))||diff;
   if(mode==="price-asc")return Number(a.dataset.price)-Number(b.dataset.price)||diff;
   if(mode==="price-desc")return Number(b.dataset.price)-Number(a.dataset.price)||diff;
   return diff;
  });
  cards.forEach(c=>{c.hidden=true});
  ordered.forEach(c=>{c.hidden=false;list.appendChild(c)});
  const visible=new Set(ordered);
  let total=ordered.length;
  allCards.filter(c=>!cards.includes(c)).forEach(c=>{const show=!q||norm(c.textContent).includes(q);c.hidden=!show;if(show)total++});
  document.querySelectorAll(".gunpla-grade").forEach(section=>{section.hidden=!!q&&!Array.from(section.querySelectorAll(".product")).some(c=>!c.hidden)});
  filterStatus.textContent=`${category==="all"?"すべてのジャンル":category}・${ordered.length}商品を表示中`;
  if(searchResults)searchResults.textContent=q?`検索結果：${total}件`:"";
  if(status)status.textContent="表示を更新しました";
 }
 select.addEventListener("change",()=>{render();updateNextButton()});
 tabs.forEach(tab=>tab.addEventListener("click",()=>{category=tab.dataset.category;tabs.forEach(b=>{const active=b===tab;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))});render();updateNextButton()}));
 search?.addEventListener("input",()=>{render();updateNextButton()});
 clear?.addEventListener("click",()=>{search.value="";render();updateNextButton();search.focus()});
 render();

 // Jump to the next visible product in document order, across ranking sections.
 const nextButton=document.getElementById("next-product");
 const visibleProducts=()=>Array.from(document.querySelectorAll(".product")).filter(el=>!el.hidden&&!el.closest("[hidden]")&&el.getClientRects().length);
 function updateNextButton(){
  if(!nextButton)return;
  const visible=visibleProducts();
  const y=window.scrollY+window.innerHeight*.32;
  nextButton.hidden=visible.length<2||visible.every(el=>el.getBoundingClientRect().top+window.scrollY<=y);
 }
 nextButton?.addEventListener("click",()=>{
  const visible=visibleProducts();
  const current=window.scrollY+window.innerHeight*.25;
  const next=visible.find(el=>el.getBoundingClientRect().top+window.scrollY>current+12);
  if(next){next.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"start"});}
  updateNextButton();
 });
 window.addEventListener("scroll",updateNextButton,{passive:true});
 window.addEventListener("resize",updateNextButton);
 updateNextButton();
})();
