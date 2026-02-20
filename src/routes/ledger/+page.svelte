<script lang="ts">
  import * as Table from '$lib/components/ui/table';
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import Pencil from '@lucide/svelte/icons/pencil';
  import { Pagination } from '$lib/components/ui/pagination';
  import { formatCents, formatDate } from '$lib/utils';
  import { payLedgerSchema, route, title } from './upsert/utils.js';
  import Heading from '$lib/components/heading.svelte';
  import { getSuperForm } from '$lib/superforms.js';
  import { CreditCard } from '@lucide/svelte';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import NumberField from '$lib/components/form/number-field.svelte';
  import Tooltip from '$lib/components/tooltip.svelte';

  const { data } = $props();

  // svelte-ignore state_referenced_locally
  const superform = getSuperForm(payLedgerSchema, data.form);
  const { submitting, enhance } = superform;
</script>

<Heading
  title={title.plural}
  link={{ route: route.upsert, title: `Add ${title.singular}` }}
/>

{#if data.invoices.length === 0}
  <p>No disputed invoices yet.</p>
{:else}
  <Table.Root class="border">
    <Table.Header>
      <Table.Row>
        <Table.Head class="p-4 text-nowrap">Company</Table.Head>
        <Table.Head class="p-4 text-nowrap">Client</Table.Head>
        <Table.Head class="p-4 text-nowrap">Invoice #</Table.Head>
        <Table.Head class="p-4 text-nowrap">Delivery Date</Table.Head>
        <Table.Head class="p-4 text-nowrap">Invoice Date</Table.Head>
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
            {invoice.invoiceNumber}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {formatDate(invoice.dateOfDelivery)}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {formatDate(invoice.dateOfInvoice)}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {formatCents(invoice.salePrice)}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {invoice.receivedAmount ? formatCents(invoice.receivedAmount) : '-'}
          </Table.Cell>
          <Table.Cell class="flex shrink-0 space-x-2 p-4 text-nowrap">
            <Tooltip text="Edit">
              <Button
                href={route.invoiceUpsert + `?id=${invoice.id}`}
                variant="outline"
                size="icon"
              >
                <Pencil class="h-4 w-4" />
              </Button>
            </Tooltip>
            <Tooltip text="Mark as paid">
              <Dialog.Root>
                <Dialog.Trigger
                  type="button"
                  class={buttonVariants({ variant: 'success', size: 'icon' })}
                >
                  <CreditCard class="h-4 w-4" />
                </Dialog.Trigger>
                <Dialog.Content class="sm:max-w-xl">
                  <form
                    method="post"
                    action="?id={invoice.id}"
                    use:enhance
                    class="grid gap-4"
                  >
                    <Dialog.Header>
                      <Dialog.Title>
                        {invoice.company.name} - {invoice.client.name} - {invoice.invoiceNumber}
                      </Dialog.Title>
                    </Dialog.Header>
                    <div class="grid gap-4">
                      <NumberField
                        {superform}
                        default={invoice.receivedAmount
                          ? invoice.receivedAmount / 100
                          : 0}
                        field="receivedAmount"
                      />
                    </div>
                    <Dialog.Footer>
                      <Dialog.Close
                        type="button"
                        class={buttonVariants({ variant: 'outline' })}
                      >
                        Cancel
                      </Dialog.Close>
                      <Button disabled={$submitting} type="submit">
                        Mark as paid
                      </Button>
                    </Dialog.Footer>
                  </form>
                </Dialog.Content>
              </Dialog.Root>
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
