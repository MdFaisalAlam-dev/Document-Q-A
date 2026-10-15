import { Router } from "express";

import {
  deleteDocumentController,
  getProcessingJobController,
  listDocumentsController,
  uploadDocumentController,
  processDocumentController,
} from "../controllers/document.controller.js";

import { uploadDocument } from "../middleware/upload.middleware.js";



const router = Router();

router.get(
  "/",
  listDocumentsController,
);

router.delete(
  "/:documentId",
  deleteDocumentController,
);

router.post(
  "/upload",
  uploadDocument.single("file"),
  uploadDocumentController,
);

router.post(
  "/process",
  uploadDocument.single("file"),
  processDocumentController,
);

router.get(
  "/jobs/:jobId",
  getProcessingJobController,
);

export default router;