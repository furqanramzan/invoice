<script lang="ts">
  type Bar = {
    key: string;
    value: number;
    label: string;
    tooltip: string;
  };

  type LegendItem = {
    label: string;
    color: string;
  };

  type Props = {
    bars: Bar[];
    color?: string;
    maxHeight?: number;
    secondaryBars?: Bar[];
    secondaryColor?: string;
    legend?: LegendItem[];
  };

  let {
    bars,
    color = 'bg-green-500',
    maxHeight = 200,
    secondaryBars = [],
    secondaryColor = 'bg-red-500/70',
    legend = [],
  }: Props = $props();

  const maxValue = $derived(Math.max(...bars.map((b) => b.value), 1));
</script>

<div class="flex items-end gap-2">
  {#each bars as bar (bar.key)}
    {@const barHeight = (bar.value / maxValue) * maxHeight}
    <div class="group relative flex flex-1 flex-col items-center">
      <div class="relative w-full" style="height: {maxHeight}px">
        <div
          class="absolute bottom-0 w-full rounded-t {color} transition-all hover:opacity-80"
          style="height: {Math.max(barHeight, 2)}px"
        ></div>
        {#each secondaryBars.filter((s) => s.key === bar.key) as sec}
          {@const secHeight = (sec.value / maxValue) * maxHeight}
          <div
            class="absolute bottom-0 w-full rounded-t {secondaryColor} transition-all hover:opacity-80"
            style="height: {Math.max(secHeight, 2)}px"
          ></div>
        {/each}
        <div
          class="absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-sm group-hover:block"
        >
          {@html bar.tooltip}
        </div>
      </div>
      <span class="mt-1 text-[10px] text-muted-foreground">{bar.label}</span>
    </div>
  {/each}
</div>

{#if legend.length > 0}
  <div class="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
    {#each legend as item (item.label)}
      <span class="flex items-center gap-1">
        <span class="inline-block h-3 w-3 rounded {item.color}"></span>
        {item.label}
      </span>
    {/each}
  </div>
{/if}
