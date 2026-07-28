<script lang="ts">
  import Heading from '$lib/components/heading.svelte';
  import { page } from '$app/state';

  let { children } = $props();

  const tabs = [
    { href: '/reports/revenue', label: 'Revenue' },
    { href: '/reports/profit', label: 'Profit & Margin' },
  ];
</script>

<Heading title="Reports" />

<div class="mt-4">
  <nav class="flex gap-1 border-b">
    {#each tabs as tab (tab.href)}
      <a
        href={tab.href}
        class="-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors {page.url.pathname === tab.href ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}"
      >
        {tab.label}
      </a>
    {/each}
  </nav>
  <div class="mt-6">
    {@render children()}
  </div>
</div>
