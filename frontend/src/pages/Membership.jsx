import {
  useEffect,
  useState,
} from "react"

import {
  Check,
  LoaderCircle,
  CreditCard,
} from "lucide-react"

import {
  getMembershipPlans,
} from "../api/api.js"


function formatPrice(
  price,
  currency = "NGN",
) {
  return new Intl.NumberFormat(
    "en-NG",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    },
  ).format(price)
}


function Membership() {
  const [
    plans,
    setPlans,
  ] = useState([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState("")


  /*
  |--------------------------------------------------------------------------
  | Load Membership Plans
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadPlans =
      async () => {
        try {
          setLoading(true)
          setError("")

          const response =
            await getMembershipPlans()

          setPlans(
            response?.plans ||
            [],
          )
        } catch (requestError) {
          console.error(
            "Unable to load membership plans:",
            requestError,
          )

          setError(
            requestError?.message ||
            "Unable to load membership plans.",
          )
        } finally {
          setLoading(false)
        }
      }

    loadPlans()
  }, [])


  /*
  |--------------------------------------------------------------------------
  | Loading State
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-screen bg-black px-4 py-12 text-white">
        <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center">

          <div className="text-center">

            <LoaderCircle
              size={32}
              className="mx-auto animate-spin text-lime-400"
            />

            <p className="mt-4 text-sm text-gray-500">
              Loading membership plans...
            </p>

          </div>

        </div>
      </div>
    )
  }


  /*
  |--------------------------------------------------------------------------
  | Error State
  |--------------------------------------------------------------------------
  */

  if (error) {
    return (
      <div className="min-h-screen bg-black px-4 py-12 text-white">
        <div className="mx-auto max-w-3xl">

          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">

            <p className="text-lg font-black text-red-300">
              Unable to load membership plans
            </p>

            <p className="mt-2 text-sm text-red-200/70">
              {error}
            </p>

          </div>

        </div>
      </div>
    )
  }


  /*
  |--------------------------------------------------------------------------
  | Empty State
  |--------------------------------------------------------------------------
  */

  if (!plans.length) {
    return (
      <div className="min-h-screen bg-black px-4 py-12 text-white">
        <div className="mx-auto max-w-3xl">

          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">

            <CreditCard
              size={36}
              className="mx-auto text-lime-400"
            />

            <h1 className="mt-5 text-2xl font-black">
              Membership Plans
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              No membership plans are currently available.
            </p>

          </div>

        </div>
      </div>
    )
  }


  /*
  |--------------------------------------------------------------------------
  | Membership Plans
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-black px-4 py-12 text-white">

      <div className="mx-auto max-w-6xl">

        {/* ============================================================ */}
        {/* HEADER                                                        */}
        {/* ============================================================ */}

        <div className="mx-auto max-w-2xl text-center">

          <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-400">
            CGF Membership
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Choose Your Membership
          </h1>

          <p className="mt-4 text-sm leading-6 text-gray-500 sm:text-base">
            Select the membership plan that works best for your fitness goals.
          </p>

        </div>


        {/* ============================================================ */}
        {/* PLANS                                                         */}
        {/* ============================================================ */}

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {plans.map(
            (plan) => (
              <div
                key={plan._id}
                className="group flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:border-lime-400/30 hover:bg-white/[0.06]"
              >

                {/* Plan Name */}

                <div>

                  <h2 className="text-xl font-black">
                    {plan.name}
                  </h2>

                  {plan.description && (
                    <p className="mt-2 min-h-10 text-sm leading-5 text-gray-500">
                      {plan.description}
                    </p>
                  )}

                </div>


                {/* Price */}

                <div className="mt-6">

                  <p className="text-4xl font-black tracking-tight">
                    {formatPrice(
                      plan.price,
                      plan.currency,
                    )}
                  </p>

                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-gray-600">
                    {plan.durationDays}{" "}
                    {plan.durationDays === 1
                      ? "day"
                      : "days"}
                  </p>

                </div>


                {/* Features */}

                <div className="mt-7 flex-1">

                  {plan.features?.length ? (
                    <ul className="space-y-3">

                      {plan.features.map(
                        (
                          feature,
                          index,
                        ) => (
                          <li
                            key={`${plan._id}-feature-${index}`}
                            className="flex items-start gap-3 text-sm text-gray-300"
                          >

                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-400/10 text-lime-400">

                              <Check
                                size={13}
                              />

                            </span>

                            <span>
                              {feature}
                            </span>

                          </li>
                        ),
                      )}

                    </ul>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Membership access included.
                    </p>
                  )}

                </div>


                {/* Continue Button */}

                <button
                  type="button"
                  onClick={() => {
                    window.location.href =
                      `/payment?plan=${plan._id}`
                  }}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-lime-400 px-5 py-3.5 text-sm font-black text-black transition hover:bg-lime-300"
                >

                  <CreditCard
                    size={17}
                  />

                  Choose Plan

                </button>

              </div>
            ),
          )}

        </div>

      </div>

    </div>
  )
}

export default Membership