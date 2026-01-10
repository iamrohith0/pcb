// src/lib/gerberParser.js
// Lightweight Gerber (RS-274X) parser for DFM validation
// Supports basic aperture definitions, coordinates, and layer types

export class GerberParser {
  constructor() {
    this.layers = new Map();
    this.apertures = new Map();
    this.currentLayer = null;
    this.currentAperture = null;
    this.coordinates = [];
    this.minX = Infinity;
    this.maxX = -Infinity;
    this.minY = Infinity;
    this.maxY = -Infinity;
  }

  parse(gerberContent) {
    const lines = gerberContent.split('\n');
    let currentLayer = null;
    let layerData = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('G04') || line.startsWith('%')) {
        continue; // Skip comments and parameter blocks
      }

      const result = this.parseLine(line, currentLayer);
      if (result.layerChanged && result.layerName) {
        currentLayer = result.layerName;
        layerData = this.getOrCreateLayer(currentLayer);
      }
    }

    return this.analyzeBoard();
  }

  parseLine(line, currentLayer) {
    const result = { layerChanged: false, layerName: null };

    // Layer identification
    if (line.includes('TOP') || line.includes('COPPER') || line.includes('GTL') || line.includes('G1')) {
      result.layerChanged = true;
      result.layerName = 'top_copper';
    } else if (line.includes('BOT') || line.includes('GBL') || line.includes('G2')) {
      result.layerChanged = true;
      result.layerName = 'bottom_copper';
    } else if (line.includes('SOLDMASK') || line.includes('GTS') || line.includes('G4')) {
      result.layerChanged = true;
      result.layerName = 'top_soldermask';
    } else if (line.includes('GBS') || line.includes('G5')) {
      result.layerChanged = true;
      result.layerName = 'bottom_soldermask';
    } else if (line.includes('SILK') || line.includes('GTO') || line.includes('G6')) {
      result.layerChanged = true;
      result.layerName = 'top_silkscreen';
    } else if (line.includes('GBO') || line.includes('G7')) {
      result.layerChanged = true;
      result.layerName = 'bottom_silkscreen';
    } else if (line.includes('DRILL') || line.includes('TXT') || line.includes('G8')) {
      result.layerChanged = true;
      result.layerName = 'drill';
    } else if (line.includes('EDGE') || line.includes('GKO') || line.includes('G9')) {
      result.layerChanged = true;
      result.layerName = 'outline';
    }

    // Aperture definitions
    if (line.startsWith('AD')) {
      this.parseAperture(line);
    }

    // Coordinate data
    if (line.match(/^[XY][0-9]+/)) {
      this.parseCoordinate(line);
    }

    return result;
  }

  parseAperture(line) {
    // Simple aperture parsing for round and rectangular apertures
    const match = line.match(/D(\d+)([CRO])([^,]*),([^*]*)/);
    if (match) {
      const [, number, type, param1, param2] = match;
      const aperture = {
        number: parseInt(number),
        type: type === 'C' ? 'circle' : type === 'R' ? 'rectangle' : 'oblong',
        size1: parseFloat(param1),
        size2: parseFloat(param2) || parseFloat(param1),
      };
      this.apertures.set(aperture.number, aperture);
    }
  }

  parseCoordinate(line) {
    // Extract X and Y coordinates
    const xMatch = line.match(/X([0-9.]+)/);
    const yMatch = line.match(/Y([0-9.]+)/);
    
    if (xMatch && yMatch) {
      const x = parseFloat(xMatch[1]);
      const y = parseFloat(yMatch[1]);
      
      this.minX = Math.min(this.minX, x);
      this.maxX = Math.max(this.maxX, x);
      this.minY = Math.min(this.minY, y);
      this.maxY = Math.max(this.maxY, y);

      this.coordinates.push({ x, y, layer: this.currentLayer });
    }
  }

  getOrCreateLayer(layerName) {
    if (!this.layers.has(layerName)) {
      this.layers.set(layerName, {
        name: layerName,
        features: [],
        apertures: new Set(),
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity,
      });
    }
    this.currentLayer = layerName;
    return this.layers.get(layerName);
  }

  analyzeBoard() {
    const layers = Array.from(this.layers.values());
    const boardWidth = this.maxX - this.minX;
    const boardHeight = this.maxY - this.minY;

    return {
      layers,
      dimensions: {
        width: boardWidth,
        height: boardHeight,
        minX: this.minX,
        maxX: this.maxX,
        minY: this.minY,
        maxY: this.maxY,
      },
      layerCount: layers.length,
      hasTopCopper: layers.some(l => l.name === 'top_copper'),
      hasBottomCopper: layers.some(l => l.name === 'bottom_copper'),
      hasSoldermask: layers.some(l => l.name.includes('soldermask')),
      hasSilkscreen: layers.some(l => l.name.includes('silkscreen')),
      hasDrill: layers.some(l => l.name === 'drill'),
      hasOutline: layers.some(l => l.name === 'outline'),
    };
  }
}

// Capability rules engine
export class CapabilityRules {
  constructor(rules = {}) {
    this.rules = {
      minTraceWidth: rules.minTraceWidth || 0.1, // mm
      minSpace: rules.minSpace || 0.1, // mm
      minAnnularRing: rules.minAnnularRing || 0.15, // mm
      maxDrillAspectRatio: rules.maxDrillAspectRatio || 10,
      minDrillSize: rules.minDrillSize || 0.2, // mm
      maxBoardSize: rules.maxBoardSize || { width: 600, height: 600 }, // mm
      minBoardSize: rules.minBoardSize || { width: 10, height: 10 }, // mm
      ...rules,
    };
  }

  validateBoard(boardData) {
    const violations = [];
    const warnings = [];

    // Board size validation
    if (boardData.dimensions.width < this.rules.minBoardSize.width || 
        boardData.dimensions.height < this.rules.minBoardSize.height) {
      violations.push({
        type: 'board_size_too_small',
        severity: 'fail',
        message: `Board dimensions (${boardData.dimensions.width.toFixed(2)} x ${boardData.dimensions.height.toFixed(2)}mm) are below minimum size requirements (${this.rules.minBoardSize.width} x ${this.rules.minBoardSize.height}mm)`,
        layer: 'outline',
      });
    }

    if (boardData.dimensions.width > this.rules.maxBoardSize.width || 
        boardData.dimensions.height > this.rules.maxBoardSize.height) {
      violations.push({
        type: 'board_size_too_large',
        severity: 'fail',
        message: `Board dimensions (${boardData.dimensions.width.toFixed(2)} x ${boardData.dimensions.height.toFixed(2)}mm) exceed maximum size limits (${this.rules.maxBoardSize.width} x ${this.rules.maxBoardSize.height}mm)`,
        layer: 'outline',
      });
    }

    // Layer validation
    if (!boardData.hasTopCopper && !boardData.hasBottomCopper) {
      violations.push({
        type: 'no_copper_layers',
        severity: 'fail',
        message: 'No copper layers detected in Gerber files',
        layer: 'copper',
      });
    }

    if (!boardData.hasDrill) {
      warnings.push({
        type: 'no_drill_file',
        severity: 'warn',
        message: 'No drill file detected - assuming no through-hole components',
        layer: 'drill',
      });
    }

    if (!boardData.hasOutline) {
      violations.push({
        type: 'no_outline',
        severity: 'fail',
        message: 'No board outline detected in Gerber files',
        layer: 'outline',
      });
    }

    // Soldermask validation
    if (boardData.hasTopCopper && !boardData.hasSoldermask) {
      warnings.push({
        type: 'no_soldermask',
        severity: 'warn',
        message: 'Soldermask layer missing for copper layers',
        layer: 'soldermask',
      });
    }

    return {
      violations,
      warnings,
      isValid: violations.length === 0,
      hasWarnings: warnings.length > 0,
    };
  }

  validateLayer(layerData) {
    const violations = [];
    const warnings = [];

    // Check for minimum feature sizes based on layer type
    switch (layerData.name) {
      case 'top_copper':
      case 'bottom_copper':
        // Copper layer specific checks would go here
        // For now, we'll add generic warnings
        if (layerData.features.length === 0) {
          warnings.push({
            type: 'empty_copper_layer',
            severity: 'warn',
            message: `Copper layer '${layerData.name}' appears to be empty`,
            layer: layerData.name,
          });
        }
        break;

      case 'drill':
        // Drill-specific validation
        if (layerData.features.length === 0) {
          warnings.push({
            type: 'no_drill_features',
            severity: 'warn',
            message: 'No drill features detected',
            layer: 'drill',
          });
        }
        break;

      case 'outline':
        // Outline validation
        if (layerData.features.length === 0) {
          violations.push({
            type: 'no_outline_features',
            severity: 'fail',
            message: 'No board outline features detected',
            layer: 'outline',
          });
        }
        break;
    }

    return { violations, warnings };
  }
}

// Main DFM analyzer that combines parsing and validation
export class DFMAnalyzer {
  constructor(rules = {}) {
    this.parser = new GerberParser();
    this.rulesEngine = new CapabilityRules(rules);
  }

  async analyze(files) {
    const results = {
      files: [],
      board: null,
      violations: [],
      warnings: [],
      summary: {
        totalViolations: 0,
        totalWarnings: 0,
        criticalIssues: [],
        layerIssues: {},
      },
    };

    // Process each uploaded file
    for (const file of files) {
      try {
        const content = await this.readFile(file);
        const layerData = this.parser.parse(content);
        
        results.files.push({
          name: file.name,
          size: file.size,
          type: this.detectLayerType(file.name),
          parsed: true,
          error: null,
        });

      } catch (error) {
        results.files.push({
          name: file.name,
          size: file.size,
          type: this.detectLayerType(file.name),
          parsed: false,
          error: error.message,
        });
      }
    }

    // Analyze the complete board
    const boardData = this.parser.analyzeBoard();
    results.board = boardData;

    // Validate board-level rules
    const boardValidation = this.rulesEngine.validateBoard(boardData);
    results.violations.push(...boardValidation.violations);
    results.warnings.push(...boardValidation.warnings);

    // Validate individual layers
    boardData.layers.forEach(layer => {
      const layerValidation = this.rulesEngine.validateLayer(layer);
      results.violations.push(...layerValidation.violations);
      results.warnings.push(...layerValidation.warnings);
      
      if (layerValidation.violations.length > 0 || layerValidation.warnings.length > 0) {
        results.summary.layerIssues[layer.name] = {
          violations: layerValidation.violations.length,
          warnings: layerValidation.warnings.length,
        };
      }
    });

    // Generate summary
    results.summary.totalViolations = results.violations.length;
    results.summary.totalWarnings = results.warnings.length;
    results.summary.criticalIssues = results.violations
      .filter(v => v.severity === 'fail')
      .map(v => v.message);

    return results;
  }

  async readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  detectLayerType(filename) {
    const name = filename.toLowerCase();
    if (name.includes('gtl') || name.includes('top') || name.includes('copper')) return 'top_copper';
    if (name.includes('gbl') || name.includes('bottom')) return 'bottom_copper';
    if (name.includes('gts') || name.includes('soldermask')) return 'top_soldermask';
    if (name.includes('gbs')) return 'bottom_soldermask';
    if (name.includes('gto') || name.includes('silkscreen')) return 'top_silkscreen';
    if (name.includes('gbo')) return 'bottom_silkscreen';
    if (name.includes('txt') || name.includes('drill')) return 'drill';
    if (name.includes('gko') || name.includes('outline')) return 'outline';
    return 'unknown';
  }
}

// Export default instance with standard rules
export const dfmAnalyzer = new DFMAnalyzer({
  minTraceWidth: 0.1, // 4mil
  minSpace: 0.1, // 4mil
  minAnnularRing: 0.15, // 6mil
  maxDrillAspectRatio: 10,
  minDrillSize: 0.2, // 8mil
  maxBoardSize: { width: 600, height: 600 }, // 24" max
  minBoardSize: { width: 10, height: 10 }, // 10mm min
});