import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getChannelSubscriberList,
  getSubscribedChannelList,
  toggleSubscription,
} from "../controllers/subscription.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/c/:channelId").post(toggleSubscription);
router.route("/c/:subscriberId").get(getSubscribedChannelList);
router.route("/u/:channelId").get(getChannelSubscriberList);

export default router;
