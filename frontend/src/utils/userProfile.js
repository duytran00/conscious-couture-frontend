export function resolveCurrentUserId(fallback = null) {
  const candidates = [
    localStorage.getItem('userId'),
    localStorage.getItem('user_id'),
    localStorage.getItem('currentUserId'),
  ];

  for (const value of candidates) {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return fallback;
}

export function splitDisplayName(displayName) {
  const name = (displayName || '').trim();
  if (!name) return { firstName: '', lastName: '' };

  const parts = name.split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
}

export function parseProfileLocation(location) {
  const raw = location || '';
  if (!raw) {
    return { address: '', city: '', state: '', zip: '' };
  }

  if (raw.includes('||')) {
    const [address = '', city = '', state = '', zip = ''] = raw.split('||');
    return { address, city, state, zip };
  }

  return { address: raw, city: '', state: '', zip: '' };
}

export function composeProfileLocation({ address, city, state, zip }) {
  return `${address || ''}||${city || ''}||${state || ''}||${zip || ''}`;
}
