<script lang="ts">
  import { clientSchema, route, title } from './utils';
  import TextField from '$lib/components/form/text-field.svelte';
  import HiddenField from '$lib/components/form/hidden-field.svelte';
  import Form from '$lib/components/form/form.svelte';
  import Heading from '$lib/components/heading.svelte';
  import { getSuperForm } from '$lib/superforms.js';
  import Label from '$lib/components/ui/label/label.svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import { Plus, Trash } from '@lucide/svelte';

  let { data } = $props();

  let isEditing = $derived(!!data.currentClient);

  // svelte-ignore state_referenced_locally
  const superform = getSuperForm(clientSchema, data.form, {
    dataType: 'json',
  });
  const { form } = superform;
</script>

<Heading
  title={(isEditing ? 'Edit ' : 'New ') + title.singular}
  link={{
    route: route.list,
    title: `List ${title.plural}`,
  }}
/>

<Form
  {superform}
  buttonText={(isEditing ? 'Update ' : 'Create ') +
    title.singular}
>
  {#if isEditing}
    <HiddenField {superform} field="id" />
  {/if}

  <TextField {superform} field="name" />
  <TextField {superform} field="email" />
  <TextField {superform} field="phone" />
  <TextField {superform} field="attention" />
  <TextField {superform} field="invoiceNumberInitial" />

  <div class="space-y-2">
    <div class="flex gap-2">
      <Label for="locations">Locations</Label>
      <Button
        size="icon-sm"
        type="button"
        disabled={$form.locations.length < 1}
        onclick={() =>
          ($form.locations = [
            ...$form.locations,
            { address: '' },
          ])}><Plus /></Button
      >
    </div>
    <div class="space-y-2" id="locations">
      {#each $form.locations as location, index (index)}
        {#if !location.deleted}
          <div class="flex gap-2">
            <TextField
              hideLabel
              {superform}
              field="locations[{index}].address"
            />
            <Button
              size="icon-sm"
              type="button"
              disabled={$form.locations.filter((x) => !x.deleted)
                .length < 2}
              onclick={() => {
                $form.locations[index].deleted = true;
                $form.locations = $form.locations;
              }}><Trash /></Button
            >
          </div>
        {/if}
      {/each}
    </div>
  </div>
</Form>
