<script>
  import { createEventDispatcher } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { t } from '$lib/i18n/index.js';

  export let recap = null;
  const dispatch = createEventDispatcher();

  function formatDuration(seconds) {
    const value = Math.max(0, Number(seconds) || 0);
    const minutes = Math.round(value / 60);
    return minutes < 1
      ? t('eyeCare.recapLessThanMinute')
      : t('eyeCare.recapMinutes', { minutes });
  }

  async function close() {
    try { await invoke('dismiss_eye_care_recap'); } catch {}
    dispatch('close');
  }
</script>

{#if recap}
  <div class="recap-backdrop" role="presentation">
    <section class="recap-card" role="dialog" aria-modal="true" aria-labelledby="eye-care-recap-title">
      <div class="recap-kicker">{t('eyeCare.recapKicker')}</div>
      <h2 id="eye-care-recap-title">{t('eyeCare.recapTitle')}</h2>
      {#if recap.empty}
        <p class="empty">{t('eyeCare.recapEmpty')}</p>
      {:else}
        <div class="total">{t('eyeCare.recapTotal')}：<strong>{formatDuration(recap.totalDurationSeconds)}</strong></div>
        <div class="grid">
          <div>
            <h3>{t('eyeCare.recapTopApps')}</h3>
            <ul>
              {#each recap.topApps || [] as item}
                <li><span>{item.name}</span><b>{formatDuration(item.durationSeconds)}</b></li>
              {/each}
            </ul>
          </div>
          <div>
            <h3>{t('eyeCare.recapTopWebsites')}</h3>
            {#if (recap.topWebsites || []).length}
              <ul>
                {#each recap.topWebsites as item}
                  <li><span>{item.name}</span><b>{formatDuration(item.durationSeconds)}</b></li>
                {/each}
              </ul>
            {:else}
              <p class="muted">{t('eyeCare.recapNoWebsites')}</p>
            {/if}
          </div>
        </div>
        {#if (recap.ocrKeywords || []).length}
          <div class="keywords">
            <h3>{t('eyeCare.recapOcrKeywords')}</h3>
            <div>{#each recap.ocrKeywords as word}<span>{word}</span>{/each}</div>
          </div>
        {/if}
      {/if}
      <div class="actions"><button type="button" on:click={close}>{t('eyeCare.recapContinue')}</button></div>
    </section>
  </div>
{/if}

<style>
  .recap-backdrop { position: fixed; inset: 0; z-index: 220; display: grid; place-items: center; padding: 28px; background: rgba(15,23,42,.52); backdrop-filter: blur(8px); }
  .recap-card { width: min(720px, calc(100vw - 56px)); max-height: calc(100vh - 56px); overflow: auto; box-sizing: border-box; padding: 30px; border: 1px solid rgba(148,163,184,.28); border-radius: 24px; background: rgba(255,255,255,.97); box-shadow: 0 24px 80px rgba(15,23,42,.28); color: #1e293b; }
  :global(.dark) .recap-card { background: rgba(22,27,34,.98); color: #e6edf3; border-color: #30363d; }
  .recap-kicker { color: #4f7f9a; font-size: 12px; font-weight: 800; letter-spacing: .18em; }
  h2 { margin: 8px 0 18px; font-size: 25px; }
  h3 { margin: 18px 0 10px; font-size: 14px; color: #64748b; }
  .total, .empty { padding: 14px 16px; border-radius: 14px; background: #eff8f6; }
  :global(.dark) .total, :global(.dark) .empty { background: #1d3436; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 26px; }
  ul { list-style: none; margin: 0; padding: 0; }
  li { display: flex; justify-content: space-between; gap: 18px; padding: 8px 0; border-bottom: 1px solid rgba(148,163,184,.18); }
  li span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  li b { flex: none; font-size: 12px; color: #64748b; }
  .keywords > div { display: flex; flex-wrap: wrap; gap: 8px; }
  .keywords span { padding: 5px 9px; border-radius: 999px; background: #eef2ff; color: #475569; font-size: 12px; }
  .muted { color: #94a3b8; font-size: 13px; }
  .actions { display: flex; justify-content: flex-end; margin-top: 24px; }
  button { padding: 9px 22px; border: 0; border-radius: 10px; background: #397d8e; color: white; font-weight: 700; cursor: pointer; }
  @media (max-width: 640px) { .grid { grid-template-columns: 1fr; gap: 0; } }
</style>
