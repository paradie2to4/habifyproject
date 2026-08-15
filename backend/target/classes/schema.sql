-- DDL Schema for Smart Rental Platform (PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(50),
    role VARCHAR(50) NOT NULL,
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS properties (
    id VARCHAR(50) PRIMARY KEY,
    landlord_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    landlord_name VARCHAR(150),
    landlord_phone VARCHAR(50),
    landlord_email VARCHAR(255),
    landlord_avatar VARCHAR(500),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location_sector VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    monthly_rent DOUBLE PRECISION NOT NULL,
    security_deposit DOUBLE PRECISION,
    property_type VARCHAR(50) NOT NULL,
    bedrooms INT NOT NULL DEFAULT 1,
    bathrooms INT NOT NULL DEFAULT 1,
    size_sqm DOUBLE PRECISION,
    is_furnished BOOLEAN DEFAULT FALSE,
    has_parking BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    views_count INT DEFAULT 0,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    amenities TEXT,
    images TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prop_sector ON properties(location_sector);
CREATE INDEX IF NOT EXISTS idx_prop_rent ON properties(monthly_rent);
CREATE INDEX IF NOT EXISTS idx_prop_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_prop_available ON properties(is_available);

CREATE TABLE IF NOT EXISTS tenant_preferences (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    max_budget DOUBLE PRECISION NOT NULL,
    monthly_income DOUBLE PRECISION NOT NULL,
    min_bedrooms INT NOT NULL DEFAULT 1,
    furnished_required BOOLEAN DEFAULT FALSE,
    parking_required BOOLEAN DEFAULT FALSE,
    preferred_locations TEXT,
    preferred_property_types TEXT,
    preferred_amenities TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS viewing_requests (
    id VARCHAR(50) PRIMARY KEY,
    property_id VARCHAR(50) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    property_title VARCHAR(255) NOT NULL,
    property_location VARCHAR(100) NOT NULL,
    property_rent DOUBLE PRECISION NOT NULL,
    property_image VARCHAR(500),
    tenant_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_name VARCHAR(150) NOT NULL,
    tenant_email VARCHAR(255) NOT NULL,
    tenant_phone VARCHAR(50),
    landlord_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_date VARCHAR(50) NOT NULL,
    requested_time_slot VARCHAR(50) NOT NULL,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inquiries (
    id VARCHAR(50) PRIMARY KEY,
    property_id VARCHAR(50) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    property_title VARCHAR(255) NOT NULL,
    property_image VARCHAR(500),
    property_location VARCHAR(100),
    tenant_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_name VARCHAR(150) NOT NULL,
    tenant_email VARCHAR(255) NOT NULL,
    landlord_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    landlord_name VARCHAR(150),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'UNREAD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favorites (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id VARCHAR(50) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, property_id)
);

CREATE TABLE IF NOT EXISTS property_reports (
    id VARCHAR(50) PRIMARY KEY,
    property_id VARCHAR(50) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    property_title VARCHAR(255) NOT NULL,
    reporter_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reporter_name VARCHAR(150) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
