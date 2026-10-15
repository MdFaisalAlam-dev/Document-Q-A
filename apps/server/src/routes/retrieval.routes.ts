import { Router } from "express";

import {
  retrieveChunksController,
} from "../controllers/retrieval.controller.js";

const router = Router();

router.post(
  "/search",
  retrieveChunksController,
);

export default router;