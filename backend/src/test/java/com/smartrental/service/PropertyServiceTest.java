package com.smartrental.service;

import com.smartrental.entity.Property;
import com.smartrental.repository.PropertyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@DisplayName("Property Service Unit Tests")
class PropertyServiceTest {

    @Mock
    private PropertyRepository propertyRepository;

    @InjectMocks
    private PropertyService propertyService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("Should retrieve only available properties for public discovery")
    void testGetAllAvailableProperties() {
        Property p1 = new Property();
        p1.setId("p1");
        p1.setIsAvailable(true);

        when(propertyRepository.findByIsAvailableTrue()).thenReturn(Arrays.asList(p1));

        List<Property> result = propertyService.getAllAvailableProperties();
        assertEquals(1, result.size());
        assertTrue(result.get(0).getIsAvailable());
        verify(propertyRepository, times(1)).findByIsAvailableTrue();
    }

    @Test
    @DisplayName("Should auto-generate ID and timestamp when creating property")
    void testCreateProperty() {
        Property newProp = new Property();
        newProp.setTitle("Remera Modern Flat");
        newProp.setLocationSector("Remera");
        newProp.setMonthlyRent(450000.0);

        when(propertyRepository.save(any(Property.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Property saved = propertyService.createProperty(newProp);
        assertNotNull(saved.getId());
        assertTrue(saved.getId().startsWith("prop-"));
        assertTrue(saved.getIsAvailable());
        assertEquals(0, saved.getViewsCount());
        assertNotNull(saved.getCreatedAt());
    }

    @Test
    @DisplayName("Should increment view count on single property retrieval")
    void testGetPropertyByIdIncrementsViews() {
        Property prop = new Property();
        prop.setId("p-view-test");
        prop.setViewsCount(10);

        when(propertyRepository.findById("p-view-test")).thenReturn(Optional.of(prop));
        when(propertyRepository.save(any(Property.class))).thenAnswer(i -> i.getArgument(0));

        Optional<Property> found = propertyService.getPropertyById("p-view-test");
        assertTrue(found.isPresent());
        assertEquals(11, found.get().getViewsCount());
        verify(propertyRepository, times(1)).save(prop);
    }
}
