let tickerGridOptions = {};
const tickerIntervalInMinutes = 1;

function getUpdateStocks(){
    return JSON.parse(localStorage.getItem(SELECTED_STOCKS_KEY) ).map(
        ( data ) => {
            return {
                id : data.symbol,
                ...data
            }
        }
    ) || [];
}

function getColumnDefs(){
    return [
        { field: "id", hide : true },
        { field: "symbol", filter: 'agNumberColumnFilter', checkboxSelection: true },
        { field: "price", filter: 'agNumberColumnFilter' },
        { field: "currentPrice", filter: 'agNumberColumnFilter' },
        { field: "DMA_20", filter: 'agNumberColumnFilter' },
        { field: "DMA_50", filter: 'agNumberColumnFilter' },
        { field: "DMA_100", filter: 'agNumberColumnFilter', hide: true, },
        { field: "DMA_200", filter: 'agNumberColumnFilter', hide: true, },
      ];
}

function getDefaultColDef(){
    return {
        flex: 1,
        minWidth: 150,
        filter: 'agTextColumnFilter',
        menuTabs: ['filterMenuTab'],
        sortable : true,
        enableValue: true,
        enableRowGroup: true,
        enablePivot: true,
    };
}

function gridOptionsTicker(){
    tickerGridOptions = {
        columnDefs: getColumnDefs(),
        rowData: getUpdateStocks(),
        defaultColDef: getDefaultColDef(),
        autoGroupColumnDef: {
          minWidth: 200,
        },
        getRowId: params => params.data.id,
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
    };
    return tickerGridOptions;
}

function deleteDataFromLocalStoage( data, gridOptionsAPI ){
    localStorage.setItem(
        SELECTED_STOCKS_KEY,
        JSON.stringify( data )
    );
    gridOptionsAPI.deselectAll();
}

function deleteSelectedStocks() {
    const gridOptionsAPI = tickerGridOptions.api;
    const selectedRows = gridOptionsAPI.getSelectedRows();
    const allRows = getUpdateStocks();
    const filteredData = allRows.filter( ( { symbol } ) => !selectedRows.some( ( stock ) => stock.symbol === symbol ) )
    gridOptionsAPI.setRowData( filteredData.map( ( data )=> { 
        return { id : data.symbol, ...data } 
    } ) );
    deleteDataFromLocalStoage( filteredData, gridOptionsAPI );
}


document.addEventListener('DOMContentLoaded', () => {
    const gridDiv = document.querySelector('#myTickerGrid');
    tickerGridOptions = gridOptionsTicker();
    new agGrid.Grid(gridDiv, tickerGridOptions);
    
    setInterval( () =>{
        tickerGridOptions.api.forEachNode((rowNode ) => {
            socket.emit('ticker', rowNode.data.symbol );
        });
    }, tickerIntervalInMinutes*1000*60)

    socket.on('ticker', ( data ) => {
        const rowNode = tickerGridOptions.api.getRowNode(data.symbol);
        rowNode.setData({
            ...rowNode.data,
            ...data,
        })
    });
});