'use strict';

angular.module('stockMarketApp')
  .controller('MainCtrl', function ($scope, $http, $timeout, socket) {
    $scope.stockList = [];
    $scope.stockNames = [];
    $scope.errormessage = '';

    var getnames = function() {
      for (var i = 0; i < $scope.stockList.length; i++) {
        $scope.stockNames.push($scope.stockList[i].name);
      }
    }

    $http.get('/api/stocks').success(function(stockList) {
      $scope.stockList = stockList;
      socket.syncUpdates('stocks', $scope.stockList, function(event){ 
        $scope.stockNames = [];
        angular.forEach($scope.stockList, function(stock) {
          $scope.stockNames.push(stock.name);
        });
        $scope.chart.destroy();
        getChartData();
      });
      getnames();
      getChartData();
    });


    $scope.addStock = function() {
      if($scope.newStock === '' || $scope.newStock === undefined) {
        $scope.errormessage = "Please enter a stock name in the search form above."
        return;
      }
      angular.forEach($scope.stockNames, function(stock) {
        if (stock === $scope.newStock.toUpperCase()) {
          $scope.newStock = '';
          $scope.errormessage = "That stock has already been added!";
        }
      });
      if($scope.newStock === '') {
        return;
      }
      $scope.errormessage = '';
      $scope.newStock = $scope.newStock.toUpperCase();
      var newName = $scope.newStock;

      $.getJSON('https://www.quandl.com/api/v3/datasets/WIKI/' + $scope.newStock.toLowerCase() + '.json?exclude_column_names=true&exclude_headers=true&column_index=4&start_date=2010-1-01&api_key=cM35kKGXkzz27FeKNdW7').done(function (data) {
        
        var newdata = [];
        var jsondata = data.dataset.data;
        angular.forEach(jsondata, function(data) {
              var date = data[0];
              date = date.split("-");
              for(var i = 0; i < date.length; i++) {
                date[i] = parseInt(date[i], 10);
              }
              var isodate = Date.UTC(date[0],date[1],date[2]);
              newdata.unshift([
                isodate, data[1]
              ]);
        });

        $http.post('/api/stocks', { name: $scope.newStock });
        $scope.stockNames.push($scope.newStock);

        $scope.chart.addSeries({
          name: newName,
          data: newdata
        });

        $scope.$apply();
        $scope.newStock = '';
      }).fail(function(){
        $scope.errormessage = "That stock does not exist!";
        $scope.$apply();
        $scope.newStock = '';
      });

    };

    $scope.deleteStock = function(stocks) {
      if ($scope.stockNames.length === 1) {
        $scope.errormessage = "There must be at least one Stock on the chart!";
        return;
      }
      $scope.stockNames.splice($scope.stockNames.indexOf(stocks.name), 1);
      $http.delete('/api/stocks/' + stocks._id);
      for (var i = 0; i < $scope.chart.series.length; i++) {
        if ($scope.chart.series[i].name === stocks.name) {
          $scope.chart.series[i].remove(true);
        }
      }
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('stocks');
    });



///////////////////////////////////////////////////
  $scope.seriesOptions = [];
  // This function will create the chart only after all the data has been loaded.
  function createChart() {
    $('#chart').highcharts('StockChart', {
      rangeSelector: {
                selected: 4
      },
      chart: {
        borderWidth: 2,
        borderColor: "#000"
      },
      yAxis: {
          labels: {
              formatter: function () {
                  return (this.value > 0 ? ' + ' : '') + this.value + '%';
              }
          },
          plotLines: [{
              value: 0,
              width: 2,
              color: 'silver'
          }]
      },
      plotOptions: {
          series: {
              compare: 'value'
          }
      },
      tooltip: {
          pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.change}%)<br/>',
          valueDecimals: 2
      },
      series: $scope.seriesOptions
    });
  }

    // This gets the values for the stock chart.
    function getChartData() {
      var seriesCounter = 0;
      $scope.seriesOptions = [];
      $.each($scope.stockNames, function (i, name) {
          $.getJSON('https://www.quandl.com/api/v3/datasets/WIKI/' + name.toLowerCase() + '.json?exclude_column_names=true&exclude_headers=true&column_index=4&start_date=2010-1-01&api_key=cM35kKGXkzz27FeKNdW7',    function (data) {
            
            var newdata = [];
            var jsondata = data.dataset.data;
            angular.forEach(jsondata, function(data) {
              var date = data[0];
              date = date.split("-");
              for(var i = 0; i < date.length; i++) {
                date[i] = parseInt(date[i], 10);
              }
              var isodate = Date.UTC(date[0],date[1],date[2]);
              newdata.unshift([
                isodate, data[1]
              ]);
            });
            //console.log(name);
              $scope.seriesOptions[i] = {
                  name: name,
                  data: newdata
              };
              // As we're loading the data asynchronously, we don't know what order it will arrive. So
              // we keep a counter and create the chart when all the data is loaded.
              seriesCounter += 1;
              if (seriesCounter === $scope.stockNames.length) {
                  createChart();
                  $scope.chart = $("#chart").highcharts('StockChart');
              }
          });
      });
    }

  });
