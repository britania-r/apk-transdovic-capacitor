import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.transdovic.app',
  appName: 'Transdovic',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      overlaysWebView: false,   // NO superponer la barra de estado sobre el contenido
      style: 'DEFAULT',         // 'DEFAULT' | 'LIGHT' | 'DARK
    },
    EdgeToEdge: {
      enabled: false,           // desactiva edge-to-edge para respetar safe areas
    },
  },
};

export default config;