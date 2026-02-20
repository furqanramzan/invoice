<script lang="ts" generics="T extends Record<string, unknown>">
  import {
    formFieldProxy,
    type SuperForm,
    type FormPath,
    filesProxy,
    arrayProxy,
    type FormPathArrays,
  } from 'sveltekit-superforms';
  import MultiFileInput from '$lib/components/input/multi-file-input.svelte';
  import ErrorMessage from './error-message.svelte';
  import type {
    FileUrls,
    MultiFileInputProps,
  } from '$lib/components/input/types';

  interface Props extends MultiFileInputProps {
    superform: SuperForm<T>;
    field: FormPath<T>;
    urlsField: FormPathArrays<T, FileUrls>;
  }

  let { superform, field, urlsField, ...restProps }: Props =
    $props();

  // svelte-ignore state_referenced_locally
  const { form } = superform;

  // svelte-ignore state_referenced_locally
  const { errors, constraints } = formFieldProxy(
    superform,
    // @ts-expect-error it's working fine
    field,
  );
  // svelte-ignore state_referenced_locally
  // @ts-expect-error it's working fine
  const files = filesProxy(form, field);
  // svelte-ignore state_referenced_locally
  const { values: urls } = arrayProxy(superform, urlsField);
</script>

<MultiFileInput
  {...restProps}
  {field}
  errors={$errors}
  bind:value={$files}
  bind:urls={$urls as FileUrls}
  {...$constraints}
>
  <ErrorMessage errors={$errors} />
</MultiFileInput>
