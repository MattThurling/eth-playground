// Dependencies
const fs = require('fs')
const Web3 = require('web3')
const { hdkey } = require('ethereumjs-wallet')
const ethers = require('ethers')

// Use Metamask accounts for sending the call
const mnemonic = fs.readFileSync('seed/mnemonic.txt', 'utf8')
const HDWalletProvider = require('@truffle/hdwallet-provider')

// Type conversion
const parseBytes = (hexString) => {
  // return Uint8Array.from(Buffer.from(hexString, 'hex'))
  return '0x' + hexString
}

// Command arguments
let fileName = process.argv[2]
let xPrv = process.argv[3]
let recoveryData = JSON.parse(fs.readFileSync(fileName))

let signingKey = hdkey.fromExtendedKey(xPrv)
let signingPrivateKey = signingKey.privateKey

let wallet = new ethers.Wallet('0x' + '0438702781f69f7b42050bc2ee0cbf83463f8403c1d01699d167ae45718b5a8ec54a5a2d80c9')
console.log(wallet)

hashBytes = ethers.utils.arrayify('0x' + recoveryData.hash)

wallet.signMessage(hashBytes).then((flatSig) => {
  let sig = ethers.utils.splitSignature(flatSig)
  console.log(sig.v, sig.r, sig.s)

  let provider = new HDWalletProvider(mnemonic, 'https://kovan.infura.io/v3/50acc159b78a4261be428f5534707279')
  let web3 = new Web3(provider)

  let abi = JSON.parse(fs.readFileSync('ABI/IVBase.abi'))
  let vWallet = new web3.eth.Contract(abi, recoveryData.vWalletAddress)
  console.log('vW: ' + recoveryData.vWalletAddress)

  // Combine with Vesto signature
  let vArray = [recoveryData.vestoV, sig.v]
  let rArray = [parseBytes(recoveryData.vestoR), sig.r]
  let sArray = [parseBytes(recoveryData.vestoS), sig.s]

  let nonceBytes = parseBytes(recoveryData.nonce)

  // Just to check we're talking to the contract...
  vWallet.methods
    .version()
    .call()
    .then(o => console.log(o))
    .catch(e => console.log(e))

  // Get the balance...
  vWallet.methods
    .balanceOf('0x7d741e8199718b6dae9327ca0df3f1444ff965fa')
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
})



