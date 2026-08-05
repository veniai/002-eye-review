<script>
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { listen } from '@tauri-apps/api/event';
  import { initializeLocale, t } from '$lib/i18n/index.js';

  let remainingSeconds = 30;

  onMount(() => {
    initializeLocale();
    let disposed = false;
    let unlisten = () => {};

    invoke('get_eye_care_status').then((status) => {
      if (!disposed && status?.phase === 'PRE_BREAK') {
        remainingSeconds = status.remainingSeconds;
      }
    }).catch(() => {});
    listen('eye-care-status-changed', (event) => {
      if (!disposed && event.payload?.phase === 'PRE_BREAK') {
        remainingSeconds = event.payload.remainingSeconds;
      }
    }).then((cleanup) => {
      if (disposed) cleanup(); else unlisten = cleanup;
    }).catch(() => {});

    return () => {
      disposed = true;
      unlisten();
    };
  });
</script>

<aside class="notice" aria-label={t('eyeCare.preBreakTitle')}>
  <div class="icon" aria-hidden="true">◌</div>
  <div class="copy">
    <strong>{t('eyeCare.preBreakTitle')}</strong>
    <span>{t('eyeCare.preBreakDescription', { seconds: remainingSeconds })}</span>
  </div>
  <div class="seconds" aria-live="polite">{remainingSeconds}</div>
</aside>

<style>
  :global(html), :global(body), :global(#app) {
    margin: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: transparent;
  }
  .notice {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr) auto;
    align-items: center;
    gap: 14px;
    padding: 17px 18px;
    border: 1px solid rgba(125, 181, 199, .48);
    border-radius: 22px;
    background: linear-gradient(135deg, rgba(241, 252, 249, .98), rgba(235, 245, 255, .98));
    box-shadow: 0 14px 42px rgba(15, 46, 68, .24);
    color: #183a50;
    font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif;
    user-select: none;
  }
  .icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: linear-gradient(135deg, #72cbb5, #79aee1);
    color: white;
    font-size: 28px;
    line-height: 1;
  }
  .copy { min-width: 0; display: flex; flex-direction: column; gap: 5px; }
  strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }
  span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #5c7485; font-size: 12px; }
  .seconds {
    min-width: 38px;
    text-align: right;
    color: #3c7189;
    font-size: 28px;
    font-weight: 780;
    font-variant-numeric: tabular-nums;
  }
</style>
