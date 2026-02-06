// babel-metadata-plugin.js - Simplified version without recursion issues
module.exports = function() {
  return {
    visitor: {
      // Minimal plugin that doesn't process anything to avoid stack overflow
      // This effectively disables the visual edits feature
      Program() {
        // No-op
      }
    }
  };
};
