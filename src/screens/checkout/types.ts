export type PayState = 'idle' | 'processing' | 'verified' | 'rejected';
export type Provider = 'culqi' | 'niubiz';
export type PayMethod = 'yape' | 'plin' | 'card';

export interface CardFields {
  /** Formatted number displayed to user (e.g. "4111 1111 1111 1111").
   *  NEVER persisted to localStorage, logs, or any external state. */
  number: string;
  expiry: string;
  /** NEVER persisted to localStorage, logs, or any external state. */
  cvv: string;
  holder: string;
}

export interface CardErrors {
  number?: string;
  expiry?: string;
  cvv?: string;
  holder?: string;
}

