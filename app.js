"use strict";
(() => {
  const list = document.getElementById("products");
  const select = document.getElementById("sort-order");
  const status = document.getElementById("sort-status");
  const cards = Array.from(list.children);
  if (cards.length === 0) return;
  document.getElementById("sort-control").hidden = false;
  select.addEventListener("change", () => {
    const key = select.value === "drop" ? "drop" : "score";
    const value = (card) => card.dataset[key] === "" ? -Infinity : Number(card.dataset[key]);
    const ordered = [...cards].sort((a, b) => value(b) - value(a) || Number(b.dataset.score) - Number(a.dataset.score));
    ordered.forEach((card, index) => {
      card.querySelector(".rank-number").textContent = String(index + 1).padStart(2, "0");
      list.appendChild(card);
    });
    status.textContent = `${select.options[select.selectedIndex].text}に並べ替えました。${cards.length}商品`;
  });
})();
