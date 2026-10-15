import { Router } from "express";
import { streamChatController } from "../controllers/stream-chat.controller.js";
import {
  queryDocumentsController,
} from "../controllers/chat.controller.js";

const router = Router();

router.post(
  "/query",
  queryDocumentsController,
);
router.post("/stream", streamChatController);

export default router;