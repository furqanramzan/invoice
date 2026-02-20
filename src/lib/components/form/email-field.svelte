<script lang="ts" generics="T extends Record<string, unknown>">
  import {
    formFieldProxy,
    type SuperForm,
    type FormPathLeaves,
  } from 'sveltekit-superforms';
  import EmailInput from '$lib/components/input/email-input.svelte';
  import ErrorMessage from './error-message.svelte';
  import type { TextInputProps } from '$lib/components/input/types';

  interface Props extends TextInputProps {
    superform: SuperForm<T>;
    field: FormPathLeaves<T>;
  }

  let { superform, field, ...restProps }: Props = $props();

  // svelte-ignore state_referenced_locally
  const { value, errors, constraints } = formFieldProxy(
    superform,
    field,
  );
</script>

<EmailInput
  {...restProps}
  {field}
  errors={$errors}
  bind:value={$value as string}
  {...$constraints}
>
  <ErrorMessage errors={$errors} />
</EmailInput>
