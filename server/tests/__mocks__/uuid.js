// Mock uuid module - the real uuid uses ESM exports that Jest can't parse
module.exports = {
  v4: () => 'test-uuid-' + Math.random().toString(36).substring(7),
  v1: () => 'test-uuid-v1-' + Math.random().toString(36).substring(7),
};
