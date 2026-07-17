<script lang="ts">
  const { children } = $props();
</script>

<svelte:head>
  <link href="/TakiSquare.svg" rel="icon" type="image/svg+xml" />
</svelte:head>

{@render children()}
