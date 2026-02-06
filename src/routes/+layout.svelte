<script lang="ts">
  import './layout.css';
  import favicon from '$lib/assets/favicon.svg';
  import { ModeWatcher } from 'mode-watcher';
  import DarkMode from '$lib/components/dark-mode.svelte';
  import { resolve } from '$app/paths';
  import { enhance } from '$app/forms';
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
<Toaster position="top-center" expand={true} richColors closeButton />

<nav class="flex bg-gray-100 p-4 dark:bg-gray-900">
  <div class="mx-auto max-w-7xl min-w-7xl">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <a href={resolve('/')} class="text-lg font-bold">Invoice App</a>
      </div>
      <div class="flex items-center space-x-4">
        <a href={resolve('/invoice')} class="text-sm">Invoices</a>
        <a href={resolve('/invoice/upsert')} class="text-sm">Create Invoice</a>
        <a href={resolve('/product')} class="text-sm">Products</a>
        <a href={resolve('/company')} class="text-sm">Companies</a>
        <a href={resolve('/client')} class="text-sm">Clients</a>
        <form method="post" action="/logout" class="text-sm" use:enhance>
          <button>Sign out</button>
        </form>
        <DarkMode />
      </div>
    </div>
  </div>
</nav>

<div class="mx-auto my-5 max-w-7xl min-w-7xl space-y-4">
  {@render children()}
</div>
