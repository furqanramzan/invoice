import { type $ZodType } from 'zod/v4/core';
import { redirect } from 'sveltekit-flash-message/server';
import { zod4 } from 'sveltekit-superforms/adapters';
import {
  message,
  superForm,
  superValidate,
  type Infer,
} from 'sveltekit-superforms';
import { toast } from 'svelte-sonner';
import { fail, type RequestEvent } from '@sveltejs/kit';
import type { Route } from './utils';

type Message = string;
type ZodValidationSchema = $ZodType<Record<string, unknown>>;

export async function initForm<T extends ZodValidationSchema>(
  schema: T,
  initialData?: Partial<Infer<T>>,
) {
  return await superValidate(initialData, zod4(schema));
}

export async function validateAction<T extends ZodValidationSchema>(
  event: RequestEvent,
  schema: T,
) {
  const form = await superValidate(event, zod4(schema));

  if (!form.valid) {
    return {
      valid: false,
      error: fail(400, { form }),
      form,
    } as const;
  }

  return {
    valid: true,
    data: form.data as Infer<T>,
    form,
  } as const;
}

export function getSuperForm<
  V extends ZodValidationSchema,
  T extends Record<string, unknown>,
  M extends Message = Message,
  In extends Record<string, unknown> = T,
>(schema: V, ...params: Parameters<typeof superForm<T, M, In>>) {
  const id = crypto.randomUUID();

  return superForm<T, M, In>(params[0], {
    onSubmit() {
      toast.loading('Processing...', { id });
    },
    onResult(event) {
      if (event.result.type === 'failure' || event.result.type === 'error') {
        console.log(event.result);
      }

      if (event.result.type === 'redirect') {
        toast.dismiss(id);
        return;
      }
      const errorMessage = 'Oops, something broke!';
      if (event.result.type === 'error') {
        toast.error(errorMessage, { id });
        return;
      }
      if (event.result.type === 'success') {
        const message = event.result.data?.form?.message?.text || 'Done!';
        toast.success(message, { id });
        return;
      }
      if (event.result.type === 'failure') {
        const message = event.result.data?.form?.message?.text || errorMessage;
        toast.error(message, { id });
      }
    },
    resetForm: false,
    validators: zod4(schema),
    ...params[1],
  });
}

export function redirectTo(
  route: Route,
  event?: RequestEvent,
  message?: string,
  type: 'success' | 'error' = 'success',
) {
  if (message && event) {
    return redirect(302, route, { type, message }, event.cookies);
  }
  return redirect(302, route);
}

export function sendMessage<T>(
  form: Awaited<ReturnType<typeof validateAction>>,
  text: string,
  type: 'success' | 'error' = 'success',
  data?: T,
) {
  if (type === 'success') {
    return message(form.form, { text, data });
  }
  return message(
    form.form,
    { text, data },
    {
      status: 400,
    },
  );
}
