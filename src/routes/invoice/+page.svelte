<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import * as Table from '$lib/components/ui/table';
  import { Button } from '$lib/components/ui/button';
  import Plus from '@lucide/svelte/icons/plus';
  import Trash from '@lucide/svelte/icons/trash';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Spinner from '$lib/components/ui/spinner/spinner.svelte';
  import { resolve } from '$app/paths'; // Import resolve
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Pagination } from '$lib/components/ui/pagination'; // New import
  import { cn } from '$lib/utils'; // New import

  const { data } = $props();

  // svelte-ignore state_referenced_locally
  const { enhance, submitting } = superForm(data.form);
</script>

<div class="flex items-center justify-between">
  <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
    Invoices
  </h1>
  <Button href={resolve('/invoice/upsert')} class="flex items-center gap-2">
    <Plus class="h-4 w-4" /> Add New Invoice
  </Button>
</div>

{#if data.invoices.length === 0}
  <p>No invoices yet. Create one!</p>
{:else}
  <Table.Root class={cn('border', data.invoices.length === 0 && 'hidden')}>
    <Table.Header>
      <Table.Row>
        <Table.Head class="p-4 text-nowrap">Invoice Number</Table.Head>
        <Table.Head class="p-4 text-nowrap">Store</Table.Head>
        <Table.Head class="p-4 text-nowrap">Date</Table.Head>
        <Table.Head class="p-4 text-nowrap">Total</Table.Head>
        <Table.Head class="p-4 text-nowrap">Status</Table.Head>
        <Table.Head class="p-4 text-nowrap">Actions</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each data.invoices as invoice (invoice.id)}
        <Table.Row>
          <Table.Cell class="p-4 text-nowrap"
            >{invoice.invoiceNumber}</Table.Cell
          >
          <Table.Cell class="p-4 text-nowrap">{invoice.store}</Table.Cell>
          <Table.Cell class="p-4 text-nowrap"
            >{new Date(invoice.date).toLocaleDateString()}</Table.Cell
          >
          <Table.Cell class="p-4 text-nowrap">{invoice.total}</Table.Cell>
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
          <Table.Cell class="flex shrink-0 space-x-2 p-4 text-nowrap">
            <Button
              href={resolve(`/invoice/upsert`) + `?id=${invoice.id}`}
              variant="outline"
              size="icon"
            >
              <Pencil class="h-4 w-4" />
            </Button>
            <form action="?/delete" method="post" use:enhance>
              <input type="hidden" value={invoice.id} name="id" />
              <Button
                disabled={$submitting}
                type="submit"
                variant="destructive"
                size="icon"
              >
                {#if $submitting}
                  <Spinner class="h-4 w-4" />
                {:else}
                  <Trash class="h-4 w-4" />
                {/if}
              </Button>
            </form>
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
      basePath="/invoice"
    />
  {/if}
{/if}
