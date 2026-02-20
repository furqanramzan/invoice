<script lang="ts">
  import * as Table from '$lib/components/ui/table';
  import { Button } from '$lib/components/ui/button';
  import Trash from '@lucide/svelte/icons/trash';
  import Pencil from '@lucide/svelte/icons/pencil';
  import { Pagination } from '$lib/components/ui/pagination';
  import { formatCents, formatDate } from '$lib/utils';
  import { route, title } from './upsert/utils.js';
  import Heading from '$lib/components/heading.svelte';
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
  link={{ route: route.upsert, title: `Add ${title.singular}` }}
/>

{#if data.expenses.length === 0}
  <p>No expenses yet. Create one!</p>
{:else}
  <Table.Root class="border">
    <Table.Header>
      <Table.Row>
        <Table.Head class="p-4 text-nowrap">Title</Table.Head>
        <Table.Head class="p-4 text-nowrap">Amount</Table.Head>
        <Table.Head class="p-4 text-nowrap">Date</Table.Head>
        <Table.Head class="p-4 text-nowrap">Description</Table.Head>
        <Table.Head class="p-4 text-nowrap">Actions</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each data.expenses as expense (expense.id)}
        <Table.Row>
          <Table.Cell class="p-4 text-nowrap">{expense.title}</Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {formatCents(expense.amount)}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {formatDate(expense.date)}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap"
            >{expense.description || '-'}</Table.Cell
          >
          <Table.Cell class="flex shrink-0 space-x-2 p-4 text-nowrap">
            <Tooltip text="Edit">
              <Button
                href={route.upsert + `?id=${expense.id}`}
                variant="outline"
                size="icon"
              >
                <Pencil class="h-4 w-4" />
              </Button>
            </Tooltip>
            <Tooltip text="Delete">
              <ActionForm {superform} field="id" value={expense.id}>
                <Trash class="h-4 w-4" />
              </ActionForm>
            </Tooltip>
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>

  {#if data.totalPages > 1}
    <Pagination currentPage={data.currentPage} totalPages={data.totalPages} />
  {/if}
{/if}
