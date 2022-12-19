import { RESTDataSource, WillSendRequestOptions } from '@apollo/datasource-rest';
import type { KeyValueCache } from '@apollo/utils.keyvaluecache';
  
export type Point = {
  time: number,
  close: number
}

export interface Dictionary {
  [index: string]: string
  coinName: string
}

export interface CoinObject {
  [index: string]: Dictionary
}


export type Coin = {
  id: string;
  symbol: string;
  coinName: string;
  imageUrl: string;
};

export class CryptoCompareAPI extends RESTDataSource {
  override baseURL = 'https://min-api.cryptocompare.com/';

  async getCoinsList(page: number): Promise<Coin[]> {
        const response = await this.get(
            `data/top/mktcapfull?limit=20&page=${page}&tsym=USD`
        )

        let mappedCoins = response.Data.map((coin: CoinObject, index: number) => {
          let {Name, FullName, ImageUrl, Id} = coin.CoinInfo;
          let obj = {
            id: Id,
            symbol: Name,
            coinName: `${FullName} (${Name})`,
            imageUrl: 'https://www.cryptocompare.com/' + ImageUrl,
          };
      
          return obj;
        });

        return mappedCoins;
  }

  async fetchHistory(fsym: string, tsym: string, limit: string, aggregate: string) {
      const response =  await this.get(
        `https://min-api.cryptocompare.com/data/v2/histohour?fsym=${fsym}&tsym=${tsym}&limit=${limit}&aggregate=${aggregate}`
      )
      let history = response.Data.Data.map(({time, close}: Point) =>({x: time, y: close}));
      return history  
  }
}