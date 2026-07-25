<script lang="ts">
  import Heading from '$lib/components/heading.svelte';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Table from '$lib/components/ui/table';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Separator } from '$lib/components/ui/separator';
  import { resolve } from '$app/paths';
  import { formatCents } from '$lib/utils.js';
  import Tooltip from '$lib/components/tooltip.svelte';

  const { data } = $props();

  const maxRevenue = $derived(Math.max(...data.dailyRevenue, 1));
  const daysInMonth = $derived(data.dailyRevenue.length);

  function statusColor(status: string) {
    const colors: Record<string, string> = {
      draft: 'bg-purple-500',
      processing: 'bg-yellow-500',
      delivered: 'bg-blue-500',
      delivery_acknowledged: 'bg-teal-500',
      paid: 'bg-green-500',
      disputed: 'bg-red-500',
      pending: 'bg-yellow-500',
      partial: 'bg-blue-500',
      cancelled: 'bg-red-500',
    };
    return colors[status] ?? 'bg-gray-500';
  }

  function activityHref(item: { type: string; id: number }) {
    if (item.type === 'invoice') return resolve('/invoice/upsert') + `?id=${item.id}`;
    if (item.type === 'expense') return resolve('/expense/upsert') + `?id=${item.id}`;
    return resolve('/purchase') + `/${item.id}`;
  }
</script>

<Heading title="Dashboard" />

<div class="mt-6 space-y-8">
  <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-sm text-muted-foreground"
          >Revenue This Month</Card.Title
        >
      </Card.Header>
      <Card.Content>
        <p class="text-3xl font-bold text-green-600">
          {formatCents(data.monthlyRevenue)}
        </p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-sm text-muted-foreground"
          >Outstanding</Card.Title
        >
      </Card.Header>
      <Card.Content>
        <p class="text-3xl font-bold text-yellow-600">
          {formatCents(data.outstanding)}
        </p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-sm text-muted-foreground"
          >Overdue Invoices</Card.Title
        >
      </Card.Header>
      <Card.Content>
        <p class="text-3xl font-bold text-red-600">
          {data.overdueCount}
        </p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-sm text-muted-foreground"
          >Low Stock Items</Card.Title
        >
      </Card.Header>
      <Card.Content>
        <p class="text-3xl font-bold text-yellow-600">
          {data.lowStockCount}
        </p>
      </Card.Content>
    </Card.Root>
  </div>

  <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
    <Card.Root>
      <Card.Header>
        <Card.Title>Revenue This Month</Card.Title>
      </Card.Header>
      <Card.Content>
        {#if data.monthlyRevenue === 0}
          <p class="text-sm text-muted-foreground">
            No revenue recorded this month.
          </p>
        {:else}
          <div class="flex items-end gap-[2px] sm:gap-[3px]">
            {#each data.dailyRevenue as amount, day}
              {@const barHeight = (amount / maxRevenue) * 100}
              <div class="group relative flex flex-1 flex-col items-center">
                <div
                  class="w-full rounded-t bg-green-500 transition-all hover:bg-green-600"
                  style="height: {Math.max(barHeight, 1)}px"
                >
                  <div
                    class="absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-sm group-hover:block"
                  >
                    Day {day + 1}: {formatCents(amount)}
                  </div>
                </div>
                <span
                  class="mt-1 text-[10px] text-muted-foreground {daysInMonth > 31
                    ? 'hidden'
                    : ''}"
                >
                  {day + 1}
                </span>
              </div>
            {/each}
          </div>
        {/if}
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title>Recent Activity</Card.Title>
      </Card.Header>
      <Card.Content class="p-0">
        {#if data.activity.length === 0}
          <p class="px-6 pb-6 text-sm text-muted-foreground">
            No recent activity.
          </p>
        {:else}
          {#each data.activity as item, i (item.type + item.id)}
            <a
              href={activityHref(item)}
              class="flex items-center justify-between px-6 py-3 transition-colors hover:bg-muted/50"
            >
              <div class="flex items-center gap-3">
                <Badge
                  class={item.status ? statusColor(item.status) : 'bg-gray-500'}
                >
                  {item.type}
                </Badge>
                <div>
                  <p class="text-sm font-medium">{item.label}</p>
                  <p class="text-xs text-muted-foreground">
                    {item.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span class="text-sm font-medium">
                {formatCents(item.amount)}
              </span>
            </a>
            {#if i < data.activity.length - 1}
              <Separator />
            {/if}
          {/each}
        {/if}
      </Card.Content>
    </Card.Root>
  </div>

  {#if data.lowStockProducts.length > 0}
    <Card.Root>
      <Card.Header>
        <Card.Title>Low Stock Products</Card.Title>
      </Card.Header>
      <Card.Content class="p-0">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head class="p-4">Product</Table.Head>
              <Table.Head class="p-4">Stock</Table.Head>
              <Table.Head class="p-4">Price</Table.Head>
              <Table.Head class="p-4"></Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each data.lowStockProducts as product (product.id)}
              <Table.Row
                class={product.stock <= 0
                  ? 'bg-red-50 dark:bg-red-950/20'
                  : 'bg-yellow-50 dark:bg-yellow-950/20'}
              >
                <Table.Cell class="p-4 font-medium"
                  >{product.name}</Table.Cell
                >
                <Table.Cell class="p-4">{product.stock}</Table.Cell>
                <Table.Cell class="p-4"
                  >{formatCents(product.salePrice)}</Table.Cell
                >
                <Table.Cell class="p-4">
                  <Tooltip text="Edit">
                    <Button
                      href={resolve('/product/upsert') + `?id=${product.id}`}
                      variant="outline"
                      size="icon"
                    >
                      <svg
                        class="h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </Button>
                  </Tooltip>
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </Card.Content>
    </Card.Root>
  {/if}

  <div class="flex flex-wrap gap-3">
    <Button href={resolve('/invoice/upsert')}>Create Invoice</Button>
    <Button href={resolve('/expense/upsert')} variant="outline"
      >Add Expense</Button
    >
    <Button href={resolve('/purchase/upsert')} variant="outline"
      >New Purchase</Button
    >
  </div>
</div>
