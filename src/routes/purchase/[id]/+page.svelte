<script lang="ts">
  import Heading from '$lib/components/heading.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Table from '$lib/components/ui/table';
  import { Badge } from '$lib/components/ui/badge';
  import { statuses, route, title, paymentSchema } from './utils.js';
  import { formatCents, cn } from '$lib/utils.js';
  import { getSuperForm } from '$lib/superforms.js';
  import Form from '$lib/components/form/form.svelte';
  import NumberField from '$lib/components/form/number-field.svelte';
  import DateField from '$lib/components/form/date-field.svelte';
  import TextField from '$lib/components/form/text-field.svelte';

  const { data } = $props();

  // svelte-ignore state_referenced_locally
  const paymentSuperform = getSuperForm(paymentSchema, data.paymentForm, {
    dataType: 'json',
  });

  let showPaymentForm = $state(false);

  let statusStyle = $derived(
    (() => {
      const s = statuses.find(
        (x) => x.value === data.purchase.status,
      );
      if (!s) return 'bg-secondary text-secondary-foreground';
      const colors: Record<string, string> = {
        yellow:
          'bg-yellow-100 text-yellow-800 border-yellow-300',
        blue: 'bg-blue-100 text-blue-800 border-blue-300',
        green:
          'bg-green-100 text-green-800 border-green-300',
        red: 'bg-red-100 text-red-800 border-red-300',
      };
      return colors[s.color] ?? 'bg-secondary text-secondary-foreground';
    })(),
  );
</script>

<Heading
  title={`${title.singular} #${data.purchase.purchaseNumber}`}
  link={{ route: route.list, title: `Back to ${title.plural}` }}
/>

<div class="mt-6 space-y-6">
  <div
    class="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-2"
  >
    <div>
      <span class="text-sm text-muted-foreground"
        >Purchase #</span
      >
      <p class="font-medium">
        {data.purchase.purchaseNumber}
      </p>
    </div>
    <div>
      <span class="text-sm text-muted-foreground">Date</span>
      <p class="font-medium">
        {new Date(data.purchase.date).toLocaleDateString()}
      </p>
    </div>
    <div>
      <span class="text-sm text-muted-foreground">Supplier</span>
      <p class="font-medium">
        {data.purchase.supplier?.name ?? '-'}
      </p>
    </div>
    <div>
      <span class="text-sm text-muted-foreground">Status</span>
      <p>
        <Badge
          class={statusStyle}
          variant="outline"
        >
          {data.purchase.status}
        </Badge>
      </p>
    </div>
    <div>
      <span class="text-sm text-muted-foreground">Company</span>
      <p class="font-medium">
        {data.purchase.company?.name ?? '-'}
      </p>
    </div>
  </div>

  {#if data.purchase.notes}
    <div class="rounded-lg border p-4">
      <span class="text-sm text-muted-foreground">Notes</span>
      <p class="mt-1 whitespace-pre-wrap">
        {data.purchase.notes}
      </p>
    </div>
  {/if}

  <div>
    <h2 class="mb-2 text-lg font-semibold">Items</h2>
    <Table.Root class="border">
      <Table.Header>
        <Table.Row>
          <Table.Head class="p-4">#</Table.Head>
          <Table.Head class="p-4">Product</Table.Head>
          <Table.Head class="p-4">Quantity</Table.Head>
          <Table.Head class="p-4">Unit Price</Table.Head>
          <Table.Head class="p-4 text-right">Total</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each data.purchase.items as item, index (item.id)}
          <Table.Row>
            <Table.Cell class="p-4">{index + 1}</Table.Cell>
            <Table.Cell class="p-4"
              >{item.product?.name ?? '-'}</Table.Cell
            >
            <Table.Cell class="p-4">{item.quantity}</Table.Cell>
            <Table.Cell class="p-4"
              >{formatCents(item.unitPrice)}</Table.Cell
            >
            <Table.Cell class="p-4 text-right"
              >{formatCents(
                item.quantity * item.unitPrice,
              )}</Table.Cell
            >
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
    <div class="mt-2 text-right text-lg font-bold">
      Total: {formatCents(data.purchase.totalAmount)}
    </div>
  </div>

  <div>
    <div
      class="mb-2 flex flex-wrap items-center justify-between gap-2"
    >
      <h2 class="text-lg font-semibold">
        Payments
        <span class="text-sm font-normal text-muted-foreground">
          ({data.purchase.payments.length})
        </span>
      </h2>
      <div class="text-sm text-muted-foreground">
        Paid:
        <span class="font-medium text-foreground"
          >{formatCents(data.purchase.totalPaid)}</span
        >
        &middot; Balance:
        <span
          class={cn(
            'font-medium',
            data.purchase.balance > 0
              ? 'text-destructive'
              : 'text-green-600',
          )}
        >
          {formatCents(data.purchase.balance)}
        </span>
      </div>
    </div>

    {#if data.purchase.payments.length === 0}
      <p class="rounded-lg border p-4 text-sm text-muted-foreground">
        No payments yet.
      </p>
    {:else}
      <Table.Root class="border">
        <Table.Header>
          <Table.Row>
            <Table.Head class="p-4">Date</Table.Head>
            <Table.Head class="p-4">Amount</Table.Head>
            <Table.Head class="p-4">Method</Table.Head>
            <Table.Head class="p-4">Reference</Table.Head>
            <Table.Head class="p-4">Notes</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each data.purchase.payments as payment (payment.id)}
            <Table.Row>
              <Table.Cell class="p-4"
                >{new Date(
                  payment.date,
                ).toLocaleDateString()}</Table.Cell
              >
              <Table.Cell class="p-4"
                >{formatCents(payment.amount)}</Table.Cell
              >
              <Table.Cell class="p-4"
                >{payment.method ?? '-'}</Table.Cell
              >
              <Table.Cell class="p-4"
                >{payment.reference ?? '-'}</Table.Cell
              >
              <Table.Cell class="p-4"
                >{payment.notes ?? '-'}</Table.Cell
              >
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {/if}

    {#if showPaymentForm}
      <div class="mt-4 rounded-lg border p-4">
        <h3 class="mb-3 text-sm font-semibold">
          Add Payment
        </h3>
        <Form
          superform={paymentSuperform}
          action="?/addPayment"
          buttonText="Save Payment"
        >
          <div
            class="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <NumberField
              superform={paymentSuperform}
              field="amount"
              label="Amount"
            />
            <DateField
              superform={paymentSuperform}
              field="date"
            />
            <TextField
              superform={paymentSuperform}
              field="method"
              label="Method"
              placeholder="e.g. Cash, Bank Transfer"
            />
            <TextField
              superform={paymentSuperform}
              field="reference"
              label="Reference"
              placeholder="e.g. transaction ID"
            />
            <div class="md:col-span-2">
              <TextField
                superform={paymentSuperform}
                field="notes"
                label="Notes"
                placeholder="Optional notes..."
              />
            </div>
          </div>
        </Form>
      </div>
    {/if}

    {#if !showPaymentForm}
      <div class="mt-4">
        <Button
          variant="outline"
          onclick={() => (showPaymentForm = true)}
        >
          + Add Payment
        </Button>
      </div>
    {/if}
  </div>

</div>
