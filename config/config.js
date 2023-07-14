const SERVER_URL = 'flask-nse-app' // for local development use 127.0.0.1 for production flask-nsea-app
const SERVER_PORT = '5000'

module.exports = {
    PORT : 3000,
    DMA : ['DMA_20', 'DMA_50', 'DMA_100', 'DMA_200'],
    FININACIAL_SERVER_URL : `http://${SERVER_URL}:${SERVER_PORT}`,
    HIT_ROLLBACK : 3
}