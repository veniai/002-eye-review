<script>
  import { confirmDialog, resolveConfirm } from '$lib/stores/confirm.js';
  import { trapFocus } from '$lib/utils/focusTrap.js';

  const toneMap = {
    info: {
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300',
      button: 'bg-primary-500 hover:bg-primary-600 text-white',
    },
    warning: {
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
      button: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
    error: {
      iconBg: 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300',
      button: 'bg-red-500 hover:bg-red-600 text-white',
    },
  };

  $: dialogState = $confirmDialog;
  $: tone = toneMap[dialogState?.tone] || toneMap.info;

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      resolveConfirm(false);
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if dialogState}
  <div class="fixed inset-0 z-[200] flex items-center justify-center px-4 py-6 bg-slate-950/48 backdrop-blur-md animate-fadeIn">
    <div
      use:trapFocus
      class="w-full max-w-md rounded-3xl border border-slate-200 dark:border-[var(--surface-border-default)] bg-white dark:bg-[#1c1c1e] shadow-2xl shadow-slate-950/24 dark:shadow-black/50 p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div class="flex items-start gap-4">
        <div class={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone.iconBg}`}>
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m0 3.75h.008v.008H12v-.008ZM10.29 3.86 1.82 18a2 2 0 0 0 1.72 3h16.92a2 2 0 0 0 1.72-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          </svg>
        </div>
        <div class="min-w-0 flex-1">
          <h3 id="confirm-dialog-title" class="text-lg font-semibold text-slate-900 dark:text-[#f5f5f7]">
            {dialogState.title}
          </h3>
          <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-[#86868b] whitespace-pre-line">
            {dialogState.message}
          </p>
        </div>
      </div>

      <div class="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          on:click={() => resolveConfirm(false)}
          class="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 dark:border-[var(--surface-border-default)] bg-white dark:bg-[#2c2c2e] px-5 text-sm font-medium text-slate-700 dark:text-[#98989d] transition-colors hover:bg-slate-50 dark:hover:bg-[var(--editorial-surface-subtle)]"
        >
          {dialogState.cancelText}
        </button>
        <button
          type="button"
          on:click={() => resolveConfirm(true)}
          class={`inline-flex min-h-11 items-center justify-center rounded-2xl px-5 text-sm font-medium transition-colors ${tone.button}`}
        >
          {dialogState.confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}
