# Tron Clones

A TRC-1167 and Deterministic Deployment Proxy implementation and demostration for TRON Blockchain

## Overview

**Project Features**

* Minimal Proxy Contracts Deployment (TRC-1167)
* Determinisct Deployment Proxy
* CREATE2 Clones Factory
* CREATE Clones Factory
* CREATE2 Prediction
* Bytecode deployments

**Non-SC related**

* Private key leak detection on pre-commit (prevents accidental pk uploads to version control systems like github)

## Prerequisites

- Node.js >= 14.0.0
- PNPM or NPM
- TronBox CLI
- TRX for deployment and testing on Shasta or Nile testnet
- openzeppelin/contracts v5.4.0

## Installation

```bash
# Clone the repository
git clone https://github.com/simbadmarino/tron-clones.git
cd tron-clones

# Install dependencies
pnpm install
```

## Configuration

1. Prepare a `.env` file in root:

```bash
cp .env.example .env
```

2. Paste you private key depending on selected network (Nile, Shasta, Mainnet), be extra careful not to mix mainnet and testnet private keys.
3. Setup your compiler and RPC settings in `tronbox.js` as needed.

## Usage

### Compile Contracts

```bash
pnpm compile
```

### Deploy Contracts

Deploy to testnet:

```bash
pnpm deploy:nile #Deploy contract to Nile testnet
pnpm deploy:shasta #Deploy contract to shasta testnet
```

### Run Tests

```bash
pnpm test:nile    #Test using Nile testnet
pnpm test:shasta  #Test using Shasta testnet
```

## Contract Architecture

### Main Contracts

**DeployClone.sol**:

- TRON Clones Factory contract demonstrating TRC-1167 functionality

**SmartSweeperAccount.sol**

- TRC-20 tokens + TRX sweeper contract template, tailored to be deployed wither using *cloneCreate2WithArgs()* or *cloneCreateWithArgs()*
- Demonstrates contract owner "initialization" through Clones library  `cloneWithImmutableArgs()` and `cloneDeterministicWithImmutableArgs()` functions, eliminating risks of init front-running

**DeterministicDeploymentProxy.sol (Under development)**

* (Experimental) Demostrates Deterministic Deployment Proxy for TRON
* It takes a contract bytecode and deploys it using CREATE2
* Eventually aming to be fully compatible with https://github.com/Arachnid/deterministic-deployment-proxy
* Not fully tested yet

### Libraries and Utils

**libs/Clones.sol**: Based on OpenZeppelin's minimal proxy contracts Library

- Minimal proxy pattern for energy-efficient deployments (42k-52k energy per deployed clone)
- Deterministic (create2) address calculation
- Indeterministic (create) contract deployment
- `predictDeterministicAddress`() function was modified so it works for TRON (CREATE2 prefix is 0x41)

**util/Create2.sol:** Based on OpenZeppelin's create2 library

* TRON port from OpenZeppelin Create2 helper, `computeAddress()` function was modified to use TRON's create2 prefix 0x41 instead of 0xff

## How does it work?

1. **TRC-1167 Clone Pattern**: Instead of deploying full contract bytecode each time, the DeployClone Factory deploys minimal proxies that delegate calls to an implementation contract, saving significant gas costs. Storage is kept on the clone but main contract functionallity still remains in the Implementation contract. Note that currently tronscan does offer an automated way to verify and upload abi data to contracts, meaning you won't be able to execute manual tests directly, nevertheless you can utilize tronbox console or tronweb to perform testing.
2. **SmartSweeperAccount:** This contract serves as a template implementation so it can be referenced by utilizing the `cloneCreate2WithArgs` and `cloneCreateWithArgs` functions from DeployClone factory contract.
