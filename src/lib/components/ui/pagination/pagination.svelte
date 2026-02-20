<script lang="ts">
  import { cn } from '$lib/utils.js';
  import { Button } from '$lib/components/ui/button';
  import { page } from '$app/state';
  import { SvelteURLSearchParams } from 'svelte/reactivity';

  let {
    currentPage,
    totalPages,
    class: className,
    ...rest
  } = $props<{
    currentPage: number;
    totalPages: number;
    class?: string;
  }>();

  // Helper to construct the href with existing search params
  const getPageHref = (pageNumber: number | string) => {
    const params = new SvelteURLSearchParams(page.url.searchParams);
    params.set('page', pageNumber.toString());
    return `${page.url.pathname}?${params.toString()}`;
  };

  // Logic to determine which page numbers to show
  const getVisiblePages = (current: number, total: number) => {
    const delta = 2;
    const range = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= current - delta && i <= current + delta)
      ) {
        range.push(i);
      }
    }
    for (let i of range) {
      if (l) {
        if (i - l === 2) rangeWithDots.push(l + 1);
        else if (i - l !== 1) rangeWithDots.push('...');
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  };

  const pages = $derived(getVisiblePages(currentPage, totalPages));
</script>

<div class={cn('flex items-center justify-center gap-2', className)} {...rest}>
  <Button
    variant="outline"
    size="sm"
    disabled={currentPage <= 1}
    href={currentPage > 1 ? getPageHref(currentPage - 1) : undefined}
  >
    Previous
  </Button>

  {#each pages as p, index (index)}
    {#if p === '...'}
      <span class="px-2 text-muted-foreground">...</span>
    {:else}
      <Button
        variant={currentPage === p ? 'default' : 'outline'}
        size="icon"
        class="h-9 w-9"
        href={getPageHref(p)}
      >
        {p}
      </Button>
    {/if}
  {/each}

  <Button
    variant="outline"
    size="sm"
    disabled={currentPage >= totalPages}
    href={currentPage < totalPages ? getPageHref(currentPage + 1) : undefined}
  >
    Next
  </Button>
</div>
