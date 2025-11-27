# Configuration Management Migration Guide

## Overview

The project has been migrated from a mix of `config.json`, `.env`, and hardcoded paths to **strictly using Environment Variables** (`.env`) for all configuration. This provides better security, flexibility, and follows best practices for configuration management.

## What Changed

### Before
- Configuration was stored in `config.json`
- Some paths were hardcoded in Python files
- No validation of required configuration values
- Mixed configuration sources

### After
- All configuration is now in `.env` file (environment variables)
- Uses `pydantic-settings` for validation
- Application fails to start if required variables are missing
- Single source of truth for configuration

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

This will install `pydantic-settings` and other required packages.

### 2. Create Your `.env` File

Copy the example file:

```bash
# On Windows (PowerShell)
Copy-Item .env.example .env

# On Linux/Mac
cp .env.example .env
```

### 3. Configure Your Environment Variables

Edit `.env` and set your values:

```env
# Required: API Key
GEMINI_API_KEY=your_actual_api_key_here

# Optional: Override default paths if needed
# FABRIC_DIR=fabric_swatches
# MOCKUP_DIR=mockups
# etc...
```

### 4. Verify Configuration

When you run any Python script, it will:
- Load configuration from `.env`
- Validate all required variables
- Create necessary directories
- Display configuration status

If any required variable is missing, the application will fail with a clear error message.

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` |

### Optional Variables (with defaults)

#### Directory Paths
- `FABRIC_DIR` (default: `fabric_swatches`)
- `MOCKUP_DIR` (default: `mockups`)
- `MASK_DIR` (default: `masks`)
- `SILHOUETTE_DIR` (default: `silhouettes`)
- `MOCKUP_OUTPUT_DIR` (default: `generated_mockups`)
- `PDF_OUTPUT_DIR` (default: `generated_techpacks`)
- `EXCEL_DIR` (default: `Excel_files`)
- `IMAGE_DIR` (default: `images`)
- `TECHPACK_TEMPLATE_DIR` (default: `techpack_templates`)

#### Database Files
- `FABRIC_DATABASE_FILE` (default: `fabric_database.xlsx`)

#### Static Files
- `TITLE_SLIDE_1_PATH` (default: `1st page.png`)
- `TITLE_SLIDE_2_PATH` (default: `2nd page.png`)

#### Image Settings
- `DEFAULT_FABRIC_RESOLUTION_WIDTH` (default: `2000`)
- `DEFAULT_FABRIC_RESOLUTION_HEIGHT` (default: `2000`)
- `OUTPUT_FORMAT` (default: `PNG`)
- `OUTPUT_QUALITY` (default: `95`)

#### Techpack Coordinates
- `TECHPACK_TOTAL_TEMPLATE_WIDTH_PX` (default: `2480`)
- `TECHPACK_TOTAL_TEMPLATE_HEIGHT_PX` (default: `3508`)
- `TECHPACK_SELECTION_X_PX` (default: `0`)
- `TECHPACK_SELECTION_Y_PX` (default: `0`)
- `TECHPACK_SELECTION_WIDTH_PX` (default: `2480`)
- `TECHPACK_SELECTION_HEIGHT_PX` (default: `3508`)

#### Flask Server Settings
- `FLASK_HOST` (default: `0.0.0.0`)
- `FLASK_PORT` (default: `5000`)
- `FLASK_DEBUG` (default: `true`)

## Migration from config.json

If you had a `config.json` file, here's how to convert it:

### Old config.json:
```json
{
  "paths": {
    "fabric_dir": "fabric_swatches",
    "mockup_dir": "mockups",
    "mask_dir": "masks",
    "mockup_output_dir": "generated_mockups",
    "pdf_output_dir": "generated_techpacks"
  },
  "settings": {
    "default_fabric_resolution": [2000, 2000],
    "output_format": "PNG",
    "output_quality": 95
  }
}
```

### New .env:
```env
FABRIC_DIR=fabric_swatches
MOCKUP_DIR=mockups
MASK_DIR=masks
MOCKUP_OUTPUT_DIR=generated_mockups
PDF_OUTPUT_DIR=generated_techpacks
DEFAULT_FABRIC_RESOLUTION_WIDTH=2000
DEFAULT_FABRIC_RESOLUTION_HEIGHT=2000
OUTPUT_FORMAT=PNG
OUTPUT_QUALITY=95
```

## Using Configuration in Code

### Before:
```python
import json
with open('config.json', 'r') as f:
    config = json.load(f)
FABRIC_DIR = config['paths']['fabric_dir']
```

### After:
```python
from config import settings

# Use settings directly
FABRIC_DIR = str(settings.fabric_dir_path)  # Returns absolute Path
# Or
FABRIC_DIR = settings.FABRIC_DIR  # Returns string value
```

## Benefits

1. **Security**: Sensitive data (API keys) not in version control
2. **Validation**: Application won't start with missing/invalid config
3. **Flexibility**: Easy to override for different environments
4. **Best Practices**: Industry-standard approach
5. **Type Safety**: Pydantic provides type validation

## Troubleshooting

### Error: "Failed to load configuration"

**Cause**: Missing required environment variable (likely `GEMINI_API_KEY`)

**Solution**: 
1. Ensure `.env` file exists
2. Set `GEMINI_API_KEY` in `.env`
3. Restart the application

### Error: "Import pydantic could not be resolved"

**Cause**: Dependencies not installed

**Solution**: 
```bash
pip install -r requirements.txt
```

### Paths not working

**Cause**: Paths in `.env` might be incorrect

**Solution**:
- Use absolute paths: `/full/path/to/directory`
- Or relative paths: `relative/path` (relative to PROJECT_ROOT)
- Check that directories exist or will be created automatically

## Next Steps

1. ✅ Install dependencies: `pip install -r requirements.txt`
2. ✅ Create `.env` from `.env.example`
3. ✅ Set `GEMINI_API_KEY` in `.env`
4. ✅ Test by running: `python api_server.py`
5. ✅ Remove old `config.json` (optional, kept for reference)

## Notes

- The old `config.json` file can be kept for reference but is no longer used
- All Python files now import from `config.py` which loads from `.env`
- Configuration is validated on application startup
- Missing required variables will cause the application to fail immediately with clear error messages

