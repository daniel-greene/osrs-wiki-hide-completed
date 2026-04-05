# OSRS Wiki — Hide Completed Quests

A userscript that adds a "Hide completed" toggle to the [Optimal Quest Guide](https://oldschool.runescape.wiki/w/Optimal_quest_guide) on the OSRS Wiki. After looking up your username via WikiSync, completed quests are highlighted green — this script lets you hide those rows so you only see what's left.

<img width="1315" height="569" alt="image" src="https://github.com/user-attachments/assets/b63fa8bb-856b-4b44-8cb7-50a0d7da637c" />

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/) in your browser.
2. **[Click here to install the userscript](../../raw/main/osrs-wiki-hide-completed.user.js)** — your userscript manager will prompt you to confirm.
3. Visit the [Optimal Quest Guide](https://oldschool.runescape.wiki/w/Optimal_quest_guide) and look up your RSN.

## Requirements

- [WikiSync](https://oldschool.runescape.wiki/w/RuneScape:WikiSync) RuneLite plugin — this is what uploads your quest completion data to the wiki. Without it, there's nothing to hide.

## How it works

WikiSync highlights completed quest rows green via inline styles. This script watches the quest table for those changes using a `MutationObserver` and adds a toggle button above the table. Clicking "Hide completed" sets `display: none` on green rows. Your show/hide preference is saved to `localStorage` and persists across page loads.

Also works on the [Ironman](https://oldschool.runescape.wiki/w/Optimal_quest_guide/Ironman) and [F2P](https://oldschool.runescape.wiki/w/Optimal_quest_guide/Free-to-play) variants.

## Issues

If WikiSync changes how it highlights rows and the detection breaks, [open an issue](../../issues).
