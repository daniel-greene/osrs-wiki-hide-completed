// ==UserScript==
// @name         OSRS Optimal Quest Guide — Hide Completed
// @namespace    https://github.com/YOUR_USERNAME/osrs-quest-tracker
// @version      1.0.0
// @description  Adds a toggle to hide WikiSync-completed quests on the Optimal Quest Guide
// @author       YOUR_USERNAME
// @license      Unlicense
// @match        https://oldschool.runescape.wiki/w/Optimal_quest_guide*
// @grant        none
// ==/UserScript==

/**
 * This userscript integrates with the OSRS Wiki's existing WikiSync gadget.
 * After performing a WikiSync username lookup on the Optimal Quest Guide page,
 * completed quests are highlighted green by the wiki's own JavaScript. This
 * script detects those highlighted rows and provides a button to hide them,
 * letting you focus on what's left to do.
 *
 * Requirements:
 *   - Tampermonkey / Violentmonkey / Greasemonkey
 *   - WikiSync RuneLite plugin (uploads your quest data to the wiki)
 *
 * Usage:
 *   1. Visit the Optimal Quest Guide wiki page
 *   2. Enter your RSN in the wiki's lookup box and click "Look up"
 *   3. Use the "Hide completed" / "Show completed" toggle that appears
 */

(function () {
  "use strict";

  // ---- Persistent preference ----
  const HIDE_KEY = "osrs-quest-tracker-hide";

  function loadHidden() {
    return localStorage.getItem(HIDE_KEY) === "true";
  }

  function saveHidden(val) {
    localStorage.setItem(HIDE_KEY, String(!!val));
  }

  // ---- Colour detection ----
  // WikiSync highlights completed quest rows with a green background colour
  // applied via inline styles. We check for green-dominant RGB values to
  // detect this, using a threshold that avoids false positives from the
  // wiki's neutral beige/grey/blue palette.
  function isGreenish(color) {
    if (!color) return false;

    const rgb = color.match(
      /rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/
    );
    if (rgb) {
      const r = parseInt(rgb[1], 10);
      const g = parseInt(rgb[2], 10);
      const b = parseInt(rgb[3], 10);
      return g > r + 20 && g > b + 20 && g > 40;
    }

    if (color.charAt(0) === "#" && color.length >= 7) {
      const r = parseInt(color.substring(1, 3), 16);
      const g = parseInt(color.substring(3, 5), 16);
      const b = parseInt(color.substring(5, 7), 16);
      return g > r + 20 && g > b + 20 && g > 40;
    }

    return false;
  }

  function isRowCompleted(row) {
    // Check inline styles first (cheap) before falling back to computed styles
    if (isGreenish(row.style.backgroundColor)) return true;

    const cells = row.querySelectorAll("td");
    for (let i = 0; i < cells.length; i++) {
      if (isGreenish(cells[i].style.backgroundColor)) return true;
    }

    // Fall back to computed style on the row only (not every cell)
    if (isGreenish(getComputedStyle(row).backgroundColor)) return true;

    return false;
  }

  // ---- Find the quest table(s) ----
  const questTables = [];

  document.querySelectorAll("table.wikitable").forEach((table) => {
    const header = table.querySelector("tr");
    if (header && /Quest/.test(header.textContent)) {
      questTables.push(table);
    }
  });

  if (questTables.length === 0) return;

  // Collect all data rows across tables
  const allRows = [];

  questTables.forEach((table) => {
    const rows = table.querySelectorAll("tr");
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].querySelectorAll("td").length > 0) {
        allRows.push(rows[i]);
      }
    }
  });

  if (allRows.length === 0) return;

  // ---- State ----
  let hideCompleted = loadHidden();
  let refreshing = false; // guard against observer feedback loop

  // ---- Styles (uses wiki CSS custom properties for theme compatibility) ----
  const style = document.createElement("style");
  style.textContent = `
    #quest-tracker-bar {
      background: var(--body-main, #f4f0e4);
      border: 1px solid var(--body-border, #b5a789);
      border-radius: 2px;
      padding: 8px 12px;
      margin: 0.8em 0;
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: inherit;
      font-size: 14px;
      color: var(--text-color, #333);
    }
    #quest-tracker-bar button {
      background: var(--body-mid, #e8e0ce);
      color: var(--text-color, #333);
      border: 1px solid var(--body-border, #b5a789);
      border-radius: 2px;
      padding: 5px 12px;
      cursor: pointer;
      font-family: inherit;
      font-size: 13px;
      white-space: nowrap;
      transition: background 0.1s, border-color 0.1s;
    }
    #quest-tracker-bar button:hover {
      background: var(--body-light, #ddd5c3);
      border-color: var(--link-color, #3366cc);
    }
    #quest-tracker-progress {
      flex: 1;
      height: 6px;
      background: var(--body-mid, #e0d8c6);
      border-radius: 3px;
      overflow: hidden;
      min-width: 60px;
    }
    #quest-tracker-progress-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;
      width: 0%;
      background: var(--link-color, #3366cc);
    }
    #quest-tracker-status {
      font-weight: 500;
      white-space: nowrap;
      font-size: 13px;
    }
  `;
  document.head.appendChild(style);

  // ---- Build the UI ----
  const bar = document.createElement("div");
  bar.id = "quest-tracker-bar";

  const toggleBtn = document.createElement("button");

  const statusText = document.createElement("span");
  statusText.id = "quest-tracker-status";

  const progressBar = document.createElement("div");
  progressBar.id = "quest-tracker-progress";

  const progressFill = document.createElement("div");
  progressFill.id = "quest-tracker-progress-fill";
  progressBar.appendChild(progressFill);

  bar.appendChild(toggleBtn);
  bar.appendChild(statusText);
  bar.appendChild(progressBar);

  questTables[0].parentNode.insertBefore(bar, questTables[0]);

  // ---- Core refresh ----
  function refresh() {
    refreshing = true;

    const total = allRows.length;
    let done = 0;

    for (let i = 0; i < allRows.length; i++) {
      const completed = isRowCompleted(allRows[i]);
      if (completed) done++;
      allRows[i].style.display = hideCompleted && completed ? "none" : "";
    }

    toggleBtn.textContent = hideCompleted ? "Show completed" : "Hide completed";

    if (done === 0) {
      statusText.textContent = "Look up a username to track progress";
      progressFill.style.width = "0%";
    } else {
      statusText.textContent = `${done} / ${total} completed`;
      progressFill.style.width = `${((done / total) * 100).toFixed(1)}%`;
    }

    // Allow the observer to settle before re-enabling
    requestAnimationFrame(() => {
      refreshing = false;
    });
  }

  refresh();

  // ---- Toggle handler ----
  toggleBtn.addEventListener("click", () => {
    hideCompleted = !hideCompleted;
    saveHidden(hideCompleted);
    refresh();
  });

  // ---- Observe WikiSync DOM mutations ----
  // WikiSync modifies row/cell styles after its async API call.
  // We debounce and guard against our own mutations triggering a loop.
  let debounceTimer;

  const observer = new MutationObserver(() => {
    if (refreshing) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(refresh, 300);
  });

  questTables.forEach((table) => {
    observer.observe(table, {
      attributes: true,
      attributeFilter: ["style", "class"],
      subtree: true,
      childList: true,
    });
  });
})();
