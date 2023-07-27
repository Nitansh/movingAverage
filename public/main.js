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

const columnDefs = [
  { field: "name", checkboxSelection: true},
  { field: "mcap", filter: 'agNumberColumnFilter' },
  { field: "isBearish", filter: 'agSetColumnFilter' },
  { field: "isBullish", filter: 'agSetColumnFilter' },
  { field: "symbol", filter: 'agNumberColumnFilter', hide: true, },
  { field: "price", filter: 'agNumberColumnFilter', hide: true, },
  { field: "rsi", filter: 'agNumberColumnFilter', hide: true, },
  { field: "DMA_20", filter: 'agNumberColumnFilter', hide: true, },
  { field: "DMA_50", filter: 'agNumberColumnFilter', hide: true, },
  { field: "DMA_100", filter: 'agNumberColumnFilter', hide: true, },
  { field: "DMA_200", filter: 'agNumberColumnFilter', hide: true, },
  { field: "url", hide: true, },
];

const gridOptions = {
    columnDefs: columnDefs,
    rowData: rowData,
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
        const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
        const cellValue = params.value;
        if (urlRegex.test(cellValue)) {
          // Cell value is a valid URL, open it in a new tab or window.
          window.open(cellValue, '_blank');
        }
    }
};

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
    localStorage.setItem(
        SELECTED_STOCKS_KEY,
        JSON.stringify(
            gridOptions.api.getSelectedRows().map( ( { symbol, price } ) => {
            return { symbol , price }
            })
        )
    );
    gridOptions.api.deselectAll();
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

document.addEventListener('DOMContentLoaded', () => {
  const gridDiv = document.querySelector('#myGrid');
  new agGrid.Grid(gridDiv, gridOptions);
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
    gridOptions.api.setRowData([]);
    buffer = [];
};

bullishChangeHTML.onchange = function(){
    var value = bullishChangeHTML.value;
    socket.emit( 'bullish', value);
    gridOptions.api.setRowData([]);
    buffer = [];
};
