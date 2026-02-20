<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import Button from '$lib/components/ui/button/button.svelte';
  import * as Card from '$lib/components/ui/card';
  import Input from '$lib/components/ui/input/input.svelte';
  import { Label } from '$lib/components/ui/label';

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const { form, errors, submitting, message, enhance } =
    superForm(data.form);
</script>

<Card.Root class="mx-auto w-full max-w-sm">
  <Card.Header>
    <Card.Title class="text-2xl">Login</Card.Title>
    <Card.Description>
      Enter your email below to login to your account
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <form class="space-y-4" method="post" use:enhance>
      <div class="grid gap-2">
        <Label for="email">Email</Label>
        <Input
          type="email"
          id="email"
          name="email"
          placeholder="johndoe"
          autocomplete="email"
          bind:value={$form.email}
        />
        {#if $errors.email}
          <p class="text-sm text-red-500">
            {$errors.email}
          </p>
        {/if}
      </div>
      <div class="grid gap-2">
        <Label for="password">Password</Label>
        <Input
          type="password"
          id="password"
          name="password"
          autocomplete="current-password"
          bind:value={$form.password}
        />
        {#if $errors.password}
          <p class="text-sm text-red-500">
            {$errors.password}
          </p>
        {/if}
      </div>
      <Button disabled={$submitting} type="submit" class="w-full"
        >Login</Button
      >
    </form>
    {#if $message}
      <p class="text-sm text-red-500">{$message}</p>
    {/if}
  </Card.Content>
</Card.Root>
