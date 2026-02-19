<script lang="ts" generics="T extends Record<string, unknown>">
  import type { Snippet } from 'svelte';
  import { type FormPathLeaves, type SuperForm } from 'sveltekit-superforms';
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import {
    buttonVariants,
    type ButtonVariant,
  } from '$lib/components/ui/button/index.js';

  type Props = {
    children: Snippet;
    superform: SuperForm<T>;
    field?: FormPathLeaves<T>;
    value?: string | number;
    action?: string;
    variant?: ButtonVariant;
  };

  let {
    children,
    superform,
    action,
    field,
    value,
    variant = 'destructive',
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  let { enhance, submitting } = superform;
</script>

<AlertDialog.Root>
  <AlertDialog.Trigger
    type="button"
    class={buttonVariants({ variant, size: 'icon' })}
  >
    {@render children()}
  </AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel type="button">Cancel</AlertDialog.Cancel>
      <form {action} method="POST" use:enhance>
        {#if field}
          <input type="hidden" name={field} {value} />
        {/if}
        <AlertDialog.Action disabled={$submitting} type="submit">
          Continue
        </AlertDialog.Action>
      </form>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
