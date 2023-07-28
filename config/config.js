const SERVER_URL = '127.0.0.1' // for local development use 127.0.0.1 for production flask-nse-app
const SERVER_PORT = '5000'

module.exports = {
    PORT: 3000,
    DMA: ['DMA_20', 'DMA_50', 'DMA_100', 'DMA_200'],
    FININACIAL_SERVER_URL: `http://${SERVER_URL}:${SERVER_PORT}/price_diff`,
    LIVE_STOCK_URL : `http://${SERVER_URL}:${SERVER_PORT}/live`,
    HIT_ROLLBACK: 3
}