<script lang="ts" generics="T extends Record<string, unknown>">
  import type { Snippet } from 'svelte';
  import { type SuperForm } from 'sveltekit-superforms';
  import { Button } from '$lib/components/ui/button';

  type Props = {
    children: Snippet;
    superform: SuperForm<T>;
    afterButton?: Snippet;
    buttonText?: string;
    action?: string;
    enctype?: 'multipart/form-data';
    method?: 'post' | 'get';
    class?: string;
  };

  let {
    action,
    enctype,
    children,
    superform,
    buttonText,
    afterButton,
    method = 'post',
    class: className,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  let { enhance, submitting, tainted, isTainted } = superform;
</script>

{#snippet html()}
  <div class={className ?? 'space-y-4'}>
    {@render children()}
  </div>
  <div class="flex gap-2">
    <Button type="submit" disabled={$submitting || !isTainted($tainted)}>
      {buttonText || method === 'post' ? 'Save' : 'Apply'}
    </Button>
    {@render afterButton?.()}
  </div>
{/snippet}

{#if method === 'post'}
  <form {action} {enctype} {method} use:enhance>
    {@render html()}
  </form>
{:else}
  <form {action} {enctype} {method}>
    {@render html()}
  </form>
{/if}
