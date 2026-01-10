package com.pcbxpress.erp.modules.engineering.cam.dto;

import com.pcbxpress.erp.modules.engineering.cam.model.CamOutput;
import com.pcbxpress.erp.modules.engineering.cam.model.OutputStatus;
import com.pcbxpress.erp.modules.engineering.cam.model.OutputType;
import java.time.OffsetDateTime;
import java.util.UUID;

public record CamOutputDto(
    UUID id,
    UUID camJobId,
    OutputType outputType,
    String fileName,
    String filePath,
    Long fileSize,
    String fileFormat,
    String layers,
    Double resolution,
    String units,
    Double scale,
    boolean mirrored,
    boolean positive,
    String apertureFormat,
    String coordinateFormat,
    String zeroSuppression,
    boolean leadingZero,
    boolean trailingZero,
    Integer decimalPlaces,
    Integer integerPlaces,
    UUID createdBy,
    String createdByName,
    OutputStatus status,
    OffsetDateTime generatedAt,
    Integer downloadCount,
    OffsetDateTime lastDownloadedAt,
    String checksum,
    Integer version,
    String notes
) {
    public static CamOutputDto fromEntity(CamOutput camOutput) {
        return new CamOutputDto(
            camOutput.getId(),
            camOutput.getCamJobId(),
            camOutput.getOutputType(),
            camOutput.getFileName(),
            camOutput.getFilePath(),
            camOutput.getFileSize(),
            camOutput.getFileFormat(),
            camOutput.getLayers(),
            camOutput.getResolution(),
            camOutput.getUnits(),
            camOutput.getScale(),
            camOutput.isMirrored(),
            camOutput.isPositive(),
            camOutput.getApertureFormat(),
            camOutput.getCoordinateFormat(),
            camOutput.getZeroSuppression(),
            camOutput.isLeadingZero(),
            camOutput.isTrailingZero(),
            camOutput.getDecimalPlaces(),
            camOutput.getIntegerPlaces(),
            camOutput.getCreatedBy(),
            camOutput.getCreatedByName(),
            camOutput.getStatus(),
            camOutput.getGeneratedAt(),
            camOutput.getDownloadCount(),
            camOutput.getLastDownloadedAt(),
            camOutput.getChecksum(),
            camOutput.getVersion(),
            camOutput.getNotes()
        );
    }
}