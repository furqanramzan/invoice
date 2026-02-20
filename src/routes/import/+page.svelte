<script lang="ts">
  import { importSchema, route, title } from './utils';
  import Form from '$lib/components/form/form.svelte';
  import Heading from '$lib/components/heading.svelte';
  import { getSuperForm } from '$lib/superforms.js';
  import FileField from '$lib/components/form/file-field.svelte';

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const superform = getSuperForm(importSchema, data.form, {
    onUpdate() {
      $form.logo = undefined;
    },
  });
  const { form } = superform;
</script>

<Heading
  title={title.singular}
  link={{
    route: route.list,
    title: `List ${title.plural}`,
  }}
/>

<Form
  {superform}
  buttonText={title.singular}
  enctype="multipart/form-data"
>
  <FileField
    {superform}
    field="logo"
    urlField="name"
    label="Logo"
  />
</Form>
