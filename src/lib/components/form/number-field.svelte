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

  type FieldType = number;
  type Props = {
    superform: SuperForm<T>;
    field: FormPathLeaves<T, FieldType>;
    label?: string;
    hideLabel?: boolean;
    disabled?: boolean;
    placeholder?: string;
    min?: number;
    max?: number;
    onchange?: (value: FieldType) => void;
    onblur?: (value: FieldType) => void;
  };

  let {
    superform,
    field,
    label,
    onchange,
    onblur,
    disabled,
    hideLabel,
    placeholder,
    min,
    max,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const { value, errors, constraints } = formFieldProxy(
    superform,
    field,
  ) satisfies FormFieldProxy<FieldType>;

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
    class="no-spinner"
    {disabled}
    autocomplete="off"
    id={field}
    name={field}
    {min}
    {max}
    placeholder={placeholderText}
    type="number"
    aria-invalid={$errors ? 'true' : undefined}
    bind:value={$value}
    {...$constraints}
    onblur={() => {
      if (!onblur) {
        return;
      }
      onblur($value);
    }}
    oninput={() => {
      if (!onchange) {
        return;
      }
      onchange($value);
    }}
  />
  {#if $errors}
    <p class="text-red-500">{$errors}</p>
  {/if}
</div>
