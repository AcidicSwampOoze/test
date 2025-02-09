import axios from 'axios';
import stocksData from './tushare_stock_basic.json'; // 导入基础数据JSON 文件

const TUSHARE_API_URL = '/api'; // 使用代理路径
const TUSHARE_TOKEN = '875009d14db5d6a06510f8546df96257fbcd29ab5b35534454abe3a0'; // Tushare Token

interface TushareResponse {
  code: number;
  msg: string;
  data: {
    fields: string[];
    items: any[][];
  } | null;
}

interface Stock {
  ts_code: string;
  symbol: string;
  name: string;
  area: string;
  industry: string;
  market: string;
  list_date: string;
}

const tushare = axios.create({
  baseURL: TUSHARE_API_URL,
  timeout: 10000,
});

/**
 * 获取股票列表
 * @returns 股票数据
 */
export const getStockList = async (): Promise<Stock[]> => {
  // 从本地 JSON 文件中读取数据
  const stocks: Stock[] = stocksData;

  // 直接返回所有股票数据
  return stocks;
};

/**
 * 获取所有股票代码
 * @returns 股票代码数组
 */
export const getAllStockCodes = async (): Promise<string[]> => {
  const stocks = await getStockList();
  return stocks.map(stock => stock.ts_code);
};

/**
 * 获取流通市值小于 50 亿的股票代码
 * @returns 股票代码数组
 */
export const getLowMarketCapStockCodes = async (): Promise<string[]> => {
  const allStockCodes = await getAllStockCodes();

  const chunkArray = (array: any[], size: number) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  };

  const chunks = chunkArray(allStockCodes, 500);

  const lowMarketCapStocks: any[] = [];
  const seenStocks = new Set<string>();

  for (const chunk of chunks) {
    try {
      const response = await tushare.post<TushareResponse>('', {
        api_name: 'daily_basic',
        token: TUSHARE_TOKEN,
        params: {
          ts_code: chunk.join(','),
        },
        fields: 'ts_code,circ_mv',
      });

      if (response.data.data) {
        response.data.data.items.forEach(item => {
          if (item[1] < 500000 && !seenStocks.has(item[0])) { // 50 亿 = 500000 万
            lowMarketCapStocks.push(item);
            seenStocks.add(item[0]);
          }
        });
      } else {
        console.error('Response data is null:', response.data);
      }
    } catch (error) {
      console.error('Error fetching low market cap stock codes:', error);
    }
  }

  return lowMarketCapStocks.map(item => item[0]);
};

/**
 * 获取流通市值小于 50 亿的股票的 pct_chg 和 vol
 * @returns 股票数据数组
 */
export const getLowMarketCapStockDetails = async (): Promise<{ ts_code: string, pct_chg: number, vol: number, volume_ratio: number, turnover_rate_f: number, trade_date: string }[]> => {
  const lowMarketCapStockCodes = await getLowMarketCapStockCodes();

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  const chunkArray = (array: any[], size: number) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  };

  const chunks = chunkArray(lowMarketCapStockCodes, 1000);

  const dailyBasicData: { [key: string]: any[][] } = {};
  const dailyData: { [key: string]: any[][] } = {};

  for (const chunk of chunks) {
    try {
      const responseDailyBasic = await tushare.post<TushareResponse>('', {
        api_name: 'daily_basic',
        token: TUSHARE_TOKEN,
        params: {
          ts_code: chunk.join(','),
          start_date: formatDate(startDate),
          end_date: formatDate(endDate),
        },
        fields: 'ts_code,trade_date,volume_ratio,turnover_rate_f',
      });

      const responseDaily = await tushare.post<TushareResponse>('', {
        api_name: 'daily',
        token: TUSHARE_TOKEN,
        params: {
          ts_code: chunk.join(','),
          start_date: formatDate(startDate),
          end_date: formatDate(endDate),
        },
        fields: 'ts_code,trade_date,pct_chg,vol',
      });

      if (responseDailyBasic.data.data) {
        responseDailyBasic.data.data.items.forEach(item => {
          const ts_code = item[0];
          if (!dailyBasicData[ts_code]) {
            dailyBasicData[ts_code] = [];
          }
          dailyBasicData[ts_code].push(item);
        });
        console.log('responseDailyBasic:', responseDailyBasic);
      } else {
        console.error('Response data is null:', responseDailyBasic.data);
      }

      if (responseDaily.data.data) {
        responseDaily.data.data.items.forEach(item => {
          const ts_code = item[0];
          if (!dailyData[ts_code]) {
            dailyData[ts_code] = [];
          }
          dailyData[ts_code].push(item);
        });
        console.log('responseDaily:', responseDaily);
      } else {
        console.error('Response data is null:', responseDaily.data);
      }
    } catch (error) {
      console.error('Error fetching daily data:', error);
    }
  }

  const combinedData = Object.keys(dailyBasicData).map(ts_code => {
    const basicItems = dailyBasicData[ts_code];
    const dailyItems = dailyData[ts_code] || [];

    const combinedItems = basicItems.map(basicItem => {
      const dailyItem = dailyItems.find(item => item[1] === basicItem[1]) || [];
      return {
        ts_code: basicItem[0],
        trade_date: basicItem[1],
        volume_ratio: basicItem[2],
        turnover_rate_f: basicItem[3],
        pct_chg: dailyItem[2] || null,
        vol: dailyItem[3] || null,
      };
    });

    combinedItems.sort((a, b) => b.trade_date.localeCompare(a.trade_date));

    return combinedItems.slice(0, 10);
    // return combinedItems;
  }).flat();

  return combinedData;
};