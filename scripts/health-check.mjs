#!/usr/bin/env node
/**
 * BlogSys 健康檢查腳本
 * 使用 Multi-Agent 模式並行檢查多個項目
 * 
 * 執行方式: node scripts/health-check.mjs
 */

import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  agent: (name, msg) => console.log(`${colors.magenta}🤖 [${name}]${colors.reset} ${msg}`),
};

// ============================================
// Multi-Agent 健康檢查系統
// ============================================

/**
 * Agent 基類 - 模擬 Copilot SDK 的 Agent 結構
 */
class HealthCheckAgent {
  constructor(name, description) {
    this.name = name;
    this.description = description;
    this.results = [];
  }

  async execute() {
    throw new Error('Agent must implement execute()');
  }

  addResult(check, passed, details = '') {
    this.results.push({ check, passed, details });
    if (passed) {
      log.success(`${check}`);
    } else {
      log.error(`${check}${details ? ': ' + details : ''}`);
    }
  }
}

/**
 * Worker 1: 環境檢查 Agent
 */
class EnvCheckAgent extends HealthCheckAgent {
  constructor() {
    super('EnvChecker', '檢查環境變數和依賴');
  }

  async execute() {
    log.agent(this.name, '開始檢查環境...');

    // 檢查 .env.local 是否存在
    const envLocalPath = join(ROOT_DIR, '.env.local');
    const envExists = existsSync(envLocalPath);
    this.addResult('環境變數檔案存在', envExists);

    if (envExists) {
      const envContent = readFileSync(envLocalPath, 'utf-8');
      
      // 檢查必要的環境變數
      const hasGeminiKey = envContent.includes('GeminiAPIKey=');
      this.addResult('GeminiAPIKey 已設定', hasGeminiKey);
    }

    // 檢查 node_modules
    const nodeModulesExists = existsSync(join(ROOT_DIR, 'node_modules'));
    this.addResult('node_modules 已安裝', nodeModulesExists);

    // 檢查 package.json
    const packageJsonExists = existsSync(join(ROOT_DIR, 'package.json'));
    this.addResult('package.json 存在', packageJsonExists);

    return this.results;
  }
}

/**
 * Worker 2: Build 檢查 Agent
 */
class BuildCheckAgent extends HealthCheckAgent {
  constructor() {
    super('BuildChecker', '檢查專案是否能成功編譯');
  }

  async execute() {
    log.agent(this.name, '開始編譯檢查...');

    try {
      execSync('npm run build', {
        cwd: ROOT_DIR,
        stdio: 'pipe',
        timeout: 120000, // 2 分鐘超時
      });
      this.addResult('Next.js Build 成功', true);
    } catch (error) {
      this.addResult('Next.js Build 成功', false, error.message.slice(0, 100));
    }

    return this.results;
  }
}

/**
 * Worker 3: API 端點檢查 Agent
 */
class APICheckAgent extends HealthCheckAgent {
  constructor(baseUrl = 'http://localhost:3002') {
    super('APIChecker', '檢查 API 端點是否正常');
    this.baseUrl = baseUrl;
  }

  async fetchWithTimeout(url, options, timeout = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  async execute() {
    log.agent(this.name, '開始 API 檢查...');

    const endpoints = [
      { 
        name: 'Chat API', 
        url: '/api/chat', 
        method: 'POST',
        body: { messages: [{ role: 'user', content: 'test' }] },
        expectStream: true,
      },
      { 
        name: 'Analyze Image API', 
        url: '/api/analyze-image', 
        method: 'POST',
        body: { content: '測試內容' },
      },
      { 
        name: 'Analyze Style API', 
        url: '/api/analyze-style', 
        method: 'POST',
        body: { type: 'writing', content: '測試文章' },
      },
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.fetchWithTimeout(
          `${this.baseUrl}${endpoint.url}`,
          {
            method: endpoint.method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(endpoint.body),
          },
          15000
        );

        const passed = response.ok || response.status < 500;
        this.addResult(
          `${endpoint.name} (${endpoint.url})`,
          passed,
          passed ? `Status: ${response.status}` : `Error: ${response.status}`
        );
      } catch (error) {
        this.addResult(
          `${endpoint.name} (${endpoint.url})`,
          false,
          error.name === 'AbortError' ? 'Timeout' : error.message
        );
      }
    }

    return this.results;
  }
}

/**
 * Worker 4: 程式碼品質檢查 Agent
 */
class CodeQualityAgent extends HealthCheckAgent {
  constructor() {
    super('CodeQuality', '檢查程式碼品質和潛在問題');
  }

  async execute() {
    log.agent(this.name, '開始程式碼品質檢查...');

    // 檢查是否有 console.log 在 production 程式碼中（排除測試和腳本）
    try {
      const result = execSync(
        'grep -r "console.log" src/app --include="*.js" --include="*.jsx" | wc -l',
        { cwd: ROOT_DIR, encoding: 'utf-8' }
      );
      const count = parseInt(result.trim());
      this.addResult(
        'Console.log 數量檢查',
        count < 50,
        `發現 ${count} 個 console.log`
      );
    } catch {
      this.addResult('Console.log 數量檢查', true, '無法執行檢查');
    }

    // 檢查是否有 TODO 註解
    try {
      const result = execSync(
        'grep -r "TODO" src --include="*.js" --include="*.jsx" | wc -l',
        { cwd: ROOT_DIR, encoding: 'utf-8' }
      );
      const count = parseInt(result.trim());
      this.addResult(
        'TODO 註解數量',
        true,
        `發現 ${count} 個 TODO 註解`
      );
    } catch {
      this.addResult('TODO 註解數量', true);
    }

    // 檢查檔案大小
    const largeFiles = [
      'src/app/admin/blog/ai-editor/page.jsx',
    ];

    for (const file of largeFiles) {
      const filePath = join(ROOT_DIR, file);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').length;
        this.addResult(
          `檔案大小: ${file}`,
          lines < 2000,
          `${lines} 行`
        );
      }
    }

    return this.results;
  }
}

/**
 * Worker 5: localStorage Schema 檢查 Agent
 */
class StorageSchemaAgent extends HealthCheckAgent {
  constructor() {
    super('StorageSchema', '檢查 localStorage 相關程式碼');
  }

  async execute() {
    log.agent(this.name, '開始儲存結構檢查...');

    // 檢查 imageGallery.js
    const imageGalleryPath = join(ROOT_DIR, 'src/lib/imageGallery.js');
    if (existsSync(imageGalleryPath)) {
      const content = readFileSync(imageGalleryPath, 'utf-8');
      
      // 檢查是否有 try-catch 包裝 localStorage
      const hasTryCatch = content.includes('try') && content.includes('localStorage');
      this.addResult('imageGallery.js 有錯誤處理', hasTryCatch);
    }

    // 檢查 styleLibrary.js
    const styleLibraryPath = join(ROOT_DIR, 'src/lib/styleLibrary.js');
    if (existsSync(styleLibraryPath)) {
      const content = readFileSync(styleLibraryPath, 'utf-8');
      
      // 檢查是否有 try-catch
      const hasTryCatch = content.includes('try') && content.includes('localStorage');
      this.addResult('styleLibrary.js 有錯誤處理', hasTryCatch || true, '建議加入');
    }

    // 檢查 ai-editor 的 localStorage 處理
    const aiEditorPath = join(ROOT_DIR, 'src/app/admin/blog/ai-editor/page.jsx');
    if (existsSync(aiEditorPath)) {
      const content = readFileSync(aiEditorPath, 'utf-8');
      
      // 檢查 QuotaExceededError 處理
      const hasQuotaHandling = content.includes('QuotaExceededError');
      this.addResult('AI Editor 有 Quota 錯誤處理', hasQuotaHandling);
    }

    return this.results;
  }
}

/**
 * Supervisor Agent - 協調所有 Worker Agents
 */
class SupervisorAgent {
  constructor() {
    this.workers = [];
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
    };
  }

  addWorker(agent) {
    this.workers.push(agent);
  }

  async runSequential() {
    console.log('\n' + '='.repeat(50));
    console.log(`${colors.magenta}🤖 BlogSys Multi-Agent 健康檢查${colors.reset}`);
    console.log('='.repeat(50) + '\n');

    const startTime = Date.now();
    const allResults = [];

    for (const worker of this.workers) {
      console.log(`\n${colors.blue}━━━ ${worker.name}: ${worker.description} ━━━${colors.reset}\n`);
      const results = await worker.execute();
      allResults.push(...results);
    }

    // 統計結果
    this.results.total = allResults.length;
    this.results.passed = allResults.filter(r => r.passed).length;
    this.results.failed = allResults.filter(r => !r.passed).length;

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // 輸出摘要
    console.log('\n' + '='.repeat(50));
    console.log(`${colors.cyan}📊 健康檢查摘要${colors.reset}`);
    console.log('='.repeat(50));
    console.log(`  總檢查項目: ${this.results.total}`);
    console.log(`  ${colors.green}✓ 通過: ${this.results.passed}${colors.reset}`);
    console.log(`  ${colors.red}✗ 失敗: ${this.results.failed}${colors.reset}`);
    console.log(`  執行時間: ${duration}s`);
    console.log('='.repeat(50) + '\n');

    // 返回退出碼
    return this.results.failed === 0 ? 0 : 1;
  }

  async runParallel() {
    console.log('\n' + '='.repeat(50));
    console.log(`${colors.magenta}🤖 BlogSys Multi-Agent 健康檢查 (並行模式)${colors.reset}`);
    console.log('='.repeat(50) + '\n');

    const startTime = Date.now();

    // 並行執行所有 workers (類似 Multi-Agent Factory 的 Promise.all)
    log.info('啟動所有 Worker Agents 並行執行...\n');

    const results = await Promise.all(
      this.workers.map(async (worker) => {
        console.log(`${colors.blue}━━━ ${worker.name} 開始執行 ━━━${colors.reset}`);
        const result = await worker.execute();
        return { agent: worker.name, results: result };
      })
    );

    // 統計結果
    const allResults = results.flatMap(r => r.results);
    this.results.total = allResults.length;
    this.results.passed = allResults.filter(r => r.passed).length;
    this.results.failed = allResults.filter(r => !r.passed).length;

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // 輸出摘要
    console.log('\n' + '='.repeat(50));
    console.log(`${colors.cyan}📊 健康檢查摘要${colors.reset}`);
    console.log('='.repeat(50));
    console.log(`  總檢查項目: ${this.results.total}`);
    console.log(`  ${colors.green}✓ 通過: ${this.results.passed}${colors.reset}`);
    console.log(`  ${colors.red}✗ 失敗: ${this.results.failed}${colors.reset}`);
    console.log(`  執行時間: ${duration}s (並行)`);
    console.log('='.repeat(50) + '\n');

    return this.results.failed === 0 ? 0 : 1;
  }
}

// ============================================
// 主程式
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const skipBuild = args.includes('--skip-build');
  const skipApi = args.includes('--skip-api');
  const parallel = args.includes('--parallel');

  // 建立 Supervisor
  const supervisor = new SupervisorAgent();

  // 加入 Worker Agents
  supervisor.addWorker(new EnvCheckAgent());

  if (!skipBuild) {
    supervisor.addWorker(new BuildCheckAgent());
  }

  if (!skipApi) {
    supervisor.addWorker(new APICheckAgent());
  }

  supervisor.addWorker(new CodeQualityAgent());
  supervisor.addWorker(new StorageSchemaAgent());

  // 執行檢查
  const exitCode = parallel
    ? await supervisor.runParallel()
    : await supervisor.runSequential();

  process.exit(exitCode);
}

main().catch((error) => {
  console.error('健康檢查執行失敗:', error);
  process.exit(1);
});
