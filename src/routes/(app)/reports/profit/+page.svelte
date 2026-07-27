<script lang="ts">
  import KpiCard from '$lib/components/report-kpi-card.svelte';
  import ReportBarChart from '$lib/components/report-bar-chart.svelte';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Table from '$lib/components/ui/table';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { resolve } from '$app/paths';
  import { formatCents } from '$lib/utils.js';

  const { data } = $props();

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const costBars = $derived(
    data.profitByPeriod.map((r: { year: number; month: number; cost: number }) => ({
      key: `${r.year}-${r.month}`,
      value: r.cost,
      label: monthLabels[r.month - 1],
      tooltip: '',
    })),
  );

  const profitBars = $derived(
    data.profitByPeriod.map((r: { year: number; month: number; revenue: number; cost: number }) => ({
      key: `${r.year}-${r.month}`,
      value: r.revenue,
      label: monthLabels[r.month - 1],
      tooltip: `${monthLabels[r.month - 1]} ${r.year}<br />Revenue: ${formatCents(r.revenue)}<br />Cost: ${formatCents(r.cost)}<br />Profit: ${formatCents(r.revenue - r.cost)}<br />Margin: ${profitPercent(r.revenue, r.cost).toFixed(1)}%`,
    })),
  );

  function profitPercent(revenue: number, cost: number) {
    if (revenue === 0) return 0;
    return ((revenue - cost) / revenue) * 100;
  }
</script>

<div class="space-y-8">
  <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
    <KpiCard title="Total Revenue (12mo)" value={formatCents(data.totalRevenue)} color="text-green-600" />
    <KpiCard title="Total Cost (12mo)" value={formatCents(data.totalCost)} color="text-red-600" />
    <KpiCard title="Gross Profit (12mo)" value={formatCents(data.totalProfit)} color="text-blue-600" />
    <KpiCard
      title="Profit Margin"
      value={`${data.margin.toFixed(1)}%`}
      color={data.margin >= 20 ? 'text-green-600' : data.margin >= 10 ? 'text-yellow-600' : 'text-red-600'}
    />
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title>Gross Profit by Month (Last 12 Months)</Card.Title>
    </Card.Header>
    <Card.Content>
      {#if data.profitByPeriod.length === 0}
        <p class="text-sm text-muted-foreground">No profit data available.</p>
      {:else}
        <ReportBarChart
          bars={profitBars}
          color="bg-green-500"
          secondaryBars={costBars}
          secondaryColor="bg-red-500/70"
          maxHeight={180}
          legend={[
            { label: 'Revenue', color: 'bg-green-500' },
            { label: 'Cost', color: 'bg-red-500/70' },
          ]}
        />
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
