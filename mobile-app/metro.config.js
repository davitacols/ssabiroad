const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.platforms = ['native', 'android', 'ios', 'web'];

module.exports = config;