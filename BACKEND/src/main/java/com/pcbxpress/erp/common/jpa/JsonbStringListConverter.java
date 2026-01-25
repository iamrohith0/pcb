package com.pcbxpress.erp.common.jpa;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.List;

/**
 * Converts List<String> <-> JSON for jsonb columns
 * Hibernate 6 + Postgres friendly
 */
@Converter(autoApply = false)
public class JsonbStringListConverter implements AttributeConverter<List<String>, String> {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        try {
            return MAPPER.writeValueAsString(attribute == null ? List.of() : attribute);
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to convert List<String> to JSON", e);
        }
    }

    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        try {
            if (dbData == null || dbData.isBlank()) return List.of();
            return MAPPER.readValue(dbData, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
