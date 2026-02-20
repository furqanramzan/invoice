// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import 'jspdf';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

declare global {
  namespace App {
    interface Locals {
      user: import('$lib/server/auth').SessionValidationResult['user'];
      session: import('$lib/server/auth').SessionValidationResult['session'];
    }

    // interface Error {}
    // interface Locals {}
    interface PageData {
      flash?: {
        type: 'success' | 'error';
        message: string;
      };
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
