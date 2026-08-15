import { Property, ListingQualityScore } from '../types';

/**
 * Listing Quality Scoring Service
 * Evaluates listing completeness and attractiveness to guide landlords in maximizing tenant inquiries.
 */
export class ListingQualityService {
  public static evaluate(property: Partial<Property>): ListingQualityScore {
    let score = 0;
    const completedItems: string[] = [];
    const recommendations: string[] = [];

    // 1. Photos evaluation (Max 25 pts)
    const imagesCount = property.images?.length || 0;
    if (imagesCount >= 4) {
      score += 25;
      completedItems.push(`Rich photo gallery (${imagesCount} high-res photos)`);
    } else if (imagesCount >= 2) {
      score += 15;
      completedItems.push(`${imagesCount} photos included`);
      recommendations.push('Add 2+ more photos showing bathroom, kitchen, and exterior entrance');
    } else if (imagesCount === 1) {
      score += 8;
      completedItems.push('1 photo provided');
      recommendations.push('Upload multiple high-quality photos (listings with 4+ photos receive 3x more viewings)');
    } else {
      recommendations.push('Critical: Add at least 3 photos of the living areas and bedroom');
    }

    // 2. Description completeness (Max 20 pts)
    const descLength = (property.description || '').trim().length;
    if (descLength >= 150) {
      score += 20;
      completedItems.push('Detailed, informative description (>150 characters)');
    } else if (descLength >= 50) {
      score += 10;
      completedItems.push('Basic description provided');
      recommendations.push('Expand description with neighborhood perks, proximity to transit, and unique features');
    } else {
      recommendations.push('Write a detailed description explaining property highlights, lease terms, and utilities');
    }

    // 3. Complete structural specs (Max 20 pts)
    let specPts = 0;
    if (property.bedrooms && property.bedrooms > 0) specPts += 7;
    if (property.bathrooms && property.bathrooms > 0) specPts += 6;
    if (property.sizeSqm && property.sizeSqm > 0) {
      specPts += 7;
      completedItems.push(`Exact floor space specified (${property.sizeSqm} m²)`);
    } else {
      recommendations.push('Add property floor area (square meters) to help tenants gauge room sizes');
    }
    score += specPts;
    if (property.bedrooms && property.bathrooms) {
      completedItems.push(`Accurate room specs (${property.bedrooms} beds, ${property.bathrooms} baths)`);
    }

    // 4. Amenities list depth (Max 15 pts)
    const amenitiesCount = property.amenities?.length || 0;
    if (amenitiesCount >= 5) {
      score += 15;
      completedItems.push(`Comprehensive amenities listed (${amenitiesCount} features)`);
    } else if (amenitiesCount >= 2) {
      score += 9;
      completedItems.push(`${amenitiesCount} amenities tagged`);
      recommendations.push('Tag more amenities (e.g. WiFi, Water Tank, Security, Balcony, Backup Power)');
    } else {
      recommendations.push('Specify key amenities (Water tank, High-speed Internet, Backup generator, Security)');
    }

    // 5. Pricing & Deposit transparency (Max 10 pts)
    if (property.monthlyRent && property.monthlyRent > 0) {
      score += 6;
      if (property.securityDeposit !== undefined && property.securityDeposit > 0) {
        score += 4;
        completedItems.push('Transparent security deposit terms included');
      } else {
        recommendations.push('Clarify security deposit amount upfront to prevent tenant hesitation');
      }
    }

    // 6. Precise Location & Neighborhood (Max 10 pts)
    if (property.locationSector && property.address) {
      score += 10;
      completedItems.push(`Precise address and sector set (${property.locationSector})`);
    } else if (property.locationSector) {
      score += 5;
      recommendations.push('Provide street address or landmark instructions for seamless viewing arrivals');
    }

    const finalScore = Math.min(100, Math.max(0, score));

    let tier: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR' = 'POOR';
    if (finalScore >= 85) tier = 'EXCELLENT';
    else if (finalScore >= 70) tier = 'GOOD';
    else if (finalScore >= 50) tier = 'NEEDS_IMPROVEMENT';

    return {
      propertyId: property.id || '',
      score: finalScore,
      tier,
      completedItems,
      recommendations
    };
  }
}
