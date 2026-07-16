//     Next.js Plus - VS Code Extension
//     Copyright (C) 2025  esty

//     This program is free software: you can redistribute it and/or modify
//     it under the terms of the GNU General Public License as published by
//     the Free Software Foundation, either version 3 of the License, or
//     (at your option) any later version.

//     This program is distributed in the hope that it will be useful,
//     but WITHOUT ANY WARRANTY; without even the implied warranty of
//     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//     GNU General Public License for more details.

//     You should have received a copy of the GNU General Public License
//     along with this program.  If not, see <https://www.gnu.org/licenses/>.

import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'
import { spawn } from 'child_process'

const CONFIG_NAMESPACE = 'nextjsPlus'

interface ProjectOptions {
  packageManager: PackageManager
  useTypeScript: boolean
  includeTailwind: boolean
  linter: Linter
  useAppRouter: boolean
  useSrcDirectory: boolean
  enableReactCompiler: boolean
  importAlias: string
  includeAgentsMd: boolean
  initShadcn: boolean
  shadcnBase: ShadcnBase
  shadcnPreset: string
  installAllShadcnComponents: boolean
}

interface BooleanQuickPickItem extends vscode.QuickPickItem {
  value: boolean
}

interface DefaultLocationQuickPickItem extends vscode.QuickPickItem {
  target: 'select' | 'clear'
}

interface ShadcnBaseQuickPickItem extends vscode.QuickPickItem {
  value: ShadcnBase
}

interface LinterQuickPickItem extends vscode.QuickPickItem {
  value: Linter
}

let statusBarItem: vscode.StatusBarItem | undefined

type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'
type ShadcnBase = 'base' | 'radix'
type Linter = 'eslint' | 'biome' | 'none'

export function activate(context: vscode.ExtensionContext) {
  const createProjectCommand = vscode.commands.registerCommand(
    'nextjs-plus.createProject',
    async () => {
      try {
        await createNextJsProject()
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error occurred'
        vscode.window.showErrorMessage(
          `Failed to create Next.js project: ${message}`
        )
      }
    }
  )

  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    1
  )
  statusBarItem.text = 'Next.js $(diff-added)'
  statusBarItem.tooltip = 'Create a new Next.js project'
  statusBarItem.command = 'nextjs-plus.createProject'

  const workspaceListener = vscode.workspace.onDidChangeWorkspaceFolders(
    updateStatusBarVisibility
  )
  const configurationListener = vscode.workspace.onDidChangeConfiguration(
    (event) => {
      if (
        event.affectsConfiguration(
          `${CONFIG_NAMESPACE}.statusBarOnlyWhenNoProjectOpen`
        )
      ) {
        updateStatusBarVisibility()
      }
    }
  )

  updateStatusBarVisibility()

  const selectDefaultLocationCommand = vscode.commands.registerCommand(
    'nextjs-plus.selectDefaultLocation',
    async () => {
      await handleDefaultLocationSelection()
    }
  )

  context.subscriptions.push(
    createProjectCommand,
    selectDefaultLocationCommand,
    statusBarItem,
    workspaceListener,
    configurationListener
  )
}

export function deactivate() {
  statusBarItem?.dispose()
}

function updateStatusBarVisibility(): void {
  if (!statusBarItem) {
    return
  }

  const config = vscode.workspace.getConfiguration(CONFIG_NAMESPACE)
  const showOnlyWhenNoProjectOpen = config.get<boolean>(
    'statusBarOnlyWhenNoProjectOpen',
    true
  )
  const hasWorkspace = (vscode.workspace.workspaceFolders?.length ?? 0) > 0

  if (!showOnlyWhenNoProjectOpen || !hasWorkspace) {
    statusBarItem.show()
  } else {
    statusBarItem.hide()
  }
}

async function createNextJsProject(): Promise<void> {
  const projectName = await vscode.window.showInputBox({
    prompt: 'Enter a name for the new Next.js project',
    placeHolder: 'my-next-app',
    ignoreFocusOut: true,
    validateInput: (value) => {
      if (!value.trim()) {
        return 'Project name is required'
      }
      if (!/^[A-Za-z0-9._-]+$/.test(value.trim())) {
        return 'Use letters, numbers, dots, underscores or dashes'
      }
      return undefined
    }
  })

  if (!projectName) {
    return
  }

  const config = vscode.workspace.getConfiguration(CONFIG_NAMESPACE)

  const projectOptions = await resolveProjectOptions(config)
  if (!projectOptions) {
    return
  }

  const defaultLocationSetting = config
    .get<string>('defaultLocation', '')
    .trim()
  const targetFolder = await resolveTargetFolder(
    defaultLocationSetting ? defaultLocationSetting : undefined
  )
  if (!targetFolder) {
    return
  }

  const projectPath = path.join(targetFolder.fsPath, projectName)
  if (fs.existsSync(projectPath)) {
    const overwrite = await vscode.window.showWarningMessage(
      `Folder "${projectName}" already exists. Overwrite?`,
      { modal: true },
      'Overwrite',
      'Cancel'
    )
    if (overwrite !== 'Overwrite') {
      return
    }
    await removeDirectory(projectPath)
  }

  const output = vscode.window.createOutputChannel('Create Next.js Project')
  output.show(true)

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Creating Next.js project "${projectName}"`,
      cancellable: false
    },
    async (progress) => {
      progress.report({ message: 'Running create-next-app...' })
      await runCreateNextAppCommand({
        projectName,
        cwd: targetFolder.fsPath,
        output,
        options: projectOptions
      })

      if (
        projectOptions.initShadcn ||
        projectOptions.installAllShadcnComponents
      ) {
        progress.report({ message: 'Setting up shadcn/ui...' })
        await runShadcnSetup({
          projectPath,
          options: projectOptions,
          output
        })
      }
    }
  )

  const shouldOpenInNewWindow = config.get<boolean>('openInNewWindow', true)

  if (shouldOpenInNewWindow) {
    vscode.window.showInformationMessage(
      `Next.js project "${projectName}" created successfully. Opening in new window...`
    )

    await vscode.commands.executeCommand(
      'vscode.openFolder',
      vscode.Uri.file(projectPath),
      true
    )
  } else {
    const choice = await vscode.window.showInformationMessage(
      `Next.js project "${projectName}" created successfully.`,
      'Open Here',
      'Open in New Window',
      'Cancel'
    )

    if (choice === 'Open Here') {
      await vscode.commands.executeCommand(
        'vscode.openFolder',
        vscode.Uri.file(projectPath),
        false
      )
    } else if (choice === 'Open in New Window') {
      await vscode.commands.executeCommand(
        'vscode.openFolder',
        vscode.Uri.file(projectPath),
        true
      )
    }
  }
}

async function resolveProjectOptions(
  config: vscode.WorkspaceConfiguration
): Promise<ProjectOptions | undefined> {
  const packageManager = getPackageManager(config)

  const useTypeScript = await resolveBooleanOption({
    config,
    settingKey: 'typescript',
    promptKey: 'typescriptPrompt',
    defaultValue: true,
    promptMessage: 'Enable TypeScript?',
    enableDescription: 'Adds TypeScript configuration and types.',
    disableDescription: 'Generates the project without TypeScript support.'
  })
  if (useTypeScript === undefined) {
    return undefined
  }

  const includeTailwind = await resolveBooleanOption({
    config,
    settingKey: 'tailwind',
    promptKey: 'tailwindPrompt',
    defaultValue: true,
    promptMessage: 'Include Tailwind CSS?',
    enableDescription: 'Installs Tailwind CSS and adds starter config.',
    disableDescription: 'Skips Tailwind CSS setup.'
  })
  if (includeTailwind === undefined) {
    return undefined
  }

  const linter = await resolveLinter(config)
  if (linter === undefined) {
    return undefined
  }

  const useAppRouter = await resolveBooleanOption({
    config,
    settingKey: 'appRouter',
    promptKey: 'appRouterPrompt',
    defaultValue: true,
    promptMessage: 'Use the App Router (`app/` directory)?',
    enableDescription: 'Generates the project using the App Router.',
    disableDescription: 'Generates the project using the Pages Router.'
  })
  if (useAppRouter === undefined) {
    return undefined
  }

  const useSrcDirectory = await resolveBooleanOption({
    config,
    settingKey: 'useSrcDirectory',
    promptKey: 'srcDirectoryPrompt',
    defaultValue: false,
    promptMessage: 'Create a `src/` directory?',
    enableDescription: 'Places application code inside `src/`.',
    disableDescription: 'Generates files at the project root (no `src/`).'
  })
  if (useSrcDirectory === undefined) {
    return undefined
  }

  const enableReactCompiler = await resolveBooleanOption({
    config,
    settingKey: 'reactCompiler',
    promptKey: 'reactCompilerPrompt',
    defaultValue: false,
    promptMessage: 'Enable the React Compiler?',
    enableDescription: 'Enables the React Compiler.',
    disableDescription: 'Keeps the React Compiler disabled.'
  })
  if (enableReactCompiler === undefined) {
    return undefined
  }

  const importAlias = await resolveStringOption({
    config,
    settingKey: 'importAlias',
    promptKey: 'importAliasPrompt',
    defaultValue: '@/*',
    promptMessage: 'Set module import alias (--import-alias).'
  })
  if (importAlias === undefined) {
    return undefined
  }

  const includeAgentsMd = await resolveBooleanOption({
    config,
    settingKey: 'agentsMd',
    promptKey: 'agentsMdPrompt',
    defaultValue: true,
    promptMessage: 'Include AGENTS.md and CLAUDE.md?',
    enableDescription:
      'Guides coding agents to use documentation matching the installed Next.js version.',
    disableDescription: 'Skips the coding-agent guidance files.'
  })
  if (includeAgentsMd === undefined) {
    return undefined
  }

  const initShadcn = await resolveBooleanOption({
    config,
    settingKey: 'shadcnInit',
    promptKey: 'shadcnInitPrompt',
    defaultValue: true,
    promptMessage: 'Run shadcn/ui init?',
    enableDescription: 'Runs `npx shadcn@latest init` after project creation.',
    disableDescription: 'Skips shadcn/ui initialization.'
  })
  if (initShadcn === undefined) {
    return undefined
  }

  const shadcnBase = await resolveShadcnBase(config)
  if (shadcnBase === undefined) {
    return undefined
  }

  const shadcnPreset = await resolveStringOption({
    config,
    settingKey: 'shadcnPreset',
    promptKey: 'shadcnPresetPrompt',
    defaultValue: 'nova',
    promptMessage: 'Enter a shadcn preset name, code, or URL.',
    emptyValidationMessage: 'shadcn preset cannot be empty'
  })
  if (shadcnPreset === undefined) {
    return undefined
  }

  const installAllShadcnComponents = await resolveBooleanOption({
    config,
    settingKey: 'shadcnInstallAll',
    promptKey: 'shadcnInstallAllPrompt',
    defaultValue: false,
    promptMessage: 'Install all shadcn/ui components?',
    enableDescription:
      'Runs `npx shadcn@latest add --all` after initialization.',
    disableDescription: 'Leaves component installation for later.'
  })
  if (installAllShadcnComponents === undefined) {
    return undefined
  }

  return {
    packageManager,
    useTypeScript,
    includeTailwind,
    linter,
    useAppRouter,
    useSrcDirectory,
    enableReactCompiler,
    importAlias: importAlias.trim(),
    includeAgentsMd,
    initShadcn,
    shadcnBase,
    shadcnPreset: shadcnPreset.trim(),
    installAllShadcnComponents
  }
}

async function resolveLinter(
  config: vscode.WorkspaceConfiguration
): Promise<Linter | undefined> {
  const fallback = getLinter(config)
  const shouldPrompt =
    getConfiguredValue<boolean>(config, 'linterPrompt') ??
    getConfiguredValue<boolean>(config, 'eslintPrompt') ??
    false

  if (!shouldPrompt) {
    return fallback
  }

  const items: LinterQuickPickItem[] = [
    {
      label: fallback === 'eslint' ? 'ESLint (default)' : 'ESLint',
      description: 'Use the traditional Next.js ESLint configuration.',
      value: 'eslint'
    },
    {
      label: fallback === 'biome' ? 'Biome (default)' : 'Biome',
      description: 'Use Biome for fast linting and formatting.',
      value: 'biome'
    },
    {
      label: fallback === 'none' ? 'None (default)' : 'None',
      description: 'Skip linter configuration.',
      value: 'none'
    }
  ]

  const selection = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a linter.',
    ignoreFocusOut: true
  })

  return selection?.value
}

async function resolveShadcnBase(
  config: vscode.WorkspaceConfiguration
): Promise<ShadcnBase | undefined> {
  const fallback = getShadcnBase(config)
  const shouldPrompt = config.get<boolean>('shadcnBasePrompt', false)

  if (!shouldPrompt) {
    return fallback
  }

  const items: ShadcnBaseQuickPickItem[] = [
    {
      label: fallback === 'base' ? 'Base (default)' : 'Base',
      description: 'Use Base UI primitives (recommended by shadcn).',
      value: 'base'
    },
    {
      label: fallback === 'radix' ? 'Radix (default)' : 'Radix',
      description: 'Use Radix UI primitives.',
      value: 'radix'
    }
  ]

  const selection = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a shadcn component library.',
    ignoreFocusOut: true
  })

  return selection?.value
}

async function resolveBooleanOption(params: {
  config: vscode.WorkspaceConfiguration
  settingKey: string
  promptKey: string
  defaultValue: boolean
  promptMessage: string
  enableDescription: string
  disableDescription: string
}): Promise<boolean | undefined> {
  const fallback = params.config.get<boolean>(
    params.settingKey,
    params.defaultValue
  )
  const shouldPrompt = params.config.get<boolean>(params.promptKey, false)

  if (!shouldPrompt) {
    return fallback
  }

  const items: BooleanQuickPickItem[] = [
    {
      label: fallback ? 'Yes (default)' : 'Yes',
      description: params.enableDescription,
      value: true
    },
    {
      label: !fallback ? 'No (default)' : 'No',
      description: params.disableDescription,
      value: false
    }
  ]

  const selection = await vscode.window.showQuickPick(items, {
    placeHolder: params.promptMessage,
    ignoreFocusOut: true
  })

  return selection?.value
}

async function resolveStringOption(params: {
  config: vscode.WorkspaceConfiguration
  settingKey: string
  promptKey: string
  defaultValue: string
  promptMessage: string
  emptyValidationMessage?: string
}): Promise<string | undefined> {
  const fallback = params.config.get<string>(
    params.settingKey,
    params.defaultValue
  )
  const shouldPrompt = params.config.get<boolean>(params.promptKey, false)

  if (!shouldPrompt) {
    return fallback
  }

  const value = await vscode.window.showInputBox({
    prompt: params.promptMessage,
    value: fallback,
    ignoreFocusOut: true,
    validateInput: (input) => {
      if (!input.trim()) {
        return params.emptyValidationMessage ?? 'Value cannot be empty'
      }
      return undefined
    }
  })

  return value?.trim()
}

async function resolveTargetFolder(
  defaultLocation?: string
): Promise<vscode.Uri | undefined> {
  if (defaultLocation) {
    const resolvedPath = path.resolve(defaultLocation)
    try {
      const stats = await fs.promises.stat(resolvedPath)
      if (stats.isDirectory()) {
        return vscode.Uri.file(resolvedPath)
      }
      void vscode.window.showWarningMessage(
        `Configured default location is not a folder: ${resolvedPath}. Please update your settings.`
      )
    } catch (error) {
      void vscode.window.showWarningMessage(
        `Configured default location not found: ${resolvedPath}. Please update your settings.`
      )
    }
  }

  const pickedFolder = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    title: 'Select a directory for the new Next.js project',
    openLabel: 'Use this folder'
  })

  return pickedFolder?.[0]
}

async function handleDefaultLocationSelection(): Promise<void> {
  const config = vscode.workspace.getConfiguration(CONFIG_NAMESPACE)
  const current = config.get<string>('defaultLocation', '').trim()

  const options: DefaultLocationQuickPickItem[] = [
    {
      label: 'Select Folder…',
      description: 'Choose a directory to use as the default project location',
      target: 'select'
    },
    {
      label: 'Clear Default Location',
      description: 'Re-enable the folder picker for every project',
      target: 'clear'
    }
  ]

  const choice = await vscode.window.showQuickPick(options, {
    placeHolder: current
      ? `Current default: ${current}`
      : 'No default project location set',
    ignoreFocusOut: true
  })

  if (!choice) {
    return
  }

  if (choice.target === 'select') {
    const picked = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      title: 'Select default Next.js project location',
      openLabel: 'Use this folder'
    })

    if (!picked || picked.length === 0) {
      return
    }

    const folder = picked[0].fsPath
    await config.update(
      'defaultLocation',
      folder,
      vscode.ConfigurationTarget.Global
    )
    void vscode.window.showInformationMessage(
      `Next.js Plus default project location set to: ${folder}`
    )
    return
  }

  if (choice.target === 'clear') {
    await config.update(
      'defaultLocation',
      '',
      vscode.ConfigurationTarget.Global
    )
    void vscode.window.showInformationMessage(
      'Next.js Plus default project location cleared.'
    )
  }
}

async function runCreateNextAppCommand(params: {
  projectName: string
  cwd: string
  output: vscode.OutputChannel
  options: ProjectOptions
}): Promise<void> {
  const { command, args } = buildCreateNextAppCommand(
    params.projectName,
    params.options
  )

  params.output.appendLine(
    `> ${command} ${args.join(' ')} (cwd: ${params.cwd})`
  )

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: params.cwd,
      shell: process.platform === 'win32'
    })

    child.stdout?.on('data', (data) => {
      params.output.append(data.toString())
    })

    child.stderr?.on('data', (data) => {
      params.output.append(data.toString())
    })

    child.on('error', (error) => {
      reject(error)
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`npx exited with code ${code ?? 'unknown'}`))
      }
    })
  })
}

function buildCliFlags(options: ProjectOptions): string[] {
  const flags: string[] = []

  flags.push(getPackageManagerFlag(options.packageManager))
  flags.push(options.useTypeScript ? '--ts' : '--js')
  flags.push(options.includeTailwind ? '--tailwind' : '--no-tailwind')
  flags.push(
    options.linter === 'eslint'
      ? '--eslint'
      : options.linter === 'biome'
        ? '--biome'
        : '--no-linter'
  )
  flags.push(options.useAppRouter ? '--app' : '--no-app')
  flags.push(options.useSrcDirectory ? '--src-dir' : '--no-src-dir')
  flags.push(
    options.enableReactCompiler ? '--react-compiler' : '--no-react-compiler'
  )
  flags.push('--import-alias', options.importAlias)
  flags.push(options.includeAgentsMd ? '--agents-md' : '--no-agents-md')

  return flags
}

async function removeDirectory(dir: string): Promise<void> {
  if (!fs.existsSync(dir)) {
    return
  }

  await fs.promises.rm(dir, { recursive: true, force: true })
}

async function runShadcnSetup(params: {
  projectPath: string
  options: ProjectOptions
  output: vscode.OutputChannel
}): Promise<void> {
  if (params.options.initShadcn || params.options.installAllShadcnComponents) {
    const initRunner = buildPackageRunner(
      params.options.packageManager,
      'shadcn@latest'
    )
    await runExternalCommand({
      command: initRunner.command,
      args: [
        ...initRunner.args,
        'init',
        '-y',
        '--base',
        params.options.shadcnBase,
        '--preset',
        params.options.shadcnPreset
      ],
      cwd: params.projectPath,
      output: params.output,
      label: 'shadcn init'
    })
  }

  if (params.options.installAllShadcnComponents) {
    const addRunner = buildPackageRunner(
      params.options.packageManager,
      'shadcn@latest'
    )
    await runExternalCommand({
      command: addRunner.command,
      args: [...addRunner.args, 'add', '--all', '-y'],
      cwd: params.projectPath,
      output: params.output,
      label: 'shadcn add --all'
    })
  }
}

async function runExternalCommand(params: {
  command: string
  args: string[]
  cwd: string
  output: vscode.OutputChannel
  label: string
}): Promise<void> {
  params.output.appendLine(
    `> (${params.label}) ${[params.command, ...params.args].join(' ')} (cwd: ${
      params.cwd
    })`
  )

  await new Promise<void>((resolve, reject) => {
    const child = spawn(params.command, params.args, {
      cwd: params.cwd,
      shell: process.platform === 'win32'
    })

    child.stdout?.on('data', (data) => {
      params.output.append(data.toString())
    })

    child.stderr?.on('data', (data) => {
      params.output.append(data.toString())
    })

    child.on('error', (error) => {
      reject(error)
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(
          new Error(`${params.label} exited with code ${code ?? 'unknown'}`)
        )
      }
    })
  })
}

function getPackageManager(
  config: vscode.WorkspaceConfiguration
): PackageManager {
  const value = config.get<string>('packageManager', 'npm').trim().toLowerCase()

  if (value === 'pnpm' || value === 'yarn' || value === 'bun') {
    return value
  }

  return 'npm'
}

function getLinter(config: vscode.WorkspaceConfiguration): Linter {
  const configuredLinter = getConfiguredValue<string>(config, 'linter')
  const value = configuredLinter?.trim().toLowerCase()

  if (value === 'biome' || value === 'none') {
    return value
  }

  if (value === 'eslint') {
    return value
  }

  const legacyEslint = getConfiguredValue<boolean>(config, 'eslint')
  if (legacyEslint === false) {
    return 'none'
  }

  return 'eslint'
}

function getConfiguredValue<T>(
  config: vscode.WorkspaceConfiguration,
  key: string
): T | undefined {
  const inspected = config.inspect<T>(key)

  return (
    inspected?.workspaceFolderValue ??
    inspected?.workspaceValue ??
    inspected?.globalValue
  )
}

function getShadcnBase(config: vscode.WorkspaceConfiguration): ShadcnBase {
  return config.get<string>('shadcnBase', 'base').trim().toLowerCase() ===
    'radix'
    ? 'radix'
    : 'base'
}

function getPackageManagerFlag(packageManager: PackageManager): string {
  switch (packageManager) {
    case 'pnpm':
      return '--use-pnpm'
    case 'yarn':
      return '--use-yarn'
    case 'bun':
      return '--use-bun'
    default:
      return '--use-npm'
  }
}

function buildCreateNextAppCommand(
  projectName: string,
  options: ProjectOptions
): { command: string; args: string[] } {
  const cliFlags = buildCliFlags(options)

  switch (options.packageManager) {
    case 'pnpm':
      return {
        command: 'pnpm',
        args: ['dlx', 'create-next-app@latest', projectName, ...cliFlags]
      }
    case 'yarn':
      return {
        command: 'yarn',
        args: ['create', 'next-app', projectName, ...cliFlags]
      }
    case 'bun':
      return {
        command: 'bunx',
        args: ['create-next-app@latest', projectName, ...cliFlags]
      }
    default:
      return {
        command: 'npx',
        args: ['--yes', 'create-next-app@latest', projectName, ...cliFlags]
      }
  }
}

function buildPackageRunner(
  packageManager: PackageManager,
  pkg: string
): { command: string; args: string[] } {
  switch (packageManager) {
    case 'pnpm':
      return { command: 'pnpm', args: ['dlx', pkg] }
    case 'yarn':
      return { command: 'yarn', args: ['dlx', pkg] }
    case 'bun':
      return { command: 'bunx', args: [pkg] }
    default:
      return { command: 'npx', args: ['--yes', pkg] }
  }
}
