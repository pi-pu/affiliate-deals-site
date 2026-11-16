"use strict";
(() => {
  const list = document.getElementById("products");
  const select = document.getElementById("sort-order");
  const status = document.getElementById("sort-status");
  const filterStatus = document.getElementById("filter-status");
  const tabs = Array.from(document.querySelectorAll(".category-tab"));
  const cards = Array.from(list.children);
  if (!cards.length) return;
  document.getElementById("sort-control").hidden = false;
  let category = "all";
  function render() {
    const mode = select.value;
    const ordered = cards.filter(card => category === "all" || card.dataset.category === category)
      .sort((a, b) => {
        const scoreDifference = Number(b.dataset.score) - Number(a.dataset.score);
        if (mode === "discount") return (Number(b.dataset.discount || -1) - Number(a.dataset.discount || -1)) || scoreDifference;
        if (mode === "price-asc") return Number(a.dataset.price) - Number(b.dataset.price) || scoreDifference;
        if (mode === "price-desc") return Number(b.dataset.price) - Number(a.dataset.price) || scoreDifference;
        return scoreDifference;
      });
    cards.forEach(card => { card.hidden = true; });
    ordered.forEach((card, index) => {
      card.hidden = false;
      card.querySelector(".rank-number").textContent = String(index + 1).padStart(2, "0");
      list.appendChild(card);
    });
    filterStatus.textContent = `${category === "all" ? "すべてのジャンル" : category}・${ordered.length}商品を表示中`;
    status.textContent = `${select.options[select.selectedIndex].text}に並べ替えました。`;
  }
  select.addEventListener("change", render);
  tabs.forEach(tab => tab.addEventListener("click", () => {
    category = tab.dataset.category;
    tabs.forEach(button => {
      const active = button === tab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    render();
  }));
  render();
})();
