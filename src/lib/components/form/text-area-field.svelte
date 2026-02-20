<script lang="ts" generics="T extends Record<string, unknown>">
  import {
    formFieldProxy,
    type SuperForm,
    type FormPathLeaves,
    type FormFieldProxy,
  } from 'sveltekit-superforms';
  import TextAreaInput from '../input/text-area-input.svelte';
  import ErrorMessage from './error-message.svelte';
  import type { TextAreaInputProps } from '../input/types';

  interface Props extends TextAreaInputProps {
    superform: SuperForm<T>;
    field: FormPathLeaves<T, string | number>;
  }

  let { superform, field, ...restProps }: Props = $props();

  // svelte-ignore state_referenced_locally
  const { value, errors, constraints } = formFieldProxy(
    superform,
    field,
  ) satisfies FormFieldProxy<string | number>;
</script>

<TextAreaInput
  {...restProps}
  {field}
  errors={$errors}
  bind:value={$value}
  {...$constraints}
>
  <ErrorMessage errors={$errors} />
</TextAreaInput>
