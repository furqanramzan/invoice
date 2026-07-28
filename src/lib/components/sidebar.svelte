<script lang="ts">
  import { page } from '$app/state';
  import { enhance } from '$app/forms';
  import { cn } from '$lib/utils.js';
  import DarkMode from '$lib/components/dark-mode.svelte';
  import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
  import FileText from '@lucide/svelte/icons/file-text';
  import PlusCircle from '@lucide/svelte/icons/plus-circle';
  import Wallet from '@lucide/svelte/icons/wallet';
  import BookOpen from '@lucide/svelte/icons/book-open';
  import Package from '@lucide/svelte/icons/package';
  import Warehouse from '@lucide/svelte/icons/warehouse';
  import Building2 from '@lucide/svelte/icons/building-2';
  import Users from '@lucide/svelte/icons/users';
  import Truck from '@lucide/svelte/icons/truck';
  import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
  import LogOut from '@lucide/svelte/icons/log-out';
  import Menu from '@lucide/svelte/icons/menu';
  import X from '@lucide/svelte/icons/x';
  import BarChart3 from '@lucide/svelte/icons/bar-chart-3';

  let expanded = $state(false);
  let mobileOpen = $state(false);

  const links = [
    { href: '/dashboard', routeId: '/(app)/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/reports/revenue', routeId: '/(app)/reports', icon: BarChart3, label: 'Reports' },
    { href: '/invoice', routeId: '/(app)/invoice', icon: FileText, label: 'Invoices' },
    { href: '/invoice/upsert', routeId: '/(app)/invoice/upsert', icon: PlusCircle, label: 'Create Invoice' },
    { href: '/expense', routeId: '/(app)/expense', icon: Wallet, label: 'Expenses' },
    { href: '/ledger', routeId: '/(app)/ledger', icon: BookOpen, label: 'Ledger' },
    { href: '/product', routeId: '/(app)/product', icon: Package, label: 'Products' },
    { href: '/inventory', routeId: '/(app)/inventory', icon: Warehouse, label: 'Inventory' },
    { href: '/company', routeId: '/(app)/company', icon: Building2, label: 'Companies' },
    { href: '/client', routeId: '/(app)/client', icon: Users, label: 'Clients' },
    { href: '/supplier', routeId: '/(app)/supplier', icon: Truck, label: 'Suppliers' },
    { href: '/purchase', routeId: '/(app)/purchase', icon: ShoppingCart, label: 'Purchases' },
  ];

  function isActive(link: typeof links[number]) {
    if (link.href === '/invoice/upsert') return page.route.id === link.routeId;
    if (link.href === '/invoice') return page.route.id?.startsWith('/(app)/invoice') && page.route.id !== '/(app)/invoice/upsert';
    if (link.href === '/reports/revenue') return page.route.id?.startsWith('/(app)/reports');
    return page.route.id === link.routeId;
  }
</script>

<button
  class="fixed top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-md bg-background shadow-sm ring-1 ring-border lg:hidden"
  onclick={() => (mobileOpen = !mobileOpen)}
  aria-label="Toggle navigation"
>
  {#if mobileOpen}
    <X class="h-5 w-5" />
  {:else}
    <Menu class="h-5 w-5" />
  {/if}
</button>

<aside
  class={cn(
    'fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-sidebar transition-all duration-200 lg:static',
    expanded ? 'w-56' : 'w-16',
    mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
  )}
>
  <div class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
    <a
      href="/dashboard"
      class={cn('flex items-center gap-2 font-bold', expanded ? 'text-base' : 'text-lg')}
    >
      <svg
        class="h-6 w-6 shrink-0"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect width="8" height="6" x="3" y="3" rx="2" />
        <rect width="8" height="6" x="13" y="3" rx="2" />
        <rect width="8" height="6" x="3" y="15" rx="2" />
        <rect width="8" height="6" x="13" y="15" rx="2" />
      </svg>
      {#if expanded}
        <span class="truncate">Invoice App</span>
      {/if}
    </a>
  </div>

  <nav class="flex-1 space-y-1 overflow-y-auto p-2">
    {#each links as link (link.href)}
      <a
        href={link.href}
        class={cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive(link)
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          expanded ? 'justify-start' : 'justify-center',
        )}
        title={expanded ? '' : link.label}
      >
        <link.icon class="h-5 w-5 shrink-0" />
        {#if expanded}
          <span class="truncate">{link.label}</span>
        {/if}
      </a>
    {/each}
  </nav>

  <div class="border-t p-2">
    <div class={cn('flex items-center gap-2', expanded ? 'justify-between' : 'flex-col')}>
      <DarkMode />
      <form method="post" action="/logout" use:enhance class="w-full">
        <button
          class={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            expanded ? 'justify-start' : 'justify-center',
          )}
          title={expanded ? '' : 'Sign out'}
          type="submit"
        >
          <LogOut class="h-5 w-5 shrink-0" />
          {#if expanded}
            <span>Sign out</span>
          {/if}
        </button>
      </form>
    </div>
  </div>

  {#if !mobileOpen}
    <button
      class="absolute -right-3 top-20 z-50 hidden h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm lg:flex"
      onclick={() => (expanded = !expanded)}
      aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
    >
      <svg
        class={cn('h-3 w-3 transition-transform', expanded ? 'rotate-180' : '')}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>
  {/if}
</aside>

{#if mobileOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
  <div
    class="fixed inset-0 z-30 bg-black/50 lg:hidden"
    role="presentation"
    onclick={() => (mobileOpen = false)}
  ></div>
{/if}
