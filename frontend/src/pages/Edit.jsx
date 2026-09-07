import React, { useState } from "react";
import "./Settings.css";
import { useEffect } from "react";
import ClothingAPI from "../utils/api";
import "./Dashboard.css";

function Edit() {
    const [connectingStripe, setConnectingStripe] = useState(false)
    const [loadingStripeStatus, setLoadingStripeStatus] = useState(false)
    const [stripeAccountId, setStripeAccountId] = useState("")
    const [stripeStatusMessage, setStripeStatusMessage] = useState(null)
    const [stripeError, setStripeError] = useState(null)

    const getSellerUserId = () =>
      localStorage.getItem('seller_user_id') ||
      localStorage.getItem('userId') ||
      localStorage.getItem('user_id') ||
      null

    const loadStripeAccountStatus = async () => {
      const sellerUserId = getSellerUserId()
      if (!sellerUserId) {
        setStripeStatusMessage('Set a seller user ID in localStorage (seller_user_id) to connect Stripe.')
        return
      }

      setLoadingStripeStatus(true)
      setStripeError(null)

      try {
        const account = await ClothingAPI.getSellerStripeAccount(sellerUserId)
        const existingId =
          account?.stripe_account_id ||
          account?.account_id ||
          account?.stripeAccountId ||
          ''

        if (existingId) {
          setStripeAccountId(existingId)
          setStripeStatusMessage('Stripe account connected.')
        } else {
          setStripeStatusMessage('No Stripe account connected yet.')
        }
      } catch (error) {
        setStripeError(error.message || 'Unable to load Stripe account status.')
      } finally {
        setLoadingStripeStatus(false)
      }
    }

    const saveStripeAccountId = async (accountId) => {
      const sellerUserId = getSellerUserId()
      if (!sellerUserId || !accountId) {
        return
      }

      await ClothingAPI.saveSellerStripeAccount(sellerUserId, accountId)
      setStripeAccountId(accountId)
      setStripeStatusMessage('Stripe account connected and saved.')
    }

    const handleStripeConnect = async () => {
      const sellerUserId = getSellerUserId()
      const sellerEmail = localStorage.getItem('userInput3') || null

      if (!sellerUserId) {
        setStripeError('Missing seller ID. Add seller_user_id to localStorage and try again.')
        return
      }

      setConnectingStripe(true)
      setStripeError(null)
      setStripeStatusMessage(null)

      try {
        const baseUrl = window.location.origin
        const refreshUrl = `${baseUrl}/edit?stripe_refresh=true`
        const returnUrl = `${baseUrl}/edit?stripe_return=true`

        const onboarding = await ClothingAPI.createStripeConnectOnboarding({
          seller_user_id: sellerUserId,
          refresh_url: refreshUrl,
          return_url: returnUrl,
          email: sellerEmail,
        })

        const accountIdFromResponse =
          onboarding?.stripe_account_id ||
          onboarding?.account_id ||
          onboarding?.account ||
          null

        if (accountIdFromResponse) {
          await saveStripeAccountId(accountIdFromResponse)
        }

        const onboardingUrl =
          onboarding?.onboarding_url || onboarding?.url || onboarding?.account_link_url

        if (!onboardingUrl) {
          throw new Error('Onboarding link missing from backend response.')
        }

        window.location.href = onboardingUrl
      } catch (error) {
        setStripeError(error.message || 'Failed to start Stripe onboarding.')
      } finally {
        setConnectingStripe(false)
      }
    }

    const save = () =>  {
        const first_input = document.getElementById('firstname').value
        const last_input = document.getElementById('lastname').value
        const email_input = document.getElementById('email').value
        const address_input = document.getElementById('address').value
        const city_input = document.getElementById('city').value
        const state_input = document.getElementById('state').value
        const zip_input = document.getElementById('zip').value

        localStorage.setItem('userInput', first_input)
        localStorage.setItem('userInput2', last_input)
        localStorage.setItem('userInput3', email_input)
        localStorage.setItem('userInput4', address_input)
        localStorage.setItem('userInput5', city_input)
        localStorage.setItem('userInput6', state_input)
        localStorage.setItem('userInput7', zip_input)

        display();
    };
    const savepay = () => {
        const card_input = document.getElementById('card').value
        const date_input = document.getElementById('date').value
        const security_input = document.getElementById('security').value
        const payzip_input = document.getElementById('payzip').value

        localStorage.setItem('userInput8', card_input)
        localStorage.setItem('userInput9', date_input)
        localStorage.setItem('userInput10', security_input)
        localStorage.setItem('userInput11', payzip_input)
        display_pay()
    };
    const display = () => {
      const saved_first = localStorage.getItem('userInput')
      const saved_last = localStorage.getItem('userInput2')
      const saved_email = localStorage.getItem('userInput3')
      const saved_address = localStorage.getItem('userInput4')
      const saved_city = localStorage.getItem('userInput5')
      const saved_state = localStorage.getItem('userInput6')
      const saved_zip = localStorage.getItem('userInput7')

      const savedata_first = document.getElementById('firstname')
      const savedata_last = document.getElementById('lastname')
      const savedata_email = document.getElementById('email')
      const savedata_address = document.getElementById('address')
      const savedata_city = document.getElementById('city')
      const savedata_state = document.getElementById('state')
      const savedata_zip = document.getElementById('zip')

      if (saved_first) {
        savedata_first.value = saved_first
      }
      else {
        savedata_first.value = ""
      }
      if (saved_last) {
        savedata_last.value = saved_last
      }
      else {
        savedata_last.value = ""
      }
      if (saved_email) {
        savedata_email.value = saved_email
      }
      else {
        savedata_email.value = ""
      }
      if (saved_address) {
        savedata_address.value = saved_address
      }
      else {
        savedata_address.value = ""
      }
      if (saved_city) {
        savedata_city.value = saved_city
      }
      else {
        savedata_city.value = ""
      }
      if (saved_state) {
        savedata_state.value = saved_state
      }
      else {
        savedata_state.value = ""
      }
      if (saved_zip) {
        savedata_zip.value = saved_zip
      }
      else {
        savedata_zip.value = ""
      }
    };
    const display_pay = () => {
        const saved_card = localStorage.getItem('userInput8')
        const saved_date = localStorage.getItem('userInput9')
        const saved_security = localStorage.getItem('userInput10')
        const saved_payzip = localStorage.getItem('userInput11')

        const savedata_card = document.getElementById('card')
        const savedata_date = document.getElementById('date')
        const savedata_security = document.getElementById('security')
        const savedata_payzip = document.getElementById('payzip')

        if (saved_card) {
            savedata_card.value = saved_card
        }
        else {
            savedata_card.value = ""
        }
        if (saved_date) {
            savedata_date.value = saved_date
        }
        else {
            savedata_date.value = ""
        }
        if (saved_security) {
            savedata_security.value = saved_security
        }
        else {
            savedata_security.value = ""
        }
        if (saved_payzip) {
            savedata_payzip.value = saved_payzip
        }
        else {
            savedata_payzip.value = ""
        }
    };
    useEffect(() => {
        display()
        display_pay()
        loadStripeAccountStatus()

        const query = new URLSearchParams(window.location.search)
        const returnedAccountId =
          query.get('stripe_account_id') || query.get('account_id') || query.get('stripeAccountId')

        if (returnedAccountId) {
          saveStripeAccountId(returnedAccountId).catch((error) => {
            setStripeError(error.message || 'Failed to save Stripe account ID after onboarding return.')
          })
        }

        if (query.get('stripe_return') || query.get('stripe_refresh') || returnedAccountId) {
          window.history.replaceState({}, '', window.location.pathname)
        }
    }, []);
    return(
        <div className="dashboard-container">
            <div className="section">
                <h2 className="section-title">Edit Profile</h2>

                <input
                type="text"
                placeholder="First Name"
                className="input-field"
                id="firstname"
                />
                <input
                type="text"
                placeholder="Last Name"
                className="input-field"
                id="lastname"
                />
                <input
                type="text"
                placeholder="Email-Address"
                className="input-field"
                id="email"
                />
                <input
                type="text"
                placeholder="Address"
                className="input-field"
                id="address"
                />
                <input
                type="text"
                placeholder="City"
                className="input-field"
                id="city"
                />
                <input
                type="text"
                placeholder="State"
                className="input-field"
                id="state"
                />
                <input
                type="text"
                placeholder="Zip code"
                className="input-field"
                id="zip"
                />
                <button className="btn btn-green" 
                onClick={save}
                >
                Save
                </button>
            </div>
            <div className="section">
              <h2 className="section-title">Stripe Seller Onboarding</h2>
              <p className="mb-3 text-gray-700">
                Connect your Stripe account to receive payouts as a seller.
              </p>

              {loadingStripeStatus && (
                <p className="text-sm text-gray-600">Checking Stripe status...</p>
              )}

              {stripeStatusMessage && (
                <p className="text-sm text-green-700">{stripeStatusMessage}</p>
              )}

              {stripeAccountId && (
                <p className="text-sm text-gray-700 mt-2">
                  Connected Account ID: <strong>{stripeAccountId}</strong>
                </p>
              )}

              {stripeError && (
                <p className="text-sm text-red-600 mt-2">{stripeError}</p>
              )}

              <button
                className="btn btn-primary"
                onClick={handleStripeConnect}
                disabled={connectingStripe}
              >
                {connectingStripe
                  ? 'Opening Stripe Onboarding...'
                  : stripeAccountId
                  ? 'Reconnect Stripe Account'
                  : 'Connect Stripe Account'}
              </button>
            </div>
            <div className="section">   
            <h2 className="section-title">Edit Payment Information</h2>
            <input
                type="text"
                placeholder="Card Number"
                className="input-field"
                id="card"
            />
            <input
                type="text"
                placeholder="Expiry Date"
                className="input-field"
                id="date"
            />
            <input
                type="text"
                placeholder="Security Code"
                className="input-field"
                id="security"
            />
            <input
                type="text"
                placeholder="Zip code"
                className="input-field"
                id="payzip"
            />
            <button className="btn btn-green" 
                onClick={savepay}
                >
                Save Payment
                </button>      
            </div>
        </div>
    );
}

export default Edit;
