<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import * as Table from '$lib/components/ui/table';
  import { Button } from '$lib/components/ui/button';
  import Plus from '@lucide/svelte/icons/plus';
  import Trash from '@lucide/svelte/icons/trash';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Spinner from '$lib/components/ui/spinner/spinner.svelte';
  import { resolve } from '$app/paths'; // Import resolve

  const { data } = $props();

  const { enhance, submitting } = superForm(data.form);
</script>

<div class="container mx-auto space-y-4">
  <div class="flex items-center justify-between">
    <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
      Invoices
    </h1>
    <Button href={resolve('/invoice/upsert')}>
      <Plus /> New Invoice
    </Button>
  </div>

  {#if data.invoices.length === 0}
    <p>No invoices yet. Create one!</p>
  {:else}
    <Table.Root class="border">
      <Table.Header>
        <Table.Row>
          <Table.Head>Invoice Number</Table.Head>
          <Table.Head>Store</Table.Head>
          <Table.Head>Date</Table.Head>
          <Table.Head>Total</Table.Head>
          <Table.Head>Actions</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each data.invoices as invoice (invoice.id)}
          <Table.Row>
            <Table.Cell>{invoice.invoiceNumber}</Table.Cell>
            <Table.Cell>{invoice.store}</Table.Cell>
            <Table.Cell
              >{new Date(invoice.date).toLocaleDateString()}</Table.Cell
            >
            <Table.Cell>{invoice.total}</Table.Cell>
            <Table.Cell class="flex space-x-2">
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

    <div class="flex justify-center space-x-2">
      {#each Array(data.totalPages) as _, i (i)}
        <Button
          variant={data.currentPage === i + 1 ? 'default' : 'outline'}
          href={resolve(`/invoice`) + `?page=${i + 1}`}
        >
          {i + 1}
        </Button>
      {/each}
    </div>
  {/if}
</div>
