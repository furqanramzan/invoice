<script lang="ts">
  import { titleCase } from 'text-case';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import type { PasswordInputProps } from './types';

  let {
    field,
    label,
    errors,
    disabled,
    children,
    password,
    placeholder,
    value = $bindable(),
  }: PasswordInputProps = $props();

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
    type="password"
    placeholder={placeholderText}
    aria-invalid={errors?.length ? 'true' : undefined}
    autocomplete={password ? `${password}-password` : 'off'}
  />
  {@render children?.()}
</div>
