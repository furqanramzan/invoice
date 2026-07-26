<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Table from '$lib/components/ui/table';
  import { formatCents } from '$lib/utils.js';

  const { data } = $props();

  const maxMonthly = $derived(Math.max(...data.monthlyRevenue.map((r: { revenue: number }) => r.revenue), 1));
  const maxYearly = $derived(Math.max(...data.yearlyRevenue.map((r: { revenue: number }) => r.revenue), 1));

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
</script>

<div class="space-y-8">
  <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-sm text-muted-foreground">All-Time Revenue</Card.Title>
      </Card.Header>
      <Card.Content>
        <p class="text-3xl font-bold text-green-600">
          {formatCents(data.totalRevenue)}
        </p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-sm text-muted-foreground">Total Invoices (Paid)</Card.Title>
      </Card.Header>
      <Card.Content>
        <p class="text-3xl font-bold">
          {data.yearlyRevenue.reduce((s: number, r: { count: number }) => s + r.count, 0)}
        </p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-sm text-muted-foreground">Avg Invoice Value</Card.Title>
      </Card.Header>
      <Card.Content>
        <p class="text-3xl font-bold text-blue-600">
          {formatCents(Math.round(data.avgInvoiceValue))}
        </p>
      </Card.Content>
    </Card.Root>
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title>Monthly Revenue (Last 12 Months)</Card.Title>
    </Card.Header>
    <Card.Content>
      {#if data.monthlyRevenue.length === 0}
        <p class="text-sm text-muted-foreground">No revenue data available.</p>
      {:else}
        <div class="flex items-end gap-2">
          {#each data.monthlyRevenue as row (row.year + '-' + row.month)}
            {@const barHeight = (row.revenue / maxMonthly) * 200}
            <div class="group relative flex flex-1 flex-col items-center">
              <div
                class="w-full rounded-t bg-green-500 transition-all hover:bg-green-600"
                style="height: {Math.max(barHeight, 2)}px"
              >
                <div class="absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-sm group-hover:block">
                  {monthLabels[row.month - 1]} {row.year}: {formatCents(row.revenue)} ({row.count} invoices)
                </div>
              </div>
              <span class="mt-1 text-[10px] text-muted-foreground">
                {monthLabels[row.month - 1]}
              </span>
            </div>
          {/each}
        </div>
      {/if}
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>Yearly Revenue</Card.Title>
    </Card.Header>
    <Card.Content>
      {#if data.yearlyRevenue.length === 0}
        <p class="text-sm text-muted-foreground">No yearly data available.</p>
      {:else}
        <div class="flex items-end gap-4">
          {#each data.yearlyRevenue as row (row.year)}
            {@const barHeight = (row.revenue / maxYearly) * 200}
            <div class="group relative flex flex-1 flex-col items-center">
              <div
                class="w-full rounded-t bg-blue-500 transition-all hover:bg-blue-600"
                style="height: {Math.max(barHeight, 2)}px"
              >
                <div class="absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-sm group-hover:block">
                  {row.year}: {formatCents(row.revenue)} ({row.count} invoices)
                </div>
              </div>
              <span class="mt-1 text-xs text-muted-foreground">{row.year}</span>
            </div>
          {/each}
        </div>
      {/if}
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>Monthly Breakdown</Card.Title>
    </Card.Header>
    <Card.Content class="p-0">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head class="p-4">Month</Table.Head>
            <Table.Head class="p-4">Invoices</Table.Head>
            <Table.Head class="p-4">Revenue</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each [...data.monthlyRevenue].reverse() as row (row.year + '-' + row.month)}
            <Table.Row>
              <Table.Cell class="p-4 font-medium">
                {monthLabels[row.month - 1]} {row.year}
              </Table.Cell>
              <Table.Cell class="p-4">{row.count}</Table.Cell>
              <Table.Cell class="p-4">{formatCents(row.revenue)}</Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </Card.Content>
  </Card.Root>
</div>
