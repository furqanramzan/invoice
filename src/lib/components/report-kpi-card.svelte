<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js';

  type Props = {
    title: string;
    value: string;
    color?: string;
  };

  let { title, value, color = '' }: Props = $props();
</script>

<Card.Root>
  <Card.Header>
    <Card.Title class="text-sm text-muted-foreground">{title}</Card.Title>
  </Card.Header>
  <Card.Content>
    <p class="text-3xl font-bold {color}">{value}</p>
  </Card.Content>
</Card.Root>
