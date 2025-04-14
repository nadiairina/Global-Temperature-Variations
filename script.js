document.addEventListener("DOMContentLoaded", function() {
  const url = "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";
  const svgWidth = Math.min(1200, window.innerWidth - 80);
  const svgHeight = svgWidth * 0.5;
  const padding = { top: 60, right: 40, bottom: 60, left: 60 };

  d3.json(url).then(data => {
    const baseTemp = data.baseTemperature;
    const dataset = data.monthlyVariance;

    const xScale = d3.scaleBand()
      .domain(dataset.map(d => d.year))
      .range([padding.left, svgWidth - padding.right])
      .padding(0.01);

    const yScale = d3.scaleBand()
      .domain(d3.range(12, 0, -1))
      .range([padding.top, svgHeight - padding.bottom])
      .padding(0.01);

    const minTemp = d3.min(dataset, d => baseTemp + d.variance);
    const maxTemp = d3.max(dataset, d => baseTemp + d.variance);
    const colorScale = d3.scaleSequential(d3.interpolateRdYlBu)
      .domain([maxTemp, minTemp]);

    const svg = d3.select("#heatmap")
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`);

    // Add background grid
    svg.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(d3.range(dataset.length))
      .enter()
      .append("line")
      .attr("x1", d => xScale(dataset[d].year))
      .attr("x2", d => xScale(dataset[d].year))
      .attr("y1", padding.top)
      .attr("y2", svgHeight - padding.bottom)
      .attr("stroke", "#f0f0f0")
      .attr("stroke-width", 0.5);

    // Create cells
    svg.selectAll(".cell")
      .data(dataset)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("data-month", d => d.month - 1)
      .attr("data-year", d => d.year)
      .attr("data-temp", d => baseTemp + d.variance)
      .attr("x", d => xScale(d.year))
      .attr("y", d => yScale(d.month))
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", d => colorScale(baseTemp + d.variance))
      .on("mouseover", function(event, d) {
        d3.select(this)
          .style("stroke", "#000")
          .style("stroke-width", "2px");
          
        d3.select("#tooltip")
          .style("visibility", "visible")
          .attr("data-year", d.year)
          .html(`
            <strong>${d.year} - ${d3.timeFormat("%B")(new Date(0, d.month - 1))}</strong><br>
            Temperature: ${(baseTemp + d.variance).toFixed(2)}°C<br>
            Variance: ${d.variance.toFixed(2)}°C
          `)
          .style("left", `${event.pageX + 15}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", function() {
        d3.select(this)
          .style("stroke", "none");
        d3.select("#tooltip")
          .style("visibility", "hidden");
      });

    // Add axes
    const xAxis = d3.axisBottom(xScale)
      .tickValues(xScale.domain().filter(year => year % 10 === 0))
      .tickFormat(d3.format("d"));
      
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(month => d3.timeFormat("%B")(new Date(0, month - 1)));

    svg.append("g")
      .attr("id", "x-axis")
      .attr("transform", `translate(0,${svgHeight - padding.bottom})`)
      .call(xAxis)
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append("g")
      .attr("id", "y-axis")
      .attr("transform", `translate(${padding.left},0)`)
      .call(yAxis);

    // Create legend
    const legendWidth = 300;
    const legendHeight = 50;
    
    const legendSvg = d3.select("#legend")
      .append("svg")
      .attr("width", legendWidth)
      .attr("height", legendHeight);

    const legendScale = d3.scaleLinear()
      .domain([minTemp, maxTemp])
      .range([0, legendWidth - 60]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d => `${d.toFixed(1)}°C`);

    const defs = legendSvg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "temperature-gradient")
      .attr("x1", "0%")
      .attr("x2", "100%");

    gradient.selectAll("stop")
      .data([
        {offset: "0%", color: colorScale(minTemp)},
        {offset: "50%", color: colorScale((minTemp + maxTemp) / 2)},
        {offset: "100%", color: colorScale(maxTemp)}
      ])
      .enter()
      .append("stop")
      .attr("offset", d => d.offset)
      .attr("stop-color", d => d.color);

    legendSvg.append("rect")
      .attr("x", 30)
      .attr("y", 0)
      .attr("width", legendWidth - 60)
      .attr("height", 20)
      .style("fill", "url(#temperature-gradient)");

    legendSvg.append("g")
      .attr("transform", `translate(30,20)`)
      .call(legendAxis);
  });
});
