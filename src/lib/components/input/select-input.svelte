<script lang="ts">
  import * as Select from '$lib/components/ui/select/index.js';
  import { titleCase } from 'text-case';
  import { Label } from '$lib/components/ui/label';
  import type { SelectInputProps } from './types';

  let {
    field,
    label,
    errors,
    onchange,
    options,
    disabled,
    children,
    allowClear,
    value = $bindable(),
    default: defaultValue,
  }: SelectInputProps = $props();

  const selectedOption = $derived(options.find((f) => f.value === value));
  const triggerContent = $derived(
    selectedOption?.label ||
      titleCase(selectedOption?.value.toString() || '') ||
      `Select ${titleCase(label || field).toLowerCase()} here `,
  );
  let labelText = $derived(label || titleCase(field));

  // svelte-ignore state_referenced_locally
  if (defaultValue || typeof defaultValue === 'number') {
    value = defaultValue;
  }

  $effect(() => {
    if (!onchange) {
      return;
    }
    onchange(value);
  });
</script>

<div class="space-y-1">
  <Label for={field}>{labelText}</Label>
  <Select.Root
    name={field}
    {disabled}
    bind:value={value as string}
    type="single"
  >
    <Select.Trigger class="w-full">
      {triggerContent}
    </Select.Trigger>
    <Select.Content>
      <Select.Group
        id={field}
        aria-invalid={errors?.length ? 'true' : undefined}
      >
        {#if allowClear && value}
          <Select.Item value={null as unknown as string} label="Clear">
            Clear
          </Select.Item>
        {/if}
        {#each options as option (option.value)}
          <Select.Item value={option.value as string} label={option.label}>
            {option.label || titleCase(option.value.toString())}
          </Select.Item>
        {/each}
      </Select.Group>
    </Select.Content>
  </Select.Root>
  {@render children?.()}
</div>
