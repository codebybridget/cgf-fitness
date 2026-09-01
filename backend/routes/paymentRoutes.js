import express from "express"

import {
  initializePayment,
} from "../controllers/paymentController.js"

import {
  protect,
} from "../middleware/authMiddleware.js"


const router =
  express.Router()


/*
|--------------------------------------------------------------------------
| Initialize Payment
|--------------------------------------------------------------------------
|
| POST /api/payments/initialize
|
| Only authenticated members can initialize
| a membership payment.
|
|--------------------------------------------------------------------------
*/

router.post(
  "/initialize",
  protect,
  initializePayment,
)


export default router