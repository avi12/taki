<script lang="ts">
  import { updated } from "$app/state";
  import { reloadForUpdate } from "$lib/utils/reload";

  const { children } = $props();

  $effect(() => {
    if (updated.current) {
      reloadForUpdate();
    }
  });
</script>

<svelte:head>
  <link href="/TakiSquare.svg" rel="icon" type="image/svg+xml" />
</svelte:head>

{@render children()}
