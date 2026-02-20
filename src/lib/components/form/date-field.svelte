<script lang="ts" generics="T extends Record<string, unknown>">
  import {
    formFieldProxy,
    type SuperForm,
    type FormPathLeaves,
    dateProxy,
  } from 'sveltekit-superforms';
  import DateInput from '../input/date-input.svelte';
  import ErrorMessage from './error-message.svelte';
  import type { DateInputProps } from '../input/types';

  interface Props extends DateInputProps {
    superform: SuperForm<T>;
    field: FormPathLeaves<T, Date>;
  }

  let { superform, field, ...restProps }: Props = $props();
  // svelte-ignore state_referenced_locally
  let { form } = superform;

  // svelte-ignore state_referenced_locally
  const { errors, constraints } = formFieldProxy(superform, field);
  // svelte-ignore state_referenced_locally
  const value = dateProxy(form, field, { format: 'date' });
</script>

<DateInput
  {...restProps}
  {field}
  errors={$errors}
  bind:value={$value}
  {...$constraints}
>
  <ErrorMessage errors={$errors} />
</DateInput>
