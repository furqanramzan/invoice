<script lang="ts">
  import * as Tooltip from '$lib/components/ui/tooltip/index.js';
  import type { Snippet } from 'svelte';

  const { text, children }: { children: Snippet; text: string } = $props();
</script>

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>
      {@render children()}
    </Tooltip.Trigger>
    <Tooltip.Content>
      <p>{text}</p>
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
