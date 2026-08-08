export class ExchangeRateProviderError extends Error {
  constructor(message: string, public readonly providerName: string, public readonly originalError?: unknown) {
    super(`[${providerName}] ${message}`);
    this.name = 'ExchangeRateProviderError';
  }
}

export class ExchangeRateNetworkError extends ExchangeRateProviderError {
  constructor(providerName: string, originalError?: unknown) {
    super('Error de red o timeout al consultar el proveedor de cotizaciones', providerName, originalError);
    this.name = 'ExchangeRateNetworkError';
  }
}

export class ExchangeRateInvalidResponseError extends ExchangeRateProviderError {
  constructor(providerName: string, details: string) {
    super(`Respuesta inválida del proveedor: ${details}`, providerName);
    this.name = 'ExchangeRateInvalidResponseError';
  }
}
