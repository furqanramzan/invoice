<script lang="ts">
  import KpiCard from '$lib/components/report-kpi-card.svelte';
  import ReportBarChart from '$lib/components/report-bar-chart.svelte';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Table from '$lib/components/ui/table';
  import { formatCents } from '$lib/utils.js';

  const { data } = $props();

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const monthlyBars = $derived(
    data.monthlyRevenue.map((r: { year: number; month: number; revenue: number; count: number }) => ({
      key: `${r.year}-${r.month}`,
      value: r.revenue,
      label: monthLabels[r.month - 1],
      tooltip: `${monthLabels[r.month - 1]} ${r.year}: ${formatCents(r.revenue)} (${r.count} invoices)`,
    })),
  );

  const yearlyBars = $derived(
    data.yearlyRevenue.map((r: { year: number; revenue: number; count: number }) => ({
      key: String(r.year),
      value: r.revenue,
      label: String(r.year),
      tooltip: `${r.year}: ${formatCents(r.revenue)} (${r.count} invoices)`,
    })),
  );
</script>

<div class="space-y-8">
  <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
    <KpiCard title="All-Time Revenue" value={formatCents(data.totalRevenue)} color="text-green-600" />
    <KpiCard
      title="Total Invoices (Paid)"
      value={String(data.yearlyRevenue.reduce((s: number, r: { count: number }) => s + r.count, 0))}
    />
    <KpiCard title="Avg Invoice Value" value={formatCents(Math.round(data.avgInvoiceValue))} color="text-blue-600" />
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title>Monthly Revenue (Last 12 Months)</Card.Title>
    </Card.Header>
    <Card.Content>
      {#if data.monthlyRevenue.length === 0}
        <p class="text-sm text-muted-foreground">No revenue data available.</p>
      {:else}
        <ReportBarChart bars={monthlyBars} color="bg-green-500" />
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
        <ReportBarChart bars={yearlyBars} color="bg-blue-500" />
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
