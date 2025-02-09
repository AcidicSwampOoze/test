<template>
  <div class="stock-filter">
    <h2>股票筛选工具</h2>
    <div>
      当前筛选条件：
      <p>最近10交易日 平均 量比>1   接口：daily_basic   volume_ratio </p>
      <p>最近10交易日 平均 换手率大于5% 小于20%  接口：daily_basic   turnover_rate_f</p>
      <p>当前流通市值 < 50亿  接口：daily_basic   circ_mv</p>
      <p>最近10交易日内 涨停过 （涨幅>= 9.9%） 接口：daily   pct_chg</p>
      <p>最后一交易日前 7天内下跌天数大于5天，且当天涨跌幅不超过  +- 0.5%   接口：daily    pct_chg </p>
      <p>成交量为7日内最低   接口：daily   vol</p>
    </div>
    <div>
      <h3>筛选结果</h3>
      <div>
        <h3>流通市值小于 50 亿的股票代码共有{{ lowMarketCapStockCodes.length }} 只</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>股票代码</th>
            <th>量比</th>
            <th>换手率</th>
            <th>涨跌幅</th>
            <th>成交量</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stock in filteredStocks" :key="stock.ts_code">
            <!-- <td>{{ stock.ts_code }}</td>
            <td>{{ stock.volume_ratio }}</td>
            <td>{{ stock.turnover_rate_f }}</td>
            <td>{{ stock.pct_chg }}</td>
            <td>{{ stock.vol }}</td> -->
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="filteredStocks.length === 0">
      <p>暂无数据</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch } from 'vue';
import { getLowMarketCapStockDetails, getLowMarketCapStockCodes } from '@/api/tushare';

export default defineComponent({
  name: 'StockFilter',
  setup() {
    const filteredStocks = ref<{ ts_code: string, pct_chg: number, vol: number, volume_ratio: number, turnover_rate_f: number }[]>([]);
    const lowMarketCapStockCodes = ref<string[]>([]);

    const fetchStockDetails = async () => {
      filteredStocks.value = await getLowMarketCapStockDetails();
    };

    const fetchLowMarketCapStockCodes = async () => {
      lowMarketCapStockCodes.value = await getLowMarketCapStockCodes();
    };

    onMounted(() => {
      fetchStockDetails();
      fetchLowMarketCapStockCodes();
    });

    watch(filteredStocks, (newValue) => {
      console.log('filteredStocks length:', newValue);
    });

    watch(lowMarketCapStockCodes, (newValue) => {
      console.log('lowMarketCapStockCodes:', newValue);
    });

    return {
      filteredStocks,
      lowMarketCapStockCodes,
    };
  },
});
</script>

<style scoped>
.stock-filter {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f4f4f4;
}
</style>