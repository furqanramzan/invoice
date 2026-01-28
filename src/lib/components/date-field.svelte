<script lang="ts" generics="T extends Record<string, unknown>">
  import { titleCase } from 'text-case';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import {
    formFieldProxy,
    type SuperForm,
    type FormPathLeaves,
    dateProxy,
  } from 'sveltekit-superforms';

  type Props = {
    superform: SuperForm<T>;
    field: FormPathLeaves<T, Date>;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
  };

  let { superform, field, label, placeholder, disabled }: Props = $props();
  // svelte-ignore state_referenced_locally
  let { form } = superform;

  // svelte-ignore state_referenced_locally
  const { errors, constraints } = formFieldProxy(superform, field);
  // svelte-ignore state_referenced_locally
  const value = dateProxy(form, field, { format: 'date' });

  let labelText = $derived(label || titleCase(field));
  let placeholderText = $derived(
    placeholder || `Type ${titleCase(field).toLowerCase()} here `,
  );
</script>

<div class="space-y-1">
  <Label id={field}>{labelText}</Label>
  <Input
    {disabled}
    id={field}
    name={field}
    placeholder={placeholderText}
    type="date"
    aria-invalid={$errors ? 'true' : undefined}
    bind:value={$value}
    {...$constraints}
  />
  {#if $errors}
    <p class="text-red-500">{$errors}</p>
  {/if}
</div>
