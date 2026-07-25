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
  let showNav = $state(false);

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

<nav class="bg-gray-100 p-4 dark:bg-gray-900">
  <div class="mx-auto max-w-7xl">
    <div
      class="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0"
    >
      <div class="flex items-center justify-between space-x-4">
        <a href={resolve('/')} class="text-lg font-bold">
          Invoice App
        </a>
        <button
          class="block rounded-md p-2 focus:ring-2 focus:ring-white focus:outline-none focus:ring-inset sm:hidden"
          onclick={() => (showNav = !showNav)}
          aria-label="Show hide navbar"
        >
          <svg
            class="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </button>
      </div>

      <div
        class="flex w-full flex-col items-center space-y-2 sm:w-auto sm:flex-row sm:space-y-0 sm:space-x-4
        {showNav ? 'flex' : 'hidden'} sm:flex"
      >
        <a href={resolve('/invoice')} class="text-sm">Invoices</a
        >
        <a href={resolve('/invoice/upsert')} class="text-sm"
          >Create Invoice</a
        >
        <a href={resolve('/expense')} class="text-sm">Expenses</a
        >
        <a href={resolve('/ledger')} class="text-sm">Ledger</a>
        <a href={resolve('/product')} class="text-sm">Products</a
        >
        <a href={resolve('/inventory')} class="text-sm"
          >Inventory</a
        >
        <a href={resolve('/company')} class="text-sm"
          >Companies</a
        >
        <a href={resolve('/client')} class="text-sm">Clients</a>
        <a href={resolve('/supplier')} class="text-sm">Suppliers</a>
        <a href={resolve('/purchase')} class="text-sm">Purchases</a>
        <form
          method="post"
          action="/logout"
          class="text-sm"
          use:enhance
        >
          <button>Sign out</button>
        </form>
        <DarkMode />
      </div>
    </div>
  </div>
</nav>

<div class="mx-auto my-5 max-w-7xl space-y-4 max-sm:px-3">
  {@render children()}
</div>
