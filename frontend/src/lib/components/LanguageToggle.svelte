<script lang="ts">
  import { locale } from "$lib/locale.svelte";

  $effect(() => {
    document.documentElement.lang = locale.lang;
  });
</script>

<div
  class="lang-switcher"
  aria-label={locale.lang === "he" ? "בחירת שפה" : "Language selector"}
  dir={locale.lang === "he" ? "rtl" : "ltr"}
  role="group"
>
  <button
    class="lang-option"
    class:is-active={locale.lang === "en"}
    aria-pressed={locale.lang === "en"}
    onclick={() => locale.lang === "he" && locale.toggle()}
  >
    English
  </button>
  <span class="lang-divider" aria-hidden="true"></span>
  <button
    class="lang-option"
    class:is-active={locale.lang === "he"}
    aria-pressed={locale.lang === "he"}
    onclick={() => locale.lang === "en" && locale.toggle()}
  >
    עברית
  </button>
</div>

<style>
  .lang-switcher {
    position: fixed;
    top: 0.6rem;
    inset-inline-end: 0.6rem;
    z-index: 9999;
    display: flex;
    gap: 0;
    align-items: center;
    padding: 0.2rem;
    border: 1px solid rgb(255 255 255 / 12%);
    border-radius: 2rem;
    background: rgb(0 0 0 / 40%);
    backdrop-filter: blur(10px);
  }

  .lang-option {
    padding: 0.4rem 0.7rem;
    border: none;
    border-radius: 2rem;
    background: none;
    color: rgb(255 255 255 / 70%);
    font-family: inherit;
    font-weight: 600;
    font-size: 0.72rem;
    line-height: 1.4;
    white-space: nowrap;
    cursor: pointer;
    transition: color 0.2s, background 0.2s;

    &.is-active {
      background: rgb(255 255 255 / 14%);
      color: rgb(255 255 255 / 95%);
      font-weight: 700;
      cursor: default;
    }

    &:not(.is-active):hover {
      color: rgb(255 255 255 / 80%);
    }

    &:focus-visible {
      outline: 2px solid rgb(255 255 255 / 90%);
      outline-offset: 2px;
    }
  }

  .lang-divider {
    flex-shrink: 0;
    width: 1px;
    height: 0.75em;
    background: rgb(255 255 255 / 18%);
  }
</style>
