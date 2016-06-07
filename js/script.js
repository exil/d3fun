(function() {
    var margin = {top: 10, right: 80, bottom: 70, left: 50};
    var svgWidth = 960 - margin.left - margin.right;
    var svgHeight = 500 - margin.top - margin.bottom;
    var hours = [];
    var charts = [];

    // Adds the svg canvas
    var svg = d3.select("#chart-container")
      .append("svg")
          .attr("width", svgWidth + margin.left + margin.right)
          .attr("height", svgHeight + margin.top + margin.bottom);

    d3.json('http://api-ak.wunderground.com/api/d8585d80376a429e/labels/conditions/hourly10day/forecast10day/health/lang:EN/units:english/v:2.0/bestfct:1/q/41.87459946,-87.63729858.json', createGraph);

    var heights = [svgHeight * .3, svgHeight * .3, svgHeight * .2, svgHeight * .2];
    var x = d3.time.scale()
      .range([0, svgWidth]);
    var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .tickFormat(d3.time.format('%a %d'));
    var bisectDate = d3.bisector(function(d) { return d.time; }).left;

    function createGraph(data) {
      var temps = parseData(data);
      var prevHeight = 0;

      for (var i = 0; i < temps.length; i++) {
        charts.push(new WeatherGraph({
          data: temps[i],
          id: i,
          width: svgWidth,
          prevHeight: prevHeight,
          height: heights[i],
          svg: svg,
          margin: margin,
          showBottomAxis: (i == temps.length - 1)
        }));
        prevHeight = prevHeight + heights[i];
      }

      var mousebox = svg.append('g').attr("transform", "translate(" + margin.left + ", 0)")

      var rect = mousebox.append("rect")
       .attr("class", "overlay")
       .attr("width", svgWidth)
       .attr("height", svgHeight + margin.top + margin.bottom)
       .attr('fill', 'transparent')
       .on("mousemove", mousemove);

       var needle = mousebox.append('rect')
         .attr('class', 'needle')
         .attr('width', 1)
         .attr('height', svgHeight + margin.top + margin.bottom)

      function mousemove() {
        var xData = temps[0][0];
        var x0 = x.invert(d3.mouse(this)[0]);
        var i = bisectDate(xData.values, x0, 1);
        var d0 = xData.values[i - 1];
        var d1 = xData.values[i];
        var d = x0 - d0.time > d1.time - x0 ? d1 : d0;
        console.log(d0);

        needle.attr("transform", "translate(" + x(d.time) + ",0)");
      }
  }

  function parseData(data) {
    var days = data.forecast.days;
    // y-axis: 0 is left side, 1 is right side
    var datasets = [
      {name: 'temperature', type: 'line', color: '#d6212a', yAxis: 0, values: []},
      {name: 'dewpoint', type: 'line', color: '#5b9f4a', yAxis: 0, values: []},
      {name: 'feelslike', type: 'line', color: '#ad55a1', yAxis: 0, values: []},
      {name: 'pressure', type: 'line', color: '#1e2023', yAxis: 1, yAxis: 1, values: []},
      {name: 'humidity', type: 'line', color: '#87c404', yAxis: 0, values: []},
      {name: 'cloudcover', type: 'area', color: '#8e8f91', yAxis: 0, values: []},
      {name: 'pop', type: 'area', color: '#16aadc', yAxis: 0, values: []},
      {name: 'liquid_precip', type: 'area', color: '#0074a2', yAxis: 0, values: []},
      {name: 'wind_speed', type: 'line', color: '#002f80', yAxis: 0, values: []},
      {name: 'wind_dir', type: 'other', color: '', yAxis: 0, values: []}
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
          value: d[key],
          yAxis: dataset.yAxis
        });
      });
    });

    return [
      [datasets[0],datasets[1],datasets[2]],
      [datasets[3],datasets[4],datasets[5],datasets[6]],
      [datasets[7]],
      [datasets[8], datasets[9]]
    ];
  }

  function WeatherGraph(options) {
    this.chartData = options.data;
    this.width = options.width;
    this.height = options.height;
    this.prevHeight = options.prevHeight;
    this.maxDataPoint = options.maxDataPoint;
    this.svg = options.svg;
    this.id = options.id;
    this.name = options.name;
    this.margin = options.margin;
    this.showBottomAxis = options.showBottomAxis;
    this.y0data = this.chartData.filter(function(datum) {
      return datum.yAxis === 0;
    });
    this.y1data = this.chartData.filter(function(datum) {
      return datum.yAxis === 1;
    });

    var y0 = d3.scale.linear()
      .range([this.height, 0]);

    var y1 = d3.scale.linear()
        .range([this.height, 0]);

    var yAxisLeft = d3.svg.axis()
        .scale(y0)
        .orient("left");

    var yAxisRight = d3.svg.axis()
        .scale(y1)
        .orient("right");

    var color = d3.scale.ordinal();

    color.domain(this.chartData.map(function(v) { return v.name; }));
    color.range(this.chartData.map(function(v) { return v.color; }));

    x.domain(d3.extent(hours, function(d) { return d.time; }));
    y0.domain([
      d3.min(this.y0data, function(c) { return d3.min(c.values, function(v) { return v.value; }); }),
      d3.max(this.y0data, function(c) { return d3.max(c.values, function(v) { return v.value; }); })
    ]);

    if (this.y1data.length) {
      y1.domain([
        d3.min(this.y1data, function(c) { return d3.min(c.values, function(v) { return v.value; }); }),
        d3.max(this.y1data, function(c) { return d3.max(c.values, function(v) { return v.value; }); })
      ]);
    }

    this.chartContainer = this.svg.append("g")
			.attr('class','graph-' + this.id)
			.attr("transform", "translate(" + this.margin.left + "," + (this.margin.top + this.prevHeight + (10 * this.id)) + ")");

    if (this.showBottomAxis) {
      this.chartContainer.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height + ")")
        .call(xAxis);
    }

    // Add the Y Axis
    this.chartContainer.append("g")
      .attr("class", "y axis y0-axis")
      .call(yAxisLeft);

    if (this.y1data.length) {
      this.chartContainer.append("g")
        .attr("class", "y axis y1-axis")
        .call(yAxisRight)
        .attr("transform", "translate(" + this.width + " ,0)");
    }

    var line = d3.svg.line()
      .interpolate("basis")
      .x(function(d) { return x(d.time); })
      .y(function(d) {
        if (d.yAxis === 0) {
          return y0(d.value);
        } else if (d.yAxis === 1) {
          return y1(d.value)
        }
      });

    var area = d3.svg.area()
      .interpolate("basis")
      .x(function(d) { return x(d.time); })
      .y0(function(d) { return y0(d.value); })
      .y1(this.height);

    var path = this.chartContainer.selectAll("path.weather-line").data(this.chartData)
        .enter()
        .append('path')
          .attr("class", function(d) {
            var className = 'weather-' + d.type;

            return className + ' key-' + d.name;
          })
          .attr("d", function(d) {
            if (d.type === 'line') {
              return line(d.values);
            } else if (d.type === 'area') {
              return area(d.values);
            }
           })
          .style("stroke", function(d) { return color(d.name); })
          .style("fill", function(d) {
            if (d.type === 'line') {
              return 'none';
            } else if (d.type === 'area') {
              return color(d.name);
            }
          })
          .attr("stroke-width", "2")
          //.attr("fill", "none");
/*
     var totalLength = path.node().getTotalLength();

      path
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
          .duration(3000)
          .ease("linear")
          .attr("stroke-dashoffset", 0);*/
  }
})();
