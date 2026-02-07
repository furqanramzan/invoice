<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import * as Table from '$lib/components/ui/table';
  import { Button } from '$lib/components/ui/button';
  import Trash from '@lucide/svelte/icons/trash';
  import Pencil from '@lucide/svelte/icons/pencil';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Pagination } from '$lib/components/ui/pagination';
  import { formatAmount, formatCents } from '$lib/utils';
  import { route, title } from './upsert/utils.js';
  import Heading from '$lib/components/heading.svelte';
  import ActionForm from '$lib/components/form/action-form.svelte';

  const { data } = $props();

  // svelte-ignore state_referenced_locally
  const superform = superForm(data.form);
</script>

<Heading
  title={title.plural}
  link={{ route: route.upsert, title: `Add ${title.singular}` }}
/>

{#if data.invoices.length === 0}
  <p>No invoices yet. Create one!</p>
{:else}
  <Table.Root class="border">
    <Table.Header>
      <Table.Row>
        <Table.Head class="p-4 text-nowrap">Company</Table.Head>
        <Table.Head class="p-4 text-nowrap">Client</Table.Head>
        <Table.Head class="p-4 text-nowrap">Status</Table.Head>
        <Table.Head class="p-4 text-nowrap">Invoice Number</Table.Head>
        <Table.Head class="p-4 text-nowrap">Date</Table.Head>
        <Table.Head class="p-4 text-nowrap">Total</Table.Head>
        <Table.Head class="p-4 text-nowrap">Received</Table.Head>
        <Table.Head class="p-4 text-nowrap">Actions</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each data.invoices as invoice (invoice.id)}
        <Table.Row>
          <Table.Cell class="p-4 text-nowrap">
            {invoice.company?.name}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {invoice.client?.name}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {#if invoice.status === 'processing'}
              <Badge class="bg-yellow-500">{invoice.status}</Badge>
            {:else if invoice.status === 'delivered'}
              <Badge class="bg-green-500">{invoice.status}</Badge>
            {:else if invoice.status === 'returned'}
              <Badge class="bg-red-500 text-white">{invoice.status}</Badge>
            {:else}
              <Badge variant="outline">{invoice.status}</Badge>
            {/if}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {invoice.invoiceNumber}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {new Date(invoice.date).toLocaleDateString()}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {formatCents(invoice.total)}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {invoice.receivedAmount
              ? formatAmount(invoice.receivedAmount)
              : '-'}
          </Table.Cell>
          <Table.Cell class="flex shrink-0 space-x-2 p-4 text-nowrap">
            <Button
              href={route.upsert + `?id=${invoice.id}`}
              variant="outline"
              size="icon"
            >
              <Pencil class="h-4 w-4" />
            </Button>
            <ActionForm {superform} field="id" value={invoice.id}>
              <Trash class="h-4 w-4" />
            </ActionForm>
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>

  <!-- Use the new Pagination component -->
  {#if data.totalPages > 1}
    <Pagination
      currentPage={data.currentPage}
      totalPages={data.totalPages}
      basePath={route.list}
    />
  {/if}
{/if}
