// Dependencies
const fs = require('fs')
const Web3 = require('web3')
const hdkey = require('hdkey')

// Use Metamask accounts for sending the call
const mnemonic = fs.readFileSync('seed/mnemonic.txt', 'utf8')
const HDWalletProvider = require('@truffle/hdwallet-provider')

// Type conversion
const parseBytes = (hexString) => {
  // return Uint8Array.from(Buffer.from(hexString, 'hex'))
  return '0x' + hexString
}

let provider = new HDWalletProvider(mnemonic, 'https://kovan.infura.io/v3/50acc159b78a4261be428f5534707279')
let web3 = new Web3(provider)

// Command arguments
let fileName = process.argv[2]
let xPrv = process.argv[3]
let recoveryData = JSON.parse(fs.readFileSync(fileName))

// Coincover signature
let signingKey = hdkey.fromExtendedKey(xPrv)
let uI8 = Uint8Array.from(Buffer.from(recoveryData.hash, 'hex'))
let signature = signingKey.sign(uI8)
let coinCoverR = signature.slice(0, 32)
let coinCoverS = signature.slice(32, 64)

console.log(coinCoverR.toString('hex'), coinCoverS.toString('hex'))

let abi = JSON.parse(fs.readFileSync('ABI/IVBase.abi'))
let vWallet = new web3.eth.Contract(abi, recoveryData.vWalletAddress)

// Combine with Vesto signature
let vArray = [recoveryData.vestoV, 28]
let rArray = [parseBytes(recoveryData.vestoR), parseBytes(coinCoverR.toString('hex'))]
let sArray = [parseBytes(recoveryData.vestoS), parseBytes(coinCoverS.toString('hex'))]
let nonceBytes = parseBytes(recoveryData.nonce)

// Just to check we're talking to the contract...
vWallet.methods
  .version()
  .call()
  .then(o => console.log(o))
  .catch(e => console.log(e))

// Recovery function
vWallet.methods
  .setUserAddress(
    recoveryData.newUserAddress,
    nonceBytes,
    vArray,
    rArray,
    sArray
  )
  .send({from: '0x43A0e3D7bF73911a3FcCB92362B649De90750dF4'}) // address of first Metamask account
  .then(o => console.log(o))
  .catch(e => console.log('Problems: ' + e))

