<script lang="ts">
  import type { Route } from '$lib/utils';
  import { Button } from './ui/button';

  type Props = {
    title: string;
    link?: { route: Route; title: string };
  };

  let { title, link }: Props = $props();
</script>

<div class="flex items-center justify-between">
  <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
    {title}
  </h1>
  {#if link}
    <Button href={link.route} class="flex items-center gap-2">
      {link.title}
    </Button>
  {/if}
</div>
