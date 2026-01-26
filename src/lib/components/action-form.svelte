<script lang="ts" generics="T extends Record<string, unknown>">
  import type { Snippet } from 'svelte';
  import { type FormPathLeaves, type SuperForm } from 'sveltekit-superforms';
  import { Button } from './ui/button';

  type Props = {
    children: Snippet;
    superform: SuperForm<T>;
    field?: FormPathLeaves<T>;
    value?: string | number;
    action?: string;
  };

  let { children, superform, action, field, value }: Props = $props();

  // svelte-ignore state_referenced_locally
  let { enhance, submitting } = superform;
</script>

<form {action} method="POST" use:enhance>
  {#if field}
    <input type="hidden" name={field} {value} />
  {/if}
  <Button
    disabled={$submitting}
    type="submit"
    variant="destructive"
    size="icon"
  >
    {@render children()}
  </Button>
</form>
