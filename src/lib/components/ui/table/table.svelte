<script lang="ts">
  import type { HTMLTableAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '$lib/utils.js';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLTableAttributes> = $props();
</script>

<!-- TODO: x overflow should be auto so that scrollbar appear. -->
<div data-slot="table-container" class="relative w-full overflow-y-visible">
  <table
    bind:this={ref}
    data-slot="table"
    class={cn('w-full caption-bottom text-sm', className)}
    {...restProps}
  >
    {@render children?.()}
  </table>
</div>
