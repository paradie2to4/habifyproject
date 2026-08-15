import { Property, TenantPreferences, MatchScoreExplanation, CriteriaMatch, AffordabilityStatus } from '../types';
import { RWANDA_LOCATIONS_DATA } from '../data/rwandaLocations';

/**
 * SMART PROPERTY MATCHING ENGINE (Java Backend Equivalent)
 *
 * Implements a weighted scoring heuristic for personalized tenant-property compatibility.
 * Default Weights:
 * - Budget Compatibility:      30%
 * - Location Compatibility:    25%
 * - Bedroom Requirement:       15%
 * - Property Type Match:       10%
 * - Amenities Compatibility:   10%
 * - Furnishing Match:           5%
 * - Parking Availability:       5%
 * Total:                      100%
 */

// Sector proximity mapping for Kigali city
const KIGALI_SECTORS_ADJACENCY: Record<string, string[]> = {
  'Kimihurura': ['Kacyiru', 'Remera', 'Nyarugenge', 'Gikondo'],
  'Kacyiru': ['Kimihurura', 'Gisozi', 'Remera', 'Nyarutarama'],
  'Nyarutarama': ['Kacyiru', 'Gisozi', 'Remera', 'Kibagabaga'],
  'Remera': ['Kimihurura', 'Kacyiru', 'Nyarutarama', 'Kanombe', 'Kicukiro'],
  'Kicukiro': ['Remera', 'Gikondo', 'Niboye', 'Kagarama'],
  'Gisozi': ['Kacyiru', 'Nyarutarama', 'Gatsata', 'Kinamba'],
  'Nyamirambo': ['Nyarugenge', 'Biryogo', 'Rwezamenyo', 'Mageragere'],
  'Nyarugenge': ['Nyamirambo', 'Kimihurura', 'Kacyiru', 'Muhima'],
  'Gikondo': ['Kicukiro', 'Kimihurura', 'Nyarugenge']
};

export class PropertyMatchingEngine {
  public static calculateMatch(
    property: Property,
    preferences: TenantPreferences
  ): MatchScoreExplanation {
    const criteriaBreakdown: CriteriaMatch[] = [];
    const matchedReasons: string[] = [];
    const improvementSuggestions: string[] = [];

    // 1. BUDGET SCORING (30% weight)
    const budgetScore = this.evaluateBudget(property.monthlyRent, preferences.maxBudget);
    criteriaBreakdown.push({
      criterion: 'BUDGET',
      label: 'Budget Compatibility',
      weightPercentage: 30,
      score: budgetScore.score,
      weightedScore: Number(((budgetScore.score * 30) / 100).toFixed(1)),
      status: budgetScore.score >= 85 ? 'MATCH' : budgetScore.score >= 50 ? 'PARTIAL' : 'MISMATCH',
      detail: budgetScore.detail
    });
    if (budgetScore.score >= 85) {
      matchedReasons.push(`Rent (${property.monthlyRent.toLocaleString()} RWF) is comfortably within your ${preferences.maxBudget.toLocaleString()} RWF budget limit`);
    } else if (budgetScore.score < 50) {
      improvementSuggestions.push(`Rent exceeds your preferred budget target of ${preferences.maxBudget.toLocaleString()} RWF`);
    }

    // 2. LOCATION SCORING (25% weight)
    const locationScore = this.evaluateLocation(property.locationSector, preferences.preferredLocations);
    criteriaBreakdown.push({
      criterion: 'LOCATION',
      label: 'Location Compatibility',
      weightPercentage: 25,
      score: locationScore.score,
      weightedScore: Number(((locationScore.score * 25) / 100).toFixed(1)),
      status: locationScore.score >= 90 ? 'MATCH' : locationScore.score >= 60 ? 'PARTIAL' : 'MISMATCH',
      detail: locationScore.detail
    });
    if (locationScore.score >= 90) {
      matchedReasons.push(`Located directly in your target sector (${property.locationSector})`);
    } else if (locationScore.score >= 60) {
      matchedReasons.push(`Located in ${property.locationSector}, neighboring your preferred sector`);
    } else {
      improvementSuggestions.push(`Located in ${property.locationSector}, which is outside your primary preferred sectors`);
    }

    // 3. BEDROOMS SCORING (15% weight)
    const bedroomScore = this.evaluateBedrooms(property.bedrooms, preferences.minBedrooms);
    criteriaBreakdown.push({
      criterion: 'BEDROOMS',
      label: 'Bedrooms Requirement',
      weightPercentage: 15,
      score: bedroomScore.score,
      weightedScore: Number(((bedroomScore.score * 15) / 100).toFixed(1)),
      status: bedroomScore.score >= 90 ? 'MATCH' : bedroomScore.score >= 40 ? 'PARTIAL' : 'MISMATCH',
      detail: bedroomScore.detail
    });
    if (bedroomScore.score >= 90) {
      matchedReasons.push(`Offers ${property.bedrooms} bedroom${property.bedrooms > 1 ? 's' : ''} (min requirement: ${preferences.minBedrooms})`);
    } else {
      improvementSuggestions.push(`Has ${property.bedrooms} bed, fewer than your minimum requested (${preferences.minBedrooms})`);
    }

    // 4. PROPERTY TYPE (10% weight)
    const typeScore = this.evaluatePropertyType(property.propertyType, preferences.preferredPropertyTypes);
    criteriaBreakdown.push({
      criterion: 'PROPERTY_TYPE',
      label: 'Property Type Match',
      weightPercentage: 10,
      score: typeScore.score,
      weightedScore: Number(((typeScore.score * 10) / 100).toFixed(1)),
      status: typeScore.score >= 90 ? 'MATCH' : typeScore.score >= 50 ? 'PARTIAL' : 'MISMATCH',
      detail: typeScore.detail
    });
    if (typeScore.score >= 90) {
      matchedReasons.push(`Matches desired property style (${property.propertyType.toLowerCase()})`);
    }

    // 5. AMENITIES (10% weight)
    const amenityScore = this.evaluateAmenities(property.amenities, preferences.preferredAmenities);
    criteriaBreakdown.push({
      criterion: 'AMENITIES',
      label: 'Amenities Match',
      weightPercentage: 10,
      score: amenityScore.score,
      weightedScore: Number(((amenityScore.score * 10) / 100).toFixed(1)),
      status: amenityScore.score >= 80 ? 'MATCH' : amenityScore.score >= 40 ? 'PARTIAL' : 'MISMATCH',
      detail: amenityScore.detail
    });
    if (amenityScore.score >= 70) {
      matchedReasons.push(`Includes ${amenityScore.matchedCount} of your ${preferences.preferredAmenities.length} priority amenities`);
    } else if (amenityScore.missingCount > 0) {
      improvementSuggestions.push(`Missing some requested amenities: ${amenityScore.missingList.join(', ')}`);
    }

    // 6. FURNISHED STATUS (5% weight)
    const furnishedScore = this.evaluateFurnished(property.isFurnished, preferences.furnishedRequired);
    criteriaBreakdown.push({
      criterion: 'FURNISHED',
      label: 'Furnishing Match',
      weightPercentage: 5,
      score: furnishedScore.score,
      weightedScore: Number(((furnishedScore.score * 5) / 100).toFixed(1)),
      status: furnishedScore.score === 100 ? 'MATCH' : 'MISMATCH',
      detail: furnishedScore.detail
    });
    if (furnishedScore.score === 100 && preferences.furnishedRequired) {
      matchedReasons.push('Fully furnished according to your preference');
    }

    // 7. PARKING AVAILABILITY (5% weight)
    const parkingScore = this.evaluateParking(property.hasParking, preferences.parkingRequired);
    criteriaBreakdown.push({
      criterion: 'PARKING',
      label: 'Parking Space',
      weightPercentage: 5,
      score: parkingScore.score,
      weightedScore: Number(((parkingScore.score * 5) / 100).toFixed(1)),
      status: parkingScore.score === 100 ? 'MATCH' : 'MISMATCH',
      detail: parkingScore.detail
    });
    if (parkingScore.score === 100 && preferences.parkingRequired) {
      matchedReasons.push('Dedicated secure parking available');
    } else if (preferences.parkingRequired && !property.hasParking) {
      improvementSuggestions.push('No dedicated on-site parking available');
    }

    // Total weighted sum
    const totalWeightedScore = criteriaBreakdown.reduce((sum, item) => sum + item.weightedScore, 0);
    const finalScore = Math.min(100, Math.max(0, Math.round(totalWeightedScore)));

    // Affordability metrics
    const affordabilityRatio = preferences.monthlyIncome > 0
      ? (property.monthlyRent / preferences.monthlyIncome) * 100
      : 0;

    let affordabilityStatus: AffordabilityStatus = 'SAFE';
    if (affordabilityRatio > 50) {
      affordabilityStatus = 'UNREALISTIC';
    } else if (affordabilityRatio > 40) {
      affordabilityStatus = 'HIGH_BURDEN';
    } else if (affordabilityRatio > 30) {
      affordabilityStatus = 'MODERATE';
    }

    return {
      propertyId: property.id,
      totalScore: finalScore,
      criteriaBreakdown,
      matchedReasons,
      improvementSuggestions,
      affordabilityRatio: Number(affordabilityRatio.toFixed(1)),
      affordabilityStatus
    };
  }

  private static evaluateBudget(rent: number, maxBudget: number): { score: number; detail: string } {
    if (maxBudget <= 0) return { score: 100, detail: 'No budget constraint specified' };

    if (rent <= maxBudget) {
      // Under budget: Full score with bonus satisfaction
      const savingsPercentage = Math.round(((maxBudget - rent) / maxBudget) * 100);
      return {
        score: 100,
        detail: savingsPercentage > 0
          ? `${savingsPercentage}% below maximum budget limit`
          : 'Exact match with maximum budget limit'
      };
    }

    // Over budget penalty gradient
    const excessRatio = (rent - maxBudget) / maxBudget;
    if (excessRatio <= 0.10) {
      // Within 10% stretch
      return { score: 80, detail: `Slightly exceeds budget by ${(excessRatio * 100).toFixed(0)}%` };
    } else if (excessRatio <= 0.25) {
      // Within 25% stretch
      return { score: 45, detail: `Exceeds budget by ${(excessRatio * 100).toFixed(0)}%` };
    } else if (excessRatio <= 0.40) {
      return { score: 20, detail: `Significantly above budget (+${(excessRatio * 100).toFixed(0)}%)` };
    }
    return { score: 0, detail: `Far exceeds budget (+${(excessRatio * 100).toFixed(0)}%)` };
  }

  private static evaluateLocation(
    propertySector: string,
    preferredLocations: string[]
  ): { score: number; detail: string } {
    if (!preferredLocations || preferredLocations.length === 0) {
      return { score: 100, detail: 'Open to any Rwanda region or city' };
    }

    const normSector = propertySector.toLowerCase().trim();

    // 1. Direct match on full name or substring
    if (
      preferredLocations.some(
        loc =>
          loc.toLowerCase().trim() === normSector ||
          normSector.includes(loc.toLowerCase().trim()) ||
          loc.toLowerCase().trim().includes(normSector)
      )
    ) {
      return { score: 100, detail: `Direct match in ${propertySector}` };
    }

    // 2. Lookup district and province metadata
    const propInfo = RWANDA_LOCATIONS_DATA[propertySector] || Object.values(RWANDA_LOCATIONS_DATA).find(
      loc => loc.name.toLowerCase() === normSector || normSector.includes(loc.name.toLowerCase())
    );

    if (propInfo) {
      // Check if any preferred location is in the same district
      const sameDistrict = preferredLocations.some(pref => {
        const prefInfo = RWANDA_LOCATIONS_DATA[pref] || Object.values(RWANDA_LOCATIONS_DATA).find(
          l => l.name.toLowerCase() === pref.toLowerCase()
        );
        return prefInfo && prefInfo.district === propInfo.district;
      });

      if (sameDistrict) {
        return { score: 85, detail: `Same district (${propInfo.district}) as your preferred area` };
      }

      // Check if in the same province
      const sameProvince = preferredLocations.some(pref => {
        const prefInfo = RWANDA_LOCATIONS_DATA[pref] || Object.values(RWANDA_LOCATIONS_DATA).find(
          l => l.name.toLowerCase() === pref.toLowerCase()
        );
        return prefInfo && prefInfo.province === propInfo.province;
      });

      if (sameProvince) {
        return { score: 65, detail: `Same province (${propInfo.province}) region (${propInfo.district})` };
      }
    }

    // 3. Check adjacent Kigali neighborhood
    const isAdjacent = preferredLocations.some(pref => {
      const adjacentList = KIGALI_SECTORS_ADJACENCY[pref] || [];
      return adjacentList.some(adj => adj.toLowerCase() === normSector);
    });

    if (isAdjacent) {
      return { score: 70, detail: `Adjacent to preferred neighborhood (${propertySector})` };
    }

    return { score: 30, detail: `Located in ${propertySector} (outside primary preferred regions)` };
  }

  private static evaluateBedrooms(actual: number, minRequired: number): { score: number; detail: string } {
    if (minRequired <= 0) return { score: 100, detail: 'No bedroom constraint' };

    if (actual >= minRequired) {
      if (actual === minRequired) {
        return { score: 100, detail: `Exact bedroom count (${actual} bedrooms)` };
      }
      return { score: 95, detail: `Generous layout (${actual} bedrooms vs ${minRequired} requested)` };
    }

    if (actual === minRequired - 1) {
      return { score: 40, detail: `Has ${actual} bed (1 less than ${minRequired} preferred)` };
    }

    return { score: 0, detail: `Insufficient rooms (${actual} vs ${minRequired} min)` };
  }

  private static evaluatePropertyType(actual: string, preferred: string[]): { score: number; detail: string } {
    if (!preferred || preferred.length === 0) return { score: 100, detail: 'Open to all property types' };

    if (preferred.includes(actual)) {
      return { score: 100, detail: `Exact match for ${actual.toLowerCase()}` };
    }

    // Compatible substitute
    if ((actual === 'APARTMENT' && preferred.includes('STUDIO')) ||
        (actual === 'HOUSE' && preferred.includes('VILLA')) ||
        (actual === 'TOWNHOUSE' && preferred.includes('DUPLEX'))) {
      return { score: 65, detail: `Compatible alternative style (${actual.toLowerCase()})` };
    }

    return { score: 20, detail: `Different property archetype (${actual.toLowerCase()})` };
  }

  private static evaluateAmenities(
    actual: string[],
    preferred: string[]
  ): { score: number; matchedCount: number; missingCount: number; missingList: string[]; detail: string } {
    if (!preferred || preferred.length === 0) {
      return { score: 100, matchedCount: 0, missingCount: 0, missingList: [], detail: 'No specific amenity requirements' };
    }

    const actualNormalized = actual.map(a => a.toLowerCase());
    const matched = preferred.filter(p => actualNormalized.includes(p.toLowerCase()));
    const missing = preferred.filter(p => !actualNormalized.includes(p.toLowerCase()));

    const fraction = matched.length / preferred.length;
    const score = Math.round(fraction * 100);

    return {
      score,
      matchedCount: matched.length,
      missingCount: missing.length,
      missingList: missing,
      detail: `${matched.length} of ${preferred.length} preferred amenities included`
    };
  }

  private static evaluateFurnished(actual: boolean, required: boolean): { score: number; detail: string } {
    if (!required) return { score: 100, detail: 'Furnishing is optional' };
    return actual
      ? { score: 100, detail: 'Furnished as requested' }
      : { score: 20, detail: 'Unfurnished' };
  }

  private static evaluateParking(actual: boolean, required: boolean): { score: number; detail: string } {
    if (!required) return { score: 100, detail: 'Parking is optional' };
    return actual
      ? { score: 100, detail: 'Dedicated parking available' }
      : { score: 0, detail: 'No dedicated parking' };
  }
}
