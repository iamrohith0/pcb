package com.pcbxpress.erp.modules.engineering.cam.dto;

import com.pcbxpress.erp.modules.engineering.cam.model.CamJobStatus;
import java.util.UUID;

public record CamJobPayload(
    String jobNumber,
    UUID customerId,
    String customerName,
    String partNumber,
    String revision,
    String description,
    Integer layerCount,
    Double boardThickness,
    Double copperThickness,
    String materialType,
    String solderMask,
    String legend,
    String surfaceFinish,
    Double panelSizeX,
    Double panelSizeY,
    String panelizationType,
    String routingType,
    boolean vScore,
    boolean tabRout,
    boolean castellatedHoles,
    boolean edgePlating,
    boolean impedanceControl,
    boolean testPoints,
    boolean fiducials,
    boolean toolingHoles,
    boolean referenceDesignators,
    boolean componentOutlines,
    String assemblyVariants,
    String specialInstructions,
    CamJobStatus status,
    String gerberFiles,
    UUID assignedTo,
    String assignedName,
    String priority,
    Double estimatedHours,
    Double actualHours,
    String notes
) {
}