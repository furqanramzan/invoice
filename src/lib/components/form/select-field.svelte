<script lang="ts" generics="T extends Record<string, unknown>">
  import {
    formFieldProxy,
    type SuperForm,
    type FormPathLeaves,
    type FormFieldProxy,
  } from 'sveltekit-superforms';
  import SelectInput from '../input/select-input.svelte';
  import ErrorMessage from './error-message.svelte';
  import type { SelectInputProps, SelectFieldType } from '../input/types';

  interface Props extends SelectInputProps {
    superform: SuperForm<T>;
    field: FormPathLeaves<T, SelectFieldType>;
  }

  let { superform, field, ...restProps }: Props = $props();

  // svelte-ignore state_referenced_locally
  const { value, errors } = formFieldProxy(
    superform,
    field,
  ) satisfies FormFieldProxy<SelectFieldType>;
</script>

<SelectInput {...restProps} {field} bind:value={$value}>
  <ErrorMessage errors={$errors} />
</SelectInput>
