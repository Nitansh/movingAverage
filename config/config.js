const SERVER_URL = '127.0.0.1' // for local development use 127.0.0.1 for production flask-nse-app
const SERVER_PORT = ['5000','5001','5002','5003','5004','5005','5006'];

module.exports = {
    PORT: 3000,
    DMA: ['DMA_20', 'DMA_50', 'DMA_100', 'DMA_200'],
    FININACIAL_SERVER_URL: `http://${SERVER_URL}:${SERVER_PORT[0]}/price_diff`,
    LIVE_STOCK_URL : `http://${SERVER_URL}:${SERVER_PORT[0]}/live`,
    SERVER_URL,
    SERVER_PORT,
    HIT_ROLLBACK: 3
}