export interface AppState {
  theme: string;
  colorWeak: boolean;
  device: string;
  loading: boolean;

  [key: string]: unknown;
}
