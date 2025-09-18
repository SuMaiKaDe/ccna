#!/usr/bin/env node
// 设置编码为 UTF-8 以避免在 Windows 上出现中文乱码
process.stdout.setEncoding('utf8');
process.stderr.setEncoding('utf8');

import { program } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface Model {
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
  permission?: any[];
  root?: string;
  parent?: string;
}

interface ModelsResponse {
  data: Model[];
  object: string;
}

interface Config {
  baseUrl: string;
  authToken: string;
  opusModel: string;
  sonnetModel: string;
  haikuModel: string;
  subagentModel: string;
}

function getConfigPath(): string {
  const homeDir = os.homedir();
  const configDir = path.join(homeDir, '.claude-config');
  return path.join(configDir, 'config.json');
}

function ensureConfigDir(): void {
  const homeDir = os.homedir();
  const configDir = path.join(homeDir, '.claude-config');

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

function saveConfig(config: Config): void {
  ensureConfigDir();
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function loadConfig(): Config | null {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.warn(chalk.yellow('配置文件读取失败，将重新配置'));
    return null;
  }
}

function clearConfig(): void {
  const configPath = getConfigPath();

  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
    console.log(chalk.green('配置已清空'));
  }
}

function showHelp(): void {
  console.log(chalk.blue('ccna - Claude Code 配置和启动工具'));
  console.log('='.repeat(40));
  console.log('');
  console.log(chalk.cyan('用法:'));
  console.log('  ccna              - 使用已有配置启动，如果没有配置则进行初始配置');
  console.log('  ccna clear        - 清空配置文件，重新进行初始配置');
  console.log('  ccna help         - 显示此帮助信息');
  console.log('  ccna [claude-args] - 使用已有配置启动 Claude，并传递额外参数给 claude 命令');
  console.log('');
  console.log(chalk.cyan('示例:'));
  console.log('  ccna              - 正常启动');
  console.log('  ccna clear        - 清空配置并重新配置');
  console.log('  ccna help         - 显示帮助');
  console.log('  ccna --version    - 启动 Claude 并显示版本');
  console.log('  ccna my-project  - 启动 Claude 并打开项目目录');
  console.log('');
  console.log(chalk.cyan('配置文件位置:'));
  console.log(`  ${getConfigPath()}`);
}

function normalizeBaseUrl(baseUrl: string): string {
  // 移除协议/
  let normalized = baseUrl.replace(/\/+$/, '');

  // 如果包含 /v1/，提取基础部分
  if (normalized.includes('/v1/')) {
    normalized = normalized.split('/v1/')[0];
  }

  // 如果以 /v1 结尾，移除它
  if (normalized.endsWith('/v1')) {
    normalized = normalized.slice(0, -3);
  }

  // 重新构建 URL
  return normalized + '/v1';
}

async function getModels(baseUrl: string, authToken: string): Promise<Model[]> {
  try {
    const normalizedUrl = normalizeBaseUrl(baseUrl);
    const modelsUrl = `${normalizedUrl}/models`;

    console.log(chalk.yellow(`正在从 ${modelsUrl} 获取模型列表...`));
    console.log(chalk.gray(`调试信息 - 原始URL: ${baseUrl}`));
    console.log(chalk.gray(`调试信息 - 标准化后: ${normalizedUrl}`));

    const response = await axios.get<ModelsResponse>(modelsUrl, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const models = response.data.data || [];

    return models;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message;
      throw new Error(`获取模型列表失败: ${errorMessage}`);
    }
    throw new Error(`获取模型列表失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function categorizeModels(modelIds: string[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {
    opus: [],
    sonnet: [],
    haiku: [],
    other: []
  };

  modelIds.forEach(modelId => {
    const modelLower = modelId.toLowerCase();
    if (modelLower.includes('opus')) {
      categories.opus.push(modelId);
    } else if (modelLower.includes('sonnet')) {
      categories.sonnet.push(modelId);
    } else if (modelLower.includes('haiku')) {
      categories.haiku.push(modelId);
    } else {
      categories.other.push(modelId);
    }
  });

  return categories;
}

function getPlatform(): string {
  const platform = process.platform;
  if (platform === 'win32') {
    return 'windows';
  } else if (platform === 'darwin') {
    return 'mac';
  } else {
    return 'linux';
  }
}

function printEnvVars(config: {
  baseUrl: string;
  authToken: string;
  opusModel: string;
  sonnetModel: string;
  haikuModel: string;
  subagentModel: string;
}): void {
  const platform = getPlatform();

  console.log('\n' + '='.repeat(60));
  console.log(chalk.green('环境变量配置:'));
  console.log('='.repeat(60));

  if (platform === 'windows') {
    console.log(chalk.cyan(`$env:ANTHROPIC_BASE_URL="${config.baseUrl}"`));
    console.log(chalk.cyan(`$env:ANTHROPIC_AUTH_TOKEN="${config.authToken}"`));
    console.log(chalk.cyan(`$env:ANTHROPIC_DEFAULT_OPUS_MODEL="${config.opusModel}"`));
    console.log(chalk.cyan(`$env:ANTHROPIC_DEFAULT_SONNET_MODEL="${config.sonnetModel}"`));
    console.log(chalk.cyan(`$env:ANTHROPIC_DEFAULT_HAIKU_MODEL="${config.haikuModel}"`));
    console.log(chalk.cyan(`$env:CLAUDE_CODE_SUBAGENT_MODEL="${config.subagentModel}"`));
  } else {
    console.log(chalk.cyan(`export ANTHROPIC_BASE_URL="${config.baseUrl}"`));
    console.log(chalk.cyan(`export ANTHROPIC_AUTH_TOKEN="${config.authToken}"`));
    console.log(chalk.cyan(`export ANTHROPIC_DEFAULT_OPUS_MODEL="${config.opusModel}"`));
    console.log(chalk.cyan(`export ANTHROPIC_DEFAULT_SONNET_MODEL="${config.sonnetModel}"`));
    console.log(chalk.cyan(`export ANTHROPIC_DEFAULT_HAIKU_MODEL="${config.haikuModel}"`));
    console.log(chalk.cyan(`export CLAUDE_CODE_SUBAGENT_MODEL="${config.subagentModel}"`));
  }

  console.log('='.repeat(60));

  // 添加使用说明
  console.log(chalk.yellow('\n使用方法:'));
  if (platform === 'windows') {
    console.log(chalk.gray('PowerShell: 直接复制上述命令到 PowerShell 中执行'));
    console.log(chalk.gray('命令提示符: 使用 set 命令，例如: set ANTHROPIC_BASE_URL=' + config.baseUrl));
  } else {
    console.log(chalk.gray('bash/zsh: 复制上述命令到终端中执行'));
    console.log(chalk.gray('或添加到 ~/.bashrc, ~/.zshrc, ~/.profile 等配置文件中'));
  }
}

async function startClaudeWithEnv(config: {
  baseUrl: string;
  authToken: string;
  opusModel: string;
  sonnetModel: string;
  haikuModel: string;
  subagentModel: string;
}, extraArgs: string[] = []): Promise<void> {
  try {
    const { spawn } = require('child_process');

    // 设置环境变量
    const env = {
      ...process.env,
      ANTHROPIC_BASE_URL: config.baseUrl,
      ANTHROPIC_AUTH_TOKEN: config.authToken,
      ANTHROPIC_DEFAULT_OPUS_MODEL: config.opusModel,
      ANTHROPIC_DEFAULT_SONNET_MODEL: config.sonnetModel,
      ANTHROPIC_DEFAULT_HAIKU_MODEL: config.haikuModel,
      CLAUDE_CODE_SUBAGENT_MODEL: config.subagentModel,
    };

    // 尝试不同的 Claude 命令路径
    const claudeCommands = [
      'claude',
      'claude.cmd',
      'claude.exe',
      '.\\claude.cmd',
      '.\\claude.exe'
    ];

    let child;
    for (const command of claudeCommands) {
      try {
        console.log(chalk.gray(`尝试启动: ${command}`));
        child = spawn(command, extraArgs, {
          stdio: 'inherit',
          env: env,
          shell: true
        });
        break;
      } catch (e) {
        continue;
      }
    }

    if (!child) {
      throw new Error('无法找到 Claude 可执行文件');
    }

    child.on('error', (error: Error) => {
      console.error(chalk.red(`启动 Claude Code 失败: ${error.message}`));
      console.log(chalk.yellow('请确保已正确安装 Claude Code 并在 PATH 中'));
      console.log(chalk.yellow('或者尝试手动设置环境变量后运行 claude 命令'));
    });

    child.on('exit', (code: number) => {
      if (code !== 0) {
        console.error(chalk.red(`Claude Code 退出，代码: ${code}`));
      }
    });

  } catch (error) {
    console.error(chalk.red(`启动 Claude Code 失败: ${error instanceof Error ? error.message : String(error)}`));
    console.log(chalk.yellow('\n请手动设置以下环境变量后运行 claude 命令:'));
    console.log(chalk.gray(`set ANTHROPIC_BASE_URL=${config.baseUrl}`));
    console.log(chalk.gray(`set ANTHROPIC_AUTH_TOKEN=${config.authToken}`));
    console.log(chalk.gray(`set ANTHROPIC_DEFAULT_OPUS_MODEL=${config.opusModel}`));
    console.log(chalk.gray(`set ANTHROPIC_DEFAULT_SONNET_MODEL=${config.sonnetModel}`));
    console.log(chalk.gray(`set ANTHROPIC_DEFAULT_HAIKU_MODEL=${config.haikuModel}`));
    console.log(chalk.gray(`set CLAUDE_CODE_SUBAGENT_MODEL=${config.subagentModel}`));
  }
}

async function configureInitial(): Promise<Config> {
  try {
    console.log(chalk.blue('Claude Code 初始配置'));
    console.log('='.repeat(40));

    // 获取 API 配置
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'baseUrl',
        message: '请输入 NEW-api 接口地址:',
        default: 'https://api.anthropic.com',
        validate: (input: string) => {
          if (!input.trim()) {
            return '接口地址不能为空';
          }
          return true;
        }
      },
      {
        type: 'password',
        name: 'authToken',
        message: '请输入 API 密钥:',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'API 密钥不能为空';
          }
          return true;
        }
      }
    ]);

    const { baseUrl, authToken } = answers;

    // 获取模型列表
    console.log(chalk.yellow('\n正在获取可用模型...'));
    const models = await getModels(baseUrl, authToken);

    if (models.length === 0) {
      console.error(chalk.red('无法获取模型列表，请检查接口地址和密钥是否正确'));
      process.exit(1);
    }

    // 显示模型列表
    console.log(chalk.green('\n可用的模型:'));
    const modelChoices = models.map((model, index) => ({
      name: `${model.id} ${model.owned_by ? `(${model.owned_by})` : ''}`,
      value: model.id,
      short: model.id
    }));

    // 选择模型
    console.log(chalk.blue('\n请选择默认模型:'));

    // 选择 Opus 模型
    const { opusModel } = await inquirer.prompt([
      {
        type: 'list',
        name: 'opusModel',
        message: '选择 Opus 模型 (用于 opus 或计划模式激活时的 opusplan):',
        choices: modelChoices,
        default: modelChoices[0]?.value
      }
    ]);

    // 选择 Sonnet 模型
    const { sonnetModel } = await inquirer.prompt([
      {
        type: 'list',
        name: 'sonnetModel',
        message: '选择 Sonnet 模型 (用于 sonnet 或计划模式未激活时的 opusplan):',
        choices: modelChoices,
        default: modelChoices[0]?.value
      }
    ]);

    // 选择 Haiku 模型
    const { haikuModel } = await inquirer.prompt([
      {
        type: 'list',
        name: 'haikuModel',
        message: '选择 Haiku 模型 (用于 haiku 或后台功能):',
        choices: modelChoices,
        default: modelChoices[0]?.value
      }
    ]);

    // 选择子代理模型
    const { subagentModel } = await inquirer.prompt([
      {
        type: 'list',
        name: 'subagentModel',
        message: '选择子代理模型:',
        choices: modelChoices,
        default: modelChoices[1]?.value || modelChoices[0]?.value
      }
    ]);

    const config: Config = {
      baseUrl,
      authToken,
      opusModel,
      sonnetModel,
      haikuModel,
      subagentModel
    };

    // 保存配置
    saveConfig(config);

    return config;
  } catch (error) {
    console.error(chalk.red(`配置失败: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

async function selectModelsFromConfig(config: Config): Promise<Config> {
  // 获取模型列表
  console.log(chalk.yellow('\n正在获取可用模型...'));
  const models = await getModels(config.baseUrl, config.authToken);

  if (models.length === 0) {
    console.error(chalk.red('无法获取模型列表，请检查接口地址和密钥是否正确'));
    process.exit(1);
  }

  // 显示模型列表
  console.log(chalk.green('\n可用的模型:'));
  const modelChoices = models.map((model, index) => ({
    name: `${model.id} ${model.owned_by ? `(${model.owned_by})` : ''}`,
    value: model.id,
    short: model.id
  }));

  // 选择模型
  console.log(chalk.blue('\n请选择默认模型:'));

  // 选择 Opus 模型
  const { opusModel } = await inquirer.prompt([
    {
      type: 'list',
      name: 'opusModel',
      message: '选择 Opus 模型 (用于 opus 或计划模式激活时的 opusplan):',
      choices: modelChoices,
      default: config.opusModel || modelChoices[0]?.value
    }
  ]);

  // 选择 Sonnet 模型
  const { sonnetModel } = await inquirer.prompt([
    {
      type: 'list',
      name: 'sonnetModel',
      message: '选择 Sonnet 模型 (用于 sonnet 或计划模式未激活时的 opusplan):',
      choices: modelChoices,
      default: config.sonnetModel || modelChoices[0]?.value
    }
  ]);

  // 选择 Haiku 模型
  const { haikuModel } = await inquirer.prompt([
    {
      type: 'list',
      name: 'haikuModel',
      message: '选择 Haiku 模型 (用于 haiku 或后台功能):',
      choices: modelChoices,
      default: config.haikuModel || modelChoices[0]?.value
    }
  ]);

  // 选择子代理模型
  const { subagentModel } = await inquirer.prompt([
    {
      type: 'list',
      name: 'subagentModel',
      message: '选择子代理模型:',
      choices: modelChoices,
      default: config.subagentModel || modelChoices[1]?.value || modelChoices[0]?.value
    }
  ]);

  const updatedConfig: Config = {
    ...config,
    opusModel,
    sonnetModel,
    haikuModel,
    subagentModel
  };

  // 保存更新后的配置
  saveConfig(updatedConfig);

  return updatedConfig;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // 处理命令行参数
  if (args.includes('help')) {
    showHelp();
    return;
  }

  if (args.includes('clear')) {
    clearConfig();
    console.log(chalk.yellow('请重新运行 ccna 进行配置'));
    return;
  }

  // 获取额外参数（非 clear 和 help 的参数）
  const extraArgs = args.filter(arg => arg !== 'clear' && arg !== 'help');

  try {
    let config: Config;

    // 检查是否有配置
    const existingConfig = loadConfig();

    if (existingConfig) {
      console.log(chalk.blue('发现现有配置，正在选择模型...'));
      config = await selectModelsFromConfig(existingConfig);
    } else {
      console.log(chalk.blue('未发现配置，正在进行初始配置...'));
      config = await configureInitial();
    }

    // 显示配置
    printEnvVars(config);

    // 直接启动 Claude Code
    console.log(chalk.yellow('\n正在启动 Claude Code...'));
    await startClaudeWithEnv(config, extraArgs);

  } catch (error) {
    console.error(chalk.red(`启动失败: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

program
  .name('ccna')
  .description('Claude Code 配置和启动工具')
  .version('1.0.0');

program.action(main);

program.parse();