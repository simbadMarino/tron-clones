const { keccak256 } = require("js-sha3");
const bs58 = require("bs58").default || require("bs58");
const { createHash } = require("crypto");

/**
 * Minimal Proxy (EIP-1167) Bytecode Template
 * A minimal proxy contract that delegates all calls to the implementation contract
 */
const MIN_PROXY_BYTECODE_PREFIX = "3d602d80600a3d3981f3363d3d373d3d3d363d73";
const MIN_PROXY_BYTECODE_SUFFIX = "5af43d82803e903d91602b57fd5bf341";

const ADDRESS_SIZE = 34;
const ADDRESS_PREFIX_BYTE = 0x41;

function isValidAddress(address) {
  if (address.length !== ADDRESS_SIZE || !address.startsWith("T")) {
    return false;
  }

  let decodeAddr = bs58.decode(address);
  if (decodeAddr.length !== 25) return false;

  if (decodeAddr[0] !== ADDRESS_PREFIX_BYTE) return false;

  const checkSum = decodeAddr.slice(21);
  decodeAddr = decodeAddr.slice(0, 21);

  const hash0 = hexToBytes(sha256(decodeAddr));
  const hash1 = hexToBytes(sha256(hash0));
  const checkSum1 = hash1.slice(0, 4);

  if (
    checkSum[0] == checkSum1[0] &&
    checkSum[1] == checkSum1[1] &&
    checkSum[2] == checkSum1[2] &&
    checkSum[3] == checkSum1[3]
  )
    return true;

  return false;
}

function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function stringToHex(str, size) {
  const bytes = Buffer.from(str, "utf8");
  if (bytes.length > size) {
    throw new Error(`String is too long for size ${size}`);
  }

  const padded = Buffer.alloc(size);
  bytes.copy(padded);

  return padded.toString("hex");
}

function toHex(base58) {
  const bytes = bs58.decode(base58);
  return Buffer.from(bytes.slice(1)).toString("hex").slice(0, 40);
}

function fromHex(hex) {
  const addr = `41${hex}`;
  const addrBytes = hexToBytes(addr);
  const doubleHash = sha256(hexToBytes(sha256(addrBytes)));
  const checkSum = doubleHash.substring(0, 8);
  return bs58.encode(Buffer.from(addr + checkSum, 'hex'));
}

const predictDeterministicAddress = ({
  implementation,
  deployer,
  salt,
}) => {
  if (!isValidAddress(implementation)) {
    throw new Error(`Invalid implementation address: ${implementation}`);
  }

  if (!isValidAddress(deployer)) {
    throw new Error(`Invalid deployer address: ${deployer}`);
  }

  if (salt.length > 32) {
    throw new Error(`Salt must be less than 32 characters: ${salt}`);
  }

  const saltHex = stringToHex(salt, 32);
  const cleanImplementation = toHex(implementation).toLowerCase();
  const cleanDeployer = toHex(deployer).toLowerCase();
  console.log(cleanImplementation);
  console.log(cleanDeployer);

  let bytecode = `${MIN_PROXY_BYTECODE_PREFIX}${cleanImplementation}${MIN_PROXY_BYTECODE_SUFFIX}${cleanDeployer}${saltHex}`;

  const firstPart = bytecode.slice(0, 110);
  const firstBytes = Buffer.from(firstPart, "hex");
  const firstHash = keccak256(firstBytes);
  bytecode += firstHash;

  const secondPart = bytecode.slice(110, 280);
  const secondBytes = Buffer.from(secondPart, "hex");
  const secondHash = keccak256(secondBytes);

  const addressHex = secondHash.slice(-40);

  return fromHex(addressHex);
};

module.exports = { predictDeterministicAddress, stringToHex };