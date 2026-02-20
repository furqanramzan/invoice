<script lang="ts">
  import { titleCase } from 'text-case';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import type { FileInputProps } from './types';
  import Button from '../ui/button/button.svelte';
  import { Trash } from '@lucide/svelte';

  let {
    field,
    label,
    errors,
    accept,
    disabled,
    children,
    urlValue,
    placeholder,
    hideLabel = false,
    value = $bindable(),
  }: FileInputProps = $props();

  let labelText = $derived(label || titleCase(field));
  let placeholderText = $derived(
    placeholder || `Type ${titleCase(field).toLowerCase()} here `,
  );
</script>

<div class="space-y-1">
  <div class="flex gap-2">
    {#if !hideLabel}
      <Label for={field}>{labelText}</Label>
    {/if}
    {#if urlValue && !value?.length}
      <Button
        variant="destructive"
        size="icon"
        type="button"
        onclick={() => (urlValue = null)}><Trash /></Button
      >
      <input type="hidden" name="dummy-url-field" value={urlValue} />
    {/if}
  </div>
  <Input
    {disabled}
    {accept}
    id={field}
    name={field}
    type="file"
    bind:files={value}
    placeholder={placeholderText}
    aria-invalid={errors?.length ? 'true' : undefined}
  />
  {@render children?.()}
</div>
