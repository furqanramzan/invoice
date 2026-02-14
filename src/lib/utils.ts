import type { resolve } from '$app/paths';
import type { RequestEvent } from '@sveltejs/kit';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any }
  ? Omit<T, 'children'>
  : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
  ref?: U | null;
};

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function toISODateString(date: Date) {
  return new Date(date).toISOString().split('T')[0];
}

export type Route = ReturnType<typeof resolve>;

export function getPaginationData(event: RequestEvent) {
  const page = Number(event.url.searchParams.get('page')) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function formatCents(amount: number) {
  return (amount / 100).toLocaleString('en-US', {
    // style: 'currency',
    // currency: 'PKR',
  });
}

export function formatAmount(amount: number) {
  return amount.toLocaleString('en-US', {
    // style: 'currency',
    // currency: 'PKR',
  });
}

export function convertCents(amount: number) {
  return amount / 100;
}

export function convertToCents(amount: number) {
  return Math.round(amount * 100);
}

export function splitAfterChars(str: string, limit = 60) {
  const result = [];
  let current = '';

  str.split(' ').forEach((word) => {
    if ((current + ' ' + word).trim().length > limit) {
      result.push(current.trim());
      current = word;
    } else {
      current += ' ' + word;
    }
  });

  if (current) result.push(current.trim());
  return result;
}

export interface Option {
  label?: string;
  value: string | number;
}
export type Options = Array<Option>;

export function randomInt(min = 1, max = 10000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
