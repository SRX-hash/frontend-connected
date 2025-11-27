"""
Mockup Generator 2.0 - Command Line Interface
Allows manual mockup generation from terminal

V2.2 Update: Uses environment variables for configuration
"""

import os
import sys
# Ensure new library is imported
from mockup_library import MockupGeneratorV2
# Import settings from config.py (uses pydantic-settings with .env file)
from config import settings


def main():
    """Interactive command-line mockup generator"""
    
    print("\n" + "="*60)
    print("🎨 SRX MOCKUP GENERATOR 2.2")
    print("   Stretch-to-Fit Fabric Application")
    print("   (Auto-detects face/back)")
    print("   Configuration: Environment Variables (.env)")
    print("="*60 + "\n")
    
    # Use configuration from environment variables
    FABRIC_DIR = str(settings.fabric_dir_path)
    MOCKUP_DIR = str(settings.mockup_dir_path)
    MASK_DIR = str(settings.mask_dir_path)
    OUTPUT_DIR = str(settings.mockup_output_dir_path)
    
    # Initialize generator
    generator = MockupGeneratorV2(
        fabric_dir=FABRIC_DIR,
        mockup_dir=MOCKUP_DIR,
        mask_dir=MASK_DIR,
        output_dir=OUTPUT_DIR
    )
    
    # Get user input
    print("📋 Enter the following details:\n")
    
    fabric_ref = input("  Fabric Reference Code (e.g., FAB-101): ").strip()
    if not fabric_ref:
        print("✗ Error: Fabric reference cannot be empty")
        return
    
    # Updated prompt
    mockup_name = input("  Garment Type (e.g., 'men polo' or 'Ladies Hoodie'): ").strip()
    if not mockup_name:
        print("✗ Error: Garment type cannot be empty")
        return
    
    # Custom output name is removed, as library now handles this
    
    # Generate mockup(s)
    # This now returns a list of paths
    result_paths = generator.generate_mockup(fabric_ref, mockup_name)
    
    if result_paths and len(result_paths) > 0:
        print(f"\n{'='*60}")
        print(f"✓ SUCCESS! Generated {len(result_paths)} mockup(s):")
        for path in result_paths:
            print(f"  ✓ Mockup saved to: {path}")
        print(f"{'='*60}\n")
    else:
        print(f"\n{'='*60}")
        print(f"✗ FAILED!")
        print(f"  No mockups were generated. Check error messages above.")
        print(f"{'='*60}\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n✗ Operation cancelled by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n✗ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)