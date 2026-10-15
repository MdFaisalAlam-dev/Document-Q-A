import crypto from "node:crypto";

import type {
  ProcessingJob,
  ProcessingStage,
} from "../types/processing-job.types.js";

interface CreateJobInput {
  documentId: string;
  fileName: string;
}

const jobs = new Map<
  string,
  ProcessingJob
>();

export function createProcessingJob(
  input: CreateJobInput,
): ProcessingJob {
  const now = new Date().toISOString();

  const job: ProcessingJob = {
    jobId: `job_${crypto.randomUUID()}`,

    documentId: input.documentId,

    fileName: input.fileName,

    status: "processing",

    stage: "received",

    progress: 5,

    message: "Document received.",

    createdAt: now,

    updatedAt: now,
  };

  jobs.set(job.jobId, job);

  return job;
}

export function getProcessingJob(
  jobId: string,
) {
  return jobs.get(jobId);
}

export function updateProcessingJob(
  jobId: string,
  update: {
    stage?: ProcessingStage;
    progress?: number;
    message?: string;
    status?: ProcessingJob["status"];
    error?: string;
    result?: ProcessingJob["result"];
  },
) {
  const job = jobs.get(jobId);

  if (!job) {
    return undefined;
  }

  Object.assign(job, {
    ...update,
    updatedAt:
      new Date().toISOString(),
  });

  return job;
}