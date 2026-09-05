import express from "express"

import { verifyPayment } from "../controllers/paymentVerificationController.js"
import { protect } from "../middleware/authMiddleware.js"

const router = express.Router()


/*
|--------------------------------------------------------------------------
| Verify Paystack Payment
|--------------------------------------------------------------------------
*/

router.post(
  "/verify",
  protect,
  verifyPayment,
)


export default router