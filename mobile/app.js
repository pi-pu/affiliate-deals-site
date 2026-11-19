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
 const searchResults=document.getElementById("search-results"),globalMatches=document.getElementById("global-search-matches");
 const localMain=document.getElementById("ranking-filter-input"),localGenre=document.getElementById("genre-filter-input");
 const localGunpla=document.getElementById("gunpla-filter-input"),localAmazon=document.getElementById("amazon-filter-input");
 menuButton?.addEventListener("click",()=>{menu.hidden=!menu.hidden;menuButton.setAttribute("aria-expanded",String(!menu.hidden));});
 menu?.querySelectorAll('a').forEach(a=>a.addEventListener("click",()=>{menu.hidden=true;menuButton.setAttribute("aria-expanded","false");}));
 searchButton?.addEventListener("click",()=>{searchPanel.hidden=!searchPanel.hidden;searchButton.setAttribute("aria-expanded",String(!searchPanel.hidden));if(!searchPanel.hidden){document.getElementById("gacha-popover")?.setAttribute("hidden","");document.getElementById("gacha-toggle")?.setAttribute("aria-expanded","false");search.focus();}});
 document.getElementById("search-close")?.addEventListener("click",()=>{searchPanel.hidden=true;searchButton?.setAttribute("aria-expanded","false");searchButton?.focus();});
 // Select a parent category without creating a long, sideways child-tab list.
 document.querySelectorAll(".genre-group-button").forEach(button=>{
  button.addEventListener("click",()=>{
   const group=button.dataset.group;
   showCurrentGroup(button);
   document.querySelectorAll(".genre-group-button").forEach(tab=>{
    const active=tab===button;
    tab.classList.toggle("is-current",active);
    tab.setAttribute("aria-expanded",String(active));
   });
   document.querySelectorAll(".genre-child-row").forEach(row=>{
    row.hidden=row.dataset.genreChild!==group;
   });
  });
 });
 // Keep the selected parent category visible in the one-row scroller,
 // including when opening a deep-linked page such as kids fashion.
 const genreStrip=document.querySelector(".genre-group-buttons");
 const showCurrentGroup=button=>{
  if(!genreStrip||!button)return;
  const preferred=button.offsetLeft-genreStrip.offsetLeft-(genreStrip.clientWidth-button.offsetWidth)/2;
  genreStrip.scrollLeft=Math.max(0,preferred);
 };
 showCurrentGroup(document.querySelector(".genre-group-button.is-current"));
 // Header omikuji is a compact, accessible popover rather than a block
 // pushing the first ranking below the fold.
 const gachaToggle=document.getElementById("gacha-toggle");
 const gachaPopover=document.getElementById("gacha-popover");
 const gachaClose=document.getElementById("gacha-popover-close");
 const setGachaOpen=open=>{
  if(!gachaPopover||!gachaToggle)return;
  gachaPopover.hidden=!open;
  gachaToggle.setAttribute("aria-expanded",String(open));
  if(open){searchPanel&&(searchPanel.hidden=true);searchButton?.setAttribute("aria-expanded","false");}
 };
 gachaToggle?.addEventListener("click",()=>{
  const next=!!gachaPopover?.hidden;
  setGachaOpen(next);
  if(next)gachaClose?.focus({preventScroll:true});
 });
 gachaClose?.addEventListener("click",()=>{setGachaOpen(false);gachaToggle?.focus({preventScroll:true});});
 document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&gachaPopover&&!gachaPopover.hidden){
   setGachaOpen(false);gachaToggle?.focus({preventScroll:true});
  }
 });
 document.addEventListener("click",event=>{
  if(!gachaPopover||gachaPopover.hidden)return;
  if(gachaPopover.contains(event.target)||gachaToggle?.contains(event.target))return;
  setGachaOpen(false);
 });
 const figureCompareList=document.getElementById("figure-comparison-list");
 const figureCompareButtons=Array.from(document.querySelectorAll("[data-figure-sort]"));
 figureCompareButtons.forEach(button=>button.addEventListener("click",()=>{
  if(!figureCompareList)return;
  const mode=button.dataset.figureSort;
  const entries=Array.from(figureCompareList.querySelectorAll(".figure-compare-entry"));
  entries.sort((a,b)=>mode==="cheap"
   ? Number(a.dataset.cheapest)-Number(b.dataset.cheapest)||Number(b.dataset.spread)-Number(a.dataset.spread)
   : Number(b.dataset.spread)-Number(a.dataset.spread)||Number(a.dataset.cheapest)-Number(b.dataset.cheapest));
  entries.forEach((entry,i)=>{
   const rank=entry.querySelector(".figure-compare-rank");
   if(rank)rank.textContent="第"+(i+1)+"位";
   figureCompareList.appendChild(entry);
  });
  figureCompareButtons.forEach(control=>{
   const active=control===button;
   control.classList.toggle("is-current",active);
   control.setAttribute("aria-pressed",String(active));
  });
 }));
 const figureTabs=Array.from(document.querySelectorAll(".figure-view-tab"));
 const figurePanels=Array.from(document.querySelectorAll(".figure-view-panel"));
 const switchFigureView=view=>{
  figureTabs.forEach(tab=>{
   const selected=tab.dataset.figureView===view;
   tab.classList.toggle("is-current",selected);
   tab.setAttribute("aria-selected",String(selected));
  });
  figurePanels.forEach(panel=>{panel.hidden=panel.id!==("figure-"+view+"-panel");});
  // Restore all cards before recomputing the visible 20.
  render();
 };
 figureTabs.forEach(tab=>tab.addEventListener("click",()=>switchFigureView(tab.dataset.figureView)));
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
   if(listEl.closest(".figure-view-panel[hidden]")){const old=pagination.get(listEl);if(old)old.button.hidden=true;return;}
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
  const q=norm(localMain?.value),genreQ=norm(localGenre?.value),amazonQ=norm(localAmazon?.value),gunplaQ=norm(localGunpla?.value),mode=select?.value||"discount";
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
  // Local filters are scoped: changing one ranking never hides other sections.
  const genreCards=Array.from(document.querySelectorAll("#genre-ranking .figure-view-panel:not([hidden]) .product, #genre-ranking > ol.products .product, #genre-ranking .fashion-category .product"));
  let genreVisible=0;
  genreCards.forEach(c=>{const show=!genreQ||norm(c.textContent).includes(genreQ);c.hidden=!show;if(show)genreVisible++});
  const genreStatus=document.getElementById("genre-filter-status");
  if(genreStatus)genreStatus.textContent=genreQ?`このランキング内で${genreVisible}件が一致`:"";
  const amazonCards=Array.from(document.querySelectorAll("#amazon-picks .product"));
  let amazonVisible=0;
  amazonCards.forEach(c=>{const show=!amazonQ||norm(c.textContent).includes(amazonQ);c.hidden=!show;if(show)amazonVisible++});
  const amazonStatus=document.getElementById("amazon-filter-status");
  if(amazonStatus)amazonStatus.textContent=amazonQ?`Amazon商品${amazonVisible}件が一致`:"";
  const gunplaCards=Array.from(document.querySelectorAll("#gunpla-products .product"));
  const grade=document.querySelector(".gunpla-tab.active")?.dataset.grade||"all";
  const gunplaMode=document.querySelector(".gunpla-mode.active")?.dataset.mode||"all";
  let gunplaVisible=0;
  gunplaCards.forEach(c=>{
   const matchesGrade=grade==="all"||c.dataset.category===grade+" ガンプラ";
   const matchesMode=gunplaMode==="all"||
    (gunplaMode==="dropped"&&c.dataset.gunplaDropped==="true")||
    (gunplaMode==="under"&&c.dataset.gunplaTier==="under")||
    (gunplaMode==="near"&&(c.dataset.gunplaTier==="under"||c.dataset.gunplaTier==="near"));
   const show=matchesGrade&&matchesMode&&(!gunplaQ||norm(c.textContent).includes(gunplaQ));
   c.hidden=!show;
   if(show)gunplaVisible++;
  });
  const gunplaStatus=document.getElementById("gunpla-filter-status");
  if(gunplaStatus)gunplaStatus.textContent=`${grade==="all"?"ガンプラ全体":grade}・${gunplaVisible}商品が条件に一致` + (gunplaVisible===0?"（条件に一致する確認済み商品はありません）":"");

  if(filterStatus)filterStatus.textContent=`${category==="all"?"すべてのジャンル":category}・${ordered.length}商品を表示中`;
  paginate(true);
  if(status)status.textContent="表示を更新しました";
 }
 select?.addEventListener("change",()=>{render();updateNextButton()});
 document.querySelectorAll(".gunpla-mode").forEach(tab=>tab.addEventListener("click",()=>{
  document.querySelectorAll(".gunpla-mode").forEach(b=>{const active=b===tab;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))});
  render();updateNextButton();
 }));
 document.querySelectorAll(".gunpla-tab").forEach(tab=>tab.addEventListener("click",()=>{
  document.querySelectorAll(".gunpla-tab").forEach(b=>{const active=b===tab;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))});
  render();updateNextButton();
 }));
 tabs.forEach(tab=>tab.addEventListener("click",()=>{category=tab.dataset.category;tabs.forEach(b=>{const active=b===tab;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))});render();updateNextButton()}));
 [localMain,localGenre,localGunpla,localAmazon].forEach(input=>input?.addEventListener("input",()=>{render();updateNextButton()}));
 document.querySelectorAll(".ranking-filter-clear").forEach(button=>button.addEventListener("click",()=>{
  const input=document.getElementById(button.dataset.target);
  if(!input)return;
  input.value="";render();updateNextButton();input.focus();
 }));
 // A global search index is generated alongside all public ranking pages.
 // It contains only product names and same-site category paths, not affiliate URLs.
 const searchCategories=["PC・スマホ","暮らし","ゲーム","ガンプラ","トレカ","家電","ファッション","Amazon"];
 let catalog=null;
 let catalogError=false;
 const safePath=path=>typeof path==="string"&&/^[a-z0-9-]+\.html$/.test(path);
 const searchLink=(entry,label,q)=>{
  const a=document.createElement("a");
  a.className="global-search-result";
  a.href="./"+entry.path+(q?"?q="+encodeURIComponent(q):"");
  const title=document.createElement("strong");
  title.textContent=label;
  a.appendChild(title);
  if(entry.category){const sub=document.createElement("small");sub.textContent=entry.category+(Number.isInteger(entry.price)?`・¥${entry.price.toLocaleString("ja-JP")}`:"");a.appendChild(sub);}
  return a;
 };
 function globalRender(){
  if(!globalMatches)return;
  globalMatches.replaceChildren();
  const q=norm(search?.value);
  if(!q){searchResults.textContent="ジャンルや商品名を入力してください。";return;}
  if(catalogError){searchResults.textContent="検索データを読み込めませんでした。時間をおいて再度お試しください。";return;}
  if(!catalog){searchResults.textContent="検索データを読み込み中…";return;}
  const tokens=q.split(/\s+/).filter(Boolean);
  const matches=entry=>tokens.every(token=>norm((entry.name||"")+" "+(entry.category||"")).includes(token));
  const genres=catalog.genres.filter(entry=>safePath(entry.path)&&matches(entry));
  const products=catalog.products.filter(entry=>safePath(entry.path)&&matches(entry));
  searchResults.textContent=`ジャンル ${genres.length}件・商品 ${products.length}件`+(products.length>30?"（商品は先頭30件を表示）":"");
  if(!genres.length&&!products.length){const p=document.createElement("p");p.textContent="一致するジャンル・商品がありません。別のキーワードをお試しください。";globalMatches.appendChild(p);return;}
  if(genres.length){
   const h=document.createElement("h3");h.textContent="ジャンル";globalMatches.appendChild(h);
   genres.forEach(entry=>globalMatches.appendChild(searchLink(entry,entry.name,"")));
  }
  if(products.length){
   const h=document.createElement("h3");h.textContent="掲載商品";globalMatches.appendChild(h);
   products.slice(0,30).forEach(entry=>globalMatches.appendChild(searchLink(entry,entry.name,search.value.trim())));
  }
 }
 search?.addEventListener("input",globalRender);
 clear?.addEventListener("click",()=>{search.value="";globalRender();search.focus()});
 // Search within the same directory even from mobile/pc preview versions.
 fetch("./search-index.json",{cache:"no-cache"}).then(response=>{
  if(!response.ok)throw new Error("search index unavailable");
  return response.json();
 }).then(data=>{
  if(!data||!Array.isArray(data.genres)||!Array.isArray(data.products))throw new Error("invalid search index");
  catalog={genres:data.genres,products:data.products};globalRender();
 }).catch(()=>{catalogError=true;globalRender()});
 // Search result deep links open the proper page and prefill its local filter.
 const initialFilter=new URLSearchParams(window.location.search).get("q");
 if(initialFilter&&initialFilter.length<=120){
  const target=localGunpla||localGenre||localAmazon||localMain;
  if(target){target.value=initialFilter;window.requestAnimationFrame(()=>target.closest("section")?.scrollIntoView({block:"start"}));}
 }
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
  // Dismissing the draw result also dismisses the header lottery panel.
  // The native close event covers the button, backdrop, and Escape key.
  dialog?.addEventListener("close",()=>{
   setGachaOpen(false);
   gachaToggle?.focus({preventScroll:true});
  });
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
