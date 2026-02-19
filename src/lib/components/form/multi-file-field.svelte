<script lang="ts" generics="T extends Record<string, unknown>">
  import { titleCase } from 'text-case';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import {
    formFieldProxy,
    type SuperForm,
    type FormPath,
    filesProxy,
    arrayProxy,
    type FormPathArrays,
  } from 'sveltekit-superforms';
  import Trash from '@lucide/svelte/icons/trash';
  import Eye from '@lucide/svelte/icons/eye';
  import { Button } from '$lib/components/ui/button';
  import * as Table from '$lib/components/ui/table/index.js';

  // Define an interface for the attachment URL objects
  interface AttachmentFile {
    url: string;
    name: string;
    deleted?: boolean;
  }

  type Props = {
    superform: SuperForm<T>;
    field: FormPath<T>;
    label?: string;
    hideLabel?: boolean;
    placeholder?: string;
    disabled?: boolean;
    urlsField: FormPathArrays<T, AttachmentFile[]>;
  };

  let {
    superform,
    field,
    label,
    placeholder,
    disabled,
    hideLabel = false,
    urlsField,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const { form } = superform;

  // svelte-ignore state_referenced_locally
  // @ts-expect-error it's working fine
  const { errors, constraints } = formFieldProxy(superform, field);
  // svelte-ignore state_referenced_locally
  // @ts-expect-error it's working fine
  const files = filesProxy(form, field);
  // svelte-ignore state_referenced_locally
  const { values: urls } = arrayProxy(superform, urlsField);

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
    {disabled}
    id={field}
    name={field}
    placeholder={placeholderText}
    type="file"
    multiple
    aria-invalid={$errors ? 'true' : undefined}
    bind:files={$files}
    {...$constraints}
  />
  {#if $errors}
    <p class="text-red-500">{$errors}</p>
  {/if}
</div>
{#if ($urls as AttachmentFile[])?.filter((x) => !x.deleted)?.length}
  <Table.Root class="border">
    <Table.Header>
      <Table.Row>
        <Table.Head class="w-16 p-4 text-nowrap"></Table.Head>
        <Table.Head class="w-10 p-4 text-nowrap">#</Table.Head>
        <Table.Head class=" p-4 text-nowrap">Name</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each $urls as AttachmentFile[] as file, index (index)}
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
                onclick={() => {
                  if (!$urls || !$urls[index]) {
                    return;
                  }
                  ($urls as AttachmentFile[])[index].deleted = true;
                  $urls = $urls;
                }}
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
