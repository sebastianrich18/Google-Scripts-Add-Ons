
/**
 * Main function to use TDAmeratrade API
 * To learn more click 'help' in the TDAmeratrade tab
 * @customfunction
 */
function TDA(one, two, three) {
  if (typeof one === 'string' && one != 'positions' && two == undefined && three == undefined) { // get price
    Logger.log('Getting last price of ' + one)
    let data = getQuote(one)['lastPrice']
    return data

  } else if (typeof one === 'string' && one != 'positions' && two == 'quote' && three != undefined) { // get quote
    Logger.log("getting " + three + " of " + one)
    let data = getQuote(one)[three]
    Logger.log(data)
    return data

  } else if (one === 'positions' && (typeof two == 'number' || two == undefined) && three == undefined) { // get positions
    Logger.log('Getting positons')
    return getPositionsData(two)

  } else if (one == "account" && typeof two == 'number' && typeof three == "string") { // get account
    Logger.log('Getting account')
    return getAccount(two)[three]

  } else if (one == "history" && typeof two == 'number' && three == undefined) { // get history
    Logger.log("Getting history")
    return getHistory(two)

  } else if (one == "contrabutions" && typeof two == 'number' && three == undefined) { // get contrabutions
    Logger.log("Getting contrabutions")
    return getContrabutions(two)

  } else {
    throw new Error("Could not find command")
  }
}


function onOpen(e) {
  Logger.log("TD refresh: " + PropertiesService.getUserProperties().getProperty('TDRefresh'))
  SpreadsheetApp.getUi()
    .createMenu('TD Ameratrade')
    .addItem('Log In', 'TDLogin')
    .addItem('Enter Code', 'TDInputCode')
    .addItem('Help', 'help')
    .addToUi();
}

function help() {
  let str = "Commands:\n"
  str += "=TDA('ABC'):  gets last market price of a stock\n"
  str += "\n=TDA('positions', AccountNumber):  gets all current postions and info on them.\n"
  str += "\n=TDA('ABC', 'quote', data):  gets quote data, possable inputs for data are; symbol, description, bidPrice, askPrice, bidSize, askSize, openPrice, highPrice, lowPrice, closePrice, netChange, totalVolume, exchange, 52WkHigh, 52WkLow, divAmount, divYield, and divDate\n"
  str += '\n=TDA("ABC", "fundamental", data):  gets fundamental data possable inputs for data are; peRatio, pegRatio, pbRatio, prRatio, pcfRatio, grossMarginTTM, grossMarginMRQ, netProffitMarginTTM, netProffitMarginMRQ, operatingMarginTTM, operatingMarginMRQ, returnOnEquity, returnOnAssets, returnOnInvestment, quickRatio, currentRatio, intrestCoverage, totalDebtToCapital, ltDebtToEquity, totalDebtToEquity, epsTTM, epsChangePercentTTM, epsChangeYear, epsChange, revChangeYear, revChangeTTM, revChangeIn, sharesOutstanding, marketCapFloat, marketCap, bookValuePerShare, beta\n'
  SpreadsheetApp.getUi().alert(str)
}

function TDLogin() {
  var html = "<script>window.open('" + TDauthLink + "');google.script.host.close();</script>";
  var userInterface = HtmlService.createHtmlOutput(html);
  SpreadsheetApp.getUi().showModalDialog(userInterface, 'Redirecting to TD Ameritrade...');

}

function TDInputCode() {
  let ui = SpreadsheetApp.getUi()
  var result = ui.prompt('Input code', 'Copy and paste everything after "code=" from the url into this box, then press ok:', ui.ButtonSet.OK_CANCEL);
  var button = result.getSelectedButton();
  var text = result.getResponseText();
  if (button == ui.Button.OK) {
    Logger.log("getting td refesh")
    getTDRefreshToken(text)
  }
}


function getTDRefreshToken(code) {
  code = decodeURIComponent(code);
  let endpoint = "https://api.tdameritrade.com/v1/oauth2/token"
  let payload = { "grant_type": "authorization_code", "access_type": "offline", "code": code, "client_id": TDapikey, "redirect_uri": callbackURI };
  let options = { "method": "POST", "payload": payload }
  let response = UrlFetchApp.fetch(endpoint, options).getContentText();
  let refresh_token = JSON.parse(response)['refresh_token']
  Logger.log("TD refresh: " + refresh_token)
  PropertiesService.getUserProperties().setProperty('TDRefresh', refresh_token)
}

function getTDAccessToken() {
  if (!TDAccessToken) {
    try {
      let endpoint = 'https://api.tdameritrade.com/v1/oauth2/token';
      let refresh_token = PropertiesService.getUserProperties().getProperty('TDRefresh');
      Logger.log("TD refresh: " + refresh_token);
      let data = { 'grant_type': 'refresh_token', 'refresh_token': refresh_token, 'client_id': TDapikey }
      let options = { "method": "post", 'payload': data }
      let r = UrlFetchApp.fetch(endpoint, options).getContentText();
      TDAccessToken = JSON.parse(r)['access_token']
      // Logger.log("access token: " + accessToken)
      return TDAccessToken
    } catch (e) {
      Logger.log(e)
      throw new Error("An authentication error occured, try logging in to TD Ameratrade again")
    }
  } else {
    // Logger.log("using access token")
    return TDAccessToken;
  }
}

function getContrabutions(accNumber) {
  let endpoint = `https://api.tdameritrade.com/v1/accounts/${accNumber}/transactions`;
  endpoint = addParams(endpoint, { "type": "ALL" })
  let headers = { "Authorization": ` Bearer ${getTDAccessToken()}` };
  let options = { "headers": headers }
  let r = UrlFetchApp.fetch(endpoint, options).getContentText()
  r = JSON.parse(r)
  let arr = [['Date', 'Ammount']]
  for (let i = 0; i < r.length; i++) {
    if (r[i]['type'] == "ELECTRONIC_FUND") {
      let date = r[i]['transactionDate'].split('T')[0]
      let ammount = r[i]['netAmount']
      // Logger.log(date, ammount)
      arr.push([date, ammount])
    }
  }
  return arr
}

function getHistory(accNumber) {
  let endpoint = `https://api.tdameritrade.com/v1/accounts/${accNumber}/transactions`;
  endpoint = addParams(endpoint, { "type": "TRADE" })
  let headers = { "Authorization": ` Bearer ${getTDAccessToken()}` };
  let options = { "headers": headers }
  let r = UrlFetchApp.fetch(endpoint, options).getContentText()
  r = JSON.parse(r)
  let arr = [['Ticker', 'Total', 'Type', 'Date']]
  for (let i = 0; i < r.length; i++) {
    let ticker = r[i]['transactionItem']['instrument']['symbol']
    let totalCost = r[i]['transactionItem']['cost']
    let price = r[i]['transactionItem']['price']
    let shares = r[i]['transactionItem']['amount']
    let date = r[i]['transactionDate'].split('T')[0]
    let type = r[i]['description'].split(' ')[0]
    // Logger.log(ticker, totalCost, price, shares, date, type)
    arr.push([ticker, totalCost, type, date])
  }
  return arr
}


function getPositionsData(accNumber) {
  let url = ''
  if (accNumber) {
    url = `https://api.tdameritrade.com/v1/accounts/${accNumber}`;
  } else {
    url = 'https://api.tdameritrade.com/v1/accounts/'
  }

  url = addParams(url, { "fields": "positions" })
  let headers = { "Authorization": ` Bearer ${getTDAccessToken()}` };
  let options = { "headers": headers }
  let data = undefined

  try {
    if (accNumber) {
      data = [JSON.parse(UrlFetchApp.fetch(url, options).getContentText())];
    } else {
      data = JSON.parse(UrlFetchApp.fetch(url, options).getContentText());
    }
  } catch (e) {
    Logger.log("get positions error:")
    Logger.log(e)
    throw new Error("Could not find account, make sure your account number is correct")
  }

  let positionData = []
  let outputArr = [];
  let cash = 0;
  outputArr.push(["Symbol", "Shares", "Avg Price", "Mkt price", "P/L Day %", "P/L Day $", "P/L Total %", "P/L Total $", 'Value', 'Description'])

  for (let i = 0; i < data.length; i++) {
    cash += data[i]['securitiesAccount']['currentBalances']['cashAvailableForTrading']
    let positions = data[i]['securitiesAccount']['positions'];
    for (let j = 0; j < positions.length; j++) {
      if (positions[j]['instrument']['symbol'] != "MMDA1") {

        let data = {}
        data['symbol'] = positions[j]['instrument']['symbol']
        data['shares'] = positions[j]['longQuantity']
        data['avgPrice'] = positions[j]['averagePrice']
        data['plDay'] = positions[j]['currentDayProfitLoss']
        data['plDayPercent'] = positions[j]['currentDayProfitLossPercentage'] / 100.0
        data['value'] = positions[j]['marketValue']

        let quote = getQuote(data['symbol'])
        data['mktPrice'] = quote['lastPrice']
        data['description'] = quote['description']

        data['plTotal'] = (data['mktPrice'] - data['avgPrice']) * data['shares']
        data['plTotalPercent'] = ((data['mktPrice'] - data['avgPrice']) / data['avgPrice'])
        Logger.log(data)
        positionData.push(data)
        outputArr.push([data['symbol'], data['shares'], data['avgPrice'], data['mktPrice'], data['plDayPercent'], data['plDay'], data['plTotalPercent'], data['plTotal'], data['value'], data['description']])
      }
    }
  }
  outputArr.push(['Cash', '', '', '', '', '', '', '', cash])
  return outputArr
}

function getAccount(accNumber) {
  let url = `https://api.tdameritrade.com/v1/accounts/${accNumber}`;
  url = addParams(url, { "fields": "orders" })
  let headers = { "Authorization": ` Bearer ${getTDAccessToken()}` };
  let options = { "headers": headers }
  let data = ""
  try {
    data = JSON.parse(UrlFetchApp.fetch(url, options).getContentText());
  } catch (e) {
    Logger.log("get positions error:")
    Logger.log(e)
    throw new Error("Could not find account, make sure your account number is correct")
  }

  return data["securitiesAccount"]["currentBalances"]

}

function getQuote(ticker) {
  let url = `https://api.tdameritrade.com/v1/marketdata/${ticker}/quotes?apikey=${TDapikey}`;
  let headers = { "Authorization": ` Bearer ${getTDAccessToken()}` };
  let options = { 'method': 'GET', 'headers': headers }
  let data = JSON.parse(UrlFetchApp.fetch(url, options).getContentText());
  Logger.log(data[ticker])
  return data[ticker];
}

function getFund(ticker) {
  let endpoint = 'https://api.tdameritrade.com/v1/instruments';
  let data = { 'apikey': TDapikey, 'symbol': ticker, 'projection': 'fundamental' }
  let url = addParams(endpoint, data)
  let headers = { "Authorization": ` Bearer ${getTDAccessToken()}` };
  let options = { 'method': 'GET', 'headers': headers }
  let r = JSON.parse(UrlFetchApp.fetch(url, options).getContentText())
  return r[ticker]['fundamental']
}

function addParams(url, params) {
  url += "?";
  for (const property in params) {
    url += (`${property}=${params[property]}&`);
  }
  url = url.substring(0, url.length - 1);
  return url
}
