<script lang="ts">
  import { cn } from '$lib/utils.js';
  import { Button } from '$lib/components/ui/button';

  let {
    currentPage,
    totalPages,
    basePath,
    class: className,
    ...rest
  } = $props<{
    currentPage: number;
    totalPages: number;
    basePath: string;
    class?: string;
  }>();

  // Logic to determine which page numbers to show
  const getVisiblePages = (current: number, total: number) => {
    const delta = 2; // How many pages to show on either side of current
    const range = [];
    const rangeWithDots = [];
    let l;

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
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
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
    href={currentPage > 1 ? `${basePath}?page=${currentPage - 1}` : undefined}
  >
    Previous
  </Button>

  {#each pages as page (page)}
    {#if page === '...'}
      <span class="px-2 text-muted-foreground">...</span>
    {:else}
      <Button
        variant={currentPage === page ? 'default' : 'outline'}
        size="icon"
        class="h-9 w-9"
        href={`${basePath}?page=${page}`}
      >
        {page}
      </Button>
    {/if}
  {/each}

  <Button
    variant="outline"
    size="sm"
    disabled={currentPage >= totalPages}
    href={currentPage < totalPages
      ? `${basePath}?page=${currentPage + 1}`
      : undefined}
  >
    Next
  </Button>
</div>
