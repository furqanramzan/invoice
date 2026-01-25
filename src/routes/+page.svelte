<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/components/ui/button/button.svelte';
  import * as Card from '$lib/components/ui/card';
  import Input from '$lib/components/ui/input/input.svelte';
  import { Label } from '$lib/components/ui/label';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<Card.Root class="mx-auto w-full max-w-sm">
  <Card.Header>
    <Card.Title class="text-2xl">Login</Card.Title>
    <Card.Description>
      Enter your username below to login to your account
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <form class="space-y-4" method="post" action="?/login" use:enhance>
      <Label for="username" class="mb-1">Username</Label>
      <Input name="username" id="username" autocomplete="username" />

      <Label for="password" class="mb-1">Password</Label>
      <Input type="password" name="password" autocomplete="current-password" />

      <Button>Login</Button>
    </form>
    <p style="color: red">{form?.message ?? ''}</p>
  </Card.Content>
</Card.Root>
