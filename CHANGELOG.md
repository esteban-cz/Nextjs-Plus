# Changelog

## 1.0.6 - 11/26/2025

- Added a setting to hide the status bar item whenever a workspace folder is open (enabled by default).
- Disable the toggle to keep Next.js Plus visible in every window.
- Added a setting to choose the package manager used for Create Next App and shadcn/ui commands (npm, pnpm, yarn, bun; default npm).
- Create Next App now receives the matching `--use-*` flag and runs through the selected package manager.

---

## 1.0.5 - 11/5/2025

- Added shadcn/ui automation settings with optional prompts.
- Automatically run `npx shadcn@latest init` when enabled.
- Added toggle to install all shadcn components via `npx shadcn@latest add --all`.
- Updated documentation to cover the new workflow.

---

## 1.0.4 - 11/4/2025

- Updated `StatusBarItem` alignment.

---

## 1.0.3 - 11/4/2025

- Made code more readable and easier to understand.
- Removed unnecessary `.gitignore` items.

---

## 1.0.2 - 11/4/2025

- Added command palette action (`Next.js Plus: Select Default Project Location`) to pick a default folder via native dialog.
- Updated settings description to highlight the command-based selection.
- Improved warnings when the saved default location is invalid or missing.

---

## 1.0.1 - 11/4/2025

- Added logo.
- Updated `.gitignore`.
- Updated README.

---

## 1.0.0 - 11/4/2025

- Initial public release of Next.js Plus.
- Create a Next.js project from the status bar with curated defaults.
- Configure defaults and per-run prompts for every Create Next App flag.
- Optionally skip opening the generated project in a new VS Code window.
