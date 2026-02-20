<script lang="ts" generics="T extends Record<string, unknown>">
  import {
    formFieldProxy,
    type SuperForm,
    type FormPathLeaves,
  } from 'sveltekit-superforms';
  import PasswordInput from '../input/password-input.svelte';
  import ErrorMessage from './error-message.svelte';
  import type { PasswordInputProps } from '../input/types';

  interface Props extends PasswordInputProps {
    superform: SuperForm<T>;
    field: FormPathLeaves<T>;
  }

  let { superform, field, ...restProps }: Props = $props();

  // svelte-ignore state_referenced_locally
  const { value, errors, constraints } = formFieldProxy(superform, field);
</script>

<PasswordInput
  {...restProps}
  {field}
  errors={$errors}
  bind:value={$value as string}
  {...$constraints}
>
  <ErrorMessage errors={$errors} />
</PasswordInput>
