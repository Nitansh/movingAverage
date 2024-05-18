const SELECTED_STOCKS_KEY = "selectedStocks";

initStorage();

let rowData = [];
let buffer = [];
let buffer_size = 10;

const socket = io();
const msgHTML = document.getElementById("msg");
const bearishChangeHTML =  document.getElementById("bearish-select");
const bullishChangeHTML =  document.getElementById("bullish-select");
const timeDeltaHTML = document.getElementById("time-select");

function getPrecisionValue( params ){
  return params.value.toFixed(2);;
}

const columnDefs = [
  { field: "id", hide : true },
  { field: "name", checkboxSelection: true},
  { field: "mcap", filter: 'agNumberColumnFilter' },
  { field: "isBearish", filter: 'agSetColumnFilter', hide: true, },
  { field: "isBullish", filter: 'agSetColumnFilter' },
  { field: "symbol", filter: 'agNumberColumnFilter', hide: true, },
  { field: "price", filter: 'agNumberColumnFilter',  },
  { field: "currentPrice", filter: 'agNumberColumnFilter', hide: true, },
  { field: "rsi", filter: 'agNumberColumnFilter', valueFormatter: getPrecisionValue},
  { field: "DMA_20", filter: 'agNumberColumnFilter', valueFormatter: getPrecisionValue},
  { field: "DMA_50", filter: 'agNumberColumnFilter',  valueFormatter: getPrecisionValue},
  { field: "DMA_100", filter: 'agNumberColumnFilter', valueFormatter: getPrecisionValue},
  { field: "DMA_200", filter: 'agNumberColumnFilter', hide: true, valueFormatter: getPrecisionValue },
  { field: "url", hide: true, },
  { field : "chart", hide: true },
];

const gridOptions = {
    columnDefs: columnDefs,
    rowData: rowData,
    getRowId: params => params.data.id,
    defaultColDef: {
      flex: 1,
      minWidth: 150,
      filter: 'agTextColumnFilter',
      menuTabs: ['filterMenuTab'],
      sortable : true,
      enableValue: true,
      enableRowGroup: true,
      enablePivot: true,
    },
    autoGroupColumnDef: {
      minWidth: 200,
    },
    sideBar: {
          toolPanels: [
              {
                  id: "columns",
                  labelDefault: "Columns",
                  labelKey: "columns",
                  iconKey: "columns",
                  toolPanel: "agColumnsToolPanel",
              },
              {
                  id: "filters",
                  labelDefault: "Filters",
                  labelKey: "filters",
                  iconKey: "filter",
                  toolPanel: "agFiltersToolPanel",
              },
          ],
          defaultToolPanel: "",
    },
    enableRangeSelection: true,
    rowSelection: 'multiple',
    suppressRowClickSelection: true,
    onCellDoubleClicked: function (params) {
        const cellValue = params.value;
        if (cellValue.includes('http') ) {
          // Cell value is a valid URL, open it in a new tab or window.
          window.open(cellValue, '_blank');
        }
    },
    getRowStyle: (params) => {
      if (params.data){
        if(params.data.isBearish === "true") {
          return { background: 'red', 'font-weight': 750 };
        } else {
          return { background: 'green', 'font-weight': 750 };
        }
      }
    }
};

const cacheGridOptions = { ...gridOptions };

function initStorage() {
    if ( localStorage.getItem( SELECTED_STOCKS_KEY ) === null ){
        localStorage.setItem( SELECTED_STOCKS_KEY , JSON.stringify([]));
    }
}

function onSelectionChanged() {
  const selectedRows = gridOptions.api.getSelectedRows();
  const url = selectedRows.length === 1 ? selectedRows[0].url : '';
  console.log(url);
  if (url) {
    window.open(url)
  }
}

function addWatchList() {
    const previousList = JSON.parse(localStorage.getItem( SELECTED_STOCKS_KEY )) || [];
    const newList = gridOptions.api.getSelectedRows().map( ( { symbol, price, DMA_20, DMA_50 } ) => {
      return { symbol , price, DMA_20, DMA_50, date : new Date().toJSON().slice(0,10) }
      });
    localStorage.setItem(
        SELECTED_STOCKS_KEY,
        JSON.stringify( newList.concat( previousList ) )
    );
    gridOptions.api.deselectAll();
    tickerGridOptions.api.setRowData( getUpdateStocks() )
}

function fetchData() {
  socket.emit('message', '');
}

function onBtExport() {
  gridOptions.api.exportDataAsExcel();
}

function onRestart(){
  socket.emit('restart', '');
  gridOptions.api.setRowData([]);
  buffer = [];
}

// Handle receiving messages
socket.on('message', (data) => {
  if (data.length !== undefined) {
    rowData = data
    gridOptions.api.setRowData(rowData);
  } else {
    if (data['isBullish'] || data['isBearish'] ) {
      buffer.push(data)
      if (buffer.length > buffer) {
        rowData.concat(buffer);
        buffer = [];
        gridOptions.api.setRowData(rowData);
      }
    }
    msgHTML.innerHTML = data['msg'];
  }
});

socket.on('disconnect', function(reason){
  console.log('User 1 disconnected because '+reason);
});

document.addEventListener('DOMContentLoaded', () => {
  const gridDiv = document.querySelector('#myGrid');
  new agGrid.Grid(gridDiv, gridOptions);
  // let index = 0;
  // interval = 1000*60;
  // setInterval( () =>{
  //   gridOptions.api.forEachNode((rowNode ) => {
  //     setTimeout(function () {
  //       socket.emit('ticker', rowNode.data.symbol );
  //     }, index * interval);
  //   });
  // }, tickerIntervalInMinutes*1000*60)

  // socket.on('ticker', ( data ) => {
  //     const rowNode = gridOptions.api.getRowNode(data.symbol);
  //     rowNode && rowNode.setData({
  //         ...rowNode.data,
  //         ...data,
  //     })
  // });

});

document.addEventListener('DOMContentLoaded', () => {
  const gridDiv = document.querySelector('#myCacheGrid');
  new agGrid.Grid(gridDiv, cacheGridOptions);
  fetch("/api/mongoDB")
  .then(response => {
    // Check if the response status is OK (status code 200)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    // Parse the response body as JSON
    return response.json();
  })
  .then(data => {
    // Handle the JSON data
    cacheGridOptions.api.setRowData(data);
  })
  .catch(error => {
    // Handle errors
    console.error('Fetch error:', error);
  });

  // let index = 0;
  // interval = 1000;
  // setInterval( () =>{
  //   cacheGridOptions.api.forEachNode((rowNode ) => {
  //     index = index + 1;
  //     setTimeout(function () {
  //         socket.emit('ticker', rowNode.data.symbol );
  //     }, index * interval);
  //   });
  // }, tickerIntervalInMinutes*1000*60)

  // socket.on('ticker', ( data ) => {
  //     const rowNode = cacheGridOptions.api.getRowNode(data.symbol);
  //     rowNode && rowNode.setData({
  //         ...rowNode.data,
  //         ...data,
  //     })
  // });

});

bearishChangeHTML.onchange = function(){
    var value = bearishChangeHTML.value;
    socket.emit( 'bearish', value);
    gridOptions.api.setRowData([]);
    buffer = [];
};
  
timeDeltaHTML.onchange = function(){
    var value = timeDeltaHTML.value;
    socket.emit( 'timedelta', value);
    // gridOptions.api.setRowData([]);
    // buffer = [];
};

bullishChangeHTML.onchange = function(){
    var value = bullishChangeHTML.value;
    socket.emit( 'bullish', value);
    gridOptions.api.setRowData([]);
    buffer = [];
};
