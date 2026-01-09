package com.pcbxpress.erp.modules.logistics.controller;

import com.pcbxpress.erp.modules.stub.AbstractStubController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({
    "/logistics",
    "/logistics/**",
    "/api/logistics",
    "/api/logistics/**"
})
public class LogisticsStubController extends AbstractStubController {
}
