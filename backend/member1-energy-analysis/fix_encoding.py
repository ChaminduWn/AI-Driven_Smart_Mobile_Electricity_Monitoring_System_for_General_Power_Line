#!/usr/bin/env python3
# Fix requirements.txt encoding
with open('requirements.txt', 'rb') as f:
    raw = f.read()

print(f"First 20 bytes (hex): {raw[:20].hex()}")

# Decode - try UTF-16LE first if BOM exists
if raw.startswith(b'\xff\xfe'):
    print("Detected UTF-16-LE, converting to UTF-8...")
    text = raw.decode('utf-16-le')
elif raw.startswith(b'\xfe\xff'):
    print("Detected UTF-16-BE, converting to UTF-8...")
    text = raw.decode('utf-16-be')
else:
    print("Treating as UTF-8 with possible null bytes...")
    text = raw.decode('utf-8', errors='ignore')

# Clean null bytes
text = text.replace('\x00', '').strip()

# Write clean UTF-8
with open('requirements.txt', 'w', encoding='utf-8') as f:
    f.write(text)

print("✓ File fixed successfully")
with open('requirements.txt', 'r') as f:
    lines = f.readlines()
    print(f"Total lines: {len(lines)}")
    print("First 3 lines:")
    for i, line in enumerate(lines[:3]):
        print(f"  {i+1}: {line.rstrip()}")
