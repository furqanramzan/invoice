<script lang="ts" generics="T extends Record<string, unknown>">
  import {
    formFieldProxy,
    type SuperForm,
    type FormPathLeaves,
    type FormFieldProxy,
  } from 'sveltekit-superforms';
  import RadioInput from '../input/radio-input.svelte';
  import ErrorMessage from './error-message.svelte';
  import type { RadioInputProps, RadioFieldType } from '../input/types';

  interface Props extends RadioInputProps {
    superform: SuperForm<T>;
    field: FormPathLeaves<T, RadioFieldType>;
  }

  let { superform, field, ...restProps }: Props = $props();

  // svelte-ignore state_referenced_locally
  const { value, errors } = formFieldProxy(
    superform,
    field,
  ) satisfies FormFieldProxy<RadioFieldType>;
</script>

<RadioInput {...restProps} {field} bind:value={$value} errors={$errors}>
  <ErrorMessage errors={$errors} />
</RadioInput>
