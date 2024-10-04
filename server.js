const express = require("express");
const EC = require("elliptic").ec;
const CryptoJS = require("crypto-js");
const { v4: uuidv4 } = require("uuid");

// Initialize elliptic curve
const ec = new EC("secp256k1");

// Generate key pair (could store this or reuse across requests)
const keyPair = ec.genKeyPair();

// Express app setup
const app = express();
const port = 3000;

// Function to hash data
function hash(data) {
  return CryptoJS.SHA256(data).toString();
}

// Convert hash to integer (hex to decimal)
function hashToInt(hash) {
  return parseInt(hash, 16);
}

// VRF Generation
function generateVRF(keyPair, input) {
  const hashPoint = hash(input);
  const signature = keyPair.sign(hashPoint);
  return { proof: signature, output: hash(hashPoint) };
}

// Function to map VRF output to a range
function getRandomIntFromVRF(min, max, output) {
  const hashInt = hashToInt(output);
  return (hashInt % (max - min + 1)) + min;
}

// Dynamic input generation
function getDynamicInput() {
  const timestamp = Date.now().toString();
  const randomNum = Math.random().toString();
  const uniqueId = uuidv4();
  const envVar = process.env.USER || "defaultUser";

  return `timestamp:${timestamp}-random:${randomNum}-uuid:${uniqueId}-env:${envVar}`;
}

// Define an API route
app.get("/random", (req, res) => {
  const min = parseInt(req.query.min) || 1;
  const max = parseInt(req.query.max) || 100;

  if (min >= max) {
    return res
      .status(400)
      .send({ error: "Min value should be less than Max value" });
  }

  // Generate dynamic input and VRF output
  const input = getDynamicInput();
  const { output } = generateVRF(keyPair, input);

  // Map the VRF output to the range between min and max
  const randomInt = getRandomIntFromVRF(min, max, output);

  res.json({ min, max, randomInt });
});

// Start server
app.listen(port, () => {
  console.log(`API server listening at http://localhost:${port}`);
});
