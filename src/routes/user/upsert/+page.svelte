<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { userSchema } from './validations';
  import Spinner from '$lib/components/ui/spinner/spinner.svelte';

  let { data } = $props();

  const isEditing = $derived(!!data.currentUser);

  // svelte-ignore state_referenced_locally
  const { form, errors, enhance, submitting } = superForm(data.form, {
    validators: zod4(userSchema),
  });
</script>

<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
  {isEditing ? 'Edit User' : 'New User'}
</h1>
<form class="space-y-4" method="POST" use:enhance>
  {#if isEditing}
    <input type="hidden" name="id" bind:value={$form.id} />
  {/if}

  <div>
    <Label for="name" class="mb-1">Name</Label>
    <Input id="name" name="name" bind:value={$form.name} />
    {#if $errors.name}
      <p class="text-red-500">{$errors.name}</p>
    {/if}
  </div>

  <div>
    <Label for="email" class="mb-1">Email</Label>
    <Input id="email" name="email" bind:value={$form.email} />
    {#if $errors.email}
      <p class="text-red-500">{$errors.email}</p>
    {/if}
  </div>

  <div>
    <Label for="password" class="mb-1">
      Password
      {#if isEditing}
        <span class="text-sm text-gray-500">(Leave blank to keep current)</span>
      {/if}
    </Label>
    <Input
      id="password"
      name="password"
      type="password"
      bind:value={$form.password}
    />
    {#if $errors.password}
      <p class="text-red-500">{$errors.password}</p>
    {/if}
  </div>

  <div class="flex gap-2">
    <Button disabled={$submitting} type="submit">
      {#if $submitting}
        <Spinner />
      {/if}
      {isEditing ? 'Update User' : 'Create User'}
    </Button>
  </div>
</form>
