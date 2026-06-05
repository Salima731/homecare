/**
 * Custom async handler to replace express-async-handler for better debugging
 * and compatibility across Express versions.
 */
const asyncHandler = (fn) => (req, res, next) => {
  console.log(`📡 [AsyncHandler] Processing ${req.method} ${req.path}`);
  if (typeof next !== 'function') {
    console.error('⚠️ Critical: next is not a function in asyncHandler wrap!');
    console.log('Context:', { method: req.method, path: req.path });
  }
  return Promise.resolve(fn(req, res, next)).catch((err) => {
    if (typeof next === 'function') {
      next(err);
    } else {
      console.error('🔥 Async Error (next missing):', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });
};

module.exports = asyncHandler;
