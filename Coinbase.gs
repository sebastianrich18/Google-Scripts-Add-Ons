
function getCrypto(ticker) {
  let url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest"
  let params = { "symbol": ticker, "CMC_PRO_API_KEY": CoinMktKey }
  url = addParams(url, params)
  let data = JSON.parse(UrlFetchApp.fetch(url).getContentText());
  Logger.log(data)
  return parseFloat(data["data"][ticker]["quote"]["USD"]["price"])
}


function onOpen(e) {
  Logger.log("Coin refresh: " + PropertiesService.getUserProperties().getProperty('CoinRefresh'))
  SpreadsheetApp.getUi()
    .createMenu('Coinbase')
    .addItem('Log In', 'CoinLogin')
    .addItem('Enter Code', 'CoinInputCode')
    .addItem('Help', 'help')
    .addToUi();
}

function CoinLogin() {
  var html = "<script>window.open('" + CoinAuthLink + "');google.script.host.close();</script>";
  var userInterface = HtmlService.createHtmlOutput(html);
  SpreadsheetApp.getUi().showModalDialog(userInterface, 'Redirecting to Coinbase...');

}

function CoinInputCode() {
  let ui = SpreadsheetApp.getUi()
  var result = ui.prompt('Input code', 'Copy and paste everything after "code=" from the url into this box, then press ok:', ui.ButtonSet.OK_CANCEL);
  var button = result.getSelectedButton();
  var text = result.getResponseText();
  if (button == ui.Button.OK) {
    Logger.log("getting coin refesh")
    getCoinRefreshToken(text)
  }
}

function getCoinRefreshToken(code) {
  code = decodeURIComponent(code);
  let endpoint = "https://www.coinbase.com/oauth/token"
  let payload = { "grant_type": "authorization_code", "code": code, "client_id": CoinID, "client_secret": CoinSecret, "redirect_uri": callbackURI };
  let options = { "method": "POST", "payload": payload }
  let response = UrlFetchApp.fetch(endpoint, options).getContentText();
  let refresh_token = JSON.parse(response)['refresh_token']
  Logger.log("coin refresh: " + refresh_token)
  PropertiesService.getUserProperties().setProperty('CoinRefresh', refresh_token)
}

function getCoinAccessToken() {
  if (!CoinAccessToken) {
    try {
      let endpoint = 'https://www.coinbase.com/oauth/token';
      let refresh_token = PropertiesService.getUserProperties().getProperty('CoinRefresh');
      Logger.log(refresh_token);
      let params = { 'grant_type': 'refresh_token', 'refresh_token': refresh_token, 'client_id': CoinID, "client_secret": CoinSecret }
      let options = { "method": "POST", 'payload': params }
      let r = UrlFetchApp.fetch(endpoint, options).getContentText();
      let data = JSON.parse(r)
      CoinAccessToken = data['access_token']
      PropertiesService.getUserProperties().setProperty('CoinRefresh', data['refresh_token'])
      Logger.log("Coin access token: " + CoinAccessToken)
      return CoinAccessToken
    } catch (e) {
      Logger.log(e, mutehttpexceptions = false)
      throw new Error("An authentication error occured, try logging in to Coinbase again")
    }
  } else {
    // Logger.log("using access token")
    return CoinAccessToken;
  }
}

function getWallets() {
  let url = "https://api.coinbase.com/v2/accounts"
  let headers = { "Authorization": ` Bearer ${getCoinAccessToken()}` };
  let options = { "headers": headers }
  let data = JSON.parse(UrlFetchApp.fetch(url, options).getContentText())['data'];
  // Logger.log(data)
  let wallets = []
  for (let obj of data) {
    if (parseFloat(obj['balance']['amount']) > 0) {
      wallets.push(obj['balance'])
    }
  }
  Logger.log(wallets)
  let arr = [["Ticker", "Amount"]]
  for (let wallet of wallets) {
    arr.push([wallet['currency'], wallet['amount']])
  }
  Logger.log(arr)
  return arr
}
