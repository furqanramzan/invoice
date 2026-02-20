<script lang="ts" generics="T extends Record<string, unknown>">
  import {
    formFieldProxy,
    type SuperForm,
    type FormPathLeaves,
    type FormFieldProxy,
  } from 'sveltekit-superforms';
  import NumberInput from '../input/number-input.svelte';
  import ErrorMessage from './error-message.svelte';
  import type { NumberInputProps, NumberFieldType } from '../input/types';

  interface Props extends NumberInputProps {
    superform: SuperForm<T>;
    field: FormPathLeaves<T, NumberFieldType>;
  }

  let { superform, field, ...restProps }: Props = $props();

  // svelte-ignore state_referenced_locally
  const { value, errors, constraints } = formFieldProxy(
    superform,
    field,
  ) satisfies FormFieldProxy<NumberFieldType>;
</script>

<NumberInput
  {...restProps}
  {field}
  errors={$errors}
  bind:value={$value}
  {...$constraints}
>
  <ErrorMessage errors={$errors} />
</NumberInput>
