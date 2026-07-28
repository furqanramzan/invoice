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
  import Label from '$lib/components/ui/label/label.svelte';

  const { data } = $props();

  function onCompanyChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    const value = target.value;
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set('companyId', value);
    } else {
      url.searchParams.delete('companyId');
    }
    window.location.href = url.toString();
  }

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

<div class="mb-4 flex items-center gap-2">
  <Label for="company-filter">Company</Label>
  <select
    id="company-filter"
    class="block w-64 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
    onchange={onCompanyChange}
  >
    <option value="">All Companies</option>
    {#each data.companies as company (company.id)}
      <option
        value={company.id}
        selected={data.selectedCompanyId === company.id}
      >
        {company.name}
      </option>
    {/each}
  </select>
</div>

{#if data.suppliers.length === 0}
  <p>No suppliers yet. Create one!</p>
{:else}
  <Table.Root
    class={cn('border', data.suppliers.length === 0 && 'hidden')}
  >
    <Table.Header>
      <Table.Row>
        <Table.Head class="p-4 text-nowrap">Name</Table.Head>
        <Table.Head class="p-4 text-nowrap">Email</Table.Head>
        <Table.Head class="p-4 text-nowrap">Phone</Table.Head>
        <Table.Head class="p-4 text-nowrap">Company</Table.Head>
        <Table.Head class="p-4 text-nowrap">Actions</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each data.suppliers as supplier (supplier.id)}
        <Table.Row>
          <Table.Cell class="p-4 text-nowrap"
            >{supplier.name}</Table.Cell
          >
          <Table.Cell class="p-4 text-nowrap"
            >{supplier.email ?? '-'}</Table.Cell
          >
          <Table.Cell class="p-4 text-nowrap"
            >{supplier.phone ?? '-'}</Table.Cell
          >
          <Table.Cell class="p-4 text-nowrap"
            >{supplier.company?.name ?? '-'}</Table.Cell
          >
          <Table.Cell
            class="flex shrink-0 space-x-2 p-4 text-nowrap"
          >
            <Tooltip text="Edit">
              <Button
                href={resolve(`/supplier/upsert`) +
                  `?id=${supplier.id}`}
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
                value={supplier.id}
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
