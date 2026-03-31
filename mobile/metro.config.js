const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");
 
/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclure react-native-maps sur web
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    if (platform === 'web' && moduleName === 'react-native-maps') {
      // Retourner un module vide pour web
      return {
        type: 'empty',
      };
    }
    // Utiliser la résolution par défaut pour les autres cas
    return context.resolveRequest(context, moduleName, platform);
  },
};
 
module.exports = withNativewind(config);