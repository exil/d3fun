(function() {
    var margin = {top: 20, right: 80, bottom: 30, left: 50};
    var width = 960 - margin.left - margin.right;
    var height = 500 - margin.top - margin.bottom;
    var hours = [];

    var x = d3.time.scale()
      .range([0, width]);

    var y = d3.scale.linear()
      .range([height, 0]);

    var color = d3.scale.category10();

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickFormat(d3.time.format('%a %d'));

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    // Adds the svg canvas
    var svg = d3.select("#chart-container")
      .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
      .append("g")
          .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

    // define line
    var line = d3.svg.line()
                  .interpolate("basis")
                  .x(function(d) { return x(d.time); })
                  .y(function(d) { return y(d.value); });

    d3.json('http://api-ak.wunderground.com/api/d8585d80376a429e/labels/conditions/hourly10day/forecast10day/health/lang:EN/units:english/v:2.0/bestfct:1/q/41.87459946,-87.63729858.json', createGraph);

    function createGraph(data) {
      var temps = parseData(data);
      x.domain(d3.extent(hours, function(d) { return d.time; }));
      y.domain([
        d3.min(temps, function(c) { return d3.min(c.values, function(v) { return v.value; }); }),
        d3.max(temps, function(c) { return d3.max(c.values, function(v) { return v.value; }); })
      ]);

      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

      // Add the Y Axis
      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis);

      var path = svg.selectAll("path.temperature-line").data(temps)
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

  function parseData(data) {
    var days = data.forecast.days;
    var datasets = [
      {name: 'temperature', values: []},
      {name: 'dewpoint', values: []},
      {name: 'feelslike', values: []},
      {name: 'liquid_precip', values: []}
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

    color.domain(['temperature','dewpoint','feelslike']);

    return [datasets[0], datasets[1], datasets[2]];
  }
})();
