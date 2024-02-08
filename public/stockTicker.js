let tickerGridOptions = {};
const tickerIntervalInMinutes = 5;

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

function diffGetter(params) {
    if ( !params.data || !params.data.currentPrice ) {
        return "current price not fetched";
    }

    return ( ( ( params.data.currentPrice - params.data.price ) / params.data.price ) * 100 ).toFixed(2) +" % " ;
}

function getPrecisionValue( { value } ){
    return value ? value.toFixed(2) : '';
}

function getColumnDefs(){
    return [
        { field: "id", hide : true },
        { field: "symbol", filter: 'agNumberColumnFilter', checkboxSelection: true },
        { field: "price", filter: 'agNumberColumnFilter' },
        { field: "date"},
        { field: "percentage", filter: 'agNumberColumnFilter',  valueGetter: diffGetter },
        { field: "currentPrice", filter: 'agNumberColumnFilter' },
        { field: "DMA_20", filter: 'agNumberColumnFilter', valueFormatter: getPrecisionValue },
        { field: "DMA_50", filter: 'agNumberColumnFilter', valueFormatter: getPrecisionValue },
        { field: "DMA_100", filter: 'agNumberColumnFilter', hide: true, valueFormatter: getPrecisionValue },
        { field: "DMA_200", filter: 'agNumberColumnFilter', hide: true, valueFormatter: getPrecisionValue},
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
        rowGroupPanelShow: 'always',
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
    let index = 0;
    const interval = 1000*60;
    setInterval( () =>{
        tickerGridOptions.api.forEachNode( (rowNode ) => {
            index = index + 1;
            setTimeout(function () {
                socket.emit('ticker', rowNode.data.symbol );
            }, index * interval);
        });
    }, tickerIntervalInMinutes*1000*60)

    socket.on('ticker', ( data ) => {
        const rowNode = tickerGridOptions.api.getRowNode(data.symbol);
        rowNode && rowNode.setData({
            ...rowNode.data,
            ...data,
        })
    });
});
