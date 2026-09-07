const DISPLACEMENT_RATE = 0.33;

const MATERIAL_FACTORS = {
  cotton: { co2: 11.0, water: 1320.0 },
  polyester: { co2: 7.5, water: 2.0 },
  linen: { co2: 3.0, water: 80.0 },
  leather: { co2: 37.5, water: 2035.0 },
};

function normalizeMaterial(materialName) {
  if (!materialName) return null;
  const normalized = String(materialName).trim().toLowerCase();
  if (normalized.includes("cotton")) return "cotton";
  if (normalized.includes("polyester")) return "polyester";
  if (normalized.includes("linen") || normalized.includes("flax")) return "linen";
  if (normalized.includes("leather")) return "leather";
  return null;
}

function materialTitle(materialKey) {
  if (!materialKey) return "-";
  return materialKey.charAt(0).toUpperCase() + materialKey.slice(1);
}

function primaryMaterialFromComposition(composition) {
  if (!composition || typeof composition !== "object") {
    return null;
  }

  let topMaterial = null;
  let topPct = -1;

  Object.entries(composition).forEach(([name, pct]) => {
    const numeric = Number(pct) || 0;
    if (numeric > topPct) {
      topPct = numeric;
      topMaterial = name;
    }
  });

  return normalizeMaterial(topMaterial);
}

function weightKgFromListing(listing) {
  return listing?.weight_grams && Number(listing.weight_grams) > 0
    ? Number(listing.weight_grams) / 1000
    : 1;
}

export function estimateListingImpact(listing) {
  const materialKey = primaryMaterialFromComposition(listing?.material_composition || {});
  const weightKg = weightKgFromListing(listing);

  if (!materialKey || !MATERIAL_FACTORS[materialKey]) {
    return {
      material: "-",
      weightKg,
      co2: null,
      water: null,
    };
  }

  return {
    material: materialTitle(materialKey),
    weightKg,
    co2: weightKg * MATERIAL_FACTORS[materialKey].co2 * DISPLACEMENT_RATE,
    water: weightKg * MATERIAL_FACTORS[materialKey].water * DISPLACEMENT_RATE,
  };
}

export function calculateListingImpactTotals(listings = []) {
  return listings.reduce(
    (acc, listing) => {
      const impact = estimateListingImpact(listing);
      if (typeof impact.co2 === "number") acc.co2 += impact.co2;
      if (typeof impact.water === "number") acc.water += impact.water;
      return acc;
    },
    { co2: 0, water: 0 }
  );
}

export function estimateSwapRowsImpact(swaps = []) {
  return swaps.reduce(
    (acc, row) => {
      const materialKey = normalizeMaterial(row?.material);
      const weight = Number(row?.weight) || 0;
      if (!materialKey || !MATERIAL_FACTORS[materialKey]) return acc;

      acc.co2SavedKg += weight * MATERIAL_FACTORS[materialKey].co2 * DISPLACEMENT_RATE;
      acc.waterSavedL += weight * MATERIAL_FACTORS[materialKey].water * DISPLACEMENT_RATE;
      return acc;
    },
    { co2SavedKg: 0, waterSavedL: 0 }
  );
}
