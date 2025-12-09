// ----- DATA MODEL & STORAGE -----

const STORAGE_KEY = "dnd_control_center_data_v1";

let state = {
  campaignName: "My Campaign",
  characters: [],
  selectedCharacterId: null,
  initiative: {
    combatants: [],
    round: 1,
    currentIndex: -1
  },
  notes: {
    session: "",
    world: "",
    rules: ""
  },
  diceHistory: []
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state = {
      ...state,
      ...parsed
    };
  } catch (e) {
    console.error("Failed to load state", e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state", e);
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

// ----- INIT -----

document.addEventListener("DOMContentLoaded", () => {
  loadState();
  initTabs();
  bindGlobalControls();
  renderAll();
});

// ----- TABS -----

function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      document
        .querySelectorAll(".tab-button")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      document
        .querySelectorAll(".tab-content")
        .forEach((section) => section.classList.remove("active"));

      const section = document.getElementById(`tab-${target}`);
      if (section) section.classList.add("active");
    });
  });
}

// ----- GLOBAL CONTROLS & SETTINGS -----

function bindGlobalControls() {
  // Campaign name display/edit
  const campaignDisplay = document.getElementById("campaign-name-display");
  const editCampaignBtn = document.getElementById("edit-campaign-btn");
  const campaignNameInput = document.getElementById("campaign-name-input");
  const saveCampaignBtn = document.getElementById("save-campaign-name-btn");

  function updateCampaignDisplay() {
    campaignDisplay.innerHTML = `Campaign: <strong>${state.campaignName}</strong>`;
    if (campaignNameInput) campaignNameInput.value = state.campaignName;
  }

  editCampaignBtn.addEventListener("click", () => {
    document
      .querySelector('[data-tab="settings"]')
      .click();
    campaignNameInput.focus();
  });

  saveCampaignBtn.addEventListener("click", () => {
    const val = campaignNameInput.value.trim();
    if (!val) {
      showToast("Campaign name cannot be empty.");
      return;
    }
    state.campaignName = val;
    saveState();
    updateCampaignDisplay();
    showToast("Campaign name saved.");
  });

  updateCampaignDisplay();

  // Export / Import / Reset
  const exportBtn = document.getElementById("export-data-btn");
  const importInput = document.getElementById("import-data-input");
  const importBtn = document.getElementById("import-data-btn");
  const resetAllBtn = document.getElementById("reset-all-btn");

  exportBtn.addEventListener("click", () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dnd_control_center_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Exported data as JSON file.");
  });

  importBtn.addEventListener("click", () => {
    if (!importInput.files || !importInput.files[0]) {
      showToast("Choose a JSON file first.");
      return;
    }
    const file = importInput.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        state = { ...state, ...imported };
        saveState();
        renderAll();
        showToast("Imported data.");
      } catch (err) {
        console.error(err);
        showToast("Failed to import JSON.");
      }
    };
    reader.readAsText(file);
  });

  resetAllBtn.addEventListener("click", () => {
    const ok = confirm(
      "This will erase all characters, initiative, and notes from this browser. Continue?"
    );
    if (!ok) return;
    state = {
      campaignName: "My Campaign",
      characters: [],
      selectedCharacterId: null,
      initiative: {
        combatants: [],
        round: 1,
        currentIndex: -1
      },
      notes: {
        session: "",
        world: "",
        rules: ""
      },
      diceHistory: []
    };
    saveState();
    renderAll();
    showToast("All data reset.");
  });

  // Notes bindings
  const sessionNotes = document.getElementById("session-notes");
  const worldNotes = document.getElementById("world-notes");
  const rulesNotes = document.getElementById("rules-notes");

  sessionNotes.value = state.notes.session || "";
  worldNotes.value = state.notes.world || "";
  rulesNotes.value = state.notes.rules || "";

  sessionNotes.addEventListener("input", () => {
    state.notes.session = sessionNotes.value;
    saveState();
  });
  worldNotes.addEventListener("input", () => {
    state.notes.world = worldNotes.value;
    saveState();
  });
  rulesNotes.addEventListener("input", () => {
    state.notes.rules = rulesNotes.value;
    saveState();
  });

  // Characters
  document
    .getElementById("add-character-btn")
    .addEventListener("click", () => onAddCharacter());

  // Dice
  initDiceControls();

  // Initiative
  initInitiativeControls();
}

// ----- RENDER ALL -----

function renderAll() {
  renderCharacters();
  renderCharacterDetail();
  renderInitiative();
  renderDice();
}

// ----- CHARACTERS -----

function onAddCharacter() {
  const name = prompt("Character name?");
  if (!name) return;
  const cls = prompt("Class? (optional)") || "";
  const levelStr = prompt("Level? (number, optional)") || "";
  const level = parseInt(levelStr) || 1;
  const maxHpStr = prompt("Max HP? (optional)") || "";
  const maxHp = parseInt(maxHpStr) || 10;

  const id = "c" + Date.now();
  const newChar = {
    id,
    name,
    class: cls,
    level,
    stats: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10
    },
    hp: {
      current: maxHp,
      max: maxHp
    },
    ac: 10,
    speed: 30,
    spells: "",
    inventory: "",
    notes: ""
  };
  state.characters.push(newChar);
  state.selectedCharacterId = id;
  saveState();
  renderCharacters();
  renderCharacterDetail();
  showToast("Character created.");
}

function renderCharacters() {
  const container = document.getElementById("character-list");
  container.innerHTML = "";
  if (!state.characters.length) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent =
      "No characters yet. Create one to get started.";
    container.appendChild(empty);
    return;
  }

  state.characters.forEach((ch) => {
    const card = document.createElement("div");
    card.className = "character-card";
    card.addEventListener("click", () => {
      state.selectedCharacterId = ch.id;
      saveState();
      renderCharacterDetail();
    });

    const header = document.createElement("div");
    header.className = "character-card-header";

    const left = document.createElement("div");
    const nameEl = document.createElement("div");
    nameEl.className = "character-name";
    nameEl.textContent = ch.name;

    const meta = document.createElement("div");
    meta.className = "character-meta";
    meta.textContent =
      (ch.class || "Unknown class") + " • Lv " + (ch.level || 1);
    left.appendChild(nameEl);
    left.appendChild(meta);

    const hpPill = document.createElement("div");
    hpPill.className = "character-hp-pill";
    hpPill.textContent = `${ch.hp.current}/${ch.hp.max} HP`;

    header.appendChild(left);
    header.appendChild(hpPill);

    card.appendChild(header);
    container.appendChild(card);
  });
}

function getSelectedCharacter() {
  return state.characters.find((c) => c.id === state.selectedCharacterId);
}

function renderCharacterDetail() {
  const detail = document.getElementById("character-detail");
  const ch = getSelectedCharacter();
  if (!ch) {
    detail.classList.add("hidden");
    detail.innerHTML = "";
    return;
  }

  detail.classList.remove("hidden");
  detail.innerHTML = "";

  const header = document.createElement("div");
  header.className = "character-detail-header";

  const title = document.createElement("h3");
  title.textContent = ch.name;

  const subtitle = document.createElement("div");
  subtitle.className = "muted";
  subtitle.textContent =
    (ch.class || "Class?") + " • Level " + (ch.level || 1);

  const leftHeader = document.createElement("div");
  leftHeader.appendChild(title);
  leftHeader.appendChild(subtitle);

  const buttons = document.createElement("div");
  const editNameBtn = document.createElement("button");
  editNameBtn.className = "btn btn-secondary";
  editNameBtn.textContent = "Edit Basics";
  editNameBtn.addEventListener("click", () => editCharacterBasics(ch.id));

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn btn-danger";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", () => deleteCharacter(ch.id));

  buttons.appendChild(editNameBtn);
  buttons.appendChild(deleteBtn);

  header.appendChild(leftHeader);
  header.appendChild(buttons);

  detail.appendChild(header);

  const leftCol = document.createElement("div");
  const rightCol = document.createElement("div");

  // Stats
  const statsBox = document.createElement("div");
  statsBox.className = "section-box";
  const statsTitle = document.createElement("h4");
  statsTitle.textContent = "Ability Scores";
  statsBox.appendChild(statsTitle);

  const statGrid = document.createElement("div");
  statGrid.className = "stat-grid";

  const statKeys = [
    ["STR", "str"],
    ["DEX", "dex"],
    ["CON", "con"],
    ["INT", "int"],
    ["WIS", "wis"],
    ["CHA", "cha"]
  ];

  statKeys.forEach(([label, key]) => {
    const pill = document.createElement("div");
    pill.className = "stat-pill";
    const t = document.createElement("div");
    t.className = "stat-pill-title";
    t.textContent = label;
    const val = document.createElement("div");
    val.className = "stat-pill-main";
    val.textContent = ch.stats[key];

    pill.appendChild(t);
    pill.appendChild(val);
    pill.addEventListener("click", () =>
      editStat(ch.id, key, label)
    );
    statGrid.appendChild(pill);
  });

  statsBox.appendChild(statGrid);
  leftCol.appendChild(statsBox);

  // Combat block
  const combatBox = document.createElement("div");
  combatBox.className = "section-box";
  const combatTitle = document.createElement("h4");
  combatTitle.textContent = "Combat";
  combatBox.appendChild(combatTitle);

  const hpRow = document.createElement("div");
  hpRow.style.display = "flex";
  hpRow.style.alignItems = "center";
  hpRow.style.gap = "6px";
  hpRow.style.marginBottom = "4px";

  const hpLabel = document.createElement("span");
  hpLabel.className = "muted";
  hpLabel.textContent = "HP:";

  const hpVal = document.createElement("span");
  hpVal.textContent = `${ch.hp.current}/${ch.hp.max}`;

  const hpEditBtn = document.createElement("button");
  hpEditBtn.className = "btn btn-tertiary";
  hpEditBtn.textContent = "Adjust";
  hpEditBtn.addEventListener("click", () =>
    editHp(ch.id)
  );

  hpRow.appendChild(hpLabel);
  hpRow.appendChild(hpVal);
  hpRow.appendChild(hpEditBtn);
  combatBox.appendChild(hpRow);

  const acRow = document.createElement("div");
  acRow.style.display = "flex";
  acRow.style.alignItems = "center";
  acRow.style.gap = "6px";

  const acLabel = document.createElement("span");
  acLabel.className = "muted";
  acLabel.textContent = "AC:";

  const acVal = document.createElement("span");
  acVal.textContent = ch.ac;

  const acBtn = document.createElement("button");
  acBtn.className = "btn btn-ghost";
  acBtn.textContent = "Edit";
  acBtn.addEventListener("click", () =>
    editAc(ch.id)
  );

  acRow.appendChild(acLabel);
  acRow.appendChild(acVal);
  acRow.appendChild(acBtn);
  combatBox.appendChild(acRow);

  leftCol.appendChild(combatBox);

  // Notes, inventory, spells
  const invBox = document.createElement("div");
  invBox.className = "section-box";
  const invTitle = document.createElement("h4");
  invTitle.textContent = "Inventory";
  const invArea = document.createElement("textarea");
  invArea.value = ch.inventory || "";
  invArea.addEventListener("input", () => {
    ch.inventory = invArea.value;
    saveState();
  });
  invBox.appendChild(invTitle);
  invBox.appendChild(invArea);
  leftCol.appendChild(invBox);

  const spellsBox = document.createElement("div");
  spellsBox.className = "section-box";
  const spellsTitle = document.createElement("h4");
  spellsTitle.textContent = "Spells / Abilities";
  const spellsArea = document.createElement("textarea");
  spellsArea.value = ch.spells || "";
  spellsArea.addEventListener("input", () => {
    ch.spells = spellsArea.value;
    saveState();
  });
  spellsBox.appendChild(spellsTitle);
  spellsBox.appendChild(spellsArea);
  leftCol.appendChild(spellsBox);

  const notesBox = document.createElement("div");
  notesBox.className = "section-box";
  const notesTitle = document.createElement("h4");
  notesTitle.textContent = "Personal Notes";
  const notesArea = document.createElement("textarea");
  notesArea.value = ch.notes || "";
  notesArea.addEventListener("input", () => {
    ch.notes = notesArea.value;
    saveState();
  });
  notesBox.appendChild(notesTitle);
  notesBox.appendChild(notesArea);
  rightCol.appendChild(notesBox);

  detail.appendChild(leftCol);
  detail.appendChild(rightCol);
}

function editCharacterBasics(id) {
  const ch = state.characters.find((c) => c.id === id);
  if (!ch) return;
  const name = prompt("Name:", ch.name);
  if (!name) return;
  const cls = prompt("Class:", ch.class);
  const lvlStr = prompt("Level:", ch.level);
  const lvl = parseInt(lvlStr) || ch.level;
  ch.name = name;
  ch.class = cls;
  ch.level = lvl;
  saveState();
  renderCharacters();
  renderCharacterDetail();
}

function deleteCharacter(id) {
  const ch = state.characters.find((c) => c.id === id);
  if (!ch) return;
  const ok = confirm(
    `Delete ${ch.name}? This cannot be undone.`
  );
  if (!ok) return;
  state.characters = state.characters.filter((c) => c.id !== id);
  if (state.selectedCharacterId === id) {
    state.selectedCharacterId = state.characters[0]?.id || null;
  }
  saveState();
  renderCharacters();
  renderCharacterDetail();
  showToast("Character deleted.");
}

function editStat(id, key, label) {
  const ch = state.characters.find((c) => c.id === id);
  if (!ch) return;
  const newValStr = prompt(
    `New ${label} score:`,
    ch.stats[key]
  );
  if (!newValStr) return;
  const newVal = parseInt(newValStr);
  if (isNaN(newVal)) {
    showToast("Invalid number.");
    return;
  }
  ch.stats[key] = newVal;
  saveState();
  renderCharacterDetail();
}

function editHp(id) {
  const ch = state.characters.find((c) => c.id === id);
  if (!ch) return;
  const curStr = prompt("Current HP:", ch.hp.current);
  if (!curStr) return;
  const maxStr = prompt("Max HP:", ch.hp.max);
  if (!maxStr) return;
  const cur = parseInt(curStr);
  const max = parseInt(maxStr);
  if (isNaN(cur) || isNaN(max)) {
    showToast("Invalid HP.");
    return;
  }
  ch.hp.current = cur;
  ch.hp.max = max;
  saveState();
  renderCharacterDetail();
}

function editAc(id) {
  const ch = state.characters.find((c) => c.id === id);
  if (!ch) return;
  const acStr = prompt("Armor Class (AC):", ch.ac);
  if (!acStr) return;
  const ac = parseInt(acStr);
  if (isNaN(ac)) {
    showToast("Invalid AC.");
    return;
  }
  ch.ac = ac;
  saveState();
  renderCharacterDetail();
}

// ----- DICE ROLLER -----

function initDiceControls() {
  const diceButtons = document.querySelectorAll(".dice-btn");
  const countInput = document.getElementById("dice-count-input");
  const modInput = document.getElementById("dice-mod-input");
  const customDieInput = document.getElementById("custom-die-input");
  const rollCustomBtn = document.getElementById("roll-custom-die-btn");
  const advBtn = document.getElementById("roll-adv-btn");
  const disBtn = document.getElementById("roll-dis-btn");

  diceButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const die = parseInt(btn.dataset.die);
      const count = parseInt(countInput.value) || 1;
      const mod = parseInt(modInput.value) || 0;
      rollDice(die, count, mod, "normal");
    });
  });

  rollCustomBtn.addEventListener("click", () => {
    const die = parseInt(customDieInput.value);
    if (isNaN(die) || die < 2) {
      showToast("Invalid custom die.");
      return;
    }
    const count = parseInt(countInput.value) || 1;
    const mod = parseInt(modInput.value) || 0;
    rollDice(die, count, mod, "normal");
  });

  advBtn.addEventListener("click", () => {
    rollAdvantage("adv");
  });

  disBtn.addEventListener("click", () => {
    rollAdvantage("dis");
  });

  renderDice();
}

function rollDice(die, count, mod, mode) {
  const rolls = [];
  for (let i = 0; i < count; i++) {
    rolls.push(1 + Math.floor(Math.random() * die));
  }
  const sum = rolls.reduce((a, b) => a + b, 0);
  const total = sum + mod;

  const main = document.getElementById("dice-result-main");
  const detail = document.getElementById("dice-result-detail");
  main.textContent = total;
  detail.textContent = `${count}d${die} ${
    mod >= 0 ? "+" : "-"
  } ${Math.abs(mod)} = [${rolls.join(", ")}]`;

  const entry = {
    id: Date.now(),
    type: "standard",
    mode,
    die,
    count,
    mod,
    rolls,
    total,
    timestamp: new Date().toISOString()
  };
  state.diceHistory.unshift(entry);
  if (state.diceHistory.length > 50) {
    state.diceHistory.pop();
  }
  saveState();
  renderDiceHistory();
}

function rollAdvantage(kind) {
  const die = 20;
  const roll1 = 1 + Math.floor(Math.random() * die);
  const roll2 = 1 + Math.floor(Math.random() * die);
  let chosen, label;
  if (kind === "adv") {
    chosen = Math.max(roll1, roll2);
    label = "Advantage";
  } else {
    chosen = Math.min(roll1, roll2);
    label = "Disadvantage";
  }

  const main = document.getElementById("dice-result-main");
  const detail = document.getElementById("dice-result-detail");
  main.textContent = chosen;
  detail.textContent = `${label}: [${roll1}, ${roll2}] → ${chosen}`;

  const entry = {
    id: Date.now(),
    type: kind,
    die,
    count: 1,
    mod: 0,
    rolls: [roll1, roll2],
    total: chosen,
    timestamp: new Date().toISOString()
  };
  state.diceHistory.unshift(entry);
  if (state.diceHistory.length > 50) {
    state.diceHistory.pop();
  }
  saveState();
  renderDiceHistory();
}

function renderDice() {
  if (!state.diceHistory.length) return;
  const last = state.diceHistory[0];
  const main = document.getElementById("dice-result-main");
  const detail = document.getElementById("dice-result-detail");
  main.textContent = last.total;
  if (last.type === "standard") {
    detail.textContent = `${last.count}d${last.die} ${
      last.mod >= 0 ? "+" : "-"
    } ${Math.abs(last.mod)} = [${last.rolls.join(", ")}]`;
  } else {
    const label = last.type === "adv" ? "Advantage" : "Disadvantage";
    detail.textContent = `${label}: [${last.rolls.join(", ")}] → ${last.total}`;
  }
  renderDiceHistory();
}

function renderDiceHistory() {
  const container = document.getElementById("dice-history");
  container.innerHTML = "";
  state.diceHistory.forEach((entry) => {
    const div = document.createElement("div");
    div.className = "dice-history-entry";
    const time = new Date(entry.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
    if (entry.type === "standard") {
      div.textContent = `[${time}] ${entry.count}d${entry.die} ${
        entry.mod >= 0 ? "+" : "-"
      } ${Math.abs(entry.mod)} = ${entry.total}`;
    } else {
      const label = entry.type === "adv" ? "Adv" : "Dis";
      div.textContent = `[${time}] d20 ${label} → ${entry.total}`;
    }
    container.appendChild(div);
  });
}

// ----- INITIATIVE -----

function initInitiativeControls() {
  const addBtn = document.getElementById("add-combatant-btn");
  const saveBtn = document.getElementById("save-combatant-btn");
  const resetFormBtn = document.getElementById("reset-combatant-form-btn");
  const clearBtn = document.getElementById("clear-initiative-btn");
  const sortBtn = document.getElementById("sort-initiative-btn");
  const nextTurnBtn = document.getElementById("next-turn-btn");

  addBtn.addEventListener("click", () => {
    resetCombatantForm();
    const nameInput = document.getElementById("combatant-name-input");
    nameInput.focus();
  });

  saveBtn.addEventListener("click", () => {
    saveCombatant();
  });

  resetFormBtn.addEventListener("click", () => {
    resetCombatantForm();
  });

  clearBtn.addEventListener("click", () => {
    const ok = confirm("Clear initiative order?");
    if (!ok) return;
    state.initiative.combatants = [];
    state.initiative.round = 1;
    state.initiative.currentIndex = -1;
    saveState();
    renderInitiative();
  });

  sortBtn.addEventListener("click", () => {
    state.initiative.combatants.sort(
      (a, b) => b.initiative - a.initiative
    );
    saveState();
    renderInitiative();
  });

  nextTurnBtn.addEventListener("click", () => {
    advanceTurn();
  });
}

function resetCombatantForm() {
  document.getElementById("combatant-name-input").value = "";
  document.getElementById("combatant-init-input").value = "";
  document.getElementById("combatant-hp-input").value = "";
  document.getElementById("combatant-type-input").value = "pc";
  document
    .getElementById("save-combatant-btn")
    .setAttribute("data-edit-id", "");
}

function saveCombatant() {
  const nameInput = document.getElementById("combatant-name-input");
  const initInput = document.getElementById("combatant-init-input");
  const hpInput = document.getElementById("combatant-hp-input");
  const typeInput = document.getElementById("combatant-type-input");
  const saveBtn = document.getElementById("save-combatant-btn");

  const name = nameInput.value.trim();
  if (!name) {
    showToast("Combatant needs a name.");
    return;
  }

  const init = parseInt(initInput.value);
  const hp = parseInt(hpInput.value);
  if (isNaN(init)) {
    showToast("Invalid initiative.");
    return;
  }
  const type = typeInput.value;

  const editId = saveBtn.getAttribute("data-edit-id");
  if (editId) {
    const c = state.initiative.combatants.find((x) => x.id === editId);
    if (!c) return;
    c.name = name;
    c.initiative = init;
    c.hp = hp || 0;
    c.type = type;
    showToast("Combatant updated.");
  } else {
    const id = "i" + Date.now();
    state.initiative.combatants.push({
      id,
      name,
      initiative: init,
      hp: hp || 0,
      type
    });
    showToast("Combatant added.");
  }

  saveState();
  renderInitiative();
  resetCombatantForm();
}

function renderInitiative() {
  const list = document.getElementById("initiative-list");
  const roundDisplay = document.getElementById("round-display");
  list.innerHTML = "";

  const { combatants, round, currentIndex } = state.initiative;
  roundDisplay.textContent = `Round: ${round} | Current: ${
    currentIndex >= 0 && combatants[currentIndex]
      ? combatants[currentIndex].name
      : "-"
  }`;

  if (!combatants.length) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "No combatants yet.";
    list.appendChild(empty);
    return;
  }

  combatants.forEach((c, idx) => {
    const item = document.createElement("div");
    item.className = "initiative-item";
    if (idx === currentIndex) {
      item.classList.add("current");
    }

    const name = document.createElement("div");
    name.className = "init-name";
    name.textContent = c.name;

    const initVal = document.createElement("div");
    initVal.className = "init-initiative";
    initVal.textContent = `Init: ${c.initiative}`;

    const hpControls = document.createElement("div");
    hpControls.className = "init-hp-controls";

    const minusBtn = document.createElement("button");
    minusBtn.className = "btn btn-ghost";
    minusBtn.textContent = "-";
    minusBtn.style.padding = "2px 6px";
    minusBtn.addEventListener("click", () =>
      adjustCombatantHp(c.id, -1)
    );

    const hpVal = document.createElement("div");
    hpVal.className = "init-hp-value";
    hpVal.textContent = c.hp;

    const plusBtn = document.createElement("button");
    plusBtn.className = "btn btn-ghost";
    plusBtn.textContent = "+";
    plusBtn.style.padding = "2px 6px";
    plusBtn.addEventListener("click", () =>
      adjustCombatantHp(c.id, +1)
    );

    hpControls.appendChild(minusBtn);
    hpControls.appendChild(hpVal);
    hpControls.appendChild(plusBtn);

    const typeEl = document.createElement("div");
    typeEl.className = "init-type";
    typeEl.textContent = c.type.toUpperCase();

    const actions = document.createElement("div");
    actions.className = "init-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-ghost";
    editBtn.textContent = "Edit";
    editBtn.style.padding = "4px 8px";
    editBtn.addEventListener("click", () =>
      loadCombatantToForm(c.id)
    );

    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-ghost";
    delBtn.textContent = "✕";
    delBtn.style.padding = "4px 8px";
    delBtn.addEventListener("click", () =>
      deleteCombatant(c.id)
    );

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    item.appendChild(name);
    item.appendChild(initVal);
    item.appendChild(hpControls);
    item.appendChild(actions);

    list.appendChild(item);
  });
}

function adjustCombatantHp(id, delta) {
  const c = state.initiative.combatants.find((x) => x.id === id);
  if (!c) return;
  c.hp = (c.hp || 0) + delta;
  saveState();
  renderInitiative();
}

function loadCombatantToForm(id) {
  const c = state.initiative.combatants.find((x) => x.id === id);
  if (!c) return;
  document.getElementById("combatant-name-input").value = c.name;
  document.getElementById("combatant-init-input").value = c.initiative;
  document.getElementById("combatant-hp-input").value = c.hp;
  document.getElementById("combatant-type-input").value = c.type;
  document
    .getElementById("save-combatant-btn")
    .setAttribute("data-edit-id", c.id);
}

function deleteCombatant(id) {
  const c = state.initiative.combatants.find((x) => x.id === id);
  if (!c) return;
  const ok = confirm(`Remove ${c.name} from initiative?`);
  if (!ok) return;
  const idx = state.initiative.combatants.findIndex((x) => x.id === id);
  state.initiative.combatants.splice(idx, 1);
  if (state.initiative.currentIndex >= state.initiative.combatants.length) {
    state.initiative.currentIndex = state.initiative.combatants.length - 1;
  }
  saveState();
  renderInitiative();
}

function advanceTurn() {
  const { combatants } = state.initiative;
  if (!combatants.length) {
    showToast("No combatants to advance.");
    return;
  }
  if (state.initiative.currentIndex === -1) {
    state.initiative.currentIndex = 0;
  } else {
    state.initiative.currentIndex++;
    if (state.initiative.currentIndex >= combatants.length) {
      state.initiative.currentIndex = 0;
      state.initiative.round++;
    }
  }
  saveState();
  renderInitiative();
}
