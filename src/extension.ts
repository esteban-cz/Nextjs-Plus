import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { spawn } from "child_process";

const CONFIG_NAMESPACE = "nextjsPlus";

interface ProjectOptions {
  useTypeScript: boolean;
  includeTailwind: boolean;
  includeEslint: boolean;
  useAppRouter: boolean;
  useSrcDirectory: boolean;
  enableExperimentalApp: boolean;
  enableTurbopack: boolean;
  enableReactCompiler: boolean;
  importAlias: string;
}

interface BooleanQuickPickItem extends vscode.QuickPickItem {
  value: boolean;
}

let statusBarItem: vscode.StatusBarItem | undefined;

export function activate(context: vscode.ExtensionContext) {
  const createProjectCommand = vscode.commands.registerCommand(
    "nextjs-plus.createProject",
    async () => {
      try {
        await createNextJsProject();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error occurred";
        vscode.window.showErrorMessage(
          `Failed to create Next.js project: ${message}`
        );
      }
    }
  );

  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBarItem.text = "Next.js $(diff-added)";
  statusBarItem.tooltip = "Create a new Next.js project";
  statusBarItem.command = "nextjs-plus.createProject";
  statusBarItem.show();

  context.subscriptions.push(createProjectCommand, statusBarItem);
}

export function deactivate() {
  statusBarItem?.dispose();
}

async function createNextJsProject(): Promise<void> {
  const projectName = await vscode.window.showInputBox({
    prompt: "Enter a name for the new Next.js project",
    placeHolder: "my-next-app",
    ignoreFocusOut: true,
    validateInput: (value) => {
      if (!value.trim()) {
        return "Project name is required";
      }
      if (!/^[A-Za-z0-9._-]+$/.test(value.trim())) {
        return "Use letters, numbers, dots, underscores or dashes";
      }
      return undefined;
    },
  });

  if (!projectName) {
    return;
  }

  const projectOptions = await resolveProjectOptions();
  if (!projectOptions) {
    return;
  }

  const targetFolder = await resolveTargetFolder();
  if (!targetFolder) {
    return;
  }

  const projectPath = path.join(targetFolder.fsPath, projectName);
  if (fs.existsSync(projectPath)) {
    const overwrite = await vscode.window.showWarningMessage(
      `Folder "${projectName}" already exists. Overwrite?`,
      { modal: true },
      "Overwrite",
      "Cancel"
    );
    if (overwrite !== "Overwrite") {
      return;
    }
    await removeDirectory(projectPath);
  }

  const output = vscode.window.createOutputChannel("Create Next.js Project");
  output.show(true);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Creating Next.js project "${projectName}"`,
      cancellable: false,
    },
    async (progress) => {
      progress.report({ message: "Running create-next-app..." });
      await runCreateNextAppCommand({
        projectName,
        cwd: targetFolder.fsPath,
        output,
        options: projectOptions,
      });
    }
  );

  const shouldOpenInNewWindow = vscode.workspace
    .getConfiguration(CONFIG_NAMESPACE)
    .get<boolean>("openInNewWindow", true);

  if (shouldOpenInNewWindow) {
    vscode.window.showInformationMessage(
      `Next.js project "${projectName}" created successfully. Opening in new window...`
    );

    await vscode.commands.executeCommand(
      "vscode.openFolder",
      vscode.Uri.file(projectPath),
      true
    );
  } else {
    const choice = await vscode.window.showInformationMessage(
      `Next.js project "${projectName}" created successfully.`,
      "Open Here",
      "Open in New Window",
      "Cancel"
    );

    if (choice === "Open Here") {
      await vscode.commands.executeCommand(
        "vscode.openFolder",
        vscode.Uri.file(projectPath),
        false
      );
    } else if (choice === "Open in New Window") {
      await vscode.commands.executeCommand(
        "vscode.openFolder",
        vscode.Uri.file(projectPath),
        true
      );
    }
  }
}

async function resolveProjectOptions(): Promise<ProjectOptions | undefined> {
  const config = vscode.workspace.getConfiguration(CONFIG_NAMESPACE);

  const useTypeScript = await resolveBooleanOption({
    config,
    settingKey: "typescript",
    promptKey: "typescriptPrompt",
    defaultValue: true,
    promptMessage: "Enable TypeScript?",
    enableDescription: "Adds TypeScript configuration and types.",
    disableDescription: "Generates the project without TypeScript support.",
  });
  if (useTypeScript === undefined) {
    return undefined;
  }

  const includeTailwind = await resolveBooleanOption({
    config,
    settingKey: "tailwind",
    promptKey: "tailwindPrompt",
    defaultValue: true,
    promptMessage: "Include Tailwind CSS?",
    enableDescription: "Installs Tailwind CSS and adds starter config.",
    disableDescription: "Skips Tailwind CSS setup.",
  });
  if (includeTailwind === undefined) {
    return undefined;
  }

  const includeEslint = await resolveBooleanOption({
    config,
    settingKey: "eslint",
    promptKey: "eslintPrompt",
    defaultValue: true,
    promptMessage: "Add ESLint?",
    enableDescription: "Configures ESLint with Next.js defaults.",
    disableDescription: "Skips ESLint setup.",
  });
  if (includeEslint === undefined) {
    return undefined;
  }

  const useAppRouter = await resolveBooleanOption({
    config,
    settingKey: "appRouter",
    promptKey: "appRouterPrompt",
    defaultValue: true,
    promptMessage: "Use the App Router (`app/` directory)?",
    enableDescription: "Generates the project using the App Router.",
    disableDescription: "Generates the project using the Pages Router.",
  });
  if (useAppRouter === undefined) {
    return undefined;
  }

  const useSrcDirectory = await resolveBooleanOption({
    config,
    settingKey: "useSrcDirectory",
    promptKey: "srcDirectoryPrompt",
    defaultValue: false,
    promptMessage: "Create a `src/` directory?",
    enableDescription: "Places application code inside `src/`.",
    disableDescription: "Generates files at the project root (no `src/`).",
  });
  if (useSrcDirectory === undefined) {
    return undefined;
  }

  const enableExperimentalApp = await resolveBooleanOption({
    config,
    settingKey: "experimentalApp",
    promptKey: "experimentalAppPrompt",
    defaultValue: false,
    promptMessage: "Enable experimental App Router features?",
    enableDescription: "Opt-in to experimental App Router capabilities.",
    disableDescription: "Leaves experimental App Router features disabled.",
  });
  if (enableExperimentalApp === undefined) {
    return undefined;
  }

  const enableTurbopack = await resolveBooleanOption({
    config,
    settingKey: "turbopack",
    promptKey: "turbopackPrompt",
    defaultValue: true,
    promptMessage: "Use Turbopack for the dev server?",
    enableDescription: "Starts development using Turbopack.",
    disableDescription: "Uses the traditional webpack-based dev server.",
  });
  if (enableTurbopack === undefined) {
    return undefined;
  }

  const enableReactCompiler = await resolveBooleanOption({
    config,
    settingKey: "reactCompiler",
    promptKey: "reactCompilerPrompt",
    defaultValue: false,
    promptMessage: "Enable the React Compiler?",
    enableDescription: "Opt-in to the experimental React Compiler.",
    disableDescription: "Keeps the React Compiler disabled.",
  });
  if (enableReactCompiler === undefined) {
    return undefined;
  }

  const importAlias = await resolveStringOption({
    config,
    settingKey: "importAlias",
    promptKey: "importAliasPrompt",
    defaultValue: "@/*",
    promptMessage: "Set module import alias (--import-alias).",
  });
  if (importAlias === undefined) {
    return undefined;
  }

  return {
    useTypeScript,
    includeTailwind,
    includeEslint,
    useAppRouter,
    useSrcDirectory,
    enableExperimentalApp,
    enableTurbopack,
    enableReactCompiler,
    importAlias: importAlias.trim(),
  };
}

async function resolveBooleanOption(params: {
  config: vscode.WorkspaceConfiguration;
  settingKey: string;
  promptKey: string;
  defaultValue: boolean;
  promptMessage: string;
  enableDescription: string;
  disableDescription: string;
}): Promise<boolean | undefined> {
  const fallback = params.config.get<boolean>(
    params.settingKey,
    params.defaultValue
  );
  const shouldPrompt = params.config.get<boolean>(params.promptKey, false);

  if (!shouldPrompt) {
    return fallback;
  }

  const items: BooleanQuickPickItem[] = [
    {
      label: fallback ? "Yes (default)" : "Yes",
      description: params.enableDescription,
      value: true,
    },
    {
      label: !fallback ? "No (default)" : "No",
      description: params.disableDescription,
      value: false,
    },
  ];

  const selection = await vscode.window.showQuickPick(items, {
    placeHolder: params.promptMessage,
    ignoreFocusOut: true,
  });

  return selection?.value;
}

async function resolveStringOption(params: {
  config: vscode.WorkspaceConfiguration;
  settingKey: string;
  promptKey: string;
  defaultValue: string;
  promptMessage: string;
}): Promise<string | undefined> {
  const fallback = params.config.get<string>(
    params.settingKey,
    params.defaultValue
  );
  const shouldPrompt = params.config.get<boolean>(params.promptKey, false);

  if (!shouldPrompt) {
    return fallback;
  }

  const value = await vscode.window.showInputBox({
    prompt: params.promptMessage,
    value: fallback,
    ignoreFocusOut: true,
    validateInput: (input) => {
      if (!input.trim()) {
        return "Import alias cannot be empty";
      }
      return undefined;
    },
  });

  return value?.trim();
}

async function resolveTargetFolder(): Promise<vscode.Uri | undefined> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length === 1) {
    return workspaceFolders[0].uri;
  }

  if (workspaceFolders && workspaceFolders.length > 1) {
    const selection = await vscode.window.showQuickPick(
      workspaceFolders.map((folder) => ({
        label: folder.name,
        description: folder.uri.fsPath,
        folder,
      })),
      {
        placeHolder:
          "Select the workspace folder where the project will be created",
        ignoreFocusOut: true,
      }
    );

    return selection?.folder.uri;
  }

  const pickedFolder = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    title: "Select a directory for the new Next.js project",
    openLabel: "Select folder",
  });

  return pickedFolder?.[0];
}

async function runCreateNextAppCommand(params: {
  projectName: string;
  cwd: string;
  output: vscode.OutputChannel;
  options: ProjectOptions;
}): Promise<void> {
  const args = [
    "--yes",
    "create-next-app@latest",
    params.projectName,
    ...buildCliFlags(params.options),
  ];

  params.output.appendLine(`> npx ${args.join(" ")} (cwd: ${params.cwd})`);

  await new Promise<void>((resolve, reject) => {
    const child = spawn("npx", args, {
      cwd: params.cwd,
      shell: process.platform === "win32",
    });

    child.stdout?.on("data", (data) => {
      params.output.append(data.toString());
    });

    child.stderr?.on("data", (data) => {
      params.output.append(data.toString());
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`npx exited with code ${code ?? "unknown"}`));
      }
    });
  });
}

function buildCliFlags(options: ProjectOptions): string[] {
  const flags: string[] = [];

  flags.push(options.useTypeScript ? "--typescript" : "--no-typescript");
  flags.push(options.includeTailwind ? "--tailwind" : "--no-tailwind");
  flags.push(options.includeEslint ? "--eslint" : "--no-eslint");
  flags.push(options.useAppRouter ? "--app" : "--no-app");
  flags.push(options.useSrcDirectory ? "--src-dir" : "--no-src-dir");
  flags.push(
    options.enableExperimentalApp
      ? "--experimental-app"
      : "--no-experimental-app"
  );
  flags.push(options.enableTurbopack ? "--turbopack" : "--no-turbopack");
  flags.push(
    options.enableReactCompiler ? "--react-compiler" : "--no-react-compiler"
  );
  flags.push("--import-alias", options.importAlias);
  flags.push("--use-npm");

  return flags;
}

async function removeDirectory(dir: string): Promise<void> {
  if (!fs.existsSync(dir)) {
    return;
  }

  await fs.promises.rm(dir, { recursive: true, force: true });
}
