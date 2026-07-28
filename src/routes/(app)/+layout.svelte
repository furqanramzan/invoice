<script lang="ts">
  import Sidebar from '$lib/components/sidebar.svelte';

  let { children } = $props();
</script>

<div class="flex min-h-screen">
  <Sidebar />
  <main class="flex-1">
    <div class="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
      {@render children()}
    </div>
  </main>
</div>
