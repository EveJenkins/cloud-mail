<template>
  <div class="preview-state">
    <div class="preview-state__main">
      <span class="preview-state__icon"><Icon :icon="icon" width="32" height="32" /></span>
      <strong>{{ title }}</strong>
      <p>{{ description }}</p>
    </div>
    <div v-if="$slots.actions || $slots.meta" class="preview-state__guide">
      <div v-if="$slots.actions" class="preview-state__actions"><slot name="actions" /></div>
      <div v-if="$slots.meta" class="preview-state__meta"><slot name="meta" /></div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

defineProps({
  icon: { type: String, default: 'solar:letter-opened-linear' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>

<style lang="scss" scoped>
.preview-state {
  width: min(620px, calc(100% - 48px));
  height: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-3);
  text-align: center;
}

.preview-state__main { display: flex; flex-direction: column; align-items: center; }
.preview-state__icon {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  color: var(--brand-600);
  border: 1px solid color-mix(in srgb, var(--brand-500) 18%, var(--border));
  border-radius: var(--r-lg);
  background: var(--brand-soft);
}
.preview-state strong { margin-top: 16px; color: var(--text-2); font-size: 15px; font-weight: 650; }
.preview-state p { max-width: 380px; margin-top: 6px; font-size: 12.5px; line-height: 1.6; }
.preview-state__guide { width: 100%; margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--border); }
.preview-state__actions { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 8px; }
.preview-state__actions :deep(button) {
  min-height: 36px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: var(--text-2);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--surface);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: color var(--dur) var(--ease), border-color var(--dur) var(--ease), background var(--dur) var(--ease), transform var(--dur) var(--ease);
}
.preview-state__actions :deep(button:hover) { color: var(--brand-700); border-color: color-mix(in srgb, var(--brand-500) 42%, var(--border)); background: var(--brand-soft); transform: translateY(-1px); }
.preview-state__actions :deep(button.primary) { color: #fff; border-color: var(--brand-600); background: var(--brand-600); }
.preview-state__actions :deep(button.primary:hover) { color: #fff; background: var(--brand-700); }
.preview-state__meta { margin-top: 14px; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 18px; color: var(--text-3); font-size: 11.5px; }
.preview-state__meta :deep(span) { display: inline-flex; align-items: center; gap: 6px; }
.preview-state__meta :deep(i) { width: 6px; height: 6px; border-radius: 50%; background: var(--success); }
.preview-state__meta :deep(kbd) { padding: 2px 6px; border: 1px solid var(--border); border-radius: 5px; background: var(--surface-3); font: inherit; }

@media (max-width: 767px) {
  .preview-state { width: calc(100% - 32px); }
}
</style>
