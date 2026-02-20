<script lang="ts">
  import * as Table from '$lib/components/ui/table';
  import { Button } from '$lib/components/ui/button';
  import Trash from '@lucide/svelte/icons/trash';
  import Pencil from '@lucide/svelte/icons/pencil';
  import { resolve } from '$app/paths';
  import { Pagination } from '$lib/components/ui/pagination';
  import { cn } from '$lib/utils';
  import Heading from '$lib/components/heading.svelte';
  import { route, title } from './upsert/utils.js';
  import ActionForm from '$lib/components/form/action-form.svelte';
  import { getSuperForm } from '$lib/superforms.js';
  import { emptySchema } from '$lib/validations.js';
  import Tooltip from '$lib/components/tooltip.svelte';

  const { data } = $props();

  // svelte-ignore state_referenced_locally
  const superform = getSuperForm(emptySchema, data.form);
</script>

<Heading
  title={title.plural}
  link={{
    route: route.upsert,
    title: `Add ${title.singular}`,
  }}
/>

{#if data.companies.length === 0}
  <p>No companies yet. Create one!</p>
{:else}
  <Table.Root
    class={cn('border', data.companies.length === 0 && 'hidden')}
  >
    <Table.Header>
      <Table.Row>
        <Table.Head class="p-4 text-nowrap"
          >Company Name</Table.Head
        >
        <Table.Head class="p-4 text-nowrap"
          >Print Layout</Table.Head
        >
        <Table.Head class="p-4 text-nowrap">Actions</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each data.companies as company (company.id)}
        <Table.Row>
          <Table.Cell class="p-4 text-nowrap"
            >{company.name}</Table.Cell
          >
          <Table.Cell class="p-4 text-nowrap"
            >{company.printLayout}</Table.Cell
          >
          <Table.Cell
            class="flex shrink-0 space-x-2 p-4 text-nowrap"
          >
            <Tooltip text="Edit">
              <Button
                href={resolve(`/company/upsert`) +
                  `?id=${company.id}`}
                variant="outline"
                size="icon"
              >
                <Pencil class="h-4 w-4" />
              </Button>
            </Tooltip>
            <Tooltip text="Delete">
              <ActionForm
                {superform}
                field="id"
                value={company.id}
              >
                <Trash class="h-4 w-4" />
              </ActionForm>
            </Tooltip>
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>

  {#if data.totalPages > 1}
    <Pagination
      currentPage={data.currentPage}
      totalPages={data.totalPages}
    />
  {/if}
{/if}
