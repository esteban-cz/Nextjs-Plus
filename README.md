# Create Next.js Project (VS Code Extension)

Create a brand new Next.js application from inside VS Code with only a project name.

## Features
- Status bar shortcut that lives in the lower left corner (`Next.js` with a rocket icon).
- Prompts only for the project name and destination folder, then runs `create-next-app` with a curated default set of options.
- Uses the equivalent of:
  ```bash
  npx create-next-app@latest <name> \
    --typescript --tailwind --eslint \
    --app --no-src-dir \
    --no-experimental-app \
    --turbopack --no-react-compiler \
    --import-alias "@/*" \
    --use-npm
  ```
- Streams CLI output to a dedicated VS Code output channel and opens the new project in a fresh window.
- Per-project defaults are configurable via VS Code settings, with optional prompts for each Create Next App flag and the ability to skip automatically opening a new window.

## Usage
1. Install dependencies and compile:
   ```bash
   npm install
   npm run compile
   ```
2. Press `F5` in VS Code to launch the extension in a new Extension Development Host window.
3. Click the `Next.js` status bar item in the bottom-left corner (or run the `Create Next.js Project` command from the Command Palette).
4. Enter the project name, pick the target folder when prompted, and wait for scaffolding to finish. When it finishes, the new project opens automatically in a fresh VS Code window.

> Tip: The extension picks the first open workspace folder as the target location. If multiple folders are open, you'll be asked to choose one. If none are open, you'll be prompted to select a folder on disk.

## Settings
All options map directly to Create Next App flags and live under **Next.js Plus Configuration** in VS Code settings (`nextjsPlus.*`). Each option has:
- a default value (boolean toggle or string for the import alias); and
- a companion `Prompt ...` checkbox that, when enabled, asks during project creation and ignores the stored default.

Available settings:
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

## Packaging
Build the extension package (`.vsix`) with:
```bash
npm run compile
npx vsce package
```

## Known Limitations
- `npx` must be available on your system PATH.
- `create-next-app` must be able to download templates (requires an active internet connection).
