import 'expo-router/entry';

// Global error handlers to prevent crashes
if (typeof ErrorUtils !== 'undefined') {
  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('Global error:', error);
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

// Handle unhandled promise rejections
const rejectionTracking = require('promise/setimmediate/rejection-tracking');
rejectionTracking.enable({
  allRejections: true,
  onUnhandled: (id, error) => {
    console.error('Unhandled promise rejection:', error);
  },
  onHandled: () => {},
});
