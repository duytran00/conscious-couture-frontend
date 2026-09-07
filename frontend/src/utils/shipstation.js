/**
 * ShipStation Shipping Service
 * Handles address verification, shipping rate calculations, and label purchases
 */

const API_BASE_URL = 'http://localhost:8000/api/v1';
const UPS_CARRIER_ID = import.meta.env.VITE_SHIPSTATION_CARRIER_ID || 'se-5007377';
const UPS_CARRIER_NAME = 'UPS';

const toBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return String(value).toLowerCase() === 'true';
};

const SHIPPING_CONFIG = {
  carrierId: UPS_CARRIER_ID,
  carrierName: UPS_CARRIER_NAME,
  mockRates: toBoolean(import.meta.env.VITE_SHIPSTATION_MOCK_RATES, false),
};

class ShipStationService {
  /**
   * Fetch the authoritative shipping config from the backend (single source of truth for mock flags).
   */
  static async fetchShippingConfig() {
    try {
      const response = await fetch(`${API_BASE_URL}/shipping/config`);
      if (!response.ok) return { ...SHIPPING_CONFIG, mockLabels: false };
      const data = await response.json();
      return {
        carrierId: data.carrier_id || SHIPPING_CONFIG.carrierId,
        carrierName: data.carrier_name || UPS_CARRIER_NAME,
        mockRates: data.mock_rates ?? SHIPPING_CONFIG.mockRates,
        mockLabels: data.mock_labels ?? false,
      };
    } catch {
      return { ...SHIPPING_CONFIG, mockLabels: false };
    }
  }

  static getShippingConfig() {
    return { ...SHIPPING_CONFIG };
  }

  static createMockRate(params) {
    const weightOz = Number(params?.parcel?.weight) || 16;
    const baseRate = 699;
    const incrementalRate = Math.max(weightOz - 16, 0) * 12;
    const rateInCents = Math.round(baseRate + incrementalRate);
    const shipmentSuffix = Date.now();

    return {
      id: `mock-ups-ground-${shipmentSuffix}`,
      shipment_id: `mock-shipment-${shipmentSuffix}`,
      carrier: UPS_CARRIER_NAME,
      carrier_id: UPS_CARRIER_ID,
      service: 'UPS Ground',
      rate: (rateInCents / 100).toFixed(2),
      delivery_days: '2-5 business days',
      est_delivery_date: null,
      mock: true,
    };
  }

  static createMockLabel(params) {
    const trackingSeed = String(Date.now()).slice(-8);

    return {
      id: `mock-label-${trackingSeed}`,
      order_id: params.orderId,
      tracking_number: `1ZMOCK${trackingSeed}`,
      label_url: `https://mock.shipping.local/labels/mock-label-${trackingSeed}.pdf`,
      carrier: UPS_CARRIER_NAME,
      carrier_id: UPS_CARRIER_ID,
      service: params.service || 'UPS Ground',
      rate: params.rate || '0.00',
      shipment_id: params.shipmentId,
      mock: true,
    };
  }

  static normalizeUpsRates(ratePayload) {
    const rawRates = ratePayload?.rates || ratePayload?.data?.rates || ratePayload || [];
    const rates = Array.isArray(rawRates) ? rawRates : [];

    const upsRates = rates.filter((rate) => {
      const carrierName = String(rate?.carrier || '').toLowerCase();
      const carrierId = String(rate?.carrier_id || '').toLowerCase();
      return carrierName.includes('ups') || carrierId === UPS_CARRIER_ID;
    });

    return upsRates.map((rate) => ({
      ...rate,
      carrier: UPS_CARRIER_NAME,
      carrier_id: rate.carrier_id || UPS_CARRIER_ID,
    }));
  }

  static normalizeAddressVerificationResponse(responseData, submittedAddress = null) {
    const payload = responseData?.data || responseData?.result || responseData;

    const verificationCandidates = [
      payload?.verified,
      payload?.valid,
      payload?.is_valid,
      payload?.isValid,
      payload?.address_verified,
      payload?.addressValid,
      responseData?.verified,
      responseData?.valid,
      responseData?.is_valid,
      responseData?.isValid,
      responseData?.address_verified,
      responseData?.addressValid,
    ];

    const explicitVerification = verificationCandidates.find(
      (value) => typeof value === 'boolean'
    );

    const standardizedSource =
      payload?.standardized ||
      payload?.standardized_address ||
      payload?.suggested ||
      payload?.normalized ||
      null;

    const standardized = standardizedSource
      ? {
          name:
            standardizedSource.name ||
            standardizedSource.full_name ||
            submittedAddress?.name ||
            '',
          street:
            standardizedSource.street ||
            standardizedSource.street1 ||
            standardizedSource.address1 ||
            submittedAddress?.street ||
            '',
          city: standardizedSource.city || submittedAddress?.city || '',
          state:
            standardizedSource.state || standardizedSource.state_code || submittedAddress?.state || '',
          zip:
            standardizedSource.zip ||
            standardizedSource.postal_code ||
            standardizedSource.zip_code ||
            submittedAddress?.zip ||
            '',
          country:
            standardizedSource.country || standardizedSource.country_code || submittedAddress?.country || 'US',
          phone: standardizedSource.phone || submittedAddress?.phone || null,
        }
      : null;

    const rawFacts =
      payload?.facts ||
      payload?.issues ||
      payload?.messages ||
      payload?.validation_messages ||
      [];

    const facts = Array.isArray(rawFacts)
      ? rawFacts.filter(Boolean).map((fact) =>
          typeof fact === 'string' ? fact : fact?.message || fact?.detail || ''
        ).filter(Boolean)
      : [];

    const message =
      payload?.message ||
      payload?.detail ||
      payload?.reason ||
      responseData?.message ||
      responseData?.detail ||
      null;

    return {
      ...payload,
      verified: explicitVerification ?? false,
      standardized,
      facts,
      message,
    };
  }

  /**
   * Verify and standardize a shipping address using ShipStation
   * @param {Object} address - Address object
   * @param {string} address.name - Recipient name
   * @param {string} address.street - Street address
   * @param {string} address.city - City
   * @param {string} address.state - State (2-letter code)
   * @param {string} address.zip - ZIP code
   * @param {string} address.country - Country code (default: 'US')
   * @param {string} [address.phone] - Phone number (optional)
   * @returns {Promise<Object>} Verified address object
   */
  static async verifyAddress(address) {
    try {
      const response = await fetch(`${API_BASE_URL}/shipping/verify-address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: address.name,
          street1: address.street,
          city: address.city,
          state: address.state,
          zip: address.zip,
          country: address.country || 'US',
          phone: address.phone || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Address verification failed');
      }

      const responseData = await response.json();
      return this.normalizeAddressVerificationResponse(responseData, address);
    } catch (error) {
      console.error('Error verifying address:', error);
      throw error;
    }
  }

  /**
   * Calculate shipping rates for a package
   * @param {Object} params - Shipping parameters
   * @param {Object} params.toAddress - Recipient address (verified)
   * @param {Object} params.fromAddress - Sender address (from profile or default)
   * @param {Object} params.parcel - Package information
   * @param {number} params.parcel.weight - Weight in ounces
   * @param {number} [params.parcel.length] - Length in inches (optional)
   * @param {number} [params.parcel.width] - Width in inches (optional)
   * @param {number} [params.parcel.height] - Height in inches (optional)
   * @returns {Promise<Array>} Array of shipping rate objects with carrier, service, price
   */
  static async calculateRates(params) {
    if (SHIPPING_CONFIG.mockRates) {
      return {
        rates: [this.createMockRate(params)],
        mock: true,
        carrier_id: UPS_CARRIER_ID,
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/shipping/rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_address: {
            name: params.toAddress.name,
            street1: params.toAddress.street,
            city: params.toAddress.city,
            state: params.toAddress.state,
            zip: params.toAddress.zip,
            country: params.toAddress.country || 'US',
            phone: params.toAddress.phone || null,
          },
          from_address: params.fromAddress
            ? {
                name: params.fromAddress.name,
                street1: params.fromAddress.street,
                city: params.fromAddress.city,
                state: params.fromAddress.state,
                zip: params.fromAddress.zip,
                country: params.fromAddress.country || 'US',
              }
            : null,
          parcel: {
            weight: params.parcel.weight, // in ounces
            length: params.parcel.length || null,
            width: params.parcel.width || null,
            height: params.parcel.height || null,
          },
          carrier_id: UPS_CARRIER_ID,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const detailMessage =
          typeof errorData?.detail === 'string'
            ? errorData.detail
            : Array.isArray(errorData?.detail)
              ? errorData.detail.map((item) => item?.msg || item?.message || String(item)).join('; ')
              : null;
        throw new Error(detailMessage || errorData?.message || 'Failed to calculate rates');
      }

      const responseData = await response.json();
      const upsRates = this.normalizeUpsRates(responseData);

      if (upsRates.length === 0) {
        throw new Error('UPS shipping rates are not available for this shipment.');
      }

      return {
        ...responseData,
        rates: upsRates,
        carrier_id: UPS_CARRIER_ID,
      };
    } catch (error) {
      console.error('Error calculating rates:', error);
      throw error;
    }
  }

  /**
   * Purchase a shipping label.
   * Always delegates to the backend which is the single source of truth for mock vs real.
   * @param {Object} params - Label purchase parameters
   * @param {string} params.shipmentId - ShipStation shipment ID
   * @param {string} params.rateId - ShipStation rate ID (selected rate)
   * @param {number} [params.saleId] - Internal sale ID (persists tracking to DB)
  * @returns {Promise<Object>} Label object with tracking_number, label_url, mock flag, status
   */
  static async purchaseLabel(params) {
    try {
      const response = await fetch(`${API_BASE_URL}/shipping/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipment_id: params.shipmentId,
          rate_id: params.rateId,
          sale_id: params.saleId || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Failed to purchase label');
      }

      return await response.json();
    } catch (error) {
      console.error('Error purchasing label:', error);
      throw error;
    }
  }

  /**
   * Get the current shipping label status for a sale from the database.
   * @param {number} saleId - Sale ID
   * @returns {Promise<Object>} Label status object
   */
  static async getLabelStatus(saleId) {
    try {
      const response = await fetch(`${API_BASE_URL}/shipping/label-status/${saleId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to get label status');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting label status:', error);
      throw error;
    }
  }

  /**
   * Get tracking information for a shipment
   * @param {string} trackingNumber - ShipStation tracking number
   * @returns {Promise<Object>} Tracking information
   */
  static async getTracking(trackingNumber) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/shipping/tracking/${trackingNumber}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get tracking info');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting tracking info:', error);
      throw error;
    }
  }

  /**
   * Format weight from pounds/ounces to ounces
   * @param {number} value - Numeric value
   * @param {string} unit - 'oz' or 'lb'
   * @returns {number} Weight in ounces
   */
  static convertToOunces(value, unit = 'oz') {
    if (unit === 'lb') {
      return value * 16;
    }
    return value;
  }

  /**
   * Format price for display
   * @param {number} cents - Price in cents
   * @returns {string} Formatted price string ($X.XX)
   */
  static formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

export default ShipStationService;
