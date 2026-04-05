# OSRS Wiki — Hide Completed Quests

A userscript that adds a "Hide completed" toggle to the [Optimal Quest Guide](https://oldschool.runescape.wiki/w/Optimal_quest_guide) on the OSRS Wiki.

<img width="1315" height="569" alt="image" src="https://github.com/user-attachments/assets/1c869a76-7d74-4c32-a8dc-fde85685e1cf" />

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/) in your browser.
2. **[Click here to install the userscript](../../raw/main/osrs-wiki-hide-completed.user.js)** — your userscript manager will prompt you to confirm.
3. Visit the [Optimal Quest Guide](https://oldschool.runescape.wiki/w/Optimal_quest_guide) and look up your RSN.

## Requirements

- [WikiSync](https://oldschool.runescape.wiki/w/RuneScape:WikiSync) RuneLite plugin.

## How it works

WikiSync adds a `highlight-on` class to completed quest rows after a username lookup. This script watches the quest table for class changes using a `MutationObserver` and adds a toggle button above the table. Clicking "Hide completed" sets `display: none` on completed rows. Your show/hide preference is saved to `localStorage` and persists across page loads.

Also works on the [Ironman](https://oldschool.runescape.wiki/w/Optimal_quest_guide/Ironman) and [F2P](https://oldschool.runescape.wiki/w/Optimal_quest_guide/Free-to-play) variants.

## Issues

If WikiSync changes how it highlights rows and the detection breaks, [open an issue](../../issues).
