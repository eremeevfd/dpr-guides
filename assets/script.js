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
    // through a CORS proxy. Tried in order; first success wins. The
    // self-hosted worker (see cors-proxy-worker/) is dedicated to this
    // site; allorigins.win is a public fallback if it's ever down.
    var CORS_PROXIES = [
      function (url) { return "https://dpr-guides-cors-proxy.cors-proxy-worker.workers.dev/?url=" + encodeURIComponent(url); },
      function (url) { return "https://api.allorigins.win/raw?url=" + encodeURIComponent(url); }
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
      if (e.key === "Enter" && !lookupBtn.disabled) lookupUser();
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

  // Relic drop odds by level
  var relicOddsLevelSelect = document.getElementById("relicOddsLevel");
  var relicOddsTableBody = document.querySelector("#relicOddsTable tbody");

  if (relicOddsLevelSelect) {
    var RARITY_ORDER = ["Rare", "Epic", "Legendary", "Mythic", "Artifact"];

    // [per kill (0-1 chance), per run (expected count), per 20 runs (expected count)]
    var RELIC_ODDS = {
      1: { Rare: [0.694762, 10.42143, 208.4286], Epic: [0.253642, 3.80463, 76.0926], Legendary: [0.051001, 0.765015, 15.3003], Mythic: [0.000595, 0.008925, 0.1785], Artifact: [0, 0, 0] },
      2: { Rare: [0.514569, 7.718535, 154.3707], Epic: [0.418879, 6.283185, 125.6637], Legendary: [0.078158, 1.17237, 23.4474], Mythic: [0.001524, 0.02286, 0.4572], Artifact: [0, 0, 0] },
      3: { Rare: [0.279576, 4.19364, 83.8728], Epic: [0.584824, 8.77236, 175.4472], Legendary: [0.129145, 1.937175, 38.7435], Mythic: [0.006089, 0.091335, 1.8267], Artifact: [0, 0, 0] },
      4: { Rare: [0.15554, 2.3331, 46.662], Epic: [0.646693, 9.700395, 194.0079], Legendary: [0.181944, 2.72916, 54.5832], Mythic: [0.015823, 0.237345, 4.7469], Artifact: [0, 0, 0] },
      5: { Rare: [0.077, 1.155, 23.1], Epic: [0.66475, 9.97125, 199.425], Legendary: [0.22795, 3.41925, 68.385], Mythic: [0.0305, 0.4575, 9.15], Artifact: [0.00007, 0.00105, 0.021] },
      6: { Rare: [0.062744, 0.94116, 18.8232], Epic: [0.265161, 3.977415, 79.5483], Legendary: [0.584548, 8.76822, 175.3644], Mythic: [0.086572, 1.29858, 25.9716], Artifact: [0.00031, 0.00465, 0.093] },
      7: { Rare: [0, 0, 0], Epic: [0.234733, 3.520995, 70.4199], Legendary: [0.643221, 9.648315, 192.9663], Mythic: [0.122315, 1.834725, 36.6945], Artifact: [0.000731, 0.010965, 0.2193] },
      8: { Rare: [0, 0, 0], Epic: [0.139219, 2.088285, 41.7657], Legendary: [0.695295, 10.429425, 208.5885], Mythic: [0.165043, 2.475645, 49.5129], Artifact: [0.001576, 0.02364, 0.4728] },
      9: { Rare: [0, 0, 0], Epic: [0.214708, 3.22062, 64.4124], Legendary: [0.224654, 3.36981, 67.3962], Mythic: [0.552604, 8.28906, 165.7812], Artifact: [0.007653, 0.114795, 2.2959] },
      10: { Rare: [0, 0, 0], Epic: [0.118125, 1.771875, 35.4375], Legendary: [0.206206, 3.09309, 61.8618], Mythic: [0.662409, 9.936135, 198.7227], Artifact: [0.013425, 0.201375, 4.0275] }
    };

    function renderRelicOdds() {
      var data = RELIC_ODDS[relicOddsLevelSelect.value];
      relicOddsTableBody.innerHTML = "";
      RARITY_ORDER.forEach(function (rarity) {
        var vals = data[rarity];
        var tr = document.createElement("tr");
        tr.innerHTML =
          "<td>" + rarity + "</td>" +
          "<td>" + (vals[0] * 100).toFixed(2) + "%</td>" +
          "<td>" + vals[1].toFixed(2) + "</td>" +
          "<td>" + vals[2].toFixed(1) + "</td>";
        relicOddsTableBody.appendChild(tr);
      });
    }

    relicOddsLevelSelect.addEventListener("change", renderRelicOdds);
    renderRelicOdds();
  }

  // Relic stat roll odds
  var relicStatSlotSelect = document.getElementById("relicStatSlot");
  var relicStatRaritySelect = document.getElementById("relicStatRarity");
  var relicStatMainSelect = document.getElementById("relicStatMain");
  var relicStatSubSelects = [
    document.getElementById("relicStatSub1"),
    document.getElementById("relicStatSub2"),
    document.getElementById("relicStatSub3"),
    document.getElementById("relicStatSub4")
  ];
  var relicStatTableBody = document.querySelector("#relicStatTable tbody");
  var relicStatTotal = document.getElementById("relicStatTotal");

  if (relicStatSlotSelect) {
    // Names/percentages are the game's own in-game "Relics" panel listings (Main Stat Chances / Sub-Stat Chances).
    // All 5 slots share the same 10 common Main Stats. Chain, Codex and Core each also carry one slot-exclusive
    // Main Stat (1.56%), which proportionally reweighs the other 10 down to make room for it — confirmed by a
    // full screenshot of Core's list (all 11 rows) matching the partial Chain/Codex screenshots exactly on the
    // 5 stats they share in common.
    var MAIN_STATS_COMMON10 = [
      { name: "Attack Speed", pct: 15.87 },
      { name: "All Crit Chance", pct: 7.94 },
      { name: "Hit Chance", pct: 15.87 },
      { name: "Soul Gain", pct: 7.94 },
      { name: "Exp", pct: 3.17 },
      { name: "Shadow Attack Chance", pct: 15.87 },
      { name: "Be hit damage", pct: 15.87 },
      { name: "Rebirth Attack Keep", pct: 7.94 },
      { name: "Extra Skull Chance", pct: 4.76 },
      { name: "Revive Attack(Relic)", pct: 4.76 }
    ];
    var MAIN_STATS_COMMON10_REWEIGHTED = [
      { name: "Attack Speed", pct: 15.62 },
      { name: "All Crit Chance", pct: 7.81 },
      { name: "Hit Chance", pct: 15.62 },
      { name: "Soul Gain", pct: 7.81 },
      { name: "Exp", pct: 3.12 },
      { name: "Shadow Attack Chance", pct: 15.62 },
      { name: "Be hit damage", pct: 15.62 },
      { name: "Rebirth Attack Keep", pct: 7.81 },
      { name: "Extra Skull Chance", pct: 4.69 },
      { name: "Revive Attack(Relic)", pct: 4.69 }
    ];
    var RELIC_SLOTS = {
      mask: { mains: MAIN_STATS_COMMON10 },
      lantern: { mains: MAIN_STATS_COMMON10 },
      chain: { mains: MAIN_STATS_COMMON10_REWEIGHTED.concat([{ name: "All Crit Damage(Relic)", pct: 1.56 }]) },
      codex: { mains: MAIN_STATS_COMMON10_REWEIGHTED.concat([{ name: "All Weapon Effect", pct: 1.56 }]) },
      core: { mains: MAIN_STATS_COMMON10_REWEIGHTED.concat([{ name: "Ringlord Effect", pct: 1.56 }]) }
    };
    // Sub-Stat Chances: identical list/percentages seen on both Lantern and Codex, so treated as universal.
    var SUB_STATS = [
      { name: "x2 Critical Damage(Relic)", pct: 2.44 },
      { name: "Final Damage(Relic)", pct: 2.44 },
      { name: "Base Attack", pct: 24.39 },
      { name: "Thunder Damage(Relic)", pct: 12.20 },
      { name: "Skull Damage(Relic)", pct: 12.20 },
      { name: "Shield Damage Multiply(Relic)", pct: 24.39 },
      { name: "Revive Attack(Relic)", pct: 7.32 },
      { name: "Challenge HP Reduce", pct: 14.63 }
    ];
    // Initial Sub-Stat Count chances (from the in-game "Relics" capacity panel): each rarity drops with one of
    // two possible sub-stat counts.
    var RARITY_SUBSTAT_COUNTS = {
      Rare: [{ n: 1, pct: 85 }, { n: 2, pct: 15 }],
      Epic: [{ n: 1, pct: 65 }, { n: 2, pct: 35 }],
      Legendary: [{ n: 2, pct: 65 }, { n: 3, pct: 35 }],
      Mythic: [{ n: 3, pct: 75 }, { n: 4, pct: 25 }],
      Artifact: [{ n: 3, pct: 50 }, { n: 4, pct: 50 }]
    };
    var ANY_OPTION = { value: "Any", name: "Any", pct: 100 };
    // Selecting this in a rarity's "extra" sub-stat slot explicitly rules that slot out, forcing the lower
    // (more common) Initial Sub-Stat Count instead of the higher one.
    var NONE_OPTION = { value: "__none__", name: "No Extra Sub-Stat", pct: null };

    function appendOption(select, opt) {
      var option = document.createElement("option");
      option.value = opt.value !== undefined ? opt.value : opt.name;
      option.textContent = opt.pct != null ? opt.name + " (" + opt.pct.toFixed(2) + "%)" : opt.name;
      select.appendChild(option);
    }

    function populateMainSelect() {
      var current = relicStatMainSelect.value;
      var mains = RELIC_SLOTS[relicStatSlotSelect.value].mains;
      relicStatMainSelect.innerHTML = "";
      mains.forEach(function (opt) { appendOption(relicStatMainSelect, opt); });
      if (mains.some(function (opt) { return opt.name === current; })) {
        relicStatMainSelect.value = current;
      }
    }

    // Every rarity has exactly one "extra" sub-stat slot (index === the lower Initial Sub-Stat Count) whose
    // presence decides which of the rarity's two counts applies. Slots below it always exist; slots above the
    // higher count can never exist for that rarity and are disabled. The extra slot gets a 3-way choice: no
    // extra slot at all (forces the lower count), "Any" (forces the higher count, unconstrained), or a specific
    // Sub-Stat (forces the higher count, that stat required).
    function populateSubSelects() {
      var counts = RARITY_SUBSTAT_COUNTS[relicStatRaritySelect.value];
      var lowerN = counts[0].n;
      var higherN = counts[counts.length - 1].n;
      relicStatSubSelects.forEach(function (select, i) {
        var current = select.value;
        select.innerHTML = "";
        if (i < lowerN) {
          select.disabled = false;
          [ANY_OPTION].concat(SUB_STATS).forEach(function (opt) { appendOption(select, opt); });
        } else if (i === lowerN && higherN > lowerN) {
          select.disabled = false;
          [NONE_OPTION, ANY_OPTION].concat(SUB_STATS).forEach(function (opt) { appendOption(select, opt); });
        } else {
          select.disabled = true;
          appendOption(select, ANY_OPTION);
          select.value = "Any";
          return;
        }
        var values = Array.prototype.map.call(select.options, function (o) { return o.value; });
        select.value = values.indexOf(current) !== -1 ? current : (i === lowerN ? NONE_OPTION.value : "Any");
      });
    }

    function findByName(list, name) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].name === name) return list[i];
      }
      return null;
    }

    function renderRelicStat() {
      var slot = RELIC_SLOTS[relicStatSlotSelect.value];
      var rarity = relicStatRaritySelect.value;
      var counts = RARITY_SUBSTAT_COUNTS[rarity];
      var lower = counts[0];
      var higher = counts[counts.length - 1];
      var extraSelect = higher.n > lower.n ? relicStatSubSelects[lower.n] : null;
      var needsHigherCount = !!extraSelect && extraSelect.value !== NONE_OPTION.value;
      var countInfo = needsHigherCount ? higher : lower;
      var main = findByName(slot.mains, relicStatMainSelect.value) || slot.mains[0];

      var chosenSubNames = relicStatSubSelects
        .filter(function (select) { return !select.disabled; })
        .map(function (select) { return select.value; })
        .filter(function (name) { return name && name !== "Any" && name !== NONE_OPTION.value; });
      var duplicate = chosenSubNames.some(function (name, i) { return chosenSubNames.indexOf(name) !== i; });

      var rows = [{ label: "Main Stat — " + main.name, pct: main.pct }];
      chosenSubNames.forEach(function (name) {
        var sub = findByName(SUB_STATS, name);
        if (sub) rows.push({ label: "Sub-Stat — " + sub.name, pct: sub.pct });
      });
      rows.push({ label: "Rolls " + countInfo.n + " Sub-Stats (" + rarity + ")", pct: countInfo.pct });

      relicStatTableBody.innerHTML = "";
      var total = 1;
      rows.forEach(function (row) {
        total *= row.pct / 100;
        var tr = document.createElement("tr");
        tr.innerHTML = "<td>" + row.label + "</td><td>" + row.pct.toFixed(2) + "%</td>";
        relicStatTableBody.appendChild(tr);
      });

      if (duplicate) {
        relicStatTotal.textContent = "Pick different Sub-Stats — a relic can't roll the same one twice.";
        return;
      }

      var totalPct = total * 100;
      var text = (totalPct > 0 && totalPct < 0.0001 ? totalPct.toExponential(2) : totalPct.toFixed(4)) + "%";
      if (total > 0) {
        text += " (~1 in " + Math.round(1 / total).toLocaleString() + " relics)";
      }
      relicStatTotal.textContent = text;
    }

    relicStatSlotSelect.addEventListener("change", function () {
      populateMainSelect();
      renderRelicStat();
    });
    relicStatRaritySelect.addEventListener("change", function () {
      populateSubSelects();
      renderRelicStat();
    });
    [relicStatMainSelect].concat(relicStatSubSelects).forEach(function (el) {
      el.addEventListener("change", renderRelicStat);
    });

    populateMainSelect();
    populateSubSelects();
    renderRelicStat();
  }

  // Shadow Sword drop odds
  var shadowGuildPerk = document.getElementById("shadowGuildPerk");
  var shadowDeepening = document.getElementById("shadowDeepening");
  var shadowDeathCoin = document.getElementById("shadowDeathCoin");
  var shadow2kHours = document.getElementById("shadow2kHours");
  var shadowPillar = document.getElementById("shadowPillar");
  var shadowPillarMult = document.getElementById("shadowPillarMult");
  var shadowSwordTableBody = document.querySelector("#shadowSwordTable tbody");
  var shadowSwordOverall = document.getElementById("shadowSwordOverall");
  var shadowSwordExpected = document.getElementById("shadowSwordExpected");

  if (shadowGuildPerk) {
    // base per-enemy chance and base enemy count (before Deepening) per floor, derived from the game's formula
    var SHADOW_SWORD_FLOORS = [
      { baseChance: 0.001, baseAmount: 5 },
      { baseChance: 0.002, baseAmount: 4 },
      { baseChance: 0.004, baseAmount: 3 },
      { baseChance: 0.008, baseAmount: 2 },
      { baseChance: 0.01, baseAmount: 2 },
      { baseChance: 0.025, baseAmount: 1 }
    ];

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function renderShadowSword() {
      var guildPerk = clamp(parseFloat(shadowGuildPerk.value) || 0, 0, 15);
      var deepening = clamp(parseFloat(shadowDeepening.value) || 0, 0, 2);
      var deathCoinMult = shadowDeathCoin.checked ? 2 : 1;
      var titleMult = shadow2kHours.checked ? 2 : 1;
      var pillarMult = shadowPillar.checked ? (parseFloat(shadowPillarMult.value) || 1) : 1;
      var perkMult = (1 + guildPerk * 0.1) * deathCoinMult * titleMult * pillarMult;

      shadowSwordTableBody.innerHTML = "";
      var noDropProduct = 1;
      var expectedSum = 0;

      SHADOW_SWORD_FLOORS.forEach(function (floor, i) {
        var chance = Math.min(floor.baseChance * perkMult, 1);
        var amount = Math.max(floor.baseAmount + deepening, 0);
        var floorChance = 1 - Math.pow(1 - chance, amount);
        noDropProduct *= (1 - floorChance);
        expectedSum += floorChance;

        var tr = document.createElement("tr");
        tr.innerHTML =
          "<td>Floor " + (i + 1) + "</td>" +
          "<td>" + (chance * 100).toFixed(3) + "%</td>" +
          "<td>" + amount + "</td>" +
          "<td>" + (floorChance * 100).toFixed(2) + "%</td>";
        shadowSwordTableBody.appendChild(tr);
      });

      shadowSwordOverall.textContent = ((1 - noDropProduct) * 100).toFixed(2) + "%";
      shadowSwordExpected.textContent = expectedSum.toFixed(2);
    }

    [shadowGuildPerk, shadowDeepening, shadowDeathCoin, shadow2kHours, shadowPillar, shadowPillarMult].forEach(function (el) {
      el.addEventListener("input", renderShadowSword);
      el.addEventListener("change", renderShadowSword);
    });
    renderShadowSword();
  }
})();
