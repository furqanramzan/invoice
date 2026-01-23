<script lang="ts">
  import './layout.css';
  import favicon from '$lib/assets/favicon.svg';
  import { ModeWatcher } from 'mode-watcher';
  import DarkMode from '$lib/components/dark-mode.svelte';
  import { resolve } from '$app/paths';

  let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<ModeWatcher />
<nav class="flex items-center justify-between bg-gray-100 p-4 dark:bg-gray-900">
  <div class="flex items-center space-x-4">
    <a href={resolve('/')} class="text-lg font-bold">Invoice App</a>
  </div>
  <div class="flex items-center space-x-4">
    <a href={resolve('/invoice/create')} class="text-sm">Create Invoice</a>
    <DarkMode />
  </div>
</nav>
{@render children()}
