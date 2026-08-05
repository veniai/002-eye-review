<script>
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { listen } from '@tauri-apps/api/event';
  import { initializeLocale, t } from '$lib/i18n/index.js';

  let status = {
    phase: 'RESTING',
    remainingSeconds: 0,
    progress: 0,
  };
  let emergencyTimer = null;
  const EMERGENCY_HOLD_MS = 5000;

  $: minutes = Math.floor((status?.remainingSeconds || 0) / 60);
  $: seconds = (status?.remainingSeconds || 0) % 60;
  $: countdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  $: progress = Math.max(0, Math.min(1, Number(status?.progress) || 0));

  function isEmergencyChord(event) {
    return event.ctrlKey && event.altKey && event.shiftKey && event.code === 'F12';
  }

  function cancelEmergencyHold() {
    if (emergencyTimer) clearTimeout(emergencyTimer);
    emergencyTimer = null;
  }

  function handleKeyDown(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!isEmergencyChord(event) || emergencyTimer || event.repeat) return;
    emergencyTimer = setTimeout(async () => {
      emergencyTimer = null;
      try {
        await invoke('eye_care_emergency_release');
      } catch (error) {
        console.error('护眼故障出口调用失败:', error);
      }
    }, EMERGENCY_HOLD_MS);
  }

  function handleKeyUp(event) {
    event.preventDefault();
    event.stopPropagation();
    if (['F12', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
      cancelEmergencyHold();
    }
  }

  onMount(() => {
    initializeLocale();
    let disposed = false;
    let unlisten = () => {};
    invoke('get_eye_care_status').then((next) => {
      if (!disposed && next) status = next;
    }).catch(() => {});
    listen('eye-care-status-changed', (event) => {
      if (!disposed && event.payload) status = event.payload;
    }).then((cleanup) => {
      if (disposed) cleanup(); else unlisten = cleanup;
    }).catch(() => {});

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', cancelEmergencyHold);
    return () => {
      disposed = true;
      unlisten();
      cancelEmergencyHold();
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', cancelEmergencyHold);
    };
  });
</script>

<svelte:window on:contextmenu|preventDefault />

<div class="rest-screen" role="dialog" aria-modal="true" aria-label={t('eyeCare.overlayDialogLabel')}>
  <section class="rest-card">
    <div class="orb orb-one"></div>
    <div class="orb orb-two"></div>
    <div class="content">
      <div class="eyebrow">EYE REVIEW</div>
      <h1>{t('eyeCare.overlayTitle')}</h1>
      <p>{t('eyeCare.overlayDescription')}</p>
      <div class="countdown" aria-live="polite">{countdown}</div>
      <div class="progress" aria-label={t('eyeCare.overlayProgressLabel')}>
        <span style={`width: ${progress * 100}%`}></span>
      </div>
      <div class="hint">{t('eyeCare.overlayHint')}</div>
    </div>
  </section>
</div>

<style>
  :global(html), :global(body), :global(#app) { margin: 0; width: 100%; height: 100%; overflow: hidden; background: transparent; }
  .rest-screen { width: 100vw; height: 100vh; display: grid; place-items: center; background: rgba(9, 18, 31, .56); user-select: none; cursor: default; font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif; }
  .rest-card { position: relative; width: 78vw; height: 78vh; overflow: hidden; border-radius: clamp(30px, 4vw, 64px); background: linear-gradient(135deg, #d9f7ef 0%, #dfeeff 45%, #f7e7f5 100%); box-shadow: 0 30px 90px rgba(2, 10, 24, .35), inset 0 0 0 1px rgba(255,255,255,.72); color: #15334b; }
  .content { position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5vh 6vw; text-align: center; box-sizing: border-box; }
  .eyebrow { font-size: clamp(12px, 1.1vw, 18px); font-weight: 800; letter-spacing: .28em; color: #4b7d89; }
  h1 { margin: 2.2vh 0 1.4vh; font-size: clamp(38px, 5vw, 84px); line-height: 1.08; font-weight: 760; letter-spacing: -.04em; }
  p { margin: 0; font-size: clamp(18px, 1.8vw, 30px); color: #456579; }
  .countdown { margin: 5vh 0 3vh; font-variant-numeric: tabular-nums; font-size: clamp(62px, 9vw, 150px); line-height: .9; font-weight: 780; letter-spacing: -.06em; color: #235c78; text-shadow: 0 4px 24px rgba(62,128,153,.12); }
  .progress { width: min(560px, 58vw); height: clamp(10px, 1.1vw, 16px); border-radius: 999px; overflow: hidden; background: rgba(255,255,255,.7); box-shadow: inset 0 1px 4px rgba(22,68,89,.14); }
  .progress span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #55bca5, #66a6d9, #ba8bc3); transition: width .35s linear; }
  .hint { margin-top: 2.5vh; font-size: clamp(13px, 1.15vw, 19px); color: #678091; }
  .orb { position: absolute; border-radius: 50%; filter: blur(2px); opacity: .55; }
  .orb-one { width: 32vw; height: 32vw; left: -10vw; top: -13vw; background: #8ddbc5; }
  .orb-two { width: 30vw; height: 30vw; right: -9vw; bottom: -14vw; background: #dca8cf; }
</style>
