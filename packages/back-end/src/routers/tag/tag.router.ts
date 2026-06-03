import express from "express";
import { z } from "zod";
import { wrapController } from "back-end/src/routers/wrapController";
import { validateRequestMiddleware } from "back-end/src/routers/utils/validateRequestMiddleware";
import * as rawTagController from "./tag.controller";

const router = express.Router();

const tagController = wrapController(rawTagController);

router.post(
  "/",
  validateRequestMiddleware({
    body: z
      .object({
        id: z.string(),
        color: z.string(),
        description: z.string(),
      })
      .strict(),
  }),
  tagController.postTag,
);

router.delete(
  "/",
  validateRequestMiddleware({
    body: z
      .object({
        id: z.string(),
      })
      .strict(),
  }),
  tagController.deleteTag,
);

router.put(
  "/color",
  validateRequestMiddleware({
    body: z
      .object({
        tags: z.array(z.string()),
        color: z.string(),
      })
      .strict(),
  }),
  tagController.putTagColors,
);

export { router as tagRouter };
