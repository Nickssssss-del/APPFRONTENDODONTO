import { createContext } from 'react';
import type { AppState } from './store';

export const AppContext = createContext<AppState | null>(null);