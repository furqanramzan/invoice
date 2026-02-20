<script lang="ts">
  import type { HTMLTableAttributes } from 'svelte/elements';
  import { cn, type WithElementRef } from '$lib/utils.js';

  interface Props extends WithElementRef<HTMLTableAttributes> {
    yVisible?: boolean;
  }

  let {
    ref = $bindable(null),
    class: className,
    children,
    yVisible = false,
    ...restProps
  }: Props = $props();
</script>

<!-- TODO: x overflow should be auto so that scrollbar appear. -->
<div
  data-slot="table-container"
  class="relative w-full"
  class:overflow-y-visible={yVisible}
  class:overflow-x-scroll={!yVisible}
>
  <table
    bind:this={ref}
    data-slot="table"
    class={cn('w-full caption-bottom text-sm', className)}
    {...restProps}
  >
    {@render children?.()}
  </table>
</div>
