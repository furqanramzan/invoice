<script lang="ts" generics="T extends Record<string, unknown>">
  import { titleCase } from 'text-case';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import {
    formFieldProxy,
    type SuperForm,
    type FormPathLeaves,
    type FormFieldProxy,
  } from 'sveltekit-superforms';

  type Props = {
    superform: SuperForm<T>;
    field: FormPathLeaves<T, number>;
    label?: string;
    hideLabel?: boolean;
    placeholder?: string;
    min?: number;
    max?: number;
  };

  let { superform, field, label, hideLabel, placeholder, min, max }: Props =
    $props();

  // svelte-ignore state_referenced_locally
  const { value, errors, constraints } = formFieldProxy(
    superform,
    field,
  ) satisfies FormFieldProxy<number>;

  let labelText = $derived(label || titleCase(field));
  let placeholderText = $derived(
    placeholder || `Type ${titleCase(field).toLowerCase()} here `,
  );
</script>

<div class="space-y-1">
  {#if !hideLabel}
    <Label id={field}>{labelText}</Label>
  {/if}
  <Input
    id={field}
    name={field}
    {min}
    {max}
    placeholder={placeholderText}
    type="number"
    aria-invalid={$errors ? 'true' : undefined}
    bind:value={$value}
    {...$constraints}
  />
  {#if $errors}
    <p class="text-red-500">{$errors}</p>
  {/if}
</div>
