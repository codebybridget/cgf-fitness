import axios from "axios"

import User from "../models/User.js"
import MembershipPlan from "../models/MembershipPlan.js"
import Payment from "../models/Payment.js"


/*
|--------------------------------------------------------------------------
| Initialize Paystack Payment
|--------------------------------------------------------------------------
*/

export const initializePayment = async (
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


    const user =
      await User.findById(
        userId,
      )

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User account not found.",
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Membership Plan
    |--------------------------------------------------------------------------
    */

    const {
      planId,
    } = req.body


    if (!planId) {
      return res.status(400).json({
        success: false,
        message:
          "Membership plan is required.",
      })
    }


    const plan =
      await MembershipPlan.findById(
        planId,
      )


    if (!plan) {
      return res.status(404).json({
        success: false,
        message:
          "Membership plan not found.",
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Active Plan Check
    |--------------------------------------------------------------------------
    */

    if (!plan.isActive) {
      return res.status(400).json({
        success: false,
        message:
          "This membership plan is no longer available.",
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Validate Price
    |--------------------------------------------------------------------------
    */

    const price =
      Number(
        plan.price,
      )

    if (
      !Number.isFinite(
        price,
      ) ||
      price <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid membership plan price.",
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Paystack Amount
    |--------------------------------------------------------------------------
    |
    | Paystack expects NGN amounts in kobo.
    |
    | ₦25,000 = 2,500,000 kobo
    |
    */

    const amount =
      Math.round(
        price * 100,
      )


    /*
    |--------------------------------------------------------------------------
    | Customer Email
    |--------------------------------------------------------------------------
    */

    const email =
      String(
        user.email || "",
      )
        .trim()
        .toLowerCase()


    if (!email) {
      return res.status(400).json({
        success: false,
        message:
          "Your account does not have a valid email address.",
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Callback URL
    |--------------------------------------------------------------------------
    */

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:5173"

    const callbackUrl =
      `${frontendUrl}/payment/callback`


    /*
    |--------------------------------------------------------------------------
    | Initialize Paystack Transaction
    |--------------------------------------------------------------------------
    */

    const response =
      await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email,

          amount:
            String(
              amount,
            ),

          currency:
            plan.currency ||
            "NGN",

          callback_url:
            callbackUrl,

          metadata:
            {
              userId:
                String(
                  user._id,
                ),

              planId:
                String(
                  plan._id,
                ),

              planName:
                plan.name,

              durationDays:
                plan.durationDays,
            },
        },
        {
          headers: {
            Authorization:
              `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,

            "Content-Type":
              "application/json",
          },
        },
      )


    /*
    |--------------------------------------------------------------------------
    | Paystack Response
    |--------------------------------------------------------------------------
    */

    if (
      !response.data?.status ||
      !response.data?.data
    ) {
      return res.status(502).json({
        success: false,
        message:
          "Paystack could not initialize the payment.",
      })
    }


    const paymentData =
      response.data.data


    /*
    |--------------------------------------------------------------------------
    | Create Pending Payment
    |--------------------------------------------------------------------------
    |
    | The payment is NOT successful yet.
    |
    | Paystack has only initialized the transaction.
    | We will verify the transaction in the next step.
    |
    */

    const existingPayment =
      await Payment.findOne({
        reference:
          paymentData.reference,
      })


    if (!existingPayment) {
      await Payment.create({
        user:
          user._id,

        membershipPlan:
          plan._id,

        amount:
          price,

        currency:
          plan.currency ||
          "NGN",

        reference:
          paymentData.reference,

        status:
          "pending",

        customerEmail:
          email,

        customerName:
          `${user.firstName || ""} ${user.lastName || ""}`.trim(),

        metadata:
          {
            userId:
              String(
                user._id,
              ),

            planId:
              String(
                plan._id,
              ),

            planName:
              plan.name,

            durationDays:
              plan.durationDays,

            paystackAccessCode:
              paymentData.access_code,
          },
      })
    }


    /*
    |--------------------------------------------------------------------------
    | Return Payment Information
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      message:
        "Payment initialized successfully.",

      authorizationUrl:
        paymentData.authorization_url,

      accessCode:
        paymentData.access_code,

      reference:
        paymentData.reference,

      plan: {
        id:
          plan._id,

        name:
          plan.name,

        price:
          plan.price,

        currency:
          plan.currency,

        durationDays:
          plan.durationDays,
      },
    })
  } catch (error) {

    console.error(
      "Initialize Paystack payment error:",
      error.response?.data ||
        error.message ||
        error,
    )


    const paystackMessage =
      error.response?.data?.message


    return res.status(
      error.response?.status ||
        500,
    ).json({
      success: false,

      message:
        paystackMessage ||
        "Unable to initialize payment.",
    })
  }
}