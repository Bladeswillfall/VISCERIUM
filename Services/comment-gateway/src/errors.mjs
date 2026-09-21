export class GatewayError extends Error {
  constructor(status, code, publicMessage, options = {}) {
    super(publicMessage, options);
    this.name = 'GatewayError';
    this.status = status;
    this.code = code;
    this.publicMessage = publicMessage;
  }
}

export function badRequest(code, message) {
  return new GatewayError(400, code, message);
}

export function unprocessable(code, message) {
  return new GatewayError(422, code, message);
}
