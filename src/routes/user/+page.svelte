<script lang="ts">
  import * as Table from '$lib/components/ui/table';
  import { Button } from '$lib/components/ui/button';
  import Pencil from '@lucide/svelte/icons/pencil';
  import { Pagination } from '$lib/components/ui/pagination';
  import { cn } from '$lib/utils';
  import { route, title } from './upsert/utils.js';
  import Heading from '$lib/components/heading.svelte';

  const { data } = $props();

  // const { enhance, submitting } = superForm(data.form);
</script>

<Heading
  title={title.plural}
  link={{ route: route.upsert, title: `Add ${title.singular}` }}
/>

{#if data.users.length === 0}
  <p>No users yet. Create one!</p>
{:else}
  <Table.Root class={cn('border', data.users.length === 0 && 'hidden')}>
    <Table.Header>
      <Table.Row>
        <Table.Head class="p-4 text-nowrap">Email</Table.Head>
        <Table.Head class="p-4 text-nowrap">Name</Table.Head>
        <Table.Head class="p-4 text-nowrap">Actions</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each data.users as user (user.id)}
        <Table.Row>
          <Table.Cell class="p-4 text-nowrap">{user.email}</Table.Cell>
          <Table.Cell class="p-4 text-nowrap">{user.name}</Table.Cell>
          <Table.Cell class="flex shrink-0 space-x-2 p-4 text-nowrap">
            <Button
              href={route.upsert + `?id=${user.id}`}
              variant="outline"
              size="icon"
            >
              <Pencil class="h-4 w-4" />
            </Button>
            <!-- <form action="?/delete" method="post" use:enhance> -->
            <!--   <input type="hidden" value={user.id} name="id" /> -->
            <!--   <Button -->
            <!--     disabled={$submitting} -->
            <!--     type="submit" -->
            <!--     variant="destructive" -->
            <!--     size="icon" -->
            <!--   > -->
            <!--     {#if $submitting} -->
            <!--       <Spinner class="h-4 w-4" /> -->
            <!--     {:else} -->
            <!--       <Trash class="h-4 w-4" /> -->
            <!--     {/if} -->
            <!--   </Button> -->
            <!-- </form> -->
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>

  {#if data.totalPages > 1}
    <Pagination currentPage={data.currentPage} totalPages={data.totalPages} />
  {/if}
{/if}
