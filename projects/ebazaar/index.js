const sdk = require('@defillama/sdk');
const bazaarsJSON = require('./bazaar.json');

const addresses = {
    "arbitrum": ["0x20944A6eb6C3c390F99C15470DF2C36623795771"]
};

const abi = {
    "balanceOf": "function balanceOf(address, address) view returns (uint256)"
}

async function arbiTvl(timestamp, ethBlock, chainBlocks) {
    return tvl(timestamp, chainBlocks, 'arbitrum', addr => 'arbitrum:'+addr);
}

async function tvl(timestamp, chainBlocks, chain, transformAddress=addr=>addr) {
    let bazaarsArray = [];
    let balances = {};
    let block;

    for (const [bazaarContract, lockedToken] of Object.entries(bazaarsJSON[chain])) {
        bazaarsArray.push([lockedToken, bazaarContract]);
    }

    block = chainBlocks[chain];

    let tokenBalances = (await sdk.api.abi.multiCall({
        block: block,
        calls: addresses[chain].map(address=> bazaarsArray.map((bazaar) => ({
            target: address,
            params: bazaar
        }))).flat(),
        abi: abi.balanceOf,
        chain: chain
    })).output.map(t => t.output);

    for (let index = 0; index < bazaarsArray.length; index++) {
        sdk.util.sumSingleBalance(
          balances,
          transformAddress(bazaarsArray[index][0]),
          tokenBalances[index]
        );
      }
    return balances;
}
module.exports = {
    arbitrum: {
        tvl: arbiTvl
    }
}