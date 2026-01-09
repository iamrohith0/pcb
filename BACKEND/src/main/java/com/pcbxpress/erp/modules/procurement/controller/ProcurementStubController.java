package com.pcbxpress.erp.modules.procurement.controller;

import com.pcbxpress.erp.modules.stub.AbstractStubController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({
    "/procurement",
    "/procurement/**",
    "/api/procurement",
    "/api/procurement/**"
})
public class ProcurementStubController extends AbstractStubController {
}
