-- H2 copy of data.sql (H2 has no ON CONFLICT). Keep in sync with data.sql.
-- Seed Data for Smart Rental Platform (Kigali, Rwanda)

-- Users (Pass: password123, BCrypt hashed)
INSERT INTO users (id, email, password_hash, full_name, phone_number, role, avatar_url)
VALUES
('usr-tenant-01', 'tenant@smartrental.rw', '$2a$12$0z3E9b9bK1VwB5wW7r6J6O3lOZb8bQvPqE1b9K1VwB5wW7r6J6O3l', 'Claire Mukamana', '+250 788 345 678', 'TENANT', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
('usr-landlord-01', 'landlord@smartrental.rw', '$2a$12$0z3E9b9bK1VwB5wW7r6J6O3lOZb8bQvPqE1b9K1VwB5wW7r6J6O3l', 'Jean-Paul Habimana', '+250 788 123 456', 'LANDLORD', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
('usr-admin-01', 'admin@smartrental.rw', '$2a$12$0z3E9b9bK1VwB5wW7r6J6O3lOZb8bQvPqE1b9K1VwB5wW7r6J6O3l', 'Alex Kayitare', '+250 788 999 000', 'ADMIN', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80')
;

-- Seed Properties
INSERT INTO properties (
    id, landlord_id, landlord_name, landlord_phone, landlord_email, landlord_avatar,
    title, description, location_sector, address, monthly_rent, security_deposit,
    property_type, bedrooms, bathrooms, size_sqm, is_furnished, has_parking,
    is_available, featured, views_count, latitude, longitude, amenities, images
)
VALUES
(
    'prop-01', 'usr-landlord-01', 'Jean-Paul Habimana', '+250 788 123 456', 'landlord@smartrental.rw', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'Modern 2-Bedroom Apartment with Balcony & City Views',
    'Spacious light-filled 2-bedroom apartment located in prime Kimihurura. Features a private sunset balcony, dedicated high-speed fiber internet, and 24/7 guarded gate.',
    'Kimihurura', 'KG 28 Ave, Kimihurura, Kigali', 350000, 350000,
    'APARTMENT', 2, 2, 85, true, true, true, true, 342, -1.9542, 30.0886,
    'High-speed WiFi,Water Tank & Pump,24/7 Security Guard,Paved Compound,Balcony / Terrace,Solar Water Heater,Backup Generator,Dedicated Parking Space',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80,https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80,https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80'
),
(
    'prop-02', 'usr-landlord-01', 'Jean-Paul Habimana', '+250 788 123 456', 'landlord@smartrental.rw', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'Executive 4-Bedroom Villa with Swimming Pool & Garden',
    'Prestigious residence located on Nyarutarama golf course ridge. Features private swimming pool, mature garden, separate staff quarters, and high-capacity backup generator.',
    'Nyarutarama', 'KG 9 Ave, Nyarutarama, Kigali', 1200000, 1200000,
    'VILLA', 4, 4, 280, true, true, true, true, 580, -1.9388, 30.1042,
    'Swimming Pool,Private Garden,Backup Generator,Air Conditioning,24/7 Security Guard,Water Tank & Pump,High-speed WiFi,Dedicated Parking Space',
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop&q=80,https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80,https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80'
)
;

-- Seed Tenant Preferences
INSERT INTO tenant_preferences (
    id, user_id, max_budget, monthly_income, min_bedrooms,
    furnished_required, parking_required, preferred_locations,
    preferred_property_types, preferred_amenities
)
VALUES (
    'pref-01', 'usr-tenant-01', 400000, 1200000, 2, true, true,
    'Kimihurura,Kacyiru,Remera,Kiyovu',
    'APARTMENT,HOUSE,TOWNHOUSE',
    'High-speed WiFi,Water Tank & Pump,24/7 Security Guard,Paved Compound,Backup Generator'
)
;
