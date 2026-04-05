// ==UserScript==
// @name         OSRS Optimal Quest Guide — Hide Completed
// @namespace    https://github.com/daniel-greene/osrs-wiki-hide-completed
// @version      1.0.0
// @description  Adds a toggle to hide WikiSync-completed quests on the Optimal Quest Guide
// @author       daniel-greene
// @license      Unlicense
// @match        https://oldschool.runescape.wiki/w/Optimal_quest_guide*
// @grant        none
// ==/UserScript==

/**
 * This userscript integrates with the OSRS Wiki's existing WikiSync gadget.
 * After performing a WikiSync username lookup on the Optimal Quest Guide page,
 * completed quests are marked with the "highlight-on" class by the wiki's own
 * JavaScript. This script detects those rows and provides a button to hide
 * them, letting you focus on what's left to do.
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
  let refreshing = false;

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
      const completed = allRows[i].classList.contains("highlight-on");
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
  // WikiSync adds/removes the "highlight-on" class on rows after its async
  // API call. We watch for class changes and refresh when detected.
  let debounceTimer;

  const observer = new MutationObserver(() => {
    if (refreshing) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(refresh, 300);
  });

  questTables.forEach((table) => {
    observer.observe(table, {
      attributes: true,
      attributeFilter: ["class"],
      subtree: true,
    });
  });
})();
