<script lang="ts">
  import { titleCase } from 'text-case';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Label } from '$lib/components/ui/label';
  import type { TextAreaInputProps } from './types';

  let {
    field,
    label,
    errors,
    placeholder,
    disabled,
    children,
    hideLabel = false,
    value = $bindable(),
  }: TextAreaInputProps = $props();

  let labelText = $derived(label || titleCase(field));
  let placeholderText = $derived(
    placeholder || `Type ${titleCase(label || field).toLowerCase()} here `,
  );
</script>

<div class="space-y-1">
  {#if !hideLabel}
    <Label for={field}>{labelText}</Label>
  {/if}
  <Textarea
    id={field}
    name={field}
    {disabled}
    bind:value
    placeholder={placeholderText}
    aria-invalid={errors?.length ? 'true' : undefined}
  />
  {@render children?.()}
</div>
