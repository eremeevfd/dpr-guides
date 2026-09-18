(function () {
  var navToggle = document.getElementById("navToggle");
  var sidebar = document.getElementById("sidebar");

  navToggle.addEventListener("click", function () {
    var isOpen = sidebar.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  sidebar.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      sidebar.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxClose = document.getElementById("lightboxClose");

  document.querySelectorAll(".card img").forEach(function (img) {
    img.addEventListener("click", function () {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.classList.add("open");
    });
  });

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightboxImg.src = "";
  }

  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeLightbox();
  });

  // Roblox username lookup
  var userIdInput = document.getElementById("robloxUserId");
  var lookupBtn = document.getElementById("robloxLookupBtn");
  var resultBox = document.getElementById("robloxResult");
  var usernameEl = document.getElementById("robloxUsername");
  var copyBtn = document.getElementById("robloxCopyBtn");
  var errorEl = document.getElementById("robloxError");

  if (lookupBtn) {
    // users.roblox.com has no CORS headers, so requests are routed
    // through a public CORS proxy. Tried in order; first success wins.
    var CORS_PROXIES = [
      function (url) { return "https://api.allorigins.win/raw?url=" + encodeURIComponent(url); },
      function (url) { return "https://corsproxy.io/?url=" + encodeURIComponent(url); }
    ];

    function showError(message) {
      resultBox.hidden = true;
      errorEl.textContent = message;
      errorEl.hidden = false;
    }

    function showUsername(name) {
      errorEl.hidden = true;
      usernameEl.textContent = name;
      resultBox.hidden = false;
    }

    function fetchViaProxy(targetUrl, proxyIndex) {
      if (proxyIndex >= CORS_PROXIES.length) {
        return Promise.reject(new Error("all proxies failed"));
      }
      var proxiedUrl = CORS_PROXIES[proxyIndex](targetUrl);
      return fetch(proxiedUrl).then(function (res) {
        if (!res.ok) throw new Error("bad response");
        return res.json();
      }).catch(function () {
        return fetchViaProxy(targetUrl, proxyIndex + 1);
      });
    }

    function lookupUser() {
      var rawId = userIdInput.value.trim();
      if (!/^\d+$/.test(rawId)) {
        showError("Enter a numeric Roblox user ID.");
        return;
      }

      lookupBtn.disabled = true;
      lookupBtn.textContent = "Looking up…";
      resultBox.hidden = true;
      errorEl.hidden = true;

      fetchViaProxy("https://users.roblox.com/v1/users/" + rawId, 0)
        .then(function (data) {
          if (!data || !data.name) throw new Error("no username in response");
          showUsername(data.name);
        })
        .catch(function () {
          showError("Couldn't find that user, or Roblox is unreachable right now. Double-check the ID and try again.");
        })
        .then(function () {
          lookupBtn.disabled = false;
          lookupBtn.textContent = "Lookup";
        });
    }

    lookupBtn.addEventListener("click", lookupUser);
    userIdInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") lookupUser();
    });

    copyBtn.addEventListener("click", function () {
      var text = usernameEl.textContent;
      if (!text) return;
      var restoreLabel = "Copy";
      function flashCopied() {
        copyBtn.textContent = "Copied!";
        setTimeout(function () { copyBtn.textContent = restoreLabel; }, 1500);
      }
      function copyWithExecCommand() {
        var temp = document.createElement("textarea");
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
        flashCopied();
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(flashCopied, copyWithExecCommand);
      } else {
        copyWithExecCommand();
      }
    });
  }
})();
