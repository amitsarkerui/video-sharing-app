import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addVideoToPlayList,
  createPlaylist,
  deletePlaylistById,
  getPlaylistById,
  getUserPlayList,
} from "../controllers/playlist.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/").post(createPlaylist);
router.route("/add/:videoId/:playlistId").patch(addVideoToPlayList);
router.route("/user/:userId").get(getUserPlayList);
router.route("/:playlistId").get(getPlaylistById).delete(deletePlaylistById);

export default router;
