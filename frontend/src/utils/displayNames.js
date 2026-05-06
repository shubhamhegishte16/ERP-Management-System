const NAME_OVERRIDES = {
  'Arjun Sharma': 'Shubham Hegishte',
  'Neha Kapoor': 'Vinaya Patole',
  'Rohan Mehta': 'Rushan Kamble',
};

export const displayName = (name) => NAME_OVERRIDES[name] || name;

export const normalizeDisplayNames = (value) => {
  if (Array.isArray(value)) return value.map(normalizeDisplayNames);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      key === 'name' && typeof entry === 'string'
        ? displayName(entry)
        : normalizeDisplayNames(entry),
    ])
  );
};
