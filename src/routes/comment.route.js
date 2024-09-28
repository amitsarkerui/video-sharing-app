import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createComment,
  deleteComment,
  getAllVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/:videoId").post(createComment).get(getAllVideoComments);
router.route("/:commentId").patch(updateComment).delete(deleteComment);

export default router;
