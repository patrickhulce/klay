function KlayModelError(message) {
  Error.captureStackTrace(this);
  this.name = 'KlayModelError';
  this.message = message;
}

KlayModelError.prototype = Object.create(Error.prototype, {constructor: KlayModelError});

module.exports = KlayModelError;
