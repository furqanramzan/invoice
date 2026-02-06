<script lang="ts">
  import { registerSchema } from '$lib/validations.js';
  import { getSuperForm } from '$lib/superforms.js';
  import Heading from '$lib/components/heading.svelte';
  import { route, title } from './utils.js';
  import Form from '$lib/components/form/form.svelte';
  import HiddenField from '$lib/components/form/hidden-field.svelte';
  import TextField from '$lib/components/form/text-field.svelte';
  import EmailField from '$lib/components/form/email-field.svelte';
  import PasswordField from '$lib/components/form/password-field.svelte';

  let { data } = $props();

  const isEditing = $derived(!!data.currentUser);

  // svelte-ignore state_referenced_locally
  const superform = getSuperForm(registerSchema, data.form);
</script>

<Heading
  title={(isEditing ? 'Edit ' : 'New ') + title.singular}
  link={{ route: route.list, title: `List ${title.plural}` }}
/>

<Form
  {superform}
  buttonText={(isEditing ? 'Update ' : 'Create ') + title.singular}
>
  {#if isEditing}
    <HiddenField {superform} field="id" />
  {/if}

  <TextField {superform} field="name" />
  <EmailField {superform} field="email" />
  <PasswordField {superform} field="password" password="new" />
</Form>
