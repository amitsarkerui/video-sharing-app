import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createComment } from "../controllers/comment.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/:videoId").post(createComment);

export default router;
