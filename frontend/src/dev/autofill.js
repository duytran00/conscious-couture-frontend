export const isDevAutofillEnabled = import.meta.env.DEV;
//export const isDevAutofillEnabled = false;


const DEV_LOGIN_DATA = {
  email: 'sarah.wilson@example.com',
  password: 'password123',
};

const DEV_CHECKOUT_DATA = {
  cardholderName: 'Sarah Wilson',
  shipping: {
    name: 'Sarah Wilson',
    address: '1002 Baylor St',
    city: 'Austin',
    state: 'TX',
    zip: '78703',
  },
  stripe: {
    cardNumber: '4242 4242 4242 4242',
    expiry: '12/34',
    cvc: '123',
    zip: '78703',
  },
};

export function getLoginAutofill() {
  return isDevAutofillEnabled ? { ...DEV_LOGIN_DATA } : { email: '', password: '' };
}

export function getCheckoutAutofill() {
  if (!isDevAutofillEnabled) {
    return {
      cardholderName: '',
      shipping: { name: '', address: '', city: '', state: '', zip: '' },
      addressFormData: { name: '', street: '', city: '', state: '', zip: '' },
      stripe: null,
    };
  }

  return {
    cardholderName: DEV_CHECKOUT_DATA.cardholderName,
    shipping: { ...DEV_CHECKOUT_DATA.shipping },
    addressFormData: {
      name: DEV_CHECKOUT_DATA.shipping.name,
      street: DEV_CHECKOUT_DATA.shipping.address,
      city: DEV_CHECKOUT_DATA.shipping.city,
      state: DEV_CHECKOUT_DATA.shipping.state,
      zip: DEV_CHECKOUT_DATA.shipping.zip,
    },
    stripe: { ...DEV_CHECKOUT_DATA.stripe },
  };
}

export function getStripeTestCardDisplay() {
  return isDevAutofillEnabled ? { ...DEV_CHECKOUT_DATA.stripe } : null;
}