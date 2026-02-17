<script lang="ts">
  import * as Table from '$lib/components/ui/table';
  import { Button } from '$lib/components/ui/button';
  import Trash from '@lucide/svelte/icons/trash';
  import Pencil from '@lucide/svelte/icons/pencil';
  import { resolve } from '$app/paths';
  import { Pagination } from '$lib/components/ui/pagination';
  import { cn, formatCents } from '$lib/utils';
  import Heading from '$lib/components/heading.svelte';
  import { route, title } from './upsert/utils.js';
  import ActionForm from '$lib/components/form/action-form.svelte';
  import { getSuperForm } from '$lib/superforms.js';
  import { emptySchema } from '$lib/validations.js';

  const { data } = $props();

  // svelte-ignore state_referenced_locally
  const superform = getSuperForm(emptySchema, data.form);
</script>

<Heading
  title={title.plural}
  link={{ route: route.upsert, title: `Add ${title.singular}` }}
/>

{#if data.products.length === 0}
  <p>No products yet. Create one!</p>
{:else}
  <Table.Root class={cn('border', data.products.length === 0 && 'hidden')}>
    <Table.Header>
      <Table.Row>
        <Table.Head class="p-4 text-nowrap">Product Name</Table.Head>
        <Table.Head class="p-4 text-nowrap">Actual Price</Table.Head>
        <Table.Head class="p-4 text-nowrap">Quoted Price</Table.Head>
        <Table.Head class="p-4 text-nowrap">Sale Price</Table.Head>
        <Table.Head class="p-4 text-nowrap">Actions</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each data.products as product (product.id)}
        <Table.Row>
          <Table.Cell class="p-4 text-nowrap">{product.name}</Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {formatCents(product.actualPrice)}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {formatCents(product.quotedPrice)}
          </Table.Cell>
          <Table.Cell class="p-4 text-nowrap">
            {formatCents(product.salePrice)}
          </Table.Cell>
          <Table.Cell class="flex shrink-0 space-x-2 p-4 text-nowrap">
            <Button
              href={resolve(`/product/upsert`) + `?id=${product.id}`}
              variant="outline"
              size="icon"
            >
              <Pencil class="h-4 w-4" />
            </Button>
            <ActionForm {superform} field="id" value={product.id}>
              <Trash class="h-4 w-4" />
            </ActionForm>
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>

  {#if data.totalPages > 1}
    <Pagination
      currentPage={data.currentPage}
      totalPages={data.totalPages}
      basePath="/product"
    />
  {/if}
{/if}
