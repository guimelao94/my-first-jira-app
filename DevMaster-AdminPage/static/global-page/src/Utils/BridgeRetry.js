export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const createTransientError = (message, extra = {}) => {
  const error = new Error(message);
  error.isTransient = true;
  Object.assign(error, extra);
  return error;
};

export const isTransientBridgeError = (error) => {
  if (error?.isTransient) {
    return true;
  }

  const message = (error?.message || '').toLowerCase();
  return (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('rate limit') ||
    message.includes('timeout') ||
    message.includes('temporarily unavailable')
  );
};

export const retryBridgeOperation = async (
  fn,
  {
    retries = 4,
    baseDelay = 400,
    description = 'bridge operation',
  } = {}
) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      if (!isTransientBridgeError(error) || attempt === retries) {
        throw error;
      }

      const retryDelay = baseDelay * Math.pow(2, attempt);
      console.warn(
        `${description} failed (${error.message || 'unknown error'}), retrying in ${retryDelay}ms`
      );
      await delay(retryDelay);
    }
  }
};
