<script lang="ts">
  import { cn } from '$lib/utils.js';
  import { Button } from '$lib/components/ui/button';
  import { resolve } from '$app/paths';

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
</script>

<div class={cn('flex justify-center space-x-2', className)} {...rest}>
  {#each Array(totalPages) as _, i (i)}
    <Button
      variant={currentPage === i + 1 ? 'default' : 'outline'}
      href={resolve(basePath) + `?page=${i + 1}`}
    >
      {i + 1}
    </Button>
  {/each}
</div>
