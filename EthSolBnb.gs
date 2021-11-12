function BNB(wallet) {
  let url = "https://api.bscscan.com/api"
  let params = { "module": "account", "action": "balance", "address": wallet, "tag": "latest", "apikey": BnbKey }
  url = addParams(url, params)
  let data = JSON.parse(UrlFetchApp.fetch(url).getContentText());
  Logger.log("bnb: " + JSON.stringify(data))
  return parseFloat(data['result']) / 1000000000000000000
}

function ETH(wallet) {
  let url = "https://api.etherscan.io/api"
  let params = { "module": "account", "action": "balance", "address": wallet, "tag": "latest", "apikey": EthKey }
  url = addParams(url, params)
  Logger.log(url)
  let data = JSON.parse(UrlFetchApp.fetch(url).getContentText());
  Logger.log(JSON.stringify(data))
  return parseFloat(data['result']) / 1000000000000000000
}

function ethToken(contractAddr, wallet) {
  let url = "https://api.etherscan.com/api"
  let params = { "module": "account", "action": "tokenbalance", 'contractaddress': contractAddr, "address": wallet, "apikey": EthKey }
  url = addParams(url, params)
  Logger.log(url)
  let data = JSON.parse(UrlFetchApp.fetch(url, { 'validateHttpsCertificates': false }).getContentText());
  Logger.log("weth: " + JSON.stringify(data))
  return (parseFloat(data['result'] + .00001)) / 1000000000000000000
}

function SOL(wallet) {
  let payload = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getBalance",
    "params": [wallet]

}
  payload = JSON.stringify(payload)
  var options = {
    'method': 'post',
    'payload': payload,
    'headers': {
      'Content-Type': 'application/json'
    }
  };
  let url = "https://api.mainnet-beta.solana.com"
  let data = UrlFetchApp.fetch(url, options).getContentText()
  data = JSON.parse(data)
  let amount = parseFloat(data['result']['value']) / 1000000000
  Logger.log("SOL: " + amount)
  return amount
}

function solToken(wallet, contract) {
  let payload = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getTokenAccountsByOwner",
    "params": [
      wallet,
      { "mint": contract },
      { "encoding": "jsonParsed" }
    ]
  }
  payload = JSON.stringify(payload)
  var options = {
    'method': 'post',
    'payload': payload,
    'headers': {
      'Content-Type': 'application/json'
    }
  };
  let url = "https://api.mainnet-beta.solana.com"
  let data = UrlFetchApp.fetch(url, options).getContentText()
  Logger.log(data)
  data = JSON.parse(data)
  let ammount = parseFloat(data['result']['value'][0]['account']['data']['parsed']['info']['tokenAmount']['amount']) / 1000000000
  Logger.log("SOL Token: " + ammount)
  return ammount
}
