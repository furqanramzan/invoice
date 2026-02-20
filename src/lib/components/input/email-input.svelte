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
    value = $bindable(),
  }: TextInputProps = $props();

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
    name={field}
    {disabled}
    bind:value
    type="email"
    autocomplete="email"
    placeholder={placeholderText}
    aria-invalid={errors?.length ? 'true' : undefined}
  />
  {@render children?.()}
</div>
