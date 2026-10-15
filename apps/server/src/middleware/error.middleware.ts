import type {
  NextFunction,
  Request,
  Response,
} from "express";

type MulterErrorLike = Error & {
  code: string;
  field?: string;
  file?: {
    originalname: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

function isMulterError(error: unknown): error is MulterErrorLike {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string" &&
    (error as { name?: unknown }).name === "MulterError"
  );
}

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(error);

  if (isMulterError(error)) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: {
          code: "FILE_TOO_LARGE",
          message: "Maximum file size is 20 MB.",
        },
      });
    }

    return res.status(400).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  if (error instanceof Error) {
    const isClientError =
      error.message.includes("Unsupported file type");

    if (isClientError) {
      return res.status(400).json({
        success: false,
        error: {
          code: "UNSUPPORTED_FILE_TYPE",
          message: error.message,
        },
      });
    }
  }

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected server error occurred.",
    },
  });
}