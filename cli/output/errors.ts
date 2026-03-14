export const normalizeOpenDriverError = (error: unknown): string => {
  const message = String((error as { message?: string })?.message ?? error).toLowerCase();

  if (message.includes('claim') || message.includes('libusb_error_access') || message.includes('permission')) {
    return 'Permission denied';
  }

  return String((error as { message?: string })?.message ?? 'Failed to open device');
};

export const normalizeCommandError = (error: unknown): { message: string; isTimeout: boolean } => {
  const name = (error as { name?: string })?.name;
  if (name === 'TimeoutError') {
    return { message: 'Timeout waiting for device response', isTimeout: true };
  }

  return {
    message: String((error as { message?: string })?.message ?? 'Command execution failed'),
    isTimeout: false,
  };
};
