(function () {
  // Leave empty to point the QR at menu.html next to this page (works wherever the site is hosted).
  // Set a full address here only if the menu lives somewhere else, e.g. "https://example.com/menu.html".
  var MENU_URL = "";

  var canvas = document.getElementById("qr");
  var url = MENU_URL || new URL("menu.html", window.location.href).href;

  // Error correction "M" keeps the code coarse enough to scan easily from a table card.
  var qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();

  var count = qr.getModuleCount();
  var quiet = 2; // the white card around the canvas supplies the rest of the blank margin scanners need
  var cell = Math.floor(canvas.width / (count + quiet * 2));
  var offset = Math.floor((canvas.width - cell * count) / 2);
  var ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1f2223";
  for (var r = 0; r < count; r++) {
    for (var c = 0; c < count; c++) {
      if (qr.isDark(r, c)) ctx.fillRect(offset + c * cell, offset + r * cell, cell, cell);
    }
  }
})();
