import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middlewire.js";
import { getAllVideos, publishVideo } from "../controllers/video.controller.js";

const router = Router();
router.use(verifyJWT);
// console.log("Video routes hitting");

router.route("/").get(getAllVideos);

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

export default router;
