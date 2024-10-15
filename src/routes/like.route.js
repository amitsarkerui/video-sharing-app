import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getCommentLikeCount,
  getVideoLikes,
  toggleCommentLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";

const router = Router();

router
  .route("/:videoId")
  .patch(verifyJWT, toggleVideoLike)
  .get(getVideoLikes)
  .post(verifyJWT, toggleCommentLike);
router.route("/comment/:commentId").get(getCommentLikeCount);
export default router;
