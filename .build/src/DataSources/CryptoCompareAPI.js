import { RESTDataSource } from '@apollo/datasource-rest';
export class CryptoCompareAPI extends RESTDataSource {
    constructor() {
        super(...arguments);
        this.baseURL = 'https://min-api.cryptocompare.com/';
    }
    async getCoinsList(page) {
        const response = await this.get(`data/top/mktcapfull?limit=20&page=${page}&tsym=USD`);
        let mappedCoins = response.Data.map((coin, index) => {
            let { Name, FullName, ImageUrl, Id } = coin.CoinInfo;
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
    async fetchHistory(fsym, tsym, limit, aggregate) {
        const response = await this.get(`https://min-api.cryptocompare.com/data/v2/histohour?fsym=${fsym}&tsym=${tsym}&limit=${limit}&aggregate=${aggregate}`);
        let history = response.Data.Data.map(({ time, close }) => ({ x: time, y: close }));
        return history;
    }
}
