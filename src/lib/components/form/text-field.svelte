<script lang="ts" generics="T extends Record<string, unknown>">
  import {
    formFieldProxy,
    type SuperForm,
    type FormPathLeaves,
    type FormFieldProxy,
  } from 'sveltekit-superforms';
  import TextInput from '$lib/components/input/text-input.svelte';
  import ErrorMessage from './error-message.svelte';
  import type {
    TextInputProps,
    TextFieldType,
  } from '$lib/components/input/types';

  interface Props extends TextInputProps {
    superform: SuperForm<T>;
    field: FormPathLeaves<T, TextFieldType>;
  }

  let { superform, field, ...restProps }: Props = $props();

  // svelte-ignore state_referenced_locally
  const { value, errors, constraints } = formFieldProxy(
    superform,
    field,
  ) satisfies FormFieldProxy<TextFieldType>;
</script>

<TextInput
  {...restProps}
  {field}
  errors={$errors}
  bind:value={$value}
  {...$constraints}
>
  <ErrorMessage errors={$errors} />
</TextInput>
