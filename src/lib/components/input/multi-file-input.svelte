<script lang="ts">
  import { titleCase } from 'text-case';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import type { MultiFileInputProps } from './types';
  import Trash from '@lucide/svelte/icons/trash';
  import Eye from '@lucide/svelte/icons/eye';
  import { Button } from '$lib/components/ui/button';
  import * as Table from '$lib/components/ui/table/index.js';

  let {
    field,
    label,
    errors,
    disabled,
    children,
    placeholder,
    hideLabel = false,
    value = $bindable(),
    urls = $bindable(),
  }: MultiFileInputProps = $props();

  let labelText = $derived(label || titleCase(field));
  let placeholderText = $derived(
    placeholder || `Type ${titleCase(field).toLowerCase()} here `,
  );

  function deleteAttachment(index: number) {
    if (!urls || !urls[index]) {
      return;
    }
    urls[index].deleted = true;
    urls = urls;
  }
</script>

<div class="space-y-1">
  {#if !hideLabel}
    <Label for={field}>{labelText}</Label>
  {/if}
  <Input
    {disabled}
    id={field}
    name={field}
    type="file"
    multiple
    bind:files={value}
    placeholder={placeholderText}
    aria-invalid={errors?.length ? 'true' : undefined}
  />
  {@render children?.()}
</div>
{#if (urls as { url: string; name: string; deleted?: boolean }[])?.filter((x) => !x.deleted)?.length}
  <Table.Root class="border">
    <Table.Header>
      <Table.Row>
        <Table.Head class="w-16 p-4 text-nowrap"></Table.Head>
        <Table.Head class="w-10 p-4 text-nowrap">#</Table.Head>
        <Table.Head class=" p-4 text-nowrap">Name</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each urls as file, index (index)}
        {#if !file.deleted}
          <Table.Row>
            <Table.Cell class="space-x-2 p-4 text-nowrap">
              <Button
                href={file.url}
                target="_blank"
                variant="outline"
                size="icon"
              >
                <Eye class="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon-sm"
                type="button"
                onclick={() => deleteAttachment(index)}
              >
                <Trash class="h-4 w-4" />
              </Button>
            </Table.Cell>
            <Table.Cell class="p-4 text-nowrap">
              {index + 1}
            </Table.Cell>
            <Table.Cell class="p-4 text-nowrap">
              {file.name}
            </Table.Cell>
          </Table.Row>
        {/if}
      {/each}
    </Table.Body>
  </Table.Root>
{/if}
