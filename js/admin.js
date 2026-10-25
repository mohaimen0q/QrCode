(function () {
  var TOKEN_KEY = "venecia_admin_token";
  var SOCIALS = [
    ["instagram", "Instagram", "https://www.instagram.com/..."],
    ["facebook", "Facebook", "https://www.facebook.com/..."],
    ["tiktok", "TikTok", "https://www.tiktok.com/@..."],
    ["whatsapp", "WhatsApp", "https://wa.me/218..."],
    ["snapchat", "Snapchat", "https://www.snapchat.com/add/..."],
    ["maps", "Google Maps", "https://maps.app.goo.gl/..."]
  ];
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
  var social = {};        // links to the restaurant's accounts, by network name
  var dirty = false;
  var openCats = {};      // which categories are expanded, by id
  var photoTarget = null; // the dish waiting for a chosen photo
  var history = [];       // earlier states of the menu, newest last, for the undo button
  var savedState = "";    // the menu as last loaded or saved, to tell whether anything differs
  var undoBtn = document.getElementById("undo");

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

  // ---------- Undo ----------
  // Call right before changing the menu: remembers the state the undo button goes back to.
  function snapshot() {
    return JSON.stringify({ menu: menu, social: social });
  }

  function checkpoint(state) {
    history.push(state || snapshot());
    if (history.length > 100) history.shift();
    undoBtn.disabled = false;
  }

  function undo() {
    if (!history.length) return;
    var state = JSON.parse(history.pop());
    menu = state.menu;
    social = state.social;
    undoBtn.disabled = !history.length;
    setDirty(snapshot() !== savedState);
    render();
    toast("تم التراجع عن آخر تعديل.");
  }

  undoBtn.addEventListener("click", undo);
  document.addEventListener("keydown", function (e) {
    // inside a text box Ctrl+Z keeps its normal meaning (undo typing)
    if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.key.toLowerCase() !== "z") return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || editorView.hidden) return;
    e.preventDefault();
    undo();
  });

  window.addEventListener("beforeunload", function (e) {
    if (dirty) { e.preventDefault(); e.returnValue = ""; }
  });

  // ---------- Show / hide what is typed in password fields (an eye button inside each) ----------
  var EYE = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  var EYE_OFF = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4 4l16 16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  var eyes = [];
  function setShown(input, button, shown) {
    input.type = shown ? "text" : "password";
    button.innerHTML = shown ? EYE_OFF : EYE;
    button.setAttribute("aria-label", shown ? "إخفاء كلمة المرور" : "إظهار كلمة المرور");
    button.setAttribute("aria-pressed", shown ? "true" : "false");
  }
  Array.prototype.forEach.call(document.querySelectorAll('input[type="password"]'), function (input) {
    var wrap = el("span", "pw");
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    var button = el("button", "pw__eye");
    button.type = "button";
    setShown(input, button, false);
    button.addEventListener("click", function () {
      setShown(input, button, input.type === "password");
      input.focus();
    });
    wrap.appendChild(button);
    eyes.push([input, button]);
  });
  // every form starts hidden again, so a password is never left showing
  function hidePasswords() {
    eyes.forEach(function (pair) { setShown(pair[0], pair[1], false); });
  }

  // ---------- Sign in / out ----------
  function showLogin(message) {
    hidePasswords();
    token = null;
    try { sessionStorage.removeItem(TOKEN_KEY); } catch (e) {}
    editorView.hidden = true;
    savebar.hidden = true;
    logoutBtn.hidden = true;
    loginView.hidden = false;
    loginError.hidden = !message;
    loginError.classList.remove("is-ok");
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

  // ---------- Forgot password / change password (both confirmed by an emailed code) ----------
  var ACCOUNT_ERRORS = {
    wrong_current: "كلمة المرور الحالية غير صحيحة.",
    short: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.",
    long: "كلمة المرور الجديدة طويلة جداً.",
    wrong_code: "الرمز غير صحيح. تحقق منه وحاول مرة أخرى.",
    expired: "انتهت صلاحية الرمز أو استُخدم عدداً كبيراً من المرات. اطلب رمزاً جديداً.",
    wait: "أُرسل رمز قبل قليل. انتظر دقيقة ثم حاول مرة أخرى.",
    mail_failed: "تعذّر إرسال البريد. حاول لاحقاً.",
    mail_not_configured: "إرسال البريد غير مفعّل بعد على الخادم (RESEND_API_KEY).",
    no_email: "بريد الإدارة غير مضبوط بعد على الخادم (ADMIN_EMAIL).",
    not_configured: "لوحة الإدارة غير مفعّلة بالكامل على الخادم بعد."
  };
  function accountError(r) {
    return (r.data && ACCOUNT_ERRORS[r.data.error]) || "تعذّر تنفيذ الطلب. حاول مرة أخرى.";
  }
  function showError(node, text) {
    node.textContent = text || "";
    node.hidden = !text;
  }

  var resetForm = document.getElementById("resetForm");
  var resetError = document.getElementById("resetError");
  var resetSubmit = document.getElementById("resetSubmit");
  var resetStep = 1;
  function showReset(on) {
    hidePasswords();
    loginForm.hidden = on;
    resetForm.hidden = !on;
    resetStep = 1;
    document.getElementById("resetStep1").hidden = false;
    document.getElementById("resetStep2").hidden = true;
    resetSubmit.textContent = "إرسال الرمز";
    ["resetCode", "resetNext", "resetNext2"].forEach(function (id) { document.getElementById(id).value = ""; });
    showError(resetError, "");
    (on ? document.getElementById("resetEmail") : document.getElementById("username")).focus();
  }
  document.getElementById("forgotBtn").addEventListener("click", function () { showReset(true); });
  document.getElementById("resetBack").addEventListener("click", function () { showReset(false); });
  resetForm.addEventListener("submit", function (e) {
    e.preventDefault();
    showError(resetError, "");
    var body;
    if (resetStep === 1) {
      var email = document.getElementById("resetEmail").value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return showError(resetError, "أدخل بريداً إلكترونياً صحيحاً.");
      body = { action: "reset-start", email: email };
    } else {
      var next = document.getElementById("resetNext").value;
      if (next !== document.getElementById("resetNext2").value) return showError(resetError, "كلمتا المرور غير متطابقتين.");
      body = { action: "reset-confirm", code: document.getElementById("resetCode").value, next: next };
    }
    resetSubmit.disabled = true;
    api("/api/account", "POST", body).then(function (r) {
      resetSubmit.disabled = false;
      if (!r.ok) return showError(resetError, accountError(r));
      if (resetStep === 1) {
        resetStep = 2;
        document.getElementById("resetStep1").hidden = true;
        document.getElementById("resetStep2").hidden = false;
        resetSubmit.textContent = "تغيير كلمة المرور";
        document.getElementById("resetCode").focus();
        return;
      }
      showReset(false);
      showLogin("");
      loginError.hidden = false;
      loginError.classList.add("is-ok");
      loginError.textContent = "تم تغيير كلمة المرور. سجّل الدخول بكلمة المرور الجديدة.";
    }).catch(function () {
      resetSubmit.disabled = false;
      showError(resetError, "تعذّر الاتصال بالخادم.");
    });
  });

  var changeForm = document.getElementById("changeForm");
  var changeError = document.getElementById("changeError");
  var changeSubmit = document.getElementById("changeSubmit");
  var changeCancel = document.getElementById("changeCancel");
  var changeStep = 1;
  function resetChange() {
    hidePasswords();
    changeStep = 1;
    document.getElementById("changeStep1").hidden = false;
    document.getElementById("changeStep2").hidden = true;
    changeSubmit.textContent = "إرسال رمز التأكيد";
    changeCancel.hidden = true;
    ["changeCurrent", "changeNext", "changeNext2", "changeCode"].forEach(function (id) { document.getElementById(id).value = ""; });
    showError(changeError, "");
  }
  changeCancel.addEventListener("click", resetChange);
  changeForm.addEventListener("submit", function (e) {
    e.preventDefault();
    showError(changeError, "");
    var body;
    if (changeStep === 1) {
      var next = document.getElementById("changeNext").value;
      if (next !== document.getElementById("changeNext2").value) return showError(changeError, "كلمتا المرور الجديدتان غير متطابقتين.");
      body = { action: "change-start", current: document.getElementById("changeCurrent").value, next: next };
    } else {
      body = { action: "change-confirm", code: document.getElementById("changeCode").value };
    }
    changeSubmit.disabled = true;
    api("/api/account", "POST", body).then(function (r) {
      changeSubmit.disabled = false;
      if (r.status === 401) return showLogin("انتهت الجلسة. سجّل الدخول من جديد.");
      if (!r.ok) return showError(changeError, accountError(r));
      if (changeStep === 1) {
        changeStep = 2;
        document.getElementById("changeStep1").hidden = true;
        document.getElementById("changeStep2").hidden = false;
        changeSubmit.textContent = "تأكيد التغيير";
        changeCancel.hidden = false;
        document.getElementById("changeCode").focus();
        return toast("أرسلنا رمز التأكيد إلى بريد الإدارة.");
      }
      // this device stays signed in with a fresh session; all others are signed out
      token = r.data.token;
      try { sessionStorage.setItem(TOKEN_KEY, token); } catch (err) {}
      resetChange();
      toast("تم تغيير كلمة المرور، وسُجّل الخروج من الأجهزة الأخرى.");
    }).catch(function () {
      changeSubmit.disabled = false;
      showError(changeError, "تعذّر الاتصال بالخادم.");
    });
  });

  // ---------- Load ----------
  function openEditor() {
    loginView.hidden = true;
    Promise.all([api("/api/menu"), api("/api/settings")]).then(function (both) {
      var r = both[0];
      social = (both[1].ok && both[1].data && both[1].data.social) || {};
      if (r.ok && Array.isArray(r.data)) {
        menu = r.data;
        sourceNote.hidden = true;
        // sections and dishes added to the site after this menu was saved (marked addToSaved) join it, so they can be edited and saved
        (window.VENECIA_MENU || []).forEach(function (cat) {
          var saved = menu.filter(function (c) { return c.id === cat.id; })[0];
          if (!saved) {
            if (cat.addToSaved) menu.push(JSON.parse(JSON.stringify(cat)));
            return;
          }
          cat.items.forEach(function (item) {
            var there = saved.items.some(function (s) { return s.n === item.n; });
            if (item.addToSaved && !there) saved.items.push(JSON.parse(JSON.stringify(item)));
          });
        });
      } else {
        // nothing saved yet: start from the menu that ships with the site
        menu = JSON.parse(JSON.stringify(window.VENECIA_MENU || []));
        sourceNote.textContent = "هذه هي القائمة الأصلية للموقع. أول حفظ سيجعل نسختك المعدّلة هي الظاهرة للزبائن.";
        sourceNote.hidden = false;
      }
      // a menu saved before English was added: fill the English from the built-in list, matched by the Arabic text
      var known = {};
      (window.VENECIA_MENU || []).forEach(function (cat) {
        if (cat.titleEn) known[cat.title] = cat.titleEn;
        cat.items.forEach(function (item) {
          if (item.nEn) known[item.n] = item.nEn;
          if (item.d && item.dEn) known[item.d] = item.dEn;
          if (item.d2 && item.d2En) known[item.d2] = item.d2En;
        });
      });
      menu.forEach(function (cat) {
        if (!cat.layout) cat.layout = "list";
        if (!cat.titleEn && known[cat.title]) cat.titleEn = known[cat.title];
        cat.items.forEach(function (item) {
          if (!item.nEn && known[item.n]) item.nEn = known[item.n];
          if (item.d && !item.dEn && known[item.d]) item.dEn = known[item.d];
          if (item.d2 && !item.d2En && known[item.d2]) item.d2En = known[item.d2];
        });
      });
      history = [];
      undoBtn.disabled = true;
      savedState = snapshot();
      editorView.hidden = false;
      savebar.hidden = false;
      logoutBtn.hidden = false;
      setDirty(false);
      render();
      loadReviews();
    }).catch(function () {
      showLogin("تعذّر تحميل القائمة. حاول مرة أخرى.");
    });
  }

  // ---------- Editor ----------
  function move(list, from, to) {
    if (to < 0 || to >= list.length) return;
    checkpoint();
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
    // one undo step per visit to a field, not one per keystroke
    var before = null;
    input.addEventListener("focus", function () { before = snapshot(); });
    input.addEventListener("input", function () {
      if (before) { checkpoint(before); before = null; }
      onInput(input.value);
      setDirty(true);
    });
    return input;
  }

  function renderDish(cat, item, i) {
    var row = el("li", "adish" + (item.hidden ? " is-hidden" : "") + (item.unavailable ? " is-unavailable" : ""));

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
    var en = el("div", "adish__en");
    en.appendChild(el("p", "adish__enlabel", "English"));
    [["Name", "nEn"], ["Description", "dEn"], ["Second description line (optional)", "d2En"]].forEach(function (f) {
      var input = textInput(item[f[1]], function (v) { item[f[1]] = v; });
      input.dir = "ltr";
      input.lang = "en";
      en.appendChild(field(f[0], input));
    });
    fields.appendChild(en);
    row.appendChild(fields);

    var tools = el("div", "adish__tools");
    var show = el("label", "check");
    var box = el("input");
    box.type = "checkbox";
    box.checked = !item.hidden;
    box.addEventListener("change", function () {
      checkpoint();
      item.hidden = !box.checked;
      row.classList.toggle("is-hidden", item.hidden);
      setDirty(true);
    });
    show.appendChild(box);
    show.appendChild(el("span", null, "ظاهر للزبائن"));
    // still listed, but marked "غير متاح" on the menu
    var offLabel = el("label", "check");
    var offBox = el("input");
    offBox.type = "checkbox";
    offBox.checked = item.unavailable === true;
    offBox.addEventListener("change", function () {
      checkpoint();
      if (offBox.checked) item.unavailable = true; else delete item.unavailable;
      row.classList.toggle("is-unavailable", offBox.checked);
      setDirty(true);
    });
    offLabel.appendChild(offBox);
    offLabel.appendChild(el("span", null, "غير متاح حالياً"));
    // shown on the menu with a star: "الأعلى تقييماً"
    var topLabel = el("label", "check");
    var topBox = el("input");
    topBox.type = "checkbox";
    topBox.checked = item.top === true;
    topBox.addEventListener("change", function () {
      checkpoint();
      if (topBox.checked) item.top = true; else delete item.top;
      setDirty(true);
    });
    topLabel.appendChild(topBox);
    topLabel.appendChild(el("span", null, "الأعلى تقييماً ★"));
    var checks = el("div", "adish__checks");
    checks.appendChild(show);
    checks.appendChild(offLabel);
    checks.appendChild(topLabel);
    tools.appendChild(checks);
    if (item.img) {
      tools.appendChild(iconBtn("حذف الصورة", "حذف الصورة", function () {
        checkpoint();
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
      checkpoint();
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
    var titleEn = textInput(cat.titleEn, function (v) { cat.titleEn = v; });
    titleEn.dir = "ltr";
    titleEn.lang = "en";
    settings.appendChild(field("اسم القسم بالإنجليزية", titleEn));
    var select = el("select");
    LAYOUTS.forEach(function (opt) {
      var o = el("option", null, opt[1]);
      o.value = opt[0];
      o.selected = cat.layout === opt[0];
      select.appendChild(o);
    });
    select.addEventListener("change", function () { checkpoint(); cat.layout = select.value; setDirty(true); });
    settings.appendChild(field("تنسيق عرض الأطباق", select));

    var order = el("div", "acat__order");
    order.appendChild(iconBtn("تحريك القسم لأعلى", "↑", function () { move(menu, c, c - 1); }, c === 0));
    order.appendChild(iconBtn("تحريك القسم لأسفل", "↓", function () { move(menu, c, c + 1); }, c === menu.length - 1));
    var del = iconBtn("حذف القسم", "حذف القسم", function () {
      if (!confirm("حذف القسم «" + (cat.title || "بدون اسم") + "» مع كل أصنافه (" + cat.items.length + ")؟")) return;
      checkpoint();
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
      checkpoint();
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

  function renderSocial() {
    var box = document.getElementById("socialFields");
    box.textContent = "";
    var filled = 0;
    SOCIALS.forEach(function (s) {
      if (social[s[0]]) filled++;
      var input = textInput(social[s[0]], function (v) {
        v = v.trim();
        if (v) social[s[0]] = v; else delete social[s[0]];
        input.classList.remove("is-bad");
      }, "url");
      input.dir = "ltr";
      input.placeholder = s[2];
      input.setAttribute("data-social", s[0]);
      var wrap = field(s[1], input);
      var icon = el("img");
      icon.src = "assets/social/" + (s[0] === "maps" ? "googlemaps" : s[0]) + ".svg";
      icon.alt = "";
      wrap.firstChild.insertBefore(icon, wrap.firstChild.firstChild);
      box.appendChild(wrap);
    });
    document.getElementById("socialCount").textContent = filled ? filled + " رابط" : "لا توجد روابط";
  }

  function render() {
    renderSocial();
    catsEl.textContent = "";
    menu.forEach(function (cat, c) { catsEl.appendChild(renderCat(cat, c)); });
  }

  document.getElementById("addCat").addEventListener("click", function () {
    var cat = { id: "c" + Date.now().toString(36), title: "", layout: "list", items: [] };
    checkpoint();
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
      checkpoint();
      item.img = r.data.url;
      setDirty(true);
      render();
      toast("تم رفع الصورة. اضغط «حفظ التغييرات» لتثبيتها.");
    }).catch(function () {
      toast("هذا الملف ليس صورة صالحة.", true);
    });
  });

  // ---------- Save ----------
  function badSocial() {
    for (var i = 0; i < SOCIALS.length; i++) {
      var url = social[SOCIALS[i][0]];
      if (url && !/^https:\/\/[^\s"'<>]+$/.test(url)) return SOCIALS[i];
    }
    return null;
  }

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
    var bad = badSocial();
    if (bad) {
      document.getElementById("socialCard").open = true;
      var field = document.querySelector('[data-social="' + bad[0] + '"]');
      field.classList.add("is-bad");
      field.scrollIntoView({ block: "center" });
      return toast("رابط " + bad[1] + " غير صحيح. يجب أن يبدأ بـ https://", true);
    }
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
    Promise.all([api("/api/menu", "PUT", menu), api("/api/settings", "PUT", { social: social })]).then(function (both) {
      var r = both[0].ok ? both[1] : both[0];
      if (r.ok) {
        savedState = snapshot();
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

  // ---------- Reviews ----------
  // Customers' reviews arrive hidden; the admin shows, hides or deletes them (one at a time or many).
  var reviews = [];
  var reviewsMax = 0;
  var picked = {};
  var reviewsList = document.getElementById("reviewsList");
  var reviewsFilter = document.getElementById("reviewsFilter");
  var reviewsAll = document.getElementById("reviewsAll");

  function loadReviews() {
    return api("/api/reviews?all=1").then(function (r) {
      if (!r.ok) {
        reviewsList.textContent = "";
        reviewsList.appendChild(el("li", "arev__empty", r.status === 401 ? "سجّل الدخول من جديد لعرض التقييمات." : "تعذّر تحميل التقييمات."));
        return;
      }
      reviews = r.data.reviews || [];
      reviewsMax = r.data.max || 0;
      var still = {};
      reviews.forEach(function (x) { if (picked[x.id]) still[x.id] = true; });
      picked = still;
      renderReviews();
    });
  }

  function shownReviews() {
    var f = reviewsFilter.value;
    return reviews.filter(function (x) { return f === "all" || (f === "approved") === Boolean(x.approved); });
  }

  function reviewWhen(at) {
    var d = new Date(at);
    return d.toLocaleDateString("ar-LY-u-nu-latn") + " " + d.toLocaleTimeString("ar-LY-u-nu-latn", { hour: "2-digit", minute: "2-digit" });
  }

  function renderReviews() {
    var pending = reviews.filter(function (x) { return !x.approved; }).length;
    document.getElementById("reviewsCount").textContent = pending ? pending + " بانتظار الموافقة" : reviews.length + " تقييم";
    document.getElementById("reviewsUsage").textContent = "المخزّن: " + reviews.length + " من " + reviewsMax +
      (reviews.length >= reviewsMax ? " — الصندوق ممتلئ، احذف بعض التقييمات ليستقبل الجديد." : "");
    var list = shownReviews();
    reviewsList.textContent = "";
    if (!list.length) reviewsList.appendChild(el("li", "arev__empty", "لا توجد تقييمات هنا."));
    list.forEach(function (x) {
      var row = el("li", "arev" + (x.approved ? " is-approved" : ""));
      var box = el("input");
      box.type = "checkbox";
      box.checked = Boolean(picked[x.id]);
      box.setAttribute("aria-label", "تحديد");
      box.addEventListener("change", function () {
        if (box.checked) picked[x.id] = true; else delete picked[x.id];
        syncPicked();
      });
      row.appendChild(box);

      var main = el("div", "arev__main");
      var head = el("div", "arev__head");
      head.appendChild(el("span", "arev__stars", "★★★★★".slice(0, x.stars) + "☆☆☆☆☆".slice(0, 5 - x.stars)));
      head.appendChild(el("b", null, x.target === "site" ? "المطعم" : (x.targetName || "صنف")));
      head.appendChild(el("span", "arev__state", x.approved ? "ظاهر" : "بانتظار الموافقة"));
      main.appendChild(head);
      main.appendChild(el("p", "arev__meta", (x.name || "بدون اسم") + " · " + reviewWhen(x.at)));
      if (x.text) main.appendChild(el("p", "arev__text", x.text));
      row.appendChild(main);

      var tools = el("div", "arev__tools");
      var toggle = el("button", "tbtn", x.approved ? "إخفاء" : "إظهار");
      toggle.type = "button";
      toggle.addEventListener("click", function () { reviewAction([x.id], x.approved ? "hide" : "approve"); });
      tools.appendChild(toggle);
      var del = el("button", "tbtn tbtn--danger", "حذف");
      del.type = "button";
      del.addEventListener("click", function () { reviewAction([x.id], "delete"); });
      tools.appendChild(del);
      row.appendChild(tools);
      reviewsList.appendChild(row);
    });
    syncPicked();
  }

  function pickedIds() {
    return shownReviews().map(function (x) { return x.id; }).filter(function (id) { return picked[id]; });
  }

  function syncPicked() {
    var shown = shownReviews();
    var ids = pickedIds();
    reviewsAll.checked = shown.length > 0 && ids.length === shown.length;
    ["reviewsApprove", "reviewsHide", "reviewsDelete"].forEach(function (id) {
      document.getElementById(id).disabled = !ids.length;
    });
  }

  function reviewAction(ids, kind) {
    if (!ids.length) return;
    if (kind === "delete" && !confirm(ids.length === 1 ? "حذف هذا التقييم نهائياً؟" : "حذف " + ids.length + " تقييمات نهائياً؟")) return;
    var req = kind === "delete"
      ? api("/api/reviews", "DELETE", { ids: ids })
      : api("/api/reviews", "PATCH", { ids: ids, approved: kind === "approve" });
    req.then(function (r) {
      if (r.status === 401) return showLogin("انتهت الجلسة. سجّل الدخول من جديد.");
      if (!r.ok) return toast("تعذّر تنفيذ الطلب. حاول مرة أخرى.", true);
      ids.forEach(function (id) { delete picked[id]; });
      toast(kind === "delete" ? "تم الحذف." : kind === "approve" ? "أصبحت ظاهرة للزبائن." : "تم إخفاؤها عن الزبائن.");
      return loadReviews();
    }).catch(function () { toast("تعذّر الاتصال بالخادم.", true); });
  }

  reviewsFilter.addEventListener("change", renderReviews);
  reviewsAll.addEventListener("change", function () {
    shownReviews().forEach(function (x) { if (reviewsAll.checked) picked[x.id] = true; else delete picked[x.id]; });
    renderReviews();
  });
  document.getElementById("reviewsApprove").addEventListener("click", function () { reviewAction(pickedIds(), "approve"); });
  document.getElementById("reviewsHide").addEventListener("click", function () { reviewAction(pickedIds(), "hide"); });
  document.getElementById("reviewsDelete").addEventListener("click", function () { reviewAction(pickedIds(), "delete"); });

  // ---------- Start ----------
  if (token) openEditor(); else showLogin();
})();
