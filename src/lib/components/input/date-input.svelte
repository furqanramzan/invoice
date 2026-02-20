<script lang="ts">
  import { titleCase } from 'text-case';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import type { DateInputProps } from './types';

  let {
    field,
    label,
    disabled,
    errors,
    children,
    placeholder,
    value = $bindable(),
  }: DateInputProps = $props();

  let labelText = $derived(label || titleCase(field));
  let placeholderText = $derived(
    placeholder ||
      `Type ${titleCase(field).toLowerCase()} here `,
  );
</script>

<div class="space-y-1">
  <Label for={field}>{labelText}</Label>
  <Input
    id={field}
    {disabled}
    name={field}
    bind:value
    type="date"
    placeholder={placeholderText}
    aria-invalid={errors?.length ? 'true' : undefined}
  />
  {@render children?.()}
</div>
