(function () {
  var data = window.VENECIA_MENU || [];
  var menu = document.getElementById("menu");
  var tabs = document.getElementById("tabs");
  var search = document.getElementById("search");
  var empty = document.getElementById("empty");
  var toTop = document.getElementById("toTop");
  var index = document.getElementById("index");
  var indexList = document.getElementById("indexList");

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  // Makes search forgiving: ignores tashkeel and the common alef / ya / ta-marbuta spelling variants.
  function normalize(s) {
    return String(s)
      .toLowerCase()
      .replace(/[ً-ْـ]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/[ىی]/g, "ي")
      .replace(/ة/g, "ه")
      .trim();
  }

  function countLabel(n) {
    return n + (n <= 10 ? " أطباق" : " طبقاً");
  }

  // ---- Build tabs, the full category list, and the sections ----
  data.forEach(function (cat) {
    var li = el("li");
    var a = el("a", "tabs__link", cat.title);
    a.href = "#" + cat.id;
    li.appendChild(a);
    tabs.appendChild(li);

    var row = el("li");
    var link = el("a", "index__link");
    link.href = "#" + cat.id;
    link.appendChild(el("span", "index__name", cat.title));
    link.appendChild(el("span", "index__count", countLabel(cat.items.length)));
    row.appendChild(link);
    indexList.appendChild(row);

    var section = el("section", "cat");
    section.id = cat.id;

    var head = el("header", "cat__head");
    var orn = el("img", "cat__ornament");
    orn.src = "assets/ornament.svg";
    orn.alt = "";
    orn.width = 213;
    orn.height = 30;
    head.appendChild(orn);
    head.appendChild(el("h2", "cat__title", cat.title));
    head.appendChild(el("p", "cat__count", countLabel(cat.items.length)));
    section.appendChild(head);

    var list = el("ul", "cat__list");
    cat.items.forEach(function (item) {
      var dish = el("li", "dish");
      dish.dataset.q = normalize([item.n, item.d, item.d2, cat.title].filter(Boolean).join(" "));

      if (item.img) {
        var photo = el("img", "dish__photo");
        photo.src = "assets/dishes/" + item.img + ".jpg";
        photo.alt = item.n;
        photo.loading = "lazy";
        photo.width = 96;
        photo.height = 96;
        // a missing file simply leaves a text-only row
        photo.addEventListener("error", function () { photo.remove(); });
        dish.appendChild(photo);
      }

      var body = el("div", "dish__body");
      var top = el("div", "dish__head");
      top.appendChild(el("h3", "dish__name", item.n));
      top.appendChild(el("span", "dish__dots"));
      var price = el("p", "dish__price");
      price.appendChild(el("b", null, item.p));
      price.appendChild(el("span", null, "دينار"));
      top.appendChild(price);
      body.appendChild(top);
      if (item.d) body.appendChild(el("p", "dish__desc", item.d));
      if (item.d2) body.appendChild(el("p", "dish__desc", item.d2));
      dish.appendChild(body);
      list.appendChild(dish);
    });
    section.appendChild(list);
    menu.appendChild(section);
  });

  var links = Array.prototype.slice.call(tabs.querySelectorAll(".tabs__link"));
  var indexLinks = Array.prototype.slice.call(indexList.querySelectorAll(".index__link"));
  var sections = Array.prototype.slice.call(menu.querySelectorAll(".cat"));

  // ---- Highlight the section being read, and keep its tab in view ----
  var current = null;
  function setActive(id) {
    if (id === current) return;
    current = id;
    links.forEach(function (link, i) {
      var on = link.getAttribute("href") === "#" + id;
      link.classList.toggle("is-active", on);
      indexLinks[i].classList.toggle("is-active", on);
      if (on) {
        link.setAttribute("aria-current", "true");
        // scrollTo on the strip itself: scrollIntoView would interrupt the page's own smooth scroll
        tabs.scrollTo({
          left: link.offsetLeft - (tabs.clientWidth - link.offsetWidth) / 2,
          behavior: "smooth"
        });
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function onScroll() {
    toTop.hidden = window.scrollY < window.innerHeight * 0.9;
    var line = tabs.getBoundingClientRect().bottom + window.innerHeight * 0.25;
    var active = null;
    sections.forEach(function (s) {
      if (!s.hidden && s.getBoundingClientRect().top <= line) active = s.id;
    });
    setActive(active);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  // ---- Full category list ----
  document.getElementById("openIndex").addEventListener("click", function () {
    if (index.showModal) index.showModal(); else index.setAttribute("open", "");
  });
  function closeIndex() {
    if (index.close) index.close(); else index.removeAttribute("open");
  }
  document.getElementById("closeIndex").addEventListener("click", closeIndex);
  indexList.addEventListener("click", function (e) {
    if (e.target.closest("a")) closeIndex();
  });

  // ---- Loading screen: shown from the moment the QR link opens until the page is ready ----
  var loader = document.getElementById("loader");
  var shownAt = Date.now();
  function hideLoader() {
    if (!loader) return;
    var node = loader;
    loader = null;
    // keep it up briefly so it reads as a welcome instead of a flicker
    setTimeout(function () {
      node.classList.add("is-done");
      setTimeout(function () { node.remove(); }, 500);
    }, Math.max(0, 700 - (Date.now() - shownAt)));
  }
  if (document.readyState === "complete") hideLoader();
  else window.addEventListener("load", hideLoader);
  setTimeout(hideLoader, 4000); // never trap the customer behind it on a slow connection

  // ---- Search ----
  search.addEventListener("input", function () {
    var q = normalize(search.value);
    var any = false;
    sections.forEach(function (s, i) {
      var hits = 0;
      Array.prototype.forEach.call(s.querySelectorAll(".dish"), function (dish) {
        var show = !q || dish.dataset.q.indexOf(q) !== -1;
        dish.hidden = !show;
        if (show) hits++;
      });
      s.hidden = hits === 0;
      links[i].parentNode.hidden = s.hidden;
      indexLinks[i].parentNode.hidden = s.hidden;
      if (hits) any = true;
    });
    empty.hidden = any;
    onScroll();
  });
})();
