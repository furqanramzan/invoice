<script lang="ts">
  import { titleCase } from 'text-case';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import type { TextInputProps } from './types';

  let {
    field,
    label,
    errors,
    disabled,
    children,
    placeholder,
    hideLabel = false,
    value = $bindable(),
  }: TextInputProps = $props();

  let labelText = $derived(label || titleCase(field));
  let placeholderText = $derived(
    placeholder || `Type ${titleCase(label || field).toLowerCase()} here `,
  );
</script>

<div class="space-y-1">
  {#if !hideLabel}
    <Label for={field}>{labelText}</Label>
  {/if}
  <Input
    id={field}
    name={field}
    {disabled}
    bind:value
    type="text"
    placeholder={placeholderText}
    aria-invalid={errors?.length ? 'true' : undefined}
  />
  {@render children?.()}
</div>
