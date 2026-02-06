<script lang="ts" generics="T extends Record<string, unknown>">
  import type { Snippet } from 'svelte';
  import { type SuperForm } from 'sveltekit-superforms';
  import { Button } from '$lib/components/ui/button';

  type Props = {
    children: Snippet;
    superform: SuperForm<T>;
    buttonText?: string;
    action?: string;
    enctype?: HTMLFormElement['multipart/form-data'];
  };

  let { children, enctype, superform, buttonText, action }: Props = $props();

  // svelte-ignore state_referenced_locally
  let { enhance, submitting, tainted, isTainted } = superform;
</script>

<form {action} {enctype} class="space-y-4" method="POST" use:enhance>
  {@render children()}
  <Button disabled={$submitting || !isTainted($tainted)} type="submit">
    {buttonText || 'Save'}
  </Button>
</form>
