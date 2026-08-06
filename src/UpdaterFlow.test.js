import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

async function readCommandsSource() {
  // commands.rs 已按领域拆分为 commands/*.rs，这里拼接所有子模块以保持断言语义不变。
  const dir = new URL('../src-tauri/src/commands/', import.meta.url);
  const files = (await readdir(dir)).filter((f) => f.endsWith('.rs'));
  const parts = await Promise.all(files.map((f) => readFile(new URL(f, dir), 'utf8')));
  return parts.join('\n');
}

test('后端检查更新应优先验证当前平台存在可安装更新包', async () => {
  const source = await readCommandsSource();

  assert.match(source, /check_installable_update/);
  assert.match(source, /\.updater_builder\(\)/);
  assert.match(source, /match updater\.check\(\)\.await/);
  assert.match(source, /auto_update_ready: true/);
});

test('Windows 更新为优雅模式：包体精简 + 静默安装 + 就绪后由用户决定重启时机', async () => {
  const { readFile: rf } = await import('node:fs/promises');
  const conf = JSON.parse(await rf(new URL('../src-tauri/tauri.conf.json', import.meta.url), 'utf8'));
  const flow = await rf(new URL('./lib/utils/updater.js', import.meta.url), 'utf8');
  const zhCN = await rf(new URL('./lib/i18n/locales/zh-CN.js', import.meta.url), 'utf8');

  // 包体：WebView2 在线引导（setup.exe 不再内嵌 ~180MB Runtime）
  assert.equal(conf.bundle.windows.webviewInstallMode?.type, 'onlineBootstrapper');
  assert.equal(conf.bundle.windows.webviewInstallMode?.silent, true);

  // 安装：NSIS passive 静默进度条（无安装向导）
  assert.equal(conf.plugins.updater.windows.installMode, 'passive');

  // 重启时机：就绪后弹确认，用户选"立即重启"或"下次启动"
  assert.match(flow, /readyToRestartTitle/);
  assert.match(flow, /pendingRestart: true/);
  assert.match(flow, /quit_app_for_update/);
  assert.match(zhCN, /readyToRestartMessage/);
  assert.match(zhCN, /restartLaterToast/);
});
