package com.pcbxpress.erp.modules.warehouse.controller;

import com.pcbxpress.erp.modules.stub.AbstractStubController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({
    "/warehouse",
    "/warehouse/**",
    "/api/warehouse",
    "/api/warehouse/**"
})
public class WarehouseStubController extends AbstractStubController {
}
