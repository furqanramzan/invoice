<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Table from '$lib/components/ui/table';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { resolve } from '$app/paths';
  import { formatCents } from '$lib/utils.js';

  const { data } = $props();

  const maxRevenue = $derived(Math.max(...data.profitByPeriod.map((r: { revenue: number }) => r.revenue), 1));

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function profitPercent(revenue: number, cost: number) {
    if (revenue === 0) return 0;
    return ((revenue - cost) / revenue) * 100;
  }
</script>

<div class="space-y-8">
  <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-sm text-muted-foreground">Total Revenue (12mo)</Card.Title>
      </Card.Header>
      <Card.Content>
        <p class="text-3xl font-bold text-green-600">{formatCents(data.totalRevenue)}</p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-sm text-muted-foreground">Total Cost (12mo)</Card.Title>
      </Card.Header>
      <Card.Content>
        <p class="text-3xl font-bold text-red-600">{formatCents(data.totalCost)}</p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-sm text-muted-foreground">Gross Profit (12mo)</Card.Title>
      </Card.Header>
      <Card.Content>
        <p class="text-3xl font-bold text-blue-600">{formatCents(data.totalProfit)}</p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-sm text-muted-foreground">Profit Margin</Card.Title>
      </Card.Header>
      <Card.Content>
        <p class="text-3xl font-bold {data.margin >= 20 ? 'text-green-600' : data.margin >= 10 ? 'text-yellow-600' : 'text-red-600'}">
          {data.margin.toFixed(1)}%
        </p>
      </Card.Content>
    </Card.Root>
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title>Gross Profit by Month (Last 12 Months)</Card.Title>
    </Card.Header>
    <Card.Content>
      {#if data.profitByPeriod.length === 0}
        <p class="text-sm text-muted-foreground">No profit data available.</p>
      {:else}
        <div class="flex items-end gap-2">
          {#each data.profitByPeriod as row (row.year + '-' + row.month)}
            {@const revHeight = (row.revenue / maxRevenue) * 180}
            {@const costHeight = (row.cost / maxRevenue) * 180}
            <div class="group relative flex flex-1 flex-col items-center">
              <div class="relative w-full" style="height: 180px">
                <div
                  class="absolute bottom-0 w-full rounded-t bg-green-500 transition-all hover:bg-green-600"
                  style="height: {Math.max(revHeight, 2)}px"
                >
                </div>
                <div
                  class="absolute bottom-0 w-full rounded-t bg-red-500/70 transition-all hover:bg-red-600"
                  style="height: {Math.max(costHeight, 2)}px"
                >
                </div>
                <div class="absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-sm group-hover:block">
                  {monthLabels[row.month - 1]} {row.year}<br />
                  Revenue: {formatCents(row.revenue)}<br />
                  Cost: {formatCents(row.cost)}<br />
                  Profit: {formatCents(row.revenue - row.cost)}<br />
                  Margin: {profitPercent(row.revenue, row.cost).toFixed(1)}%
                </div>
              </div>
              <span class="mt-1 text-[10px] text-muted-foreground">{monthLabels[row.month - 1]}</span>
            </div>
          {/each}
        </div>
        <div class="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span class="flex items-center gap-1"><span class="inline-block h-3 w-3 rounded bg-green-500"></span> Revenue</span>
          <span class="flex items-center gap-1"><span class="inline-block h-3 w-3 rounded bg-red-500/70"></span> Cost</span>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>Product Profit Margins</Card.Title>
    </Card.Header>
    <Card.Content class="p-0">
      {#if data.productProfit.length === 0}
        <p class="px-6 pb-6 text-sm text-muted-foreground">No product data available.</p>
      {:else}
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head class="p-4">Product</Table.Head>
              <Table.Head class="p-4 text-right">Units Sold</Table.Head>
              <Table.Head class="p-4 text-right">Revenue</Table.Head>
              <Table.Head class="p-4 text-right">Cost</Table.Head>
              <Table.Head class="p-4 text-right">Profit</Table.Head>
              <Table.Head class="p-4 text-right">Margin</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each data.productProfit as product (product.id)}
              {@const profit = product.revenue - product.cost}
              {@const pct = profitPercent(product.revenue, product.cost)}
              <Table.Row>
                <Table.Cell class="p-4 font-medium">{product.name}</Table.Cell>
                <Table.Cell class="p-4 text-right">{product.unitsSold}</Table.Cell>
                <Table.Cell class="p-4 text-right">{formatCents(product.revenue)}</Table.Cell>
                <Table.Cell class="p-4 text-right">{formatCents(product.cost)}</Table.Cell>
                <Table.Cell class="p-4 text-right font-medium">{formatCents(profit)}</Table.Cell>
                <Table.Cell class="p-4 text-right">
                  <span class="font-medium {pct >= 20 ? 'text-green-600' : pct >= 10 ? 'text-yellow-600' : 'text-red-600'}">
                    {pct.toFixed(1)}%
                  </span>
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      {/if}
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>Most Profitable Invoices</Card.Title>
    </Card.Header>
    <Card.Content class="p-0">
      {#if data.invoiceProfit.length === 0}
        <p class="px-6 pb-6 text-sm text-muted-foreground">No invoice data available.</p>
      {:else}
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head class="p-4">Invoice</Table.Head>
              <Table.Head class="p-4">Status</Table.Head>
              <Table.Head class="p-4 text-right">Revenue</Table.Head>
              <Table.Head class="p-4 text-right">Cost</Table.Head>
              <Table.Head class="p-4 text-right">Profit</Table.Head>
              <Table.Head class="p-4 text-right">Margin</Table.Head>
              <Table.Head class="p-4"></Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each data.invoiceProfit as inv (inv.id)}
              {@const profit = inv.revenue - inv.cost}
              {@const pct = profitPercent(inv.revenue, inv.cost)}
              <Table.Row>
                <Table.Cell class="p-4 font-medium">#{inv.invoiceNumber}</Table.Cell>
                <Table.Cell class="p-4">
                  <Badge variant="outline">{inv.status}</Badge>
                </Table.Cell>
                <Table.Cell class="p-4 text-right">{formatCents(inv.revenue)}</Table.Cell>
                <Table.Cell class="p-4 text-right">{formatCents(inv.cost)}</Table.Cell>
                <Table.Cell class="p-4 text-right font-medium">{formatCents(profit)}</Table.Cell>
                <Table.Cell class="p-4 text-right">
                  <span class="font-medium {pct >= 20 ? 'text-green-600' : pct >= 10 ? 'text-yellow-600' : 'text-red-600'}">
                    {pct.toFixed(1)}%
                  </span>
                </Table.Cell>
                <Table.Cell class="p-4">
                  <Button href={resolve('/invoice/upsert') + `?id=${inv.id}`} variant="outline" size="sm">
                    View
                  </Button>
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      {/if}
    </Card.Content>
  </Card.Root>
</div>
