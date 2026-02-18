<script lang="ts" generics="T extends Record<string, unknown>">
  import * as RadioGroup from '$lib/components/ui/radio-group';
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
  <RadioGroup.Root
    name={field}
    {disabled}
    class="flex gap-2"
    bind:value={$value}
  >
    {#each options as option, index (index)}
      <div class="flex items-center space-x-2">
        <RadioGroup.Item value={option.value} id={option.value.toString()} />
        <Label for={option.value.toString()}>
          {option.label || titleCase(option.value.toString())}
        </Label>
      </div>
    {/each}
  </RadioGroup.Root>
  {#if $errors}
    <p class="text-red-500">{$errors}</p>
  {/if}
</div>
