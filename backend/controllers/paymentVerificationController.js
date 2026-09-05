import axios from "axios"

import Payment from "../models/Payment.js"
import Subscription from "../models/Subscription.js"
import MembershipPlan from "../models/MembershipPlan.js"


/*
|--------------------------------------------------------------------------
| Verify Paystack Payment
|--------------------------------------------------------------------------
*/

export const verifyPayment = async (
  req,
  res,
) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | Paystack Secret Key
    |--------------------------------------------------------------------------
    */

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message:
          "Paystack is not configured on the server.",
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Current User
    |--------------------------------------------------------------------------
    */

    const userId =
      req.user?._id

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Payment Reference
    |--------------------------------------------------------------------------
    */

    const {
      reference,
    } = req.body


    if (!reference) {
      return res.status(400).json({
        success: false,
        message:
          "Payment reference is required.",
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Find Pending Payment
    |--------------------------------------------------------------------------
    */

    const payment =
      await Payment.findOne({
        reference:
          String(reference),
        user:
          userId,
      })


    if (!payment) {
      return res.status(404).json({
        success: false,
        message:
          "Payment record not found.",
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Prevent Duplicate Processing
    |--------------------------------------------------------------------------
    */

    if (
      payment.status === "success"
    ) {
      const subscription =
        payment.subscription
          ? await Subscription.findById(
              payment.subscription,
            )
          : null

      return res.status(200).json({
        success: true,
        message:
          "Payment has already been verified.",
        payment,
        subscription,
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Verify Transaction With Paystack
    |--------------------------------------------------------------------------
    */

    const response =
      await axios.get(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(
          reference,
        )}`,
        {
          headers: {
            Authorization:
              `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,

            "Content-Type":
              "application/json",
          },
        },
      )


    const paystackResponse =
      response.data


    /*
    |--------------------------------------------------------------------------
    | Verify Paystack Response
    |--------------------------------------------------------------------------
    */

    if (
      !paystackResponse?.status ||
      !paystackResponse?.data
    ) {
      payment.status =
        "failed"

      payment.failureReason =
        paystackResponse?.message ||
        "Paystack verification failed."

      payment.gatewayResponse =
        paystackResponse

      await payment.save()

      return res.status(400).json({
        success: false,
        message:
          payment.failureReason,
      })
    }


    const transaction =
      paystackResponse.data


    /*
    |--------------------------------------------------------------------------
    | Verify Transaction Status
    |--------------------------------------------------------------------------
    */

    if (
      transaction.status !==
      "success"
    ) {
      payment.status =
        transaction.status ===
        "abandoned"
          ? "abandoned"
          : "failed"

      payment.failureReason =
        transaction.gateway_response ||
        `Payment status: ${transaction.status}`

      payment.gatewayResponse =
        transaction

      payment.channel =
        transaction.channel ||
        undefined

      payment.transactionId =
        transaction.id
          ? String(transaction.id)
          : undefined

      await payment.save()

      return res.status(400).json({
        success: false,
        message:
          payment.failureReason,
        status:
          payment.status,
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Verify Amount
    |--------------------------------------------------------------------------
    |
    | Never trust the frontend or callback alone.
    | Compare Paystack's actual amount with our database amount.
    |
    */

    const expectedAmount =
      Math.round(
        Number(payment.amount) * 100,
      )

    const paidAmount =
      Number(
        transaction.amount,
      )


    if (
      paidAmount !==
      expectedAmount
    ) {
      payment.status =
        "failed"

      payment.failureReason =
        "Payment amount does not match the membership plan."

      payment.gatewayResponse =
        transaction

      await payment.save()

      return res.status(400).json({
        success: false,
        message:
          payment.failureReason,
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Verify Currency
    |--------------------------------------------------------------------------
    */

    const expectedCurrency =
      String(
        payment.currency ||
          "NGN",
      ).toUpperCase()

    const paidCurrency =
      String(
        transaction.currency ||
          "",
      ).toUpperCase()


    if (
      paidCurrency &&
      paidCurrency !==
        expectedCurrency
    ) {
      payment.status =
        "failed"

      payment.failureReason =
        "Payment currency does not match the membership plan."

      payment.gatewayResponse =
        transaction

      await payment.save()

      return res.status(400).json({
        success: false,
        message:
          payment.failureReason,
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Find Membership Plan
    |--------------------------------------------------------------------------
    */

    const plan =
      await MembershipPlan.findById(
        payment.membershipPlan,
      )


    if (!plan) {
      return res.status(404).json({
        success: false,
        message:
          "Membership plan associated with this payment was not found.",
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Calculate Subscription Dates
    |--------------------------------------------------------------------------
    */

    const startDate =
      new Date()


    const durationDays =
      Number(
        plan.durationDays,
      )


    if (
      !Number.isFinite(
        durationDays,
      ) ||
      durationDays <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid membership plan duration.",
      })
    }


    const endDate =
      new Date(
        startDate,
      )

    endDate.setDate(
      endDate.getDate() +
        durationDays,
    )


    /*
    |--------------------------------------------------------------------------
    | Create Or Reuse Subscription
    |--------------------------------------------------------------------------
    */

    let subscription =
      await Subscription.findOne({
        paymentReference:
          payment.reference,
      })


    if (!subscription) {
      subscription =
        await Subscription.create({
          user:
            userId,

          membershipPlan:
            plan._id,

          planName:
            plan.name,

          amount:
            payment.amount,

          currency:
            payment.currency ||
            "NGN",

          startDate,

          endDate,

          status:
            "active",

          paymentStatus:
            "paid",

          paymentReference:
            payment.reference,

          autoRenew:
            false,

          notes:
            "Membership activated after successful Paystack payment.",
        })
    } else {
      subscription.status =
        "active"

      subscription.paymentStatus =
        "paid"

      subscription.startDate =
        subscription.startDate ||
        startDate

      subscription.endDate =
        subscription.endDate ||
        endDate

      await subscription.save()
    }


    /*
    |--------------------------------------------------------------------------
    | Update Payment
    |--------------------------------------------------------------------------
    */

    payment.status =
      "success"

    payment.transactionId =
      transaction.id
        ? String(transaction.id)
        : undefined

    payment.channel =
      transaction.channel ||
      undefined

    payment.gatewayResponse =
      transaction

    payment.paidAt =
      transaction.paid_at
        ? new Date(
            transaction.paid_at,
          )
        : new Date()

    payment.subscription =
      subscription._id

    payment.failureReason =
      undefined

    await payment.save()


    /*
    |--------------------------------------------------------------------------
    | Return Success
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      message:
        "Payment verified successfully. Membership activated.",

      payment,

      subscription,
    })
  } catch (error) {

    console.error(
      "Verify Paystack payment error:",
      error.response?.data ||
        error.message ||
        error,
    )


    const message =
      error.response?.data?.message ||
      "Unable to verify payment."


    return res.status(
      error.response?.status ||
        500,
    ).json({
      success: false,
      message,
    })
  }
}