package com.pcbxpress.erp.modules.inventory.controller;

import com.pcbxpress.erp.modules.stub.AbstractStubController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({
    "/inventory",
    "/inventory/**",
    "/api/inventory",
    "/api/inventory/**",
    "/stock",
    "/stock/**",
    "/api/stock",
    "/api/stock/**",
    "/serials",
    "/serials/**",
    "/api/serials",
    "/api/serials/**"
})
public class InventoryStubController extends AbstractStubController {
}
