// Dependencies
const fs = require('fs')
const { hdkey } = require('ethereumjs-wallet')
const { ethers } = require('ethers')

// Set up access to Ethereum network
const provider = new ethers.providers.JsonRpcProvider('https://kovan.infura.io/v3/50acc159b78a4261be428f5534707279')

// Use Metamask accounts for sending the call
const mnemonic = fs.readFileSync('seed/mnemonic.txt', 'utf8')

// Type conversion
const parseBytes = (hexString) => {
  return '0x' + hexString
}

// Command arguments
let fileName = process.argv[2]
let xPrv = process.argv[3]
let recoveryData = JSON.parse(fs.readFileSync(fileName))

// Get the private key from the HD key
let signingKey = hdkey.fromExtendedKey(xPrv)

// Set up the wallet for signing
let signingWallet = new ethers.Wallet('0x' + signingKey._hdkey.privateKey.toString('hex'))

// Set up the wallet for sending and paying gas
let sendingWallet = ethers.Wallet.fromMnemonic(mnemonic)
// Connect this wallet to the provider
let connectedSendingWallet = sendingWallet.connect(provider)

// Prepare the hash for signing
let hashBytes = ethers.utils.arrayify('0x' + recoveryData.hash)

// Interface to interact with the contract
const abi = JSON.parse(fs.readFileSync('ABI/IVBase.abi'))

// Instantiate the contract with the sendingWallet
const vWallet = new ethers.Contract(recoveryData.vWalletAddress, abi, connectedSendingWallet)

// Sign the message with the signingWallet (async)
signingWallet.signMessage(hashBytes).then((flatSig) => {
  let sig = ethers.utils.splitSignature(flatSig)
  console.log(sig.v, sig.r, sig.s)

  // Combine with Vesto signature
  let vArray = [recoveryData.vestoV, sig.v]
  let rArray = [parseBytes(recoveryData.vestoR), sig.r]
  let sArray = [parseBytes(recoveryData.vestoS), sig.s]

  let nonceBytes = parseBytes(recoveryData.nonce)

  // Just to check we're talking to the contract...
  vWallet.version()
    .then(o => console.log(o))
    .catch(e => console.log(e))

  // Get the balance...
  vWallet.balanceOf('0x7d741e8199718b6dae9327ca0df3f1444ff965fa')
    .then(o => console.log(o))
    .catch(e => console.log(e))

  // Recovery function
  let options = { gasPrice: 1000000000, gasLimit: 85000 };
  vWallet.setUserAddress(
      recoveryData.newUserAddress,
      nonceBytes,
      vArray,
      rArray,
      sArray,
      options)
    .then(o => console.log(o))
    .catch(e => console.log('Problems: ' + e))
})



