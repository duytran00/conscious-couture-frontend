const BUYER_NOTIFICATIONS_KEY = 'buyer_notifications';
export const BUYER_NOTIFICATIONS_EVENT = 'buyer-notifications-updated';
const SELLER_NOTIFICATIONS_KEY = 'seller_notifications';

const safeParse = (rawValue) => {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getBuyerNotifications = () => {
  return safeParse(localStorage.getItem(BUYER_NOTIFICATIONS_KEY));
};
export const getSellerNotifications = (sellerUserId = null) => {
  const notifications = safeParse(localStorage.getItem(SELLER_NOTIFICATIONS_KEY));
  if (sellerUserId === null || sellerUserId === undefined || sellerUserId === '') {
    return notifications;
  }
  return notifications.filter(
    (notification) => String(notification.sellerUserId) === String(sellerUserId)
  );
};

const writeNotifications = (notifications) => {
  localStorage.setItem(BUYER_NOTIFICATIONS_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new CustomEvent(BUYER_NOTIFICATIONS_EVENT));
};

export const addBuyerNotification = (notification) => {
  const notifications = getBuyerNotifications();

  if (
    notification?.type === 'shipping_label' &&
    notification?.trackingNumber &&
    notifications.some(
      (item) =>
        item.type === 'shipping_label' &&
        item.trackingNumber === notification.trackingNumber
    )
  ) {
    return notifications;
  }

  const nextNotification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    read: false,
    createdAt: new Date().toISOString(),
    channel: 'buyer',
    ...notification,
  };

  const updated = [nextNotification, ...notifications];
  writeNotifications(updated);
  return updated;
};
export const addSellerNotification = (notification) => {
  const notifications = safeParse(localStorage.getItem(SELLER_NOTIFICATIONS_KEY));
  const nextNotification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    read: false,
    createdAt: new Date().toISOString(),
    channel: 'seller',
    ...notification,
  };

  const updated = [nextNotification, ...notifications];
  localStorage.setItem(SELLER_NOTIFICATIONS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(BUYER_NOTIFICATIONS_EVENT));
  return updated;
};

export const markBuyerNotificationRead = (notificationId) => {
  const notifications = safeParse(localStorage.getItem(BUYER_NOTIFICATIONS_KEY));
  const updated = notifications.map((notification) =>
    notification.id === notificationId
      ? { ...notification, read: true }
      : notification
  );
  writeNotifications(updated);
  return updated;
};
export const markSellerNotificationRead = (notificationId) => {
  const notifications = safeParse(localStorage.getItem(SELLER_NOTIFICATIONS_KEY));
  const updated = notifications.map((notification) =>
    notification.id === notificationId
      ? { ...notification, read: true }
      : notification
  );
  localStorage.setItem(SELLER_NOTIFICATIONS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(BUYER_NOTIFICATIONS_EVENT));
  return updated;
};

export const markAllBuyerNotificationsRead = () => {
  const notifications = safeParse(localStorage.getItem(BUYER_NOTIFICATIONS_KEY));
  const updated = notifications.map((notification) => ({
    ...notification,
    read: true,
  }));
  writeNotifications(updated);
  return updated;
};

export const addShippingLabelNotification = ({
  trackingNumber,
  labelUrl,
  carrier,
  service,
  orderId,
}) => {
  return addBuyerNotification({
    type: 'shipping_label',
    title: 'Shipping Label Is Ready',
    message: 'Seller confirmed your order. Your shipping label is available for download.',
    trackingNumber,
    labelUrl,
    carrier,
    service,
    orderId,
  });
};
export const markAllSellerNotificationsRead = (sellerUserId = null) => {
  const notifications = safeParse(localStorage.getItem(SELLER_NOTIFICATIONS_KEY));
  const updated = notifications.map((notification) => {
    if (sellerUserId !== null && String(notification.sellerUserId) !== String(sellerUserId)) {
      return notification;
    }
    return { ...notification, read: true };
  });
  localStorage.setItem(SELLER_NOTIFICATIONS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(BUYER_NOTIFICATIONS_EVENT));
  return updated;
};

export const updateSellerNotification = (notificationId, updates) => {
  const notifications = safeParse(localStorage.getItem(SELLER_NOTIFICATIONS_KEY));
  const updated = notifications.map((notification) =>
    notification.id === notificationId
      ? { ...notification, ...updates }
      : notification
  );
  localStorage.setItem(SELLER_NOTIFICATIONS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(BUYER_NOTIFICATIONS_EVENT));
  return updated;
};

export const updateBuyerNotification = (notificationId, updates) => {
  const notifications = safeParse(localStorage.getItem(BUYER_NOTIFICATIONS_KEY));
  const updated = notifications.map((notification) =>
    notification.id === notificationId
      ? { ...notification, ...updates }
      : notification
  );
  writeNotifications(updated);
  return updated;
};