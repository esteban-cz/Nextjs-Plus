<div align="center">
<table>
<tbody>
<td align="center">
<br>
<sub>
  
  [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge)](https://choosealicense.com/licenses/gpl-3.0/)&nbsp;&nbsp;&nbsp;
  ![Maintenance](https://img.shields.io/maintenance/yes/2025?style=for-the-badge)&nbsp;&nbsp;&nbsp;
  ![Extension Version](https://img.shields.io/github/package-json/v/esteban-cz/nextjs-plus/master?style=for-the-badge&label=Version)&nbsp;&nbsp;&nbsp;
  ![GitHub last commit](https://img.shields.io/github/last-commit/esteban-cz/nextjs-plus?style=for-the-badge)
  
</sub><br><br>
</td>
</tbody>
</table>
</div>

<br>

<div align="center">
  <p style="margin: 0 0 12px 0; font-size: 2.75rem;"><u><b>Next.js Plus</b></u></p>
  <img src="icons/nextjs-plus-logo.png" width="100" height="100" alt="Next.js Plus logo">
</div>

## Features

- Launch a new Next.js project from the status bar (`Next.js` entry at the bottom-left corner).
- Guided prompts for the project name and destination folder, with additional questions only when you enable the matching “Prompt …” toggles.
- Runs `npx create-next-app@latest` with curated defaults (TypeScript, Tailwind, ESLint, App Router, no `src/`, no experimental features, Turbopack, no React Compiler, import alias `@/*`, npm).
- Streams scaffold progress to a dedicated VS Code output channel.
- Optionally open the generated project automatically in a fresh VS Code window.

---

## Settings

- `TypeScript` / `Prompt for TypeScript`
- `Tailwind CSS` / `Prompt for Tailwind CSS`
- `ESLint` / `Prompt for ESLint`
- `App Router` / `Prompt for App Router`
- `Create src/ directory` / `Prompt for src/ directory`
- `Experimental App features` / `Prompt for experimental App features`
- `Turbopack` / `Prompt for Turbopack`
- `React Compiler` / `Prompt for React Compiler`
- `Import alias` / `Prompt for import alias`
- `Open in new window`

Every setting lives under **Next.js Plus Configuration** (`nextjsPlus.*`) and maps directly to a Create Next App flag. When a “Prompt …” toggle is enabled, the stored default is ignored and you’re asked during project creation.

---

## Release Notes

### 1.0.0

- Initial public release of Next.js Plus.
- Create a Next.js project from the status bar with curated defaults.
- Configure defaults and per-run prompts for every Create Next App flag.
- Optionally skip opening the generated project in a new VS Code window.

### 1.0.1

- Added logo
- Updated .gitignore
- Updated README

---

**Enjoy!**
