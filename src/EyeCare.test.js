import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('护眼配置默认 40/3/5/30 且旧提醒字段有确定性迁移', async () => {
  const [config, settings] = await Promise.all([
    read('../crates/core/src/config.rs'),
    read('./routes/settings/components/SettingsEyeCare.svelte'),
  ]);

  assert.match(config, /fn default_eye_care_work_minutes\(\)[\s\S]*?40/);
  assert.match(config, /fn default_eye_care_rest_minutes\(\)[\s\S]*?3/);
  assert.match(config, /fn default_eye_care_natural_rest_minutes\(\)[\s\S]*?5/);
  assert.match(config, /fn default_eye_care_pre_break_seconds\(\)[\s\S]*?30/);
  assert.match(config, /deserialize_config_with_legacy_migration/);
  assert.match(config, /remove\("break_reminder_enabled"\)/);
  assert.match(config, /remove\("break_reminder_interval_minutes"\)/);
  for (const field of [
    'eye_care_enabled',
    'eye_care_work_minutes',
    'eye_care_rest_minutes',
    'eye_care_natural_rest_minutes',
    'eye_care_pre_break_seconds',
    'eye_care_paused',
  ]) {
    assert.match(settings, new RegExp(`config\\.${field}`));
  }
});

test('护眼状态机独立使用单调增量并覆盖等待返回、锁屏、挂起和持久化', async () => {
  const [engine, main] = await Promise.all([
    read('../src-tauri/src/eye_care.rs'),
    read('../src-tauri/src/main.rs'),
  ]);

  for (const phase of ['Working', 'PreBreak', 'Resting', 'WaitingReturn']) {
    assert.match(engine, new RegExp(`\\b${phase}\\b`));
  }
  assert.match(main, /std::time::Instant::now\(\)/);
  assert.match(main, /saturating_duration_since\(last_tick\)/);
  assert.match(main, /resolve_tick_timing\(monotonic_delta_ms, suspend_clock_delta_ms\)/);
  assert.match(engine, /GetTickCount64/);
  assert.match(main, /try_get_idle_seconds\(\)/);
  assert.match(main, /lock_monitor\.is_locked\(\)/);
  assert.match(engine, /suspended_or_unknown_gap/);
  assert.match(engine, /eye-care-state\.json|save\(&mut self/);
  assert.doesNotMatch(engine, /ScreenshotService|generate_report|reqwest|AiProvider/);
});

test('预告非阻挡，休息层覆盖每块显示器且 watchdog 会恢复窗口', async () => {
  const [engine, main, overlay, preBreak, capabilities] = await Promise.all([
    read('../src-tauri/src/eye_care.rs'),
    read('../src-tauri/src/main.rs'),
    read('./routes/eye-care/EyeCareOverlay.svelte'),
    read('./routes/eye-care/EyeCarePreBreak.svelte'),
    read('../src-tauri/capabilities/migrated.json'),
  ]);

  assert.match(engine, /available_monitors\(\)/);
  assert.match(engine, /for \(index, monitor\) in monitors\.iter\(\)\.enumerate\(\)/);
  assert.match(engine, /expected_labels/);
  assert.match(engine, /set_ignore_cursor_events\(true\)/);
  assert.match(engine, /set_content_protected\(true\)/);
  assert.match(main, /sync_overlay_windows\(&app, &status\)/);
  assert.match(main, /同步护眼休息层失败，watchdog 将重试/);
  assert.match(main, /api\.prevent_close\(\)/);
  assert.match(main, /api\.prevent_exit\(\)/);
  // 休息遮罩为深色静谧全屏（Apple-grade editorial 收敛后不再使用 78vw 圆角卡片）
  assert.match(overlay, /100vw/);
  assert.match(overlay, /100vh/);
  assert.match(overlay, /radial-gradient/);
  assert.match(overlay, /tabular-nums/);
  assert.doesNotMatch(overlay, /orb-one|orb-two/);
  assert.match(overlay, /EMERGENCY_HOLD_MS\s*=\s*5000/);
  assert.match(overlay, /ControlLeft[\s\S]*AltLeft[\s\S]*ShiftLeft/);
  assert.doesNotMatch(overlay, /skip|postpone|延后|跳过/i);
  assert.match(preBreak, /preBreakDescription/);
  assert.match(capabilities, /eye-care-pre-break/);
  assert.match(capabilities, /eye-care-overlay-\*/);
});

test('周期回顾只读现有活动并复用隐私过滤，自有窗口不进入采集', async () => {
  const [engine, main, recap] = await Promise.all([
    read('../src-tauri/src/eye_care.rs'),
    read('../src-tauri/src/main.rs'),
    read('./lib/components/EyeCareRecap.svelte'),
  ]);

  assert.match(engine, /get_activities_in_range/);
  assert.match(engine, /collect_privacy_filters/);
  assert.match(engine, /filter_activities_by_privacy/);
  assert.match(engine, /build_recap_from_activities/);
  assert.match(engine, /overlap_start/);
  assert.match(engine, /overlap_end/);
  assert.match(main, /if transition\.returned[\s\S]*build_recap/);
  assert.match(main, /is_own_app_window/);
  assert.match(main, /title == "eye review rest"/);
  assert.match(recap, /recap\.empty/);
  assert.doesNotMatch(engine, /capture\(|upload_screenshot|generate_text_with_model/);
});

test('桌宠运行时、窗口、设置和素材已删除', async () => {
  const removed = [
    '../src-tauri/src/avatar_engine.rs',
    '../src-tauri/src/avatar_input.rs',
    '../src-tauri/src/commands/avatar.rs',
    './routes/avatar/AvatarWindow.svelte',
    './routes/settings/components/SettingsAvatar.svelte',
    './lib/components/Avatar',
  ];
  for (const path of removed) {
    await assert.rejects(access(new URL(path, import.meta.url), constants.F_OK));
  }
});
