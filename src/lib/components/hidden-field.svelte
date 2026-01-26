<script lang="ts" generics="T extends Record<string, unknown>">
  import {
    formFieldProxy,
    type SuperForm,
    type FormPathLeaves,
  } from 'sveltekit-superforms';

  type Props = {
    superform: SuperForm<T>;
    field: FormPathLeaves<T>;
  };

  let { superform, field }: Props = $props();

  // svelte-ignore state_referenced_locally
  const { value } = formFieldProxy(superform, field);
</script>

<input type="hidden" name={field} value={$value} />
