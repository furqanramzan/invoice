<script lang="ts" generics="T extends Record<string, unknown>">
  import { titleCase } from 'text-case';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import {
    formFieldProxy,
    type SuperForm,
    type FormPath,
    fileProxy,
    type FormFieldProxy,
    type FormPathLeaves,
  } from 'sveltekit-superforms';
  import Button from '../ui/button/button.svelte';
  import { Trash } from '@lucide/svelte';

  type Props = {
    superform: SuperForm<T>;
    field: FormPath<T>;
    urlField: FormPathLeaves<T, string | null>;
    label?: string;
    hideLabel?: boolean;
    placeholder?: string;
    disabled?: boolean;
    accept?: string;
  };

  let {
    superform,
    field,
    urlField,
    label,
    placeholder,
    disabled,
    hideLabel = false,
    accept,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const { form } = superform;
  // svelte-ignore state_referenced_locally
  // @ts-expect-error it's working fine
  const { errors, constraints } = formFieldProxy(superform, field);
  // @ts-expect-error it's working fine
  const file = fileProxy(form, 'image');
  // svelte-ignore state_referenced_locally
  const { value } = formFieldProxy(
    superform,
    urlField,
  ) satisfies FormFieldProxy<string | null>;

  let labelText = $derived(label || titleCase(field));
  let placeholderText = $derived(
    placeholder || `Type ${titleCase(field).toLowerCase()} here `,
  );
</script>

<div class="space-y-1">
  <div class="flex gap-2">
    {#if !hideLabel}
      <Label id={field}>{labelText}</Label>
    {/if}
    {#if $value && !$file.length}
      <Button
        variant="destructive"
        size="icon"
        type="button"
        onclick={() => ($value = null)}><Trash /></Button
      >
      <input type="hidden" name={urlField} value={$value} />
    {/if}
  </div>
  <Input
    {disabled}
    {accept}
    id={field}
    name={field}
    placeholder={placeholderText}
    type="file"
    aria-invalid={$errors ? 'true' : undefined}
    bind:files={$file}
    {...$constraints}
  />
  {#if $errors}
    <p class="text-red-500">{$errors}</p>
  {/if}
</div>
