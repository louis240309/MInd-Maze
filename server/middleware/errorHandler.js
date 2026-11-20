export const errorHandler = (err, req, res, next) => {
  console.error("Unhandled request error:", {
    status: err.statusCode || 500,
    message: err.message || "Unknown error",
    causeStatus: err.cause?.status || err.cause?.statusCode || null,
    causeCode: err.cause?.code || null,
  });

  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode || 500);
  const safeMessage = statusCode >= 500 && !err.statusCode
    ? "The request could not be completed. Please try again."
    : err.message || "An unexpected server error occurred.";

  res.status(statusCode).json({
    success: false,
    message: safeMessage,
    retryable: Boolean(err.retryable),
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

