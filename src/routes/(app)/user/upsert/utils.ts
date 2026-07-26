import { resolve } from '$app/paths';

export const title = { singular: 'User', plural: 'Users' };

export const route = {
  list: resolve('/user'),
  upsert: resolve('/user/upsert'),
};
