const axios = require('axios');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const fs = require('fs');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const { insert, getData } = require("./db.js")
const NIFITY_FIFITY = require("./config/share.js");
const {
    PORT,
    DMA,
    SERVER_URL,
    SERVER_PORT,
    HIT_ROLLBACK,
} = require("./config/config.js");

app.use(express.static('public'));

let index = 0;
let hit_constant = 0;
let first_response = [];
let once = true;
let priceDiff = 1;
let priceDiffBullish = 5;
let timeDelta = 1;
let portIndex = 0;
const MapPortSuccess = {}

const getFinancialStockURL = () => {
    portIndex++;
    if (portIndex > 7) {
        portIndex = 0;
    }
    if ( SERVER_PORT[portIndex] === undefined ){
        portIndex = 0;
    }
    return `http://${SERVER_URL}:${SERVER_PORT[portIndex]}/price_diff`;
}

function incrementPortCount(url) {
  const port = new URL(url).port;

  if (MapPortSuccess[port]) {
    MapPortSuccess[port] += 1;
  } else {
    MapPortSuccess[port] = 1;
  }
}

const formatError = ( error ) => {
    if (axios.isAxiosError(error)) {
    console.error("-----------------------------------------------------------------------------");
    const status = error.response?.status || 'N/A';
    const message = error.message || 'No message';
    const baseUrl = new URL(error.config?.url || 'Unknown');
    const params = error.config?.params || {};
    const responseData = error.response?.data || '[No response data]';
    incrementPortCount( baseUrl );
    console.error('❌ Axios Request Failed');
    console.error('Status      :', status);
    console.error('Message     :', message);
    console.error('Symbol      :', params.symbol);
    console.error('Response    :', responseData);
    console.error('Matrix      :', MapPortSuccess);
    console.error("-----------------------------------------------------------------------------");
    // Optional: Log full error for deep debugging
    // console.error(error);
    
  } else {
    console.error('❌ Unknown error:', error);
  }
}


const getAPIData = async (symbol) => {
    if (symbol) {
        try {
            console.log(`Fetching  ${symbol} with index ${index} and hit constant is ${hit_constant} out of ${NIFITY_FIFITY.length - 1}`);
            if (index > NIFITY_FIFITY.length - 1) {
                console.log(finalAnalytics);
                return;
            }
            const currentDataPromise = axios.get(getFinancialStockURL(), {
                params: {
                    symbol,
                    dma: DMA.join(','),
                    priceDiff,
                    priceDiffBullish,
                    timeDelta,
                },
                timeout: 2000,
                signal: AbortSignal.timeout(2000)
            })
            Promise.all([currentDataPromise]).then((
                [
                    { data },
                ]
            ) => {
                insert(data)
                if (data['isBullish'] || data['isBearish']) {
                    first_response.push(data);
                }
                io.emit('message', {
                    ...data,
                    msg: `Stocks fetched ${index} out of ${NIFITY_FIFITY.length - 1} with hit constant : ${hit_constant} , shortlisted bullish stock ${first_response.filter(({ isBullish }) => isBullish === 'true').length}, shortlisted bearish stock ${first_response.filter(({ isBearish }) => isBearish === 'true').length} `
                });
                hit_constant = 0;
                index = index + 1;
                setTimeout(async () => await getAPIData(NIFITY_FIFITY[index]), hit_constant * 1000);
            }).catch(( cause ) => {
                formatError( cause );
                hit_constant = hit_constant + 1;
                if (hit_constant > HIT_ROLLBACK) {
                    hit_constant = 0;
                    index = index + 1;
                }
                setTimeout(async () => await getAPIData(NIFITY_FIFITY[index]), hit_constant * 1000);
            })
        } catch ( cause ) {
            formatError( cause );
            hit_constant = hit_constant + 1;
            if (hit_constant > HIT_ROLLBACK) {
                hit_constant = 0;
                index = index + 1;
            }
            setTimeout(async () => await getAPIData(NIFITY_FIFITY[index]), hit_constant * 1000);
        }
    } else {
        if (once) {
            io.emit('message', first_response);
        }
        once = false;
    }
}


const restart = () => {
    console.log("message recieved restart");
    first_response = [];
    index = 0;
    hit_constant = 0;
}

const getLiveStockURL = () => {
    portIndex++;
    if (portIndex > 7) {
        portIndex = 0;
    }
    return `http://${SERVER_URL}:${SERVER_PORT[0]}/live`;
}

const fetchLivePrice = (symbol) => {
    const currentDataPromise = axios.get(getLiveStockURL(), {
        params: {
            symbol,
        },
        timeout: 2000,
        signal: AbortSignal.timeout(2000)
    })
    Promise.all([currentDataPromise]).then((
        [
            { data },
        ]
    ) => {
        console.log(data);
        io.emit('ticker', data)
    }).catch(({ cause }) => {
        formatError(cause);
    })
}

io.on('connection', (socket) => {
    io.emit('message', first_response);

    socket.on('disconnect', function (reason) {
        console.log('User 1 disconnected because ' + reason);
    });

    socket.on('message', (data) => {
        io.emit('message', first_response);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });

    socket.on('ticker', (data) => {
        fetchLivePrice(data);
    })

    socket.on('bullish', (data) => {
        console.log("message recieved bullish");
        priceDiff = data;
        restart();
    });

    socket.on('timedelta', (data) => {
        console.log("message recieved bullish");
        hit_constant = data;
        //restart();
    });

    socket.on('bearish', (data) => {
        console.log("message recieved bearish");
        priceDiffBullish = data;
        restart();
    });

    socket.on('restart', () => {
        console.log("message recieved restart");
        restart();
    })

});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


app.get('/getHostName', (req, res) => {
    res.send( os.hostname() );
});


app.get('/', (req, res) => {
    fs.readFile(__dirname + '/public/index.html', 'utf8', (err, text) => {
        res.send(text);
    });
});

app.get('/mongoDB', (req, res) => {
    fs.readFile(__dirname + '/public/mongo.html', 'utf8', (err, text) => {
        res.send(text);
    });
});

app.get('/healthcheck', (req, res) => {
    res.send('working')
});

app.get('/healthcheckpy', (req, res) => {

    const currentDataPromise = axios.get(getLiveStockURL(), {
        params: {
            symbol: 'RELIANCE',
        }
    })
    Promise.all([currentDataPromise]).then((
        [
            { data },
        ]
    ) => {
        res.send(data);

    }).catch(({ cause }) => {
        formatError(cause);
    })
});

// Create a route to fetch data with a filter
app.get('/api/mongoDB', async (req, res) => {
    getData({ isBullish: 'true' }, req, res)
});

(async () => {
    await getAPIData(NIFITY_FIFITY[index]);
})() 
