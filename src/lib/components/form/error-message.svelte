<script lang="ts">
  type Props = {
    errors?: string[];
  };

  let { errors }: Props = $props();
</script>

{#if errors}
  <p class="text-red-500">{errors}</p>
{/if}
