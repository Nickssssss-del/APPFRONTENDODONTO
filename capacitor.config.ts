import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.odontosystem.app',
  appName: 'OdontoSystem',
  webDir: 'dist',
  plugins: {
    // Las peticiones fetch/XHR salen por la capa nativa de Android y no por el WebView:
    // el WebView (origen https://localhost) quedaba bloqueado por CORS al llamar al backend en Railway.
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;