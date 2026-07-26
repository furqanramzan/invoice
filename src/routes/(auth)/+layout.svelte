<script lang="ts">
  let { children } = $props();
</script>

<div class="flex min-h-dvh items-center justify-center">
  {@render children()}
</div>
