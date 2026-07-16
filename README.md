<div align="center">
<table>
<tbody>
<td align="center">
<br>
<sub>
  
  [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge)](https://choosealicense.com/licenses/gpl-3.0/)&nbsp;&nbsp;&nbsp;
  ![Maintenance](https://img.shields.io/maintenance/yes/2026?style=for-the-badge)&nbsp;&nbsp;&nbsp;
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

- Launch a new Next.js project from the status bar (`Next.js` entry at the bottom-left corner) with any package manager.
- Guided prompts for the project name and destination folder, with additional questions only when you enable the matching “Prompt …” toggles.
- Runs `create-next-app@latest` non-interactively with curated defaults (TypeScript, Tailwind, ESLint, App Router, no `src/`, no React Compiler, import alias `@/*`, and coding-agent guidance files) via your chosen package manager (default: npm).
- Streams scaffold progress to a dedicated VS Code output channel.
- Optionally open the generated project automatically in a fresh VS Code window.
- Optional default project location so you can skip the folder picker when desired.
- Optional shadcn/ui automation with configurable Base/Radix component libraries and presets. Initialization installs Button by default, or every component when enabled.

---

## Settings

- `Default project location`
- `TypeScript` / `Prompt for TypeScript`
- `Tailwind CSS` / `Prompt for Tailwind CSS`
- `Linter` (ESLint, Biome, or none) / `Prompt for linter`
- `App Router` / `Prompt for App Router`
- `Create src/ directory` / `Prompt for src/ directory`
- `React Compiler` / `Prompt for React Compiler`
- `Import alias` / `Prompt for import alias`
- `Coding-agent guidance files` / `Prompt for agent guidance files`
- `shadcn init` / `Prompt for shadcn init`
- `shadcn component library` / `Prompt for shadcn component library`
- `shadcn preset` / `Prompt for shadcn preset`
- `Install all shadcn components` / `Prompt for shadcn components`
- `Open in new window`
- `Only show status bar item when no project is open`
- `Package manager` (npm, pnpm, yarn, bun)

Every setting lives under **Next.js Plus Configuration** (`nextjsPlus.*`). Most map directly to a Create Next App flag; the default project location lets you skip the folder picker (set via the `Next.js Plus: Select Default Project Location` command), while the shadcn settings control initialization, component library, preset, and optional installation of all components. When a “Prompt …” toggle is enabled, the stored default is ignored and you’re asked during project creation.

---

## Release Notes

### 1.0.8 — shadcn CLI update

- When installing all shadcn components is disabled, initialization installs Button only.

### 1.0.7 — Next.js and shadcn CLI updates

- Added support for Create Next App's `AGENTS.md`/`CLAUDE.md` option.
- Replaced the ESLint toggle with an ESLint/Biome/none linter choice.
- Added shadcn Base/Radix component-library and preset settings.
- Updated generated commands for the latest Create Next App and shadcn CLI flags.
- Removed the retired experimental App Router and bundler settings.
- shadcn setup now runs non-interactively with explicit defaults (`base` and `nova`).
- When installing all shadcn components is disabled, initialization installs Button only.
- Updated the minimum supported VS Code version to 1.125.

### 1.0.6 — Status bar visibility & Package manager choice

- Added a setting to hide the Next.js Plus status bar item whenever a workspace folder is open (enabled by default).
- Disable the toggle if you want the extension to stay in the status bar in every window.
- Added a setting to choose which package manager runs Create Next App and shadcn/ui commands (npm, pnpm, yarn, bun; default npm).
- The generated project now uses the selected package manager flag for dependency installation.

### 1.0.5 — shadcn/ui Automation

- Added settings (and optional prompts) to run `npx shadcn@latest init` automatically after scaffolding.
- Added toggle to run `npx shadcn@latest add --all` to pull in every component.
- Updated docs and settings descriptions to highlight the shadcn workflow.

### 1.0.4 - Updated alignment

- Updated `StatusBarItem` alignment.

---

### 1.0.3 - Code cleanup

- Made code more readable and easier to understand.
- Removed unnecessary `.gitignore` items.

### 1.0.2 — Default Location Command

- Added command palette action (`Next.js Plus: Select Default Project Location`) to pick a default folder via native dialog.
- Updated settings description to highlight the command.
- Improved fallback messaging when the stored default folder is invalid.

### 1.0.1 — Branding & Docs

- Added logo.
- Updated `.gitignore`.
- Refreshed README.

### 1.0.0 — Initial Release

- Create Next.js project from the status bar with curated defaults.
- Configure defaults and per-run prompts for every Create Next App flag.
- Optionally skip opening the generated project in a new VS Code window.

---

**Enjoy!**
