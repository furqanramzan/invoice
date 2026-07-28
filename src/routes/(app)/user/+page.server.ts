import { getUserCount } from '$lib/server/auth.js';
import { db } from '$lib/server/db';
import { getPaginationData } from '$lib/utils';

export async function load(event) {
  const { page, offset, limit } = getPaginationData(event);
  const [users, total] = await Promise.all([
    db.query.Users.findMany({
      limit,
      offset,
      columns: {
        id: true,
        email: true,
        name: true,
      },
    }),
    getUserCount(),
  ]);

  return {
    users: users,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
  };
}

// export const actions = {
//   async delete(event) {
//     const form = await superValidate(event.request, zod4(itemSchema));
//
//     if (!form.valid) {
//       return fail(400, { form });
//     }
//
//     // Prevent deletion of own user if authenticated
//     // This part requires authentication context which is not directly available here
//     // For now, I'll allow deletion, but in a real app, you'd check `event.locals.user.id`
//
//     await db.delete(table.user).where(eq(table.user.id, form.data.id!));
//     return message(form, 'User deleted successfully');
//   },
// };
