const axios = require('axios');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const NIFITY_FIFITY = require("./config/share.js");
const { 
    PORT, 
    DMA,
    FININACIAL_SERVER_URL,
    HIT_ROLLBACK,
} = require("./config/config.js");

app.use(express.static('public'));

let index = 0;
let hit_constant = 0;
let first_response = [];

io.on('connection', (socket) => {
    console.log('A user connected');
    io.emit('message', first_response );
    
    // Handle socket disconnections
    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
});

const getAPIData = async (symbol) => {
    try {
        console.log(`Fetching  ${symbol} with index ${ index } and hit constant is ${ hit_constant} out of ${NIFITY_FIFITY.length - 1}` );
        if (index > NIFITY_FIFITY.length - 1) {
            console.log(finalAnalytics);
            return;
        }
        const currentDataPromise = axios.get(FININACIAL_SERVER_URL, {
            params: {
                symbol,
                dma: DMA.join(',')
            }
        })
        Promise.all([currentDataPromise]).then((
            [
                { data },
            ]
        ) => {
            if (data['isBullish']) {
                first_response.push( data );
                
            }
            io.emit('message', { 
                ...data , 
                msg : `Stocks fetched ${ index } out of ${NIFITY_FIFITY.length - 1} with hit constant : ${hit_constant} and shortlisted stock ${ first_response.length }`
            } );
            if (hit_constant > HIT_ROLLBACK) {
                hit_constant = 5;
            }
            index = index + 1;
            setTimeout(async () => await getAPIData(NIFITY_FIFITY[index]), hit_constant * 1000);
        }).catch( ( { cause } )  => {
            console.log(cause)
            hit_constant = hit_constant + 1;
            if ( hit_constant > HIT_ROLLBACK ) {
                hit_constant = 5;
                index = index + 1;
            }
            setTimeout(async () => await getAPIData(NIFITY_FIFITY[index]), hit_constant * 1000);    
        })
    } catch ({ cause }) {
        console.log( cause );
        hit_constant = hit_constant + 1;
            if ( hit_constant > HIT_ROLLBACK ) {
                hit_constant = 5;
                index = index + 1;
            }
        setTimeout(async () => await getAPIData(NIFITY_FIFITY[index]), hit_constant * 1000);
    }
}


server.listen(PORT , () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


app.get('/', (req, res) => {
    fs.readFile(__dirname + '/public/index.html', 'utf8', (err, text) => {
        res.send(text);
    });
});

(async () => {
    await getAPIData(NIFITY_FIFITY[index]);
})() 
