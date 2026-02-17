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
  import { titleCase } from 'text-case';

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
        <Table.Head class="p-4 text-nowrap">Invoice #</Table.Head>
        <Table.Head class="p-4 text-nowrap">Delivery Date</Table.Head>
        <Table.Head class="p-4 text-nowrap">Invoice Date</Table.Head>
        <Table.Head class="p-4 text-nowrap">Actual Price</Table.Head>
        <Table.Head class="p-4 text-nowrap">Quoted Price</Table.Head>
        <Table.Head class="p-4 text-nowrap">Sale Price</Table.Head>
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
            {#if invoice.status === 'draft'}
              <Badge class="bg-purple-500">{titleCase(invoice.status)}</Badge>
            {:else if invoice.status === 'processing'}
              <Badge class="bg-yellow-500">{titleCase(invoice.status)}</Badge>
            {:else if invoice.status === 'delivered'}
              <Badge class="bg-blue-500">{titleCase(invoice.status)}</Badge>
            {:else if invoice.status === 'delivery_acknowledged'}
              <Badge class="bg-teal-500">{titleCase(invoice.status)}</Badge>
            {:else if invoice.status === 'paid'}
              <Badge class="bg-green-500">{titleCase(invoice.status)}</Badge>
            {/if}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {invoice.invoiceNumber}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {new Date(invoice.dateOfDelivery).toLocaleDateString()}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {new Date(invoice.dateOfInvoice).toLocaleDateString()}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {formatCents(invoice.actualPrice)}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {formatCents(invoice.quotedPrice)}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {formatCents(invoice.salePrice)}
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
