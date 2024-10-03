import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getVideoLikes,
  toggleVideoLike,
} from "../controllers/like.controller.js";

const router = Router();

router.route("/:videoId").patch(verifyJWT, toggleVideoLike).get(getVideoLikes);

export default router;
