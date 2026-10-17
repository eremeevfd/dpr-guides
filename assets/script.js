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
      var deathCoinBonus = shadowDeathCoin.checked ? 1 : 0;
      var titleBonus = shadow2kHours.checked ? 1 : 0;
      var pillarMult = shadowPillar.checked ? (parseFloat(shadowPillarMult.value) || 1) : 1;
      // Guild Perk, Death Coin and 2K Hours "+X%" bonuses add together; Pillar multiplies the sum.
      // Matches in-game odds: Guild Lv10 + Death Coin + Pillar = (1 + 1.0 + 1) * 3 = x9 base.
      var perkMult = (1 + guildPerk * 0.1 + deathCoinBonus + titleBonus) * pillarMult;

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

  // Nightmare Labyrinth expected rewards
  var labyrinthDifficulty = document.getElementById("labyrinthDifficulty");
  var labyrinthLevel = document.getElementById("labyrinthLevel");
  var labyrinthRuns = document.getElementById("labyrinthRuns");
  var labyrinthPuzzle = document.getElementById("labyrinthPuzzle");
  var labyrinthRarityBody = document.querySelector("#labyrinthRarityTable tbody");
  var labyrinthRewardBody = document.querySelector("#labyrinthRewardTable tbody");
  var labyrinthRunsHeader = document.getElementById("labyrinthRunsHeader");
  var labyrinthNote = document.getElementById("labyrinthNote");

  if (labyrinthDifficulty) {
    var LABYRINTH_REWARDS = [
      "Locks", "Weapon Stones", "Red Pot", "Rerolls", "Resets",
      "Blue Pot", "Exp Pot", "Evo Stone", "Horn Fragment", "Gold Weapon Stone", "Devil's Horn"
    ];
    // per chest rarity: [reward, drop weight, amount] — weights reproduce the sheet's rounded %s
    var LABYRINTH_CHESTS = {
      Uncommon: [["Locks", 1, 20], ["Weapon Stones", 1, 500]],
      Rare: [["Locks", 5, 50], ["Weapon Stones", 5, 1000], ["Red Pot", 2, 1]],
      Epic: [["Weapon Stones", 10, 2000], ["Red Pot", 3, 2], ["Rerolls", 3, 10], ["Resets", 3, 10]],
      Legendary: [["Weapon Stones", 100, 5000], ["Rerolls", 30, 20], ["Resets", 30, 20],
        ["Blue Pot", 10, 1], ["Evo Stone", 5, 1], ["Gold Weapon Stone", 2, 1]],
      Mythic: [["Locks", 100, 100], ["Rerolls", 30, 50], ["Resets", 30, 50],
        ["Exp Pot", 10, 1], ["Gold Weapon Stone", 3, 1], ["Devil's Horn", 1, 1]],
      Artifact: [["Horn Fragment", 100, 1], ["Gold Weapon Stone", 10, 1], ["Devil's Horn", 3, 1]]
    };
    // random chest rarity weights per difficulty; puzzle adds one guaranteed chest of `puzzle` rarity;
    // tickets = entry cost per run
    var LABYRINTH_DIFFICULTIES = {
      easy: { rarities: { Uncommon: 55, Rare: 25, Epic: 14, Legendary: 5 }, puzzle: "Epic", tickets: 1 },
      medium: { rarities: { Rare: 30, Epic: 15, Legendary: 8, Mythic: 1 }, puzzle: "Legendary", tickets: 1 },
      hard: { rarities: { Epic: 5, Legendary: 2, Mythic: 1 }, puzzle: "Mythic", tickets: 1 },
      hell: { rarities: { Legendary: 10, Mythic: 4, Artifact: 1 }, puzzle: "Artifact", tickets: 3 }
    };
    var LABYRINTH_CHESTS_PER_LEVEL = { 1: 2, 2: 3, 3: 5 };

    function sumWeights(weights) {
      return Object.keys(weights).reduce(function (sum, key) { return sum + weights[key]; }, 0);
    }

    function expectedFromChest(rarity) {
      var entries = LABYRINTH_CHESTS[rarity];
      var total = entries.reduce(function (sum, e) { return sum + e[1]; }, 0);
      var out = {};
      entries.forEach(function (e) { out[e[0]] = e[1] / total * e[2]; });
      return out;
    }

    function formatAmount(value) {
      if (value >= 100) return Math.round(value).toLocaleString();
      if (value >= 1) return value.toFixed(2);
      return value.toFixed(3);
    }

    function renderLabyrinth() {
      var difficulty = LABYRINTH_DIFFICULTIES[labyrinthDifficulty.value];
      var randomChests = LABYRINTH_CHESTS_PER_LEVEL[labyrinthLevel.value];
      var runs = Math.max(Math.floor(parseFloat(labyrinthRuns.value) || 1), 1);
      var puzzle = labyrinthPuzzle.checked;
      var rarityTotal = sumWeights(difficulty.rarities);
      var perRun = {};

      function addChests(rarity, count) {
        var expected = expectedFromChest(rarity);
        Object.keys(expected).forEach(function (name) {
          perRun[name] = (perRun[name] || 0) + expected[name] * count;
        });
      }

      labyrinthRarityBody.innerHTML = "";
      ["Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Artifact"].forEach(function (rarity) {
        var weight = difficulty.rarities[rarity] || 0;
        var randomCount = randomChests * weight / rarityTotal;
        var guaranteed = puzzle && difficulty.puzzle === rarity ? 1 : 0;
        if (!weight && !guaranteed) return;
        addChests(rarity, randomCount + guaranteed);
        var tr = document.createElement("tr");
        tr.innerHTML =
          "<td>" + rarity + "</td>" +
          "<td>" + (weight / rarityTotal * 100).toFixed(2) + "%</td>" +
          "<td>" + randomCount.toFixed(2) + (guaranteed ? " + 1 (puzzle)" : "") + "</td>";
        labyrinthRarityBody.appendChild(tr);
      });

      labyrinthRunsHeader.textContent = "Per " + runs + " Run" + (runs === 1 ? "" : "s");
      labyrinthRewardBody.innerHTML = "";
      LABYRINTH_REWARDS.forEach(function (name) {
        if (!perRun[name]) return;
        var tr = document.createElement("tr");
        tr.innerHTML =
          "<td>" + name + "</td>" +
          "<td>" + formatAmount(perRun[name]) + "</td>" +
          "<td>" + formatAmount(perRun[name] * runs) + "</td>";
        labyrinthRewardBody.appendChild(tr);
      });

      var tickets = difficulty.tickets * runs;
      labyrinthNote.textContent =
        "Costs " + tickets + " ticket" + (tickets === 1 ? "" : "s") + " for " + runs + " run" + (runs === 1 ? "" : "s") +
        " (" + difficulty.tickets + " per run). Levels 1/2/3 give 2/3/5 random chests. Solving the puzzle adds one guaranteed chest: " +
        "Epic on Easy, Legendary on Medium, Mythic on Hard, Artifact on Hell.";
    }

    [labyrinthDifficulty, labyrinthLevel, labyrinthRuns, labyrinthPuzzle].forEach(function (el) {
      el.addEventListener("input", renderLabyrinth);
      el.addEventListener("change", renderLabyrinth);
    });
    renderLabyrinth();
  }

  // Timeforged Sword damage: (TF level × online hours) ^ power, power set by evolution
  var tfHours = document.getElementById("tfHours");
  var tfLevel = document.getElementById("tfLevel");
  var tfEvo = document.getElementById("tfEvo");
  var tfLog = document.getElementById("tfLog");
  var tfDamage = document.getElementById("tfDamage");
  var tfTableBody = document.querySelector("#tfTable tbody");
  var tfChart = document.getElementById("tfChart");

  // shared chart helpers; TF_EVOS powers are also used by the Gold Weapon Stone tool
  var TF_EVOS = [
    { evo: 2, power: 0.5, color: "#97a2b4" },
    { evo: 3, power: 0.75, color: "#81c784" },
    { evo: 4, power: 1, color: "#ffd54f" },
    { evo: 5, power: 1.5, color: "#ff8a65" },
    { evo: 6, power: 2.5, color: "#4dd8ff" }
  ];
  var SVG_NS = "http://www.w3.org/2000/svg";

  function tfDamageAt(level, hours, power) {
    return Math.pow(level * hours, power);
  }

  function formatBig(value) {
    var units = [[1e15, "Q"], [1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
    for (var i = 0; i < units.length; i++) {
      if (value >= units[i][0]) {
        var scaled = value / units[i][0];
        if (scaled >= 1000) return value.toExponential(2);
        return parseFloat(scaled.toFixed(2)) + units[i][1];
      }
    }
    return parseFloat(value.toFixed(value < 10 ? 2 : 0)).toLocaleString();
  }

  function formatRatio(value) {
    if (value >= 1000) return "×" + formatBig(value);
    return "×" + parseFloat(value.toPrecision(3));
  }

  function niceStep(range, target) {
    var raw = range / target;
    var mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var norm = raw / mag;
    return (norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10) * mag;
  }

  function svgEl(name, attrs, text) {
    var el = document.createElementNS(SVG_NS, name);
    Object.keys(attrs).forEach(function (key) { el.setAttribute(key, attrs[key]); });
    if (text !== undefined) el.textContent = text;
    return el;
  }

  // coalesce bursts of input/change events (spinner auto-repeat, typing) into one render per frame
  function perFrame(fn) {
    var pending = false;
    return function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; fn(); });
    };
  }

  // Chrome changes a focused number input when the wheel scrolls over it; drop focus so scrolling the page can't edit values
  document.querySelectorAll("input[type=number]").forEach(function (input) {
    input.addEventListener("wheel", function () {
      if (document.activeElement === input) input.blur();
    }, { passive: true });
  });

  var CHART_GRID = "#1e2836";
  var CHART_TEXT = { fill: "#97a2b4", "font-size": 11, "font-family": "inherit" };
  var chartClipId = 0;

  // axes + grid for a line chart sized to its container; returns scales and a clipped layer for series
  function chartFrame(container, opts) {
    var width = Math.max(container.clientWidth - 8, 280);
    var height = Math.round(Math.min(Math.max(width * 0.55, 240), 380));
    var pad = { left: 52, right: opts.padRight || 44, top: 18, bottom: 42 };
    var plotW = width - pad.left - pad.right;
    var plotH = height - pad.top - pad.bottom;
    var xStep = niceStep(opts.xMax - opts.xMin, width < 420 ? 4 : 6);
    var xMin = Math.floor(opts.xMin / xStep) * xStep;
    var xMax = Math.ceil(opts.xMax / xStep) * xStep;
    var yLog = opts.yLog;
    var yMin = yLog ? Math.floor(Math.log10(opts.yMin)) : opts.yMin;
    var yMaxRaw = yLog ? Math.log10(opts.yMax) : opts.yMax;
    var yStep = yLog ? Math.max(1, Math.ceil((yMaxRaw - yMin) / 6)) : niceStep(yMaxRaw - yMin, 5);
    var yMax = yLog ? Math.ceil(yMaxRaw) : Math.ceil(yMaxRaw / yStep) * yStep;
    if (yMax <= yMin) yMax = yMin + yStep;

    function px(x) { return pad.left + (x - xMin) / (xMax - xMin) * plotW; }
    function py(y) {
      var v = yLog ? Math.log10(Math.max(y, 1e-12)) : y;
      return pad.top + plotH - (v - yMin) / (yMax - yMin) * plotH;
    }

    var svg = svgEl("svg", { viewBox: "0 0 " + width + " " + height, width: width, height: height, role: "img", "aria-label": opts.label });
    var clipId = "chartClip" + (++chartClipId);
    var clip = svgEl("clipPath", { id: clipId });
    clip.appendChild(svgEl("rect", { x: pad.left, y: pad.top, width: plotW, height: plotH }));
    svg.appendChild(clip);

    // ticks on round multiples of the step, plus the bottom edge when it isn't one
    var yTicks = [];
    if (yLog || Math.abs(yMin / yStep - Math.round(yMin / yStep)) > 1e-9) yTicks.push(yMin);
    for (var yt = Math.ceil(yMin / yStep - 1e-9) * yStep; yt <= yMax + yStep / 2; yt += yStep) {
      if (!yTicks.length || yt - yTicks[yTicks.length - 1] > yStep * 0.4) yTicks.push(yt);
    }
    yTicks.forEach(function (yt) {
      var y = pad.top + plotH - (yt - yMin) / (yMax - yMin) * plotH;
      svg.appendChild(svgEl("line", { x1: pad.left, x2: pad.left + plotW, y1: y, y2: y, stroke: CHART_GRID }));
      svg.appendChild(svgEl("text", Object.assign({ x: pad.left - 6, y: y + 4, "text-anchor": "end" }, CHART_TEXT),
        opts.yFormat(yLog ? Math.pow(10, yt) : yt)));
    });
    for (var xt = xMin; xt <= xMax + xStep / 2; xt += xStep) {
      var x = px(xt);
      svg.appendChild(svgEl("line", { x1: x, x2: x, y1: pad.top, y2: pad.top + plotH, stroke: CHART_GRID }));
      svg.appendChild(svgEl("text", Object.assign({ x: x, y: pad.top + plotH + 16, "text-anchor": "middle" }, CHART_TEXT), formatBig(xt)));
    }
    svg.appendChild(svgEl("text", Object.assign({ x: pad.left + plotW / 2, y: height - 6, "text-anchor": "middle" }, CHART_TEXT), opts.xLabel));

    var layer = svgEl("g", { "clip-path": "url(#" + clipId + ")" });
    svg.appendChild(layer);
    container.innerHTML = "";
    container.appendChild(svg);
    return { svg: svg, layer: layer, px: px, py: py, xMin: xMin, xMax: xMax, yMax: yLog ? Math.pow(10, yMax) : yMax,
      pad: pad, plotW: plotW, plotH: plotH };
  }

  function pointsAttr(frame, pts) {
    return pts.map(function (pt) { return frame.px(pt[0]).toFixed(1) + "," + frame.py(pt[1]).toFixed(1); }).join(" ");
  }

  if (tfHours) {
    function renderTfChart(level, hours, currentEvo, logScale) {
      // render at real pixel width so text stays readable on phones
      var width = Math.max(tfChart.clientWidth - 8, 280);
      var height = Math.round(Math.min(Math.max(width * 0.55, 240), 380));
      var pad = { left: 52, right: 44, top: 12, bottom: 30 };
      var plotW = width - pad.left - pad.right;
      var plotH = height - pad.top - pad.bottom;
      var xMax = Math.max(hours * 1.5, 100);
      var xStep = niceStep(xMax, width < 420 ? 4 : 6);
      xMax = Math.ceil(xMax / xStep) * xStep;
      var yMaxValue = Math.max(tfDamageAt(level, xMax, TF_EVOS[TF_EVOS.length - 1].power), 10);

      var yMin, yMax, yOf, yTicks = [];
      if (logScale) {
        yMin = 0;
        yMax = Math.ceil(Math.log10(yMaxValue));
        var decadeStep = Math.max(1, Math.ceil(yMax / (plotH < 260 ? 5 : 7)));
        for (var d = 0; d <= yMax; d += decadeStep) yTicks.push(d);
        yOf = function (v) { return Math.log10(Math.max(v, 1)); };
      } else {
        yMin = 0;
        var yStep = niceStep(yMaxValue, 5);
        yMax = Math.ceil(yMaxValue / yStep) * yStep;
        for (var t = 0; t <= yMax + yStep / 2; t += yStep) yTicks.push(t);
        yOf = function (v) { return v; };
      }
      function px(h) { return pad.left + h / xMax * plotW; }
      function py(v) { return pad.top + plotH - (yOf(v) - yMin) / (yMax - yMin) * plotH; }
      function pyRaw(y) { return pad.top + plotH - (y - yMin) / (yMax - yMin) * plotH; }

      var svg = svgEl("svg", {
        viewBox: "0 0 " + width + " " + height, width: width, height: height,
        role: "img", "aria-label": "Timeforged Sword damage curves for evolutions 2 to 6"
      });
      var axisStyle = { fill: "#97a2b4", "font-size": 11, "font-family": "inherit" };

      yTicks.forEach(function (tick) {
        var y = pyRaw(tick);
        svg.appendChild(svgEl("line", { x1: pad.left, x2: pad.left + plotW, y1: y, y2: y, stroke: "#1e2836" }));
        var label = logScale ? formatBig(Math.pow(10, tick)) : formatBig(tick);
        svg.appendChild(svgEl("text", Object.assign({ x: pad.left - 6, y: y + 4, "text-anchor": "end" }, axisStyle), label));
      });
      for (var xt = 0; xt <= xMax + xStep / 2; xt += xStep) {
        var x = px(xt);
        svg.appendChild(svgEl("line", { x1: x, x2: x, y1: pad.top, y2: pad.top + plotH, stroke: "#1e2836" }));
        svg.appendChild(svgEl("text", Object.assign({ x: x, y: height - 10, "text-anchor": "middle" }, axisStyle), formatBig(xt)));
      }
      svg.appendChild(svgEl("line", { x1: px(hours), x2: px(hours), y1: pad.top, y2: pad.top + plotH,
        stroke: "#e7ecf3", "stroke-opacity": 0.35, "stroke-dasharray": "4 4" }));

      var samples = 120;
      TF_EVOS.forEach(function (e) {
        var points = [];
        for (var i = 0; i <= samples; i++) {
          var h = xMax * i / samples;
          points.push(px(h).toFixed(1) + "," + py(tfDamageAt(level, h, e.power)).toFixed(1));
        }
        var isCurrent = e.evo === currentEvo;
        svg.appendChild(svgEl("polyline", {
          points: points.join(" "), fill: "none", stroke: e.color,
          "stroke-width": isCurrent ? 3 : 1.6, "stroke-opacity": isCurrent ? 1 : 0.75,
          "stroke-linejoin": "round"
        }));
        svg.appendChild(svgEl("circle", {
          cx: px(hours), cy: py(tfDamageAt(level, hours, e.power)), r: isCurrent ? 5 : 3.5,
          fill: e.color, stroke: "#0b0e14", "stroke-width": 1.5
        }));
        svg.appendChild(svgEl("text", {
          x: pad.left + plotW + 6, y: py(tfDamageAt(level, xMax, e.power)) + 4,
          fill: e.color, "font-size": 11, "font-weight": isCurrent ? 700 : 400, "font-family": "inherit"
        }, "Evo " + e.evo));
      });

      tfChart.innerHTML = "";
      tfChart.appendChild(svg);
    }

    function renderTimeforged() {
      var hours = Math.max(parseFloat(tfHours.value) || 0, 0);
      var level = Math.max(parseFloat(tfLevel.value) || 1, 1);
      var currentEvo = parseInt(tfEvo.value, 10);
      var current = TF_EVOS.filter(function (e) { return e.evo === currentEvo; })[0];
      var currentDamage = tfDamageAt(level, hours, current.power);

      tfDamage.textContent = formatBig(currentDamage) +
        (currentDamage >= 1000 ? " (" + Math.round(currentDamage).toLocaleString() + ")" : "");

      tfTableBody.innerHTML = "";
      TF_EVOS.forEach(function (e) {
        var damage = tfDamageAt(level, hours, e.power);
        var tr = document.createElement("tr");
        if (e.evo === currentEvo) tr.className = "tf-current";
        tr.innerHTML =
          "<td><span class=\"tf-swatch\" style=\"background:" + e.color + "\"></span>Evo " + e.evo + "</td>" +
          "<td>^" + e.power + "</td>" +
          "<td>" + formatBig(damage) + "</td>" +
          "<td>" + (currentDamage > 0 ? formatRatio(damage / currentDamage) : "—") + "</td>" +
          "<td>" + formatRatio(Math.pow(2, e.power)) + "</td>";
        tfTableBody.appendChild(tr);
      });

      renderTfChart(level, hours, currentEvo, tfLog.checked);
    }

    var scheduleTimeforged = perFrame(renderTimeforged);
    [tfHours, tfLevel, tfEvo, tfLog].forEach(function (el) {
      el.addEventListener("input", scheduleTimeforged);
      el.addEventListener("change", scheduleTimeforged);
    });
    var tfResizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(tfResizeTimer);
      tfResizeTimer = setTimeout(scheduleTimeforged, 150);
    });
    renderTimeforged();
  }

  // Gold Weapon Stone: +1 level to Sword of Darkness or Timeforged Sword, whichever multiplies damage more
  var gsDark = document.getElementById("gsDark");
  var gsTf = document.getElementById("gsTf");
  var gsEvo = document.getElementById("gsEvo");
  var gsStones = document.getElementById("gsStones");
  var gsTaiji = document.getElementById("gsTaiji");
  var gsVerdict = document.getElementById("gsVerdict");
  var gsTableBody = document.querySelector("#gsTable tbody");
  var gsPlanLabel = document.getElementById("gsPlanLabel");
  var gsPlan = document.getElementById("gsPlan");
  var gsNote = document.getElementById("gsNote");
  var gsMapChart = document.getElementById("gsMapChart");
  var gsPayoffChart = document.getElementById("gsPayoffChart");

  if (gsDark) {
    var SOD_MAX = 60; // in-game cap: Gold Weapon Stones can't level SoD past this

    // SoD level L → L+1 scales its own bonus by (L+2)/(L+1); with Taiji counted, Taiji's power scales by the same factor
    function sodGain(dark, taiji) {
      return Math.pow((dark + 2) / (dark + 1), taiji ? 2 : 1);
    }

    // a maxed SoD can't take the stone, so its gain is 0 and TF always wins
    function sodNext(dark, taiji) {
      return dark < SOD_MAX ? sodGain(dark, taiji) : 0;
    }

    function tfGain(tf, power) {
      return Math.pow((tf + 1) / tf, power);
    }

    function formatGain(gain) {
      return "+" + ((gain - 1) * 100).toFixed(2) + "%";
    }

    function renderGoldStone() {
      var dark = Math.min(Math.max(Math.floor(parseFloat(gsDark.value) || 0), 0), SOD_MAX);
      var tf = Math.max(Math.floor(parseFloat(gsTf.value) || 1), 1);
      var power = parseFloat(gsEvo.value);
      var stones = Math.min(Math.max(Math.floor(parseFloat(gsStones.value) || 1), 1), 10000);
      var taiji = gsTaiji.checked;
      var sodMaxed = dark >= SOD_MAX;
      var sod = sodNext(dark, taiji);
      var tfg = tfGain(tf, power);

      gsVerdict.textContent = sod >= tfg ? "Sword of Darkness" : "Timeforged Sword" + (sodMaxed ? " (SoD is maxed)" : "");
      gsTableBody.innerHTML = "";
      [[sodMaxed ? "SoD Lv." + dark + " (max)" : "SoD Lv." + dark + " → " + (dark + 1), sod, sod >= tfg],
        ["TF Lv." + tf + " → " + (tf + 1), tfg, tfg > sod]].forEach(function (row) {
        var tr = document.createElement("tr");
        if (row[2]) tr.className = "tf-current";
        tr.innerHTML = "<td>" + row[0] + "</td><td>" + (row[1] ? formatGain(row[1]) : "—") + "</td>";
        gsTableBody.appendChild(tr);
      });

      // each sword's gain per level shrinks as it levels, so spending stones one at a time on the bigger gain is optimal
      var d = dark, t = tf, toSod = 0, total = 1;
      var path = [[d, t]];
      var payoff = { best: [[0, 1]], sod: [[0, 1]], tf: [[0, 1]] };
      var sodOnly = 1, tfOnly = 1;
      // keep charts to a few hundred points however many stones are spent
      var every = Math.ceil(stones / 300);
      for (var i = 0; i < stones; i++) {
        var gs = sodNext(d, taiji), gt = tfGain(t, power);
        if (gs >= gt) { d++; toSod++; total *= gs; } else { t++; total *= gt; }
        // stones past the cap can't go to SoD, so the all-SoD line goes flat there
        if (dark + i < SOD_MAX) sodOnly *= sodGain(dark + i, taiji);
        tfOnly *= tfGain(tf + i, power);
        if ((i + 1) % every && i + 1 < stones) continue;
        path.push([d, t]);
        payoff.best.push([i + 1, total]);
        payoff.sod.push([i + 1, sodOnly]);
        payoff.tf.push([i + 1, tfOnly]);
      }
      gsPlanLabel.textContent = "Best split of " + stones + " stone" + (stones === 1 ? "" : "s") + ":";
      gsPlan.textContent = toSod + " to SoD (Lv." + d + "), " + (stones - toSod) + " to TF (Lv." + t + "), total damage ×" +
        parseFloat(total.toPrecision(4));

      // at the current TF level, the first SoD level whose next stone is worth less than a TF level
      var note;
      if (sodMaxed) {
        note = "SoD is at its max level (" + SOD_MAX + "), so every stone goes to TF. ";
      } else if (sod >= tfg) {
        var switchAt = dark;
        while (switchAt < SOD_MAX && sodGain(switchAt, taiji) >= tfg) switchAt++;
        note = switchAt === SOD_MAX
          ? "At TF Lv." + tf + ", SoD stays the better pick all the way to its max, Lv." + SOD_MAX + ". "
          : "At TF Lv." + tf + ", SoD stays the better pick up to Lv." + switchAt + ". ";
      } else {
        note = "TF is ahead: its next level beats SoD's. ";
      }
      gsNote.textContent = note + (taiji
        ? "Counting Taiji assumes most of your damage lands while Taiji is active. Untick it to compare damage outside Taiji only."
        : "Without Taiji, a SoD level only grows SoD's own multiplier.");

      renderGsMap(dark, tf, power, taiji, path);
      renderGsPayoff(payoff);
    }

    // TF level at which a TF stone is worth exactly as much as a SoD stone at SoD level `dark`
    function tfBreakEven(dark, power, taiji) {
      return 1 / (Math.pow(sodGain(dark, taiji), 1 / power) - 1);
    }

    function renderGsMap(dark, tf, power, taiji, path) {
      var end = path[path.length - 1];
      var switchD = (taiji ? 2 : 1) / power * (tf + 0.5) - 1.5;
      // nothing past the SoD cap is reachable, so the map stops there
      var xMax = Math.min(Math.max(dark, end[0], switchD, 20) * 1.2, SOD_MAX);
      var yMax = Math.max(tf, end[1], tfBreakEven(Math.max(dark, end[0]), power, taiji), 20) * 1.2;
      var frame = chartFrame(gsMapChart, {
        xMin: 0, xMax: xMax, yMin: 0, yMax: yMax, yLog: false, padRight: 16,
        xLabel: "SoD level", label: "SoD level vs TF level: which sword the next Gold Weapon Stone should level",
        yFormat: formatBig
      });
      var top = frame.yMax, right = frame.xMax, samples = 120;

      function boundary(p) {
        var pts = [];
        for (var i = 0; i <= samples; i++) {
          var x = right * i / samples;
          pts.push([x, Math.min(tfBreakEven(x, p, taiji), top * 2)]);
        }
        return pts;
      }

      var mine = boundary(power);
      frame.layer.appendChild(svgEl("polygon", { points: pointsAttr(frame, mine.concat([[right, top * 2], [0, top * 2]])), fill: "#b39ddb", "fill-opacity": 0.12 }));
      frame.layer.appendChild(svgEl("polygon", { points: pointsAttr(frame, mine.concat([[right, 0], [0, 0]])), fill: "#ffb74d", "fill-opacity": 0.12 }));
      TF_EVOS.forEach(function (e) {
        if (e.power === power) return;
        frame.layer.appendChild(svgEl("polyline", { points: pointsAttr(frame, boundary(e.power)), fill: "none", stroke: "#97a2b4", "stroke-opacity": 0.45, "stroke-width": 1.2, "stroke-dasharray": "5 4" }));
      });
      frame.layer.appendChild(svgEl("polyline", { points: pointsAttr(frame, mine), fill: "none", stroke: "#e7ecf3", "stroke-width": 2.2 }));

      // label each evo line where it leaves the plot (top edge or right edge)
      TF_EVOS.forEach(function (e) {
        var atRight = tfBreakEven(right, e.power, taiji);
        var lx, ly, anchor = "end";
        if (atRight <= top) { lx = frame.px(right) - 4; ly = frame.py(atRight) - 5; }
        else {
          var dTop = 1 / (Math.pow((top + 1) / top, e.power / (taiji ? 2 : 1)) - 1) - 1;
          // line leaves through the top: label just right of it, unless that runs off the plot
          lx = frame.px(dTop) + 6; ly = frame.py(top) + 13;
          anchor = lx + 44 > frame.px(right) ? "end" : "start";
          if (anchor === "end") lx -= 12;
        }
        frame.svg.appendChild(svgEl("text", { x: lx, y: ly, "text-anchor": anchor, "font-size": 11, "font-family": "inherit",
          fill: e.power === power ? "#e7ecf3" : "#97a2b4", "font-weight": e.power === power ? 700 : 400 }, "Evo " + e.evo));
      });
      if (frame.xMax >= SOD_MAX) {
        frame.layer.appendChild(svgEl("line", { x1: frame.px(SOD_MAX), x2: frame.px(SOD_MAX), y1: frame.py(0), y2: frame.py(top),
          stroke: "#e7ecf3", "stroke-opacity": 0.35, "stroke-dasharray": "4 4" }));
        frame.svg.appendChild(svgEl("text", { x: frame.px(SOD_MAX) - 4, y: frame.pad.top + frame.plotH / 2, "text-anchor": "end", fill: CHART_TEXT.fill, "font-size": 11, "font-family": "inherit" }, "SoD max"));
      }
      frame.svg.appendChild(svgEl("text", { x: frame.pad.left + 8, y: frame.pad.top + 18, fill: "#b39ddb", "font-size": 12, "font-weight": 700, "font-family": "inherit" }, "SoD better"));
      frame.svg.appendChild(svgEl("text", { x: frame.pad.left + frame.plotW - 8, y: frame.pad.top + frame.plotH - 8, "text-anchor": "end", fill: "#ffb74d", "font-size": 12, "font-weight": 700, "font-family": "inherit" }, "TF better"));
      frame.svg.appendChild(svgEl("text", { x: 12, y: frame.pad.top + frame.plotH / 2, transform: "rotate(-90 12 " + (frame.pad.top + frame.plotH / 2) + ")", "text-anchor": "middle", fill: CHART_TEXT.fill, "font-size": 11, "font-family": "inherit" }, "TF level"));

      if (path.length > 1) {
        frame.layer.appendChild(svgEl("polyline", { points: pointsAttr(frame, path), fill: "none", stroke: "#4dd8ff", "stroke-width": 2, "stroke-linejoin": "round" }));
        frame.layer.appendChild(svgEl("circle", { cx: frame.px(end[0]), cy: frame.py(end[1]), r: 4.5, fill: "#0b0e14", stroke: "#4dd8ff", "stroke-width": 2 }));
      }
      frame.layer.appendChild(svgEl("circle", { cx: frame.px(dark), cy: frame.py(tf), r: 5.5, fill: "#4dd8ff", stroke: "#0b0e14", "stroke-width": 1.5 }));
    }

    function renderGsPayoff(payoff) {
      var series = [
        { key: "tf", name: "All to TF", color: "#ffb74d", width: 1.6 },
        { key: "sod", name: "All to SoD", color: "#b39ddb", width: 1.6 },
        { key: "best", name: "Best split", color: "#4dd8ff", width: 2.8 }
      ];
      var n = payoff.best.length - 1; // last point index, not stone count (points are downsampled)
      var yTop = Math.max(payoff.best[n][1], payoff.sod[n][1], payoff.tf[n][1]);
      var yLog = yTop >= 100;
      var frame = chartFrame(gsPayoffChart, {
        xMin: 0, xMax: Math.max(payoff.best[n][0], 1), yMin: 1, yMax: yTop * 1.05, yLog: yLog, padRight: 76,
        xLabel: "Gold Weapon Stones spent", label: "Total damage multiplier vs Gold Weapon Stones spent",
        yFormat: function (v) { return formatRatio(v); }
      });
      var labelYs = [];
      series.forEach(function (sr) {
        var pts = payoff[sr.key];
        frame.layer.appendChild(svgEl("polyline", { points: pointsAttr(frame, pts), fill: "none", stroke: sr.color, "stroke-width": sr.width, "stroke-linejoin": "round" }));
        var y = frame.py(pts[n][1]) + 4;
        // nudge labels apart when lines end close together
        labelYs.forEach(function (other) { if (Math.abs(other - y) < 13) y = other + (y >= other ? 13 : -13); });
        labelYs.push(y);
        frame.svg.appendChild(svgEl("text", { x: frame.px(frame.xMax) + 6, y: y, fill: sr.color, "font-size": 11, "font-family": "inherit", "font-weight": sr.key === "best" ? 700 : 400 },
          sr.name));
      });
    }

    var scheduleGoldStone = perFrame(renderGoldStone);
    [gsDark, gsTf, gsEvo, gsStones, gsTaiji].forEach(function (el) {
      el.addEventListener("input", scheduleGoldStone);
      el.addEventListener("change", scheduleGoldStone);
    });
    var gsResizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(gsResizeTimer);
      gsResizeTimer = setTimeout(scheduleGoldStone, 150);
    });
    renderGoldStone();
  }
})();
