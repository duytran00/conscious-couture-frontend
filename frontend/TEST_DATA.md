Manual test data for local sign-in and checkout.

Login

- Email: sarah.wilson@example.com
- Password: password123

Notes

- These users come from scripts/create_sample_users.py in the backend.
- If login fails because the user does not exist yet, run the sample user seed script first.

Stripe test card

- Card number: 4242 4242 4242 4242
- Expiration: any future date, for example 12/34
- CVC: any 3 digits, for example 123
- ZIP: 78703

Shipping address

- Name: Sarah Wilson
- Street: 1002 Baylor St
- City: Austin
- State: TX
- ZIP: 78703

Checkout field mapping

- cardholderName: Sarah Wilson
- shipping.name: Sarah Wilson
- shipping.address: 1002 Baylor St
- shipping.city: Austin
- shipping.state: TX
- shipping.zip: 78703