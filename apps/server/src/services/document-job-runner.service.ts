import {
  deleteUploadedFile,
} from "./document.service.js";

import {
  processDocument,
} from "./document-processing.service.js";

import {
  updateProcessingJob,
} from "./processing-job.service.js";

import type { UploadedDocument } from "../types/document.types.js";

export async function runDocumentProcessingJob(
  jobId: string,
  document: UploadedDocument,
) {
  try {
    const result =
      await processDocument(
        document,
        async (update) => {
          updateProcessingJob(
            jobId,
            update,
          );
        },
      );

    await deleteUploadedFile(
      document.storedPath,
    );

    updateProcessingJob(jobId, {
      status: "ready",

      stage: "ready",

      progress: 100,

      message:
        "Document indexed successfully.",

      result,
    });
  } catch (error) {
    await deleteUploadedFile(
      document.storedPath,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Document processing failed.";

    updateProcessingJob(jobId, {
      status: "failed",

      stage: "failed",

      progress: 100,

      message: "Document processing failed.",

      error: message,
    });

    console.error(
      `Document job ${jobId} failed:`,
      error,
    );
  }
}