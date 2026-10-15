import type {
  Request,
  Response,
} from "express";

import {
  createUploadedDocument,
  deleteUploadedFile,
} from "../services/document.service.js";
import {
  deleteIndexedDocument,
  listIndexedDocuments,
} from "../services/document-registry.service.js";

import {
  createProcessingJob,
  getProcessingJob,
} from "../services/processing-job.service.js";

import {
  runDocumentProcessingJob,
} from "../services/document-job-runner.service.js";

export async function uploadDocumentController(
  req: Request,
  res: Response,
) {
  if (!req.file) {
    return res.status(400).json({
      success: false,

      error: {
        code: "FILE_REQUIRED",

        message:
          "Please provide a document file.",
      },
    });
  }

  try {
    const document =
      await createUploadedDocument(
        req.file,
      );

    return res.status(201).json({
      success: true,

      message:
        "Document uploaded successfully.",

      document,
    });
  } catch (error) {
    await deleteUploadedFile(
      req.file.path,
    );

    throw error;
  }
}

export async function processDocumentController(
  req: Request,
  res: Response,
) {
  if (!req.file) {
    return res.status(400).json({
      success: false,

      error: {
        code: "FILE_REQUIRED",

        message:
          "Please provide a document file.",
      },
    });
  }

  try {
    const document =
      await createUploadedDocument(
        req.file,
      );

    const job =
      createProcessingJob({
        documentId:
          document.documentId,

        fileName:
          document.originalName,
      });

    /*
     * Intentionally not awaited.
     *
     * The HTTP request returns immediately while
     * the processing job continues in the server.
     */
    void runDocumentProcessingJob(
      job.jobId,
      document,
    );

    return res.status(202).json({
      success: true,

      message:
        "Document processing started.",

      job,
    });
  } catch (error) {
    await deleteUploadedFile(
      req.file.path,
    );

    throw error;
  }
}

export async function getProcessingJobController(
  req: Request,
  res: Response,
) {
  const jobId = req.params.jobId;

  if (!jobId || typeof jobId !== "string") {
    return res.status(400).json({
      success: false,

      error: {
        code: "JOB_ID_REQUIRED",

        message:
          "Processing job ID is required.",
      },
    });
  }

  const job =
    getProcessingJob(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,

      error: {
        code: "JOB_NOT_FOUND",

        message:
          "Processing job was not found.",
      },
    });
  }

  return res.status(200).json({
    success: true,

    job,
  });
}

export async function listDocumentsController(
  _req: Request,
  res: Response,
) {
  const documents = await listIndexedDocuments();

  return res.status(200).json({
    success: true,
    documents,
  });
}

export async function deleteDocumentController(
  req: Request,
  res: Response,
) {
  const documentId = req.params.documentId;

  if (!documentId || typeof documentId !== "string") {
    return res.status(400).json({
      success: false,
      error: {
        code: "DOCUMENT_ID_REQUIRED",
        message: "Document ID is required.",
      },
    });
  }

  await deleteIndexedDocument(documentId);

  return res.status(200).json({
    success: true,
    message: "Document deleted successfully.",
  });
}