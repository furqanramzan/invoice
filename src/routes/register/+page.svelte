<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import Button from '$lib/components/ui/button/button.svelte';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const { form, message, errors, enhance } = superForm(data.form);
</script>

<Card.Root class="mx-auto w-full max-w-sm">
  <Card.Header>
    <Card.Title class="text-2xl">Register</Card.Title>
    <Card.Description>Create an account to get started</Card.Description>
  </Card.Header>
  <Card.Content>
    <form class="space-y-4" method="post" use:enhance>
      <div class="grid gap-2">
        <Label for="name">Name</Label>
        <Input
          type="text"
          id="name"
          name="name"
          placeholder="John Doe"
          bind:value={$form.name}
        />
        {#if $errors.name}
          <p class="text-sm text-red-500">{$errors.name}</p>
        {/if}
      </div>
      <div class="grid gap-2">
        <Label for="email">Email</Label>
        <Input
          type="text"
          id="email"
          name="email"
          placeholder="johndoe"
          autocomplete="email"
          bind:value={$form.email}
        />
        {#if $errors.email}
          <p class="text-sm text-red-500">{$errors.email}</p>
        {/if}
      </div>
      <div class="grid gap-2">
        <Label for="password">Password</Label>
        <Input
          type="password"
          id="password"
          name="password"
          placeholder="******"
          autocomplete="new-password"
          bind:value={$form.password}
        />
        {#if $errors.password}
          <p class="text-sm text-red-500">{$errors.password}</p>
        {/if}
      </div>
      <Button type="submit" class="w-full">Register</Button>
    </form>
    {#if $message}
      <p class="text-sm text-red-500">{$message}</p>
    {/if}
  </Card.Content>
</Card.Root>
