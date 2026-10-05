(function () {
  var TOKEN_KEY = "venecia_admin_token";
  var LAYOUTS = [
    ["list", "قائمة مع صورة صغيرة"],
    ["cards", "بطاقات بصور كبيرة"],
    ["text", "نص فقط بدون صور"]
  ];

  var loginView = document.getElementById("loginView");
  var editorView = document.getElementById("editorView");
  var loginForm = document.getElementById("loginForm");
  var loginError = document.getElementById("loginError");
  var catsEl = document.getElementById("cats");
  var savebar = document.getElementById("savebar");
  var saveBtn = document.getElementById("save");
  var saveState = document.getElementById("saveState");
  var sourceNote = document.getElementById("sourceNote");
  var logoutBtn = document.getElementById("logout");
  var toastEl = document.getElementById("toast");
  var filePicker = document.getElementById("filePicker");

  var token = null;
  try { token = sessionStorage.getItem(TOKEN_KEY); } catch (e) {}
  var menu = [];
  var dirty = false;
  var openCats = {};      // which categories are expanded, by id
  var photoTarget = null; // the dish waiting for a chosen photo

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function photoUrl(img) {
    return /^(https?:)?\//.test(img) ? img : "assets/dishes/" + img + ".jpg";
  }

  function toast(message, bad) {
    toastEl.textContent = message;
    toastEl.classList.toggle("is-bad", Boolean(bad));
    toastEl.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { toastEl.hidden = true; }, 3200);
  }

  function api(path, method, body) {
    var headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = "Bearer " + token;
    return fetch(path, {
      method: method || "GET",
      headers: headers,
      cache: "no-store",
      body: body !== undefined ? JSON.stringify(body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        return { ok: res.ok, status: res.status, data: data };
      });
    });
  }

  function setDirty(value) {
    dirty = value;
    saveBtn.disabled = !value;
    saveState.textContent = value ? "لديك تغييرات غير محفوظة" : "لا توجد تغييرات";
    savebar.classList.toggle("is-dirty", value);
  }

  window.addEventListener("beforeunload", function (e) {
    if (dirty) { e.preventDefault(); e.returnValue = ""; }
  });

  // ---------- Sign in / out ----------
  function showLogin(message) {
    token = null;
    try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) {}
    editorView.hidden = true;
    savebar.hidden = true;
    logoutBtn.hidden = true;
    loginView.hidden = false;
    loginError.hidden = !message;
    loginError.textContent = message || "";
  }

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var button = loginForm.querySelector("button");
    button.disabled = true;
    loginError.hidden = true;
    api("/api/login", "POST", {
      username: document.getElementById("username").value,
      password: document.getElementById("password").value
    }).then(function (r) {
      button.disabled = false;
      if (r.ok && r.data.token) {
        token = r.data.token;
        try { sessionStorage.setItem(TOKEN_KEY, token); } catch (err) {}
        document.getElementById("password").value = "";
        openEditor();
      } else if (r.status === 503) {
        showLogin("لوحة الإدارة غير مفعّلة بعد: يجب ضبط ADMIN_USER و ADMIN_PASSWORD في إعدادات المشروع على Vercel ثم إعادة النشر.");
      } else if (r.status === 401) {
        showLogin("اسم المستخدم أو كلمة المرور غير صحيحة.");
      } else {
        showLogin("تعذّر الاتصال بالخادم. حاول مرة أخرى.");
      }
    }).catch(function () {
      button.disabled = false;
      showLogin("تعذّر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.");
    });
  });

  logoutBtn.addEventListener("click", function () {
    if (dirty && !confirm("لديك تغييرات غير محفوظة. هل تريد الخروج بدون حفظ؟")) return;
    setDirty(false);
    showLogin();
  });

  // ---------- Load ----------
  function openEditor() {
    loginView.hidden = true;
    api("/api/menu").then(function (r) {
      if (r.ok && Array.isArray(r.data)) {
        menu = r.data;
        sourceNote.hidden = true;
      } else {
        // nothing saved yet: start from the menu that ships with the site
        menu = JSON.parse(JSON.stringify(window.VENECIA_MENU || []));
        sourceNote.textContent = "هذه هي القائمة الأصلية للموقع. أول حفظ سيجعل نسختك المعدّلة هي الظاهرة للزبائن.";
        sourceNote.hidden = false;
      }
      menu.forEach(function (cat) { if (!cat.layout) cat.layout = "list"; });
      editorView.hidden = false;
      savebar.hidden = false;
      logoutBtn.hidden = false;
      setDirty(false);
      render();
    }).catch(function () {
      showLogin("تعذّر تحميل القائمة. حاول مرة أخرى.");
    });
  }

  // ---------- Editor ----------
  function move(list, from, to) {
    if (to < 0 || to >= list.length) return;
    list.splice(to, 0, list.splice(from, 1)[0]);
    setDirty(true);
    render();
  }

  function iconBtn(label, symbol, onClick, disabled) {
    var b = el("button", "ibtn", symbol);
    b.type = "button";
    b.title = label;
    b.setAttribute("aria-label", label);
    b.disabled = Boolean(disabled);
    b.addEventListener("click", onClick);
    return b;
  }

  function field(label, input, cls) {
    var wrap = el("label", "field" + (cls ? " " + cls : ""));
    wrap.appendChild(el("span", null, label));
    wrap.appendChild(input);
    return wrap;
  }

  function textInput(value, onInput, type) {
    var input = el("input");
    input.type = type || "text";
    input.value = value == null ? "" : value;
    input.addEventListener("input", function () {
      onInput(input.value);
      setDirty(true);
    });
    return input;
  }

  function renderDish(cat, item, i) {
    var row = el("li", "adish" + (item.hidden ? " is-hidden" : ""));

    var photo = el("button", "adish__photo");
    photo.type = "button";
    photo.title = "تغيير الصورة";
    if (item.img) {
      var img = el("img");
      img.src = photoUrl(item.img);
      img.alt = "";
      img.loading = "lazy";
      photo.appendChild(img);
    }
    photo.appendChild(el("span", null, item.img ? "تغيير" : "+ صورة"));
    photo.addEventListener("click", function () {
      photoTarget = item;
      filePicker.value = "";
      filePicker.click();
    });
    row.appendChild(photo);

    var fields = el("div", "adish__fields");
    fields.appendChild(field("اسم الصنف", textInput(item.n, function (v) { item.n = v; }), "field--name"));
    var price = textInput(item.p, function (v) { item.p = v; }, "number");
    price.min = "0";
    price.step = "0.5";
    price.inputMode = "decimal";
    fields.appendChild(field("السعر (دينار)", price, "field--price"));
    fields.appendChild(field("الوصف", textInput(item.d, function (v) { item.d = v; }), "field--wide"));
    fields.appendChild(field("سطر وصف ثانٍ (اختياري)", textInput(item.d2, function (v) { item.d2 = v; }), "field--wide"));
    row.appendChild(fields);

    var tools = el("div", "adish__tools");
    var show = el("label", "check");
    var box = el("input");
    box.type = "checkbox";
    box.checked = !item.hidden;
    box.addEventListener("change", function () {
      item.hidden = !box.checked;
      row.classList.toggle("is-hidden", item.hidden);
      setDirty(true);
    });
    show.appendChild(box);
    show.appendChild(el("span", null, "ظاهر للزبائن"));
    tools.appendChild(show);
    if (item.img) {
      tools.appendChild(iconBtn("حذف الصورة", "حذف الصورة", function () {
        delete item.img;
        setDirty(true);
        render();
      }));
      tools.lastChild.className = "tbtn";
    }
    tools.appendChild(iconBtn("تحريك لأعلى", "↑", function () { move(cat.items, i, i - 1); }, i === 0));
    tools.appendChild(iconBtn("تحريك لأسفل", "↓", function () { move(cat.items, i, i + 1); }, i === cat.items.length - 1));
    var del = iconBtn("حذف الصنف", "✕", function () {
      if (!confirm("حذف الصنف «" + (item.n || "بدون اسم") + "»؟")) return;
      cat.items.splice(i, 1);
      setDirty(true);
      render();
    });
    del.classList.add("ibtn--danger");
    tools.appendChild(del);
    row.appendChild(tools);
    return row;
  }

  function renderCat(cat, c) {
    var card = el("details", "acat");
    card.open = Boolean(openCats[cat.id]);
    card.addEventListener("toggle", function () { openCats[cat.id] = card.open; });

    var summary = el("summary", "acat__head");
    var title = el("span", "acat__title", cat.title || "قسم بدون اسم");
    summary.appendChild(title);
    summary.appendChild(el("span", "acat__count", cat.items.length + " صنف"));
    card.appendChild(summary);

    var body = el("div", "acat__body");

    var settings = el("div", "acat__settings");
    settings.appendChild(field("اسم القسم", textInput(cat.title, function (v) {
      cat.title = v;
      title.textContent = v || "قسم بدون اسم";
    })));
    var select = el("select");
    LAYOUTS.forEach(function (opt) {
      var o = el("option", null, opt[1]);
      o.value = opt[0];
      o.selected = cat.layout === opt[0];
      select.appendChild(o);
    });
    select.addEventListener("change", function () { cat.layout = select.value; setDirty(true); });
    settings.appendChild(field("تنسيق عرض الأطباق", select));

    var order = el("div", "acat__order");
    order.appendChild(iconBtn("تحريك القسم لأعلى", "↑", function () { move(menu, c, c - 1); }, c === 0));
    order.appendChild(iconBtn("تحريك القسم لأسفل", "↓", function () { move(menu, c, c + 1); }, c === menu.length - 1));
    var del = iconBtn("حذف القسم", "حذف القسم", function () {
      if (!confirm("حذف القسم «" + (cat.title || "بدون اسم") + "» مع كل أصنافه (" + cat.items.length + ")؟")) return;
      menu.splice(c, 1);
      setDirty(true);
      render();
    });
    del.className = "tbtn tbtn--danger";
    order.appendChild(del);
    settings.appendChild(order);
    body.appendChild(settings);

    var list = el("ul", "acat__items");
    cat.items.forEach(function (item, i) { list.appendChild(renderDish(cat, item, i)); });
    body.appendChild(list);

    var add = el("button", "abtn abtn--dashed", "+ إضافة صنف");
    add.type = "button";
    add.addEventListener("click", function () {
      cat.items.push({ n: "", p: 0 });
      setDirty(true);
      render();
      var rows = catsEl.children[c].querySelectorAll(".adish");
      var last = rows[rows.length - 1];
      last.scrollIntoView({ block: "center" });
      last.querySelector("input").focus();
    });
    body.appendChild(add);

    card.appendChild(body);
    return card;
  }

  function render() {
    catsEl.textContent = "";
    menu.forEach(function (cat, c) { catsEl.appendChild(renderCat(cat, c)); });
  }

  document.getElementById("addCat").addEventListener("click", function () {
    var cat = { id: "c" + Date.now().toString(36), title: "", layout: "list", items: [] };
    menu.push(cat);
    openCats[cat.id] = true;
    setDirty(true);
    render();
    var card = catsEl.lastChild;
    card.scrollIntoView({ block: "start" });
    card.querySelector(".acat__settings input").focus();
  });

  // ---------- Photos ----------
  // Photos are cropped square and shrunk in the browser, so uploads stay small and the menu stays fast.
  function shrink(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var side = Math.min(img.naturalWidth, img.naturalHeight);
        var size = Math.min(side, 480);
        var canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        canvas.getContext("2d").drawImage(
          img,
          (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side,
          0, 0, size, size
        );
        URL.revokeObjectURL(img.src);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = function () { reject(new Error("image")); };
      img.src = URL.createObjectURL(file);
    });
  }

  filePicker.addEventListener("change", function () {
    var file = filePicker.files[0];
    var item = photoTarget;
    photoTarget = null;
    if (!file || !item) return;
    toast("جارٍ رفع الصورة…");
    shrink(file).then(function (dataUrl) {
      return api("/api/upload", "POST", { dataUrl: dataUrl });
    }).then(function (r) {
      if (r.status === 401) return showLogin("انتهت الجلسة. سجّل الدخول من جديد.");
      if (!r.ok || !r.data.url) {
        return toast(r.status === 503 ? "التخزين غير مفعّل على الخادم بعد." : "تعذّر رفع الصورة.", true);
      }
      item.img = r.data.url;
      setDirty(true);
      render();
      toast("تم رفع الصورة. اضغط «حفظ التغييرات» لتثبيتها.");
    }).catch(function () {
      toast("هذا الملف ليس صورة صالحة.", true);
    });
  });

  // ---------- Save ----------
  function problem() {
    for (var c = 0; c < menu.length; c++) {
      var cat = menu[c];
      if (!String(cat.title || "").trim()) return { cat: cat, text: "يوجد قسم بدون اسم." };
      for (var i = 0; i < cat.items.length; i++) {
        var item = cat.items[i];
        if (!String(item.n || "").trim()) return { cat: cat, text: "يوجد صنف بدون اسم في قسم «" + cat.title + "»." };
        var p = Number(item.p);
        if (item.p === "" || !isFinite(p) || p < 0) return { cat: cat, text: "سعر غير صحيح للصنف «" + item.n + "»." };
      }
    }
    return null;
  }

  saveBtn.addEventListener("click", function () {
    var issue = problem();
    if (issue) {
      openCats[issue.cat.id] = true;
      render();
      return toast(issue.text, true);
    }
    menu.forEach(function (cat) {
      cat.items.forEach(function (item) { item.p = Number(item.p); });
    });
    saveBtn.disabled = true;
    saveState.textContent = "جارٍ الحفظ…";
    api("/api/menu", "PUT", menu).then(function (r) {
      if (r.ok) {
        setDirty(false);
        sourceNote.hidden = true;
        return toast("تم الحفظ. التغييرات ظاهرة الآن للزبائن.");
      }
      setDirty(true);
      if (r.status === 401) return showLogin("انتهت الجلسة. سجّل الدخول من جديد.");
      toast(r.status === 503 ? "التخزين غير مفعّل على الخادم بعد (Vercel Blob)." : "تعذّر الحفظ. حاول مرة أخرى.", true);
    }).catch(function () {
      setDirty(true);
      toast("تعذّر الاتصال بالخادم.", true);
    });
  });

  // ---------- Start ----------
  if (token) openEditor(); else showLogin();
})();
