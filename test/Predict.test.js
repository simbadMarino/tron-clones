const { predictDeterministicAddress } = require("../lib/create2");

describe('Predict Address', () => {
  it('should predict the address', () => {
    const address = predictDeterministicAddress({
      implementation: "TL2ScqgY9ckK5h1VQExuMNrweyVSSdAtHa",
      deployer: "TFgphAx29XEwrS8feFMpPfqzypjYzNysSH",
      salt: "tron-network-salt",
    });
    console.log("Predicted Address:", address);
    assert.equal(address, "TQGeReoGywayLjiFDedvJTrxAALh7uZnqH");
  });
});