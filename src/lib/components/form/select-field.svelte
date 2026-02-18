<script lang="ts" generics="T extends Record<string, unknown>">
  import * as Select from '$lib/components/ui/select/index.js';
  import { titleCase } from 'text-case';
  import { Label } from '$lib/components/ui/label';
  import {
    formFieldProxy,
    type SuperForm,
    type FormPathLeaves,
    type FormFieldProxy,
  } from 'sveltekit-superforms';
  import type { Options } from '$lib/utils';

  type FieldType = string | number;
  type Props = {
    superform: SuperForm<T>;
    field: FormPathLeaves<T, FieldType>;
    options: Options;
    label?: string;
    disabled?: boolean;
    onchange?: (value: FieldType) => void;
  };

  let { superform, onchange, field, options, label, disabled }: Props =
    $props();

  // svelte-ignore state_referenced_locally
  const { value, errors } = formFieldProxy(
    superform,
    field,
  ) satisfies FormFieldProxy<FieldType>;

  const selectedOption = $derived(options.find((f) => f.value === $value));
  const triggerContent = $derived(
    (selectedOption?.label ||
      titleCase(selectedOption?.value.toString() || '')) ??
      `Select ${titleCase(label || field).toLowerCase()} here `,
  );
  let labelText = $derived(label || titleCase(field));

  $effect(() => {
    if (!onchange) {
      return;
    }
    onchange($value);
  });
</script>

<div class="space-y-1">
  <Label id={field}>{labelText}</Label>
  <Select.Root {disabled} type="single" name={field} bind:value={$value}>
    <Select.Trigger class="w-full">
      {triggerContent}
    </Select.Trigger>
    <Select.Content>
      <Select.Group>
        {#each options as option (option.value)}
          <Select.Item value={option.value} label={option.label}>
            {option.label || titleCase(option.value.toString())}
          </Select.Item>
        {/each}
      </Select.Group>
    </Select.Content>
  </Select.Root>
  {#if $errors}
    <p class="text-red-500">{$errors}</p>
  {/if}
</div>
