package com.pcbxpress.erp.modules.quality.controller;

import com.pcbxpress.erp.modules.stub.AbstractStubController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({
    "/quality",
    "/quality/**",
    "/api/quality",
    "/api/quality/**"
})
public class QualityStubController extends AbstractStubController {
}
