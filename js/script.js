(function() {
    var margin = {top: 20, right: 80, bottom: 30, left: 50};
    var width = 960 - margin.left - margin.right;
    var height = 500 - margin.top - margin.bottom;
    var hours = [];
    var charts = [];

    /*


  */

    // Adds the svg canvas
    var svg = d3.select("#chart-container")
      .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom);

    // define line


    d3.json('http://api-ak.wunderground.com/api/d8585d80376a429e/labels/conditions/hourly10day/forecast10day/health/lang:EN/units:english/v:2.0/bestfct:1/q/41.87459946,-87.63729858.json', createGraph);

    function createGraph(data) {
      var temps = parseData(data);

      for (var i = 0; i < temps.length; i++) {
        charts.push(new WeatherGraph({
          data: temps[i],
          id: i,
          width: width,
          height: height / temps.length,
          svg: svg,
          margin: margin,
          showBottomAxis: (i == temps.length - 1)
        }));
      }
  }

  function parseData(data) {
    var days = data.forecast.days;
    var datasets = [
      {name: 'temperature', values: []},
      {name: 'dewpoint', values: []},
      {name: 'feelslike', values: []},
      {name: 'pressure', values: []},
      {name: 'humidity', values: []},
      {name: 'cloudcover', values: []},
      {name: 'pop', values: []},
      {name: 'liquid_precip', values: []},
      {name: 'wind_speed', values: []}
    ];
    days.forEach(function(d) {
      hours = hours.concat(d.hours);
    });

    hours.forEach(function(d) {
      d.time = new Date(d.date.epoch * 1000);
      datasets.forEach(function(dataset) {
        var key = dataset.name;
        dataset.values.push({
          time: new Date(d.date.epoch * 1000),
          value: d[key]
        });
      });
    });

    return [
      [datasets[0],datasets[1],datasets[2]],
      [datasets[3],datasets[4],datasets[5],datasets[6],datasets[7]],
      [datasets[8],datasets[9],datasets[10]]
    ];
  }

  function WeatherGraph(options) {
    this.chartData = options.data;
    this.width = options.width;
    this.height = options.height;
    this.maxDataPoint = options.maxDataPoint;
    this.svg = options.svg;
    this.id = options.id;
    this.name = options.name;
    this.margin = options.margin;
    this.showBottomAxis = options.showBottomAxis;

    var x = d3.time.scale()
      .range([0, this.width]);

    var y = d3.scale.linear()
      .range([this.height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickFormat(d3.time.format('%a %d'));

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var color = d3.scale.category10();

    color.domain(['temperature','dewpoint','feelslike']);

    var line = d3.svg.line()
              .interpolate("basis")
              .x(function(d) { return x(d.time); })
              .y(function(d) { return y(d.value); });

    console.log(this.chartData);
    x.domain(d3.extent(hours, function(d) { return d.time; }));
    y.domain([
      d3.min(this.chartData, function(c) { return d3.min(c.values, function(v) { return v.value; }); }),
      d3.max(this.chartData, function(c) { return d3.max(c.values, function(v) { return v.value; }); })
    ]);

    this.chartContainer = this.svg.append("g")
			.attr('class','graph-' + this.id)
			.attr("transform", "translate(" + this.margin.left + "," + (this.margin.top + (this.height * this.id) + (10 * this.id)) + ")");

    this.chartContainer.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    // Add the Y Axis
    this.chartContainer.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    var path = this.chartContainer.selectAll("path.temperature-line").data(this.chartData)
        .enter()
        .append('path')
          .attr("class", function(d) { return 'temperature-line key-' + d.name })
          .attr("d", function(d) { return line(d.values); } )
          .style("stroke", function(d) { return color(d.name); })
          .attr("stroke-width", "2")
          .attr("fill", "none");

     var totalLength = path.node().getTotalLength();

      path
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
          .duration(3000)
          .ease("linear")
          .attr("stroke-dashoffset", 0);
  }
})();
