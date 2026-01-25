<script lang="ts">
  // import { superForm } from 'sveltekit-superforms';
  import * as Table from '$lib/components/ui/table';
  import { Button } from '$lib/components/ui/button';
  import Plus from '@lucide/svelte/icons/plus';
  import Pencil from '@lucide/svelte/icons/pencil';
  // import Trash from '@lucide/svelte/icons/trash';
  // import Spinner from '$lib/components/ui/spinner/spinner.svelte';
  import { resolve } from '$app/paths';
  import { Pagination } from '$lib/components/ui/pagination';
  import { cn } from '$lib/utils';

  const { data } = $props();

  // const { enhance, submitting } = superForm(data.form);
</script>

<div class="flex items-center justify-between">
  <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
    Users
  </h1>
  <Button href={resolve('/user/upsert')} class="flex items-center gap-2">
    <Plus class="h-4 w-4" /> Add New User
  </Button>
</div>

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
              href={resolve(`/user/upsert`) + `?id=${user.id}`}
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
    <Pagination
      currentPage={data.currentPage}
      totalPages={data.totalPages}
      basePath="/user"
    />
  {/if}
{/if}
