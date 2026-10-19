(function () {
  var LANG_KEY = "venecia_lang";
  var root = document.documentElement;
  var menu = document.getElementById("menu");
  var tabs = document.getElementById("tabs");
  var search = document.getElementById("search");
  var empty = document.getElementById("empty");
  var toTop = document.getElementById("toTop");
  var index = document.getElementById("index");
  var indexList = document.getElementById("indexList");

  // ---- Fixed wording of the page in both languages ----
  var TEXT = {
    ar: {
      place: "طرابلس - السياحية",
      menuTitle: "قائمة الطعام",
      menuOther: "Menu",
      searchLabel: "ابحث في القائمة",
      searchHint: "ابحث عن طبق أو مكوّن",
      empty: "لا يوجد طبق بهذا الاسم. جرّب كلمة أخرى.",
      sections: "أقسام القائمة",
      allSections: "عرض كل الأقسام",
      close: "إغلاق",
      unavailable: "غير متاح",
      toTop: "العودة إلى أعلى القائمة",
      currency: "دينار",
      welcome: "أهلاً بكم في فينيسيا",
      visit: "زورونا",
      address: "طرابلس - السياحية، بالقرب من جزيرة الغيران",
      hours: "ساعات العمل",
      daily: "كل يوم",
      dailyTime: "1:00 ظهراً – 12:00 منتصف الليل",
      friday: "الجمعة",
      fridayTime: "2:30 ظهراً – 12:00 منتصف الليل",
      contact: "تواصل معنا",
      follow: "تابعونا",
      pageTitle: "قائمة الطعام | Venecia Restaurant"
    },
    en: {
      place: "Tripoli - Al-Siyahia",
      menuTitle: "Menu",
      menuOther: "قائمة الطعام",
      searchLabel: "Search the menu",
      searchHint: "Search for a dish or ingredient",
      empty: "No dish matches that. Try another word.",
      sections: "Menu sections",
      allSections: "Show all sections",
      close: "Close",
      unavailable: "Unavailable",
      toTop: "Back to the top of the menu",
      currency: "LYD",
      welcome: "Welcome to Venecia",
      visit: "Visit us",
      address: "Tripoli - Al-Siyahia, near Al-Ghiran roundabout",
      hours: "Opening hours",
      daily: "Every day",
      dailyTime: "1:00 PM – 12:00 AM",
      friday: "Friday",
      fridayTime: "2:30 PM – 12:00 AM",
      contact: "Contact us",
      follow: "Follow us",
      pageTitle: "Menu | Venecia Restaurant"
    }
  };

  var lang = "ar";
  try { if (localStorage.getItem(LANG_KEY) === "en") lang = "en"; } catch (e) {}
  // the address can ask for a language too (the English QR code opens menu.html?lang=en)
  var asked = /[?&]lang=(en|ar)\b/.exec(location.search);
  if (asked) lang = asked[1];

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

  // A photo is either a full address (uploaded from the admin page) or the name of a file in assets/dishes.
  function photoUrl(img) {
    return /^(https?:)?\//.test(img) ? img : "assets/dishes/" + img + ".jpg";
  }

  // ---- English wording ----
  // A menu saved before English was added has no English fields; the built-in list fills the gaps,
  // matched by the Arabic text. Anything still missing is shown in Arabic.
  var known = {};
  (window.VENECIA_MENU || []).forEach(function (cat) {
    if (cat.titleEn) known[cat.title] = cat.titleEn;
    cat.items.forEach(function (item) {
      if (item.nEn) known[item.n] = item.nEn;
      if (item.d && item.dEn) known[item.d] = item.dEn;
      if (item.d2 && item.d2En) known[item.d2] = item.d2En;
    });
  });
  function pick(arabic, english) {
    if (lang !== "en") return arabic;
    return english || known[arabic] || arabic;
  }

  // ---- Loading screen: shown from the moment the QR link opens until the menu is on the page ----
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

  // ---- Menu content: the version saved from the admin page, or the built-in list if there is none ----
  function loadMenu(done) {
    var fallback = window.VENECIA_MENU || [];
    var finished = false;
    function finish(data) {
      if (finished) return;
      finished = true;
      if (!Array.isArray(data) || !data.length) return done(fallback);
      // sections and dishes added to the site after the menu was saved (marked addToSaved) are shown too
      fallback.forEach(function (cat) {
        var saved = data.filter(function (c) { return c.id === cat.id; })[0];
        if (!saved) {
          if (cat.addToSaved) data.push(cat);
          return;
        }
        cat.items.forEach(function (item) {
          var there = saved.items.some(function (s) { return s.n === item.n; });
          if (item.addToSaved && !there) saved.items.push(item);
        });
      });
      done(data);
    }
    if (!window.fetch || location.protocol === "file:") return finish(null);
    setTimeout(function () { finish(null); }, 3500); // slow connection: show the built-in menu instead of waiting
    fetch("/api/menu", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(finish)
      .catch(function () { finish(null); });
  }

  var data = [];
  var links = [];
  var indexLinks = [];
  var sections = [];
  var current = null;

  // ---- Fixed wording and page direction ----
  function applyLanguage() {
    var t = TEXT[lang];
    root.lang = lang;
    root.dir = lang === "en" ? "ltr" : "rtl";
    document.title = t.pageTitle;
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n]"), function (node) {
      node.textContent = t[node.getAttribute("data-i18n")];
    });
    // the small label under the title shows the other language, so mark which one it is
    document.querySelector("[data-i18n=menuOther]").lang = lang === "en" ? "ar" : "en";
    search.placeholder = t.searchHint;
    document.getElementById("tabsNav").setAttribute("aria-label", t.sections);
    index.setAttribute("aria-label", t.sections);
    document.getElementById("openIndex").setAttribute("aria-label", t.allSections);
    document.getElementById("closeIndex").setAttribute("aria-label", t.close);
    toTop.setAttribute("aria-label", t.toTop);
    Array.prototype.forEach.call(document.querySelectorAll(".lang__btn"), function (btn) {
      var on = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  // ---- Tabs, the full category list, and the sections ----
  function render() {
    tabs.textContent = "";
    indexList.textContent = "";
    menu.textContent = "";
    current = null;

    data.forEach(function (cat) {
      var items = (cat.items || []).filter(function (item) { return !item.hidden; });
      if (!items.length) return;
      var layout = cat.layout || "list";
      var title = pick(cat.title, cat.titleEn);

      var li = el("li");
      var a = el("a", "tabs__link", title);
      a.href = "#" + cat.id;
      li.appendChild(a);
      tabs.appendChild(li);

      var row = el("li");
      var link = el("a", "index__link");
      link.href = "#" + cat.id;
      link.appendChild(el("span", "index__name", title));
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
      head.appendChild(el("h2", "cat__title", title));
      section.appendChild(head);

      var list = el("ul", "cat__list cat__list--" + layout);
      items.forEach(function (item) {
        var name = pick(item.n, item.nEn);
        var d = item.d ? pick(item.d, item.dEn) : "";
        var d2 = item.d2 ? pick(item.d2, item.d2En) : "";
        var off = item.unavailable === true;
        var dish = el("li", "dish" + (off ? " is-unavailable" : ""));
        // tapping a dish opens its close-up
        dish.item = item;
        dish.tabIndex = 0;
        dish.setAttribute("aria-haspopup", "dialog");
        // searchable in both languages whichever one is showing
        dish.dataset.q = normalize([
          item.n, item.d, item.d2, cat.title,
          item.nEn || known[item.n], item.dEn || known[item.d], item.d2En || known[item.d2], cat.titleEn || known[cat.title]
        ].filter(Boolean).join(" "));

        var withPhoto = item.img && layout !== "text";
        if (withPhoto) {
          var media = el("div", "dish__media");
          var photo = el("img", "dish__photo");
          photo.src = photoUrl(item.img);
          photo.alt = name;
          photo.loading = "lazy";
          photo.width = 96;
          photo.height = 96;
          // a missing file simply leaves a text-only row
          photo.addEventListener("error", function () { media.remove(); });
          media.appendChild(photo);
          if (off) media.appendChild(el("span", "dish__off", TEXT[lang].unavailable));
          dish.appendChild(media);
        }

        var body = el("div", "dish__body");
        var top = el("div", "dish__head");
        top.appendChild(el("h3", "dish__name", name));
        top.appendChild(el("span", "dish__dots"));
        var price = el("p", "dish__price");
        price.appendChild(el("b", null, item.p));
        price.appendChild(el("span", null, TEXT[lang].currency));
        top.appendChild(price);
        body.appendChild(top);
        if (off && !withPhoto) body.appendChild(el("p", "dish__badge", TEXT[lang].unavailable));
        if (d) body.appendChild(el("p", "dish__desc", d));
        if (d2) body.appendChild(el("p", "dish__desc", d2));
        dish.appendChild(body);
        list.appendChild(dish);
      });
      section.appendChild(list);
      menu.appendChild(section);
    });

    links = Array.prototype.slice.call(tabs.querySelectorAll(".tabs__link"));
    indexLinks = Array.prototype.slice.call(indexList.querySelectorAll(".index__link"));
    sections = Array.prototype.slice.call(menu.querySelectorAll(".cat"));
    filter();
  }

  // ---- Highlight the section being read, and keep its tab in view ----
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

  // ---- Search ----
  function filter() {
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
    empty.hidden = any || !sections.length;
    onScroll();
  }

  // ---- Dish close-up: photo, name, price and description ----
  var sheet = document.getElementById("sheet");
  var sheetMedia = document.getElementById("sheetMedia");
  var sheetDesc = document.getElementById("sheetDesc");
  var sheetOpen = false;
  function openDish(item) {
    var name = pick(item.n, item.nEn);
    sheetMedia.textContent = "";
    sheetMedia.hidden = !item.img;
    if (item.img) {
      var img = el("img");
      img.src = photoUrl(item.img);
      img.alt = name;
      img.addEventListener("error", function () { sheetMedia.hidden = true; });
      sheetMedia.appendChild(img);
    }
    document.getElementById("sheetName").textContent = name;
    var price = document.getElementById("sheetPrice");
    price.textContent = "";
    price.appendChild(el("b", null, item.p));
    price.appendChild(el("span", null, TEXT[lang].currency));
    var off = document.getElementById("sheetOff");
    off.textContent = TEXT[lang].unavailable;
    off.hidden = item.unavailable !== true;
    sheetDesc.textContent = "";
    [[item.d, item.dEn], [item.d2, item.d2En]].forEach(function (line) {
      if (line[0]) sheetDesc.appendChild(el("p", null, pick(line[0], line[1])));
    });
    document.getElementById("closeSheet").setAttribute("aria-label", TEXT[lang].close);
    if (sheet.showModal) sheet.showModal(); else sheet.setAttribute("open", "");
    sheet.scrollTop = 0;
    root.classList.add("is-locked");
    sheetOpen = true;
    // the phone's back button closes the close-up instead of leaving the menu
    history.pushState({ sheet: true }, "");
  }
  function hideSheet() {
    if (!sheetOpen) return;
    sheetOpen = false;
    if (sheet.close) sheet.close(); else sheet.removeAttribute("open");
    root.classList.remove("is-locked");
  }
  function closeSheet() {
    if (sheetOpen && history.state && history.state.sheet) history.back(); else hideSheet();
  }
  window.addEventListener("popstate", hideSheet);
  document.getElementById("closeSheet").addEventListener("click", closeSheet);
  sheet.addEventListener("cancel", function (e) { e.preventDefault(); closeSheet(); });
  // a tap outside the card (on the dimmed page) closes it too
  sheet.addEventListener("click", function (e) { if (e.target === sheet) closeSheet(); });
  menu.addEventListener("click", function (e) {
    var dish = e.target.closest(".dish");
    if (dish && dish.item) openDish(dish.item);
  });
  menu.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target.item) {
      e.preventDefault();
      openDish(e.target.item);
    }
  });

  // ---- Full category list ----
  function closeIndex() {
    if (index.close) index.close(); else index.removeAttribute("open");
  }
  document.getElementById("openIndex").addEventListener("click", function () {
    if (index.showModal) index.showModal(); else index.setAttribute("open", "");
  });
  document.getElementById("closeIndex").addEventListener("click", closeIndex);
  indexList.addEventListener("click", function (e) {
    if (e.target.closest("a")) closeIndex();
  });

  // ---- Language switch ----
  Array.prototype.forEach.call(document.querySelectorAll(".lang__btn"), function (btn) {
    btn.addEventListener("click", function () {
      var next = btn.getAttribute("data-lang");
      if (next === lang) return;
      lang = next;
      try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
      // stay on the section the customer was reading
      var keep = current;
      applyLanguage();
      render();
      if (keep && document.getElementById(keep)) document.getElementById(keep).scrollIntoView({ behavior: "auto" });
      onScroll();
    });
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  search.addEventListener("input", filter);

  // ---- Social links in the footer (set on the admin page; hidden when there are none) ----
  var SOCIALS = [
    ["instagram", "Instagram"], ["facebook", "Facebook"], ["tiktok", "TikTok"],
    ["whatsapp", "WhatsApp"], ["snapchat", "Snapchat"], ["maps", "Google Maps"]
  ];
  function showSocial(social) {
    var list = document.getElementById("social");
    list.textContent = "";
    SOCIALS.forEach(function (s) {
      var url = social && social[s[0]];
      if (!url || !/^https:\/\//.test(url)) return;
      var li = el("li");
      var a = el("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      a.setAttribute("aria-label", s[1]);
      a.title = s[1];
      var icon = el("img", "on-dark");
      icon.src = "assets/social/" + (s[0] === "maps" ? "googlemaps" : s[0]) + ".svg";
      icon.alt = "";
      icon.width = 22;
      icon.height = 22;
      a.appendChild(icon);
      li.appendChild(a);
      list.appendChild(li);
    });
    document.getElementById("socialBlock").hidden = !list.children.length;
  }
  if (window.fetch && location.protocol !== "file:") {
    fetch("/api/settings", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (settings) { if (settings) showSocial(settings.social); })
      .catch(function () {});
  }

  // ---- Start ----
  applyLanguage();
  loadMenu(function (loaded) {
    data = loaded;
    render();
    // the page was opened on a section link before the sections existed
    if (location.hash.length > 1) {
      var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) target.scrollIntoView();
    }
    hideLoader();
  });
})();
