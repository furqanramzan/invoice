<script lang="ts">
  import { titleCase } from 'text-case';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import type { NumberInputProps } from './types';

  let {
    field,
    min,
    max,
    label,
    errors,
    onblur,
    onchange,
    children,
    disabled,
    placeholder,
    default: defaultValue,
    hideLabel = false,
    value = $bindable(),
  }: NumberInputProps = $props();

  let labelText = $derived(label || titleCase(field));
  let placeholderText = $derived(
    placeholder || `Type ${titleCase(field).toLowerCase()} here `,
  );
  // svelte-ignore state_referenced_locally
  if (typeof defaultValue === 'number') {
    value = defaultValue;
  }
</script>

<div class="space-y-1">
  {#if !hideLabel}
    <Label for={field}>{labelText}</Label>
  {/if}
  <Input
    {min}
    {max}
    id={field}
    name={field}
    {disabled}
    bind:value
    type="number"
    class="no-spinner"
    autocomplete="off"
    placeholder={placeholderText}
    aria-invalid={errors?.length ? 'true' : undefined}
    onblur={() => {
      if (!onblur) {
        return;
      }
      onblur(value);
    }}
    oninput={() => {
      if (!onchange) {
        return;
      }
      onchange(value);
    }}
  />
  {@render children?.()}
</div>
