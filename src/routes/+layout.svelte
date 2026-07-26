<script lang="ts">
  import './layout.css';
  import favicon from '$lib/assets/favicon.svg';
  import { ModeWatcher } from 'mode-watcher';
  import { getFlash } from 'sveltekit-flash-message';
  import { page } from '$app/state';
  import { toast } from 'svelte-sonner';
  import { Toaster } from '$lib/components/ui/sonner/index.js';

  const flash = getFlash(page);

  let { children } = $props();

  $effect(() => {
    if ($flash?.type === 'success') {
      toast.success($flash.message);
    }
    if ($flash?.type === 'error') {
      toast.error($flash.message);
    }
  });
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<ModeWatcher />
<Toaster
  position="top-center"
  expand={true}
  richColors
  closeButton
/>

{@render children()}
