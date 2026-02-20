<script lang="ts">
  import * as RadioGroup from '$lib/components/ui/radio-group';
  import { titleCase } from 'text-case';
  import { Label } from '$lib/components/ui/label';
  import type { RadioInputProps } from './types';

  let {
    field,
    label,
    errors,
    options,
    disabled,
    children,
    onchange,
    value = $bindable(),
  }: RadioInputProps = $props();

  let labelText = $derived(label || titleCase(field));

  $effect(() => {
    if (!onchange) {
      return;
    }
    onchange(value);
  });
</script>

<div class="space-y-1">
  <Label for={field}>{labelText}</Label>
  <RadioGroup.Root
    id={field}
    {disabled}
    bind:value
    class="flex gap-2"
    aria-invalid={errors?.length ? 'true' : undefined}
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
  {@render children?.()}
</div>
