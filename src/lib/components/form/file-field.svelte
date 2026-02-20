<script lang="ts" generics="T extends Record<string, unknown>">
  import {
    formFieldProxy,
    type SuperForm,
    type FormPath,
    fileProxy,
    type FormFieldProxy,
    type FormPathLeaves,
  } from 'sveltekit-superforms';
  import FileInput from '../input/file-input.svelte';
  import ErrorMessage from './error-message.svelte';
  import type { FileInputProps } from '../input/types';

  interface Props extends FileInputProps {
    superform: SuperForm<T>;
    field: FormPath<T>;
    urlField: FormPathLeaves<T, string | null>;
  }

  let { superform, field, urlField, ...restProps }: Props = $props();

  // svelte-ignore state_referenced_locally
  const { form } = superform;
  // svelte-ignore state_referenced_locally
  // @ts-expect-error it's working fine
  const { errors, constraints } = formFieldProxy(superform, field);
  // @ts-expect-error it's working fine
  const file = fileProxy(form, 'image');
  // svelte-ignore state_referenced_locally
  const { value: urlValue } = formFieldProxy(
    superform,
    urlField,
  ) satisfies FormFieldProxy<string | null>;
</script>

<FileInput
  {...restProps}
  {field}
  errors={$errors}
  bind:value={$file}
  urlValue={$urlValue}
  {...$constraints}
>
  <ErrorMessage errors={$errors} />
  {#if $urlValue && !$file.length}
    <input type="hidden" name={urlField} value={$urlValue} />
  {/if}
</FileInput>
