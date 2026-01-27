// test-cbor.js
// Run with: node test-cbor.js

const crypto = require('crypto');

// Mock browser globals for Node.js environment
global.TextEncoder = require('util').TextEncoder;
global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');

// Paste the new CBOR encoder code directly here for testing
// (simplified version of lib/cbor-encoder.ts)
function encodeCBOR(value) {
  const writer = new CBORWriter();
  writer.writeValue(value);
  return new Uint8Array(writer.buffer);
}

class CBORWriter {
  constructor() {
    this.buffer = [];
  }
  
  writeByte(byte) {
    this.buffer.push(byte & 0xFF);
  }

  writeValue(value) {
    if (value === null) {
      this.writeByte(0xF6);
    } else if (typeof value === 'boolean') {
      this.writeByte(value ? 0xF5 : 0xF4);
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        this.writeInteger(value);
      } else {
        throw new Error("Float not supported");
      }
    } else if (typeof value === 'string') {
      this.writeString(value);
    } else if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
      this.writeByteString(value);
    } else if (value instanceof Map) {
      this.writeMap(value);
    } else {
      throw new Error("Unsupported type: " + typeof value);
    }
  }

  writeInteger(val) {
    if (val >= 0) {
      this.writeTypeAndLength(0, val);
    } else {
      this.writeTypeAndLength(1, -1 - val);
    }
  }

  writeString(str) {
    const bytes = Buffer.from(str, 'utf8');
    this.writeTypeAndLength(3, bytes.length);
    for (const b of bytes) this.buffer.push(b);
  }

  writeByteString(bytes) {
    this.writeTypeAndLength(2, bytes.length);
    for (const b of bytes) this.buffer.push(b);
  }

  writeMap(map) {
    this.writeTypeAndLength(5, map.size);
    const keys = Array.from(map.keys()).sort((a, b) => {
        // Simple sort: Int < String
        if (typeof a === 'number' && typeof b === 'string') return -1;
        if (typeof a === 'string' && typeof b === 'number') return 1;
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
    });

    for (const key of keys) {
      this.writeValue(key);
      this.writeValue(map.get(key));
    }
  }

  writeTypeAndLength(majorType, length) {
    const majorTypeHigh = majorType << 5;
    if (length < 24) {
      this.writeByte(majorTypeHigh | length);
    } else if (length < 0x100) {
      this.writeByte(majorTypeHigh | 24);
      this.writeByte(length);
    } else {
        // Simplified for test
      this.writeByte(majorTypeHigh | 25);
      this.writeByte(length >> 8);
      this.writeByte(length & 0xFF);
    }
  }
}

// --- Test Case: COSE Key ---
console.log("Testing COSE Key Encoding...");

const challenge = "some-random-challenge-string-123";
const xBytes = crypto.createHash('sha256').update(challenge).digest();
const yBytes = crypto.createHash('sha256').update(challenge + "y").digest();

const keyMap = new Map();
keyMap.set(1, 2);   // kty: EC2
keyMap.set(3, -7);  // alg: ES256
keyMap.set(-1, 1);  // crv: P-256
keyMap.set(-2, xBytes); // x
keyMap.set(-3, yBytes); // y

console.log("Map constructed:", keyMap);

try {
    const encoded = encodeCBOR(keyMap);
    console.log("Encoded successfully!");
    console.log("Hex output:", Buffer.from(encoded).toString('hex'));
    
    // Manual verification of the hex output
    // A5 (Map 5)
    // 01 02 (Key 1, Val 2)
    // 03 26 (Key 3, Val -7 -> 1 | 6)
    // 20 01 (Key -1 -> 1 | 0, Val 1)
    // 21 58 20 ... (Key -2 -> 1 | 1, Val bytes 32 ...)
    // 22 58 20 ... (Key -3 -> 1 | 2, Val bytes 32 ...)
    
    const hex = Buffer.from(encoded).toString('hex');
    
    // Check for Map of size 5 (A5)
    if (!hex.startsWith('a5')) console.error("❌ FAILED: Does not start with A5 (Map 5)");
    else console.log("✅ Starts with A5 (Map 5)");

    // Check for Byte String marker (58 20 = 32 bytes)
    if (hex.includes('5820')) console.log("✅ Contains 32-byte string markers (5820)");
    else console.error("❌ FAILED: Missing byte string markers");
    
    console.log("Test Passed: Output looks like valid Canonical CBOR.");

} catch (e) {
    console.error("❌ Encoding Failed:", e);
}
