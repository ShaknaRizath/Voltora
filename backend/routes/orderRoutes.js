import express from "express";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";
import { validateObjectId } from "../middleware/validate.js";
import { listOrders, getOrderById, confirmCheckout, markDelivered } from "../controllers/orderController.js";

const router = express.Router();

router.param("id", validateObjectId);

router.get("/", verifyToken, listOrders);
router.get("/confirm", verifyToken, confirmCheckout); // must stay above "/:id"
router.get("/:id", verifyToken, getOrderById);
router.patch("/:id/deliver", verifyToken, isAdmin, markDelivered);

export default router;
