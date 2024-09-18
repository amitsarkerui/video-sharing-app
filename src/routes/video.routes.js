import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middlewire.js";
import {
  getAllVideos,
  getVideoById,
  publishVideo,
  updateVideo,
} from "../controllers/video.controller.js";

const router = Router();
router.use(verifyJWT);
// console.log("Video routes hitting");

router.route("/").get(getAllVideos);
router.route("/:videoId").get(getVideoById);

router.route("/upload-video").post(
  upload.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishVideo
);

router
  .route("/update-details/:videoId")
  .patch(upload.single("thumbnail"), updateVideo);

export default router;
