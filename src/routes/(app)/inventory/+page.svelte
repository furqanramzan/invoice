<script lang="ts">
  import Heading from '$lib/components/heading.svelte';
  import * as Table from '$lib/components/ui/table';
  import { Badge } from '$lib/components/ui/badge';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Button } from '$lib/components/ui/button';
  import { Pagination } from '$lib/components/ui/pagination';
  import Pencil from '@lucide/svelte/icons/pencil';
  import { resolve } from '$app/paths';
  import { formatCents, cn } from '$lib/utils.js';
  import Tooltip from '$lib/components/tooltip.svelte';
  import Label from '$lib/components/ui/label/label.svelte';

  const { data } = $props();

  function onCompanyChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    const value = target.value;
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set('companyId', value);
    } else {
      url.searchParams.delete('companyId');
    }
    window.location.href = url.toString();
  }
</script>

<Heading title="Inventory" />

<div class="mt-6 space-y-6">
  <div
    class="grid grid-cols-2 gap-4 md:grid-cols-4"
  >
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-sm text-muted-foreground"
          >Total Products</Card.Title
        >
      </Card.Header>
      <Card.Content>
        <p class="text-3xl font-bold">
          {data.stats.totalProducts}
        </p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-sm text-muted-foreground"
          >In Stock</Card.Title
        >
      </Card.Header>
      <Card.Content>
        <p class="text-3xl font-bold text-green-600">
          {data.stats.inStock}
        </p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-sm text-muted-foreground"
          >Low Stock</Card.Title
        >
      </Card.Header>
      <Card.Content>
        <p class="text-3xl font-bold text-yellow-600">
          {data.stats.lowStock}
        </p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-sm text-muted-foreground"
          >Out of Stock</Card.Title
        >
      </Card.Header>
      <Card.Content>
        <p class="text-3xl font-bold text-red-600">
          {data.stats.outOfStock}
        </p>
      </Card.Content>
    </Card.Root>
  </div>

  <div class="flex items-center gap-2">
    <Label for="company-filter">Company</Label>
    <select
      id="company-filter"
      class="block w-64 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
      onchange={onCompanyChange}
    >
      <option value="">All Companies</option>
      {#each data.companies as company (company.id)}
        <option
          value={company.id}
          selected={data.selectedCompanyId === company.id}
        >
          {company.name}
        </option>
      {/each}
    </select>
  </div>

  {#if data.products.length === 0}
    <p class="text-sm text-muted-foreground">
      No products found.
    </p>
  {:else}
    <Table.Root class="border">
      <Table.Header>
        <Table.Row>
          <Table.Head class="p-4">Product</Table.Head>
          <Table.Head class="p-4">Company</Table.Head>
          <Table.Head class="p-4">Sale Price</Table.Head>
          <Table.Head class="p-4">Stock</Table.Head>
          <Table.Head class="p-4">Status</Table.Head>
          <Table.Head class="p-4"></Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each data.products as product (product.id)}
          <Table.Row
            class={cn(
              product.stock === 0 && 'bg-red-50 dark:bg-red-950/20',
              product.stock > 0 &&
                product.stock <= data.lowStockThreshold &&
                'bg-yellow-50 dark:bg-yellow-950/20',
            )}
          >
            <Table.Cell class="p-4 font-medium"
              >{product.name}</Table.Cell
            >
            <Table.Cell class="p-4"
              >{product.company?.name ?? '-'}</Table.Cell
            >
            <Table.Cell class="p-4"
              >{formatCents(product.salePrice)}</Table.Cell
            >
            <Table.Cell class="p-4">{product.stock}</Table.Cell>
            <Table.Cell class="p-4">
              {#if product.stock === 0}
                <Badge class="bg-red-500">Out of Stock</Badge>
              {:else if product.stock <= data.lowStockThreshold}
                <Badge class="bg-yellow-500">Low Stock</Badge>
              {:else}
                <Badge class="bg-green-500">In Stock</Badge>
              {/if}
            </Table.Cell>
            <Table.Cell class="p-4">
              <Tooltip text="Edit">
                <Button
                  href={resolve(`/product/upsert`) +
                    `?id=${product.id}`}
                  variant="outline"
                  size="icon"
                >
                  <Pencil class="h-4 w-4" />
                </Button>
              </Tooltip>
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>

    {#if data.totalPages > 1}
      <Pagination
        currentPage={data.currentPage}
        totalPages={data.totalPages}
      />
    {/if}
  {/if}
</div>
