"use strict";
(() => {
 const menu=document.getElementById("site-menu"),menuButton=document.getElementById("menu-toggle");
 const header=document.querySelector(".site-header");
 let previousScroll=window.scrollY;
 window.addEventListener("scroll",()=>{
  const current=Math.max(0,window.scrollY);
  const menuOpen=!!menu&&!menu.hidden;
  const searchOpen=!!document.getElementById("site-search")&&!document.getElementById("site-search").hidden;
  if(current<80||menuOpen||searchOpen||current<previousScroll-5){header?.classList.remove("header-hidden");}
  else if(current>previousScroll+5){header?.classList.add("header-hidden");}
  previousScroll=current;
 },{passive:true});
 const searchPanel=document.getElementById("site-search"),searchButton=document.getElementById("search-toggle");
 const search=document.getElementById("product-search"),clear=document.getElementById("search-clear");
 const searchResults=document.getElementById("search-results");
 menuButton?.addEventListener("click",()=>{menu.hidden=!menu.hidden;menuButton.setAttribute("aria-expanded",String(!menu.hidden));});
 menu?.querySelectorAll('a').forEach(a=>a.addEventListener("click",()=>{menu.hidden=true;menuButton.setAttribute("aria-expanded","false");}));
 searchButton?.addEventListener("click",()=>{searchPanel.hidden=!searchPanel.hidden;searchButton.setAttribute("aria-expanded",String(!searchPanel.hidden));if(!searchPanel.hidden)search.focus();});
 const list=document.getElementById("products"),select=document.getElementById("sort-order");

 const cards=Array.from(list?.children||[]),tabs=Array.from(document.querySelectorAll(".category-tab"));
 const allCards=Array.from(document.querySelectorAll(".product"));
 const status=document.getElementById("sort-status"),filterStatus=document.getElementById("filter-status");
 let category="all";
 if(cards.length&&document.getElementById("sort-control"))document.getElementById("sort-control").hidden=false;
 const norm=s=>(s||"").normalize("NFKC").toLocaleLowerCase("ja").trim();
 // Only the first 20 matching products are visible at first. Each tap adds 20,
 // with a hard cap of 100 per ranking list, without network requests.
 const pageSize=20, pageMax=100, pagination=new Map();
 function paginate(reset=false){
  document.querySelectorAll("#genre-ranking ol.products, #gunpla-products, #products").forEach(listEl=>{
   const eligible=Array.from(listEl.querySelectorAll(":scope > .product")).filter(el=>reset?!el.hidden:el.dataset.pageEligible==="1").slice(0,pageMax);
   if(reset)Array.from(listEl.querySelectorAll(":scope > .product")).forEach(el=>{el.dataset.pageEligible=String(!el.hidden?"1":"0");});
   let state=pagination.get(listEl);
   if(!state){
    const button=document.createElement("button");
    button.type="button";
    button.className="ranking-load-more";
    button.addEventListener("click",()=>{state.shown=Math.min(pageMax,state.shown+pageSize);paginate(false);updateNextButton();});
    listEl.insertAdjacentElement("afterend",button);
    state={shown:pageSize,button};
    pagination.set(listEl,state);
   }
   if(reset)state.shown=pageSize;
   Array.from(listEl.querySelectorAll(":scope > .product")).forEach(el=>{
    const index=eligible.indexOf(el);
    el.hidden=index<0||index>=state.shown;
   });
   const visible=Math.min(state.shown,eligible.length);
   state.button.hidden=visible>=eligible.length;
   state.button.textContent=`さらに${Math.min(pageSize,eligible.length-visible)}件表示（${visible}/${eligible.length}件）`;
   state.button.setAttribute("aria-label",`次の商品を表示。現在${visible}件、最大${eligible.length}件`);
  });
 }

 function render(){
  const q=norm(search?.value),mode=select?.value||"discount";
  const candidates=cards.filter(c=>(category==="all"||c.dataset.category===category)&&(!q||norm(c.textContent).includes(q)));
  const dealRank=(a,b)=>{
   const da=a.dataset.discount===""?null:Number(a.dataset.discount);
   const db=b.dataset.discount===""?null:Number(b.dataset.discount);
   if(da!==null&&db===null)return -1;
   if(da===null&&db!==null)return 1;
   if(da!==null&&db!==null){
    const byRate=db-da;
    if(byRate)return byRate;
    const savingsA=Number(a.dataset.saving||0),savingsB=Number(b.dataset.saving||0);
    if(savingsA!==savingsB)return savingsB-savingsA;
   }
   return Number(a.dataset.price)-Number(b.dataset.price);
  };
  const ordered=candidates.sort((a,b)=>{
   if(mode==="price-asc")return Number(a.dataset.price)-Number(b.dataset.price)||dealRank(a,b);
   if(mode==="price-desc")return Number(b.dataset.price)-Number(a.dataset.price)||dealRank(a,b);
   return dealRank(a,b);
  }).slice(0,pageMax);
  cards.forEach(c=>{c.hidden=true});
  ordered.forEach(c=>{c.hidden=false;list?.appendChild(c)});
  const visible=new Set(ordered);
  let total=ordered.length;
  allCards.filter(c=>!cards.includes(c)&&!c.closest("#gunpla-products")).forEach(c=>{const show=!q||norm(c.textContent).includes(q);c.hidden=!show;if(show)total++});
  const gunplaCards=Array.from(document.querySelectorAll("#gunpla-products .product"));
  const grade=document.querySelector(".gunpla-tab.active")?.dataset.grade||"all";
  let gunplaVisible=0;
  gunplaCards.forEach(c=>{
   const matchesGrade=grade==="all"||c.dataset.category===grade+" ガンプラ";
   const show=matchesGrade&&(!q||norm(c.textContent).includes(q));
   c.hidden=!show;
   if(show)gunplaVisible++;
  });
  const gunplaStatus=document.getElementById("gunpla-filter-status");
  if(gunplaStatus)gunplaStatus.textContent=`${grade==="all"?"ガンプラ全体":grade}・${gunplaVisible}商品を表示中`;

  if(filterStatus)filterStatus.textContent=`${category==="all"?"すべてのジャンル":category}・${ordered.length}商品を表示中`;
  if(searchResults)searchResults.textContent=q?`検索結果：${total+gunplaVisible}件`:"";
  paginate(true);
  if(status)status.textContent="表示を更新しました";
 }
 select?.addEventListener("change",()=>{render();updateNextButton()});
 document.querySelectorAll(".gunpla-tab").forEach(tab=>tab.addEventListener("click",()=>{
  document.querySelectorAll(".gunpla-tab").forEach(b=>{const active=b===tab;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))});
  render();updateNextButton();
 }));
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
 // Genre-specific gacha: draw only from this page's verified discount offers.
 const draw=document.getElementById("gacha-draw");
 const source=document.getElementById("gacha-offers");
 if(draw&&source){
  let offers=[];
  try{offers=JSON.parse(source.textContent||"[]");}catch(_){offers=[];}
  const stage=document.getElementById("treasure-gacha");
  const dialog=document.getElementById("gacha-dialog");
  const closeButton=document.getElementById("gacha-close");
  const reveal=document.getElementById("gacha-reveal");
  const capsule=document.getElementById("gacha-capsule");
  const result=document.getElementById("gacha-result");
  const status=document.getElementById("gacha-status");
  const yen=new Intl.NumberFormat("ja-JP");
  const rarityLabel={rainbow:"超大吉",gold:"大吉",silver:"中吉",bronze:"小吉"};
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  if(!offers.length){draw.disabled=true;}
  closeButton?.addEventListener("click",()=>dialog.close());
  dialog?.addEventListener("click",event=>{if(event.target===dialog)dialog.close();});
  dialog?.addEventListener("close",()=>{draw.focus({preventScroll:true});});
  let running=false;
  draw.addEventListener("click",()=>{
   if(running||!offers.length)return;
   running=true;
   draw.disabled=true;
   const item=offers[Math.floor(Math.random()*offers.length)];
   const rarity=item.rarity;
   stage.classList.add("gacha-spinning");
   stage.classList.remove("gacha-finished");
   reveal.hidden=false;
   result.hidden=true;
   result.replaceChildren();
   result.className="gacha-result "+rarity;
   capsule.className="gacha-capsule "+rarity;
   status.textContent="おみくじを引いています…";
   const show=()=>{
    stage.classList.remove("gacha-spinning");
    stage.classList.add("gacha-finished");
    const label=document.createElement("p");
    label.className="gacha-result-rarity "+rarity;
    label.textContent=rarityLabel[rarity]||"当たり";
    const picture=document.createElement("div");
    picture.className="gacha-result-picture";
    if(item.image_url){
     const photo=document.createElement("img");
     photo.className="gacha-result-image";
     photo.src=item.image_url;
     photo.alt=item.name;
     photo.loading="lazy";
     photo.decoding="async";
     photo.referrerPolicy="no-referrer";
     photo.addEventListener("error",()=>{picture.textContent="画像なし";picture.classList.add("image-fallback");});
     picture.appendChild(photo);
    }else{
     picture.textContent="画像なし";
     picture.classList.add("image-fallback");
    }
    const title=document.createElement("h3");
    title.textContent=item.name;
    const shop=document.createElement("p");
    shop.className="gacha-result-shop";
    shop.textContent=item.shop;
    const saving=document.createElement("p");
    saving.className="gacha-result-saving";
    saving.textContent=item.discount+"%OFF・"+yen.format(item.saving)+"円お得";
    const price=document.createElement("p");
    price.className="gacha-result-price";
    price.textContent="¥"+yen.format(item.price)+"（通常価格 ¥"+yen.format(item.normal)+"）";
    const link=document.createElement("a");
    link.className="gacha-result-link";
    link.textContent="Yahoo!ショッピングで確認 ↗";
    link.href=item.url;
    link.setAttribute("data-umami-event","product-click");
    link.setAttribute("data-umami-event-store","yahoo");
    link.setAttribute("data-umami-event-category",String(item.category||"").slice(0,80));
    link.setAttribute("data-umami-event-product",String(item.name||"").slice(0,100));
    link.setAttribute("data-umami-event-placement","omikuji");
    link.target="_blank";
    link.rel="noopener noreferrer";
    result.append(label,picture,title,shop,saving,price,link);
    result.hidden=false;
    // A native modal places the result in the viewport without moving the page.
    // Escape, the close button and backdrop click all dismiss the result.
    dialog.showModal();
    closeButton.focus({preventScroll:true});
    status.textContent="今日のお宝商品が見つかりました！";
    draw.disabled=false;
    running=false;
    draw.textContent="もう一度占う！";
   };
   if(reduced.matches){show();}else{window.setTimeout(show,1700);}
  });
 }

})();
