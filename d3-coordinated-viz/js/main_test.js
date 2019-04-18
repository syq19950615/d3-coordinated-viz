//Main JavaScript by Yuqi Shi, 2019

(function(){

//pseudo-global variables
var attrArray = ["drug poisoning death", "Population (k)", "drug poisoning death rate (per 100,000 inhabitant)", "violent crimes rate (per 100,000 inhabitant)", "property crimes rate (per 100,000 inhabitant)"]; //list of attributes
var expressed = attrArray[0]; //initial attribute
var attr0 = attrArray[0];
var attr1 = attrArray[1];
var attr2 = attrArray[2];
var attr3 = attrArray[3];
var attr4 = attrArray[4];

//chart frame dimensions
var chartWidth = window.innerWidth * 0.425,
    chartHeight = 585,
    leftPadding = 30,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){

    //map frame dimensions
    var width = window.innerWidth * 0.5,
        height = 582;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
    var projection = d3.geoAlbers()
        .center([2, 40])
        .rotate([98, 0])
        .parallels([35, 35])
        .scale(1000)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);
		
    //use Promise.all to parallelize asynchronous data loading	
	var promises = [];
    promises.push(d3.csv("data/data2.csv")); //load attributes from csv
    promises.push(d3.json("data/state.topojson"));//load choropleth spatial data
    Promise.all(promises).then(callback);

    function callback(data){
	csvData = data[0];
	states = data[1];
	
    //place graticule on the map
    setGraticule(map, path);

	//translate states TopoJSON
	var US_states = topojson.feature(states, states.objects.Export_Output).features;
	
    //join csv data to GeoJSON enumeration units
    US_states = joinData(US_states, csvData);
	//console.log(US_states)
	
    //create the color scale
    var colorScale = makeColorScale(csvData);
	//console.log(csvData)
	
	//create a scale to size bars proportionally to frame and for axis
	var maxattr = d3.max(csvData, function(d){return parseFloat(d[expressed])});
	yScale = d3.scaleLinear()
		.range([585, 0])
		.domain([0, maxattr*1.05]);	
    //add enumeration units to the map
    setEnumerationUnits(US_states, map, path, colorScale);
	createDropdown(csvData);
        //add coordinated visualization to the map
		//console.log(csvData)
        setChart(csvData, colorScale);	
	};
}; //end of setMap()

function setGraticule(map, path){
    //...GRATICULE BLOCKS FROM MODULE 8
	//Example 2.5 line 3...create graticule generator
    var graticule = d3.geoGraticule()
        .step([10, 10]); //place graticule lines every 5 degrees of longitude and latitude

	//create graticule background
    var gratBackground = map.append("path")
        .datum(graticule.outline()) //bind graticule background
        .attr("class", "gratBackground") //assign class for styling
        .attr("d", path); //project graticule
			
    //Example 2.6 line 5...create graticule lines
    var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
        .data(graticule.lines()) //bind graticule lines to each element to be created
        .enter() //create an element for each datum
        .append("path") //append each element to the svg as a path element
        .attr("class", "gratLines") //assign class for styling
        .attr("d", path); //project graticule lines		
};

function joinData(US_states, csvData){
    //...DATA JOIN LOOPS FROM EXAMPLE 1.1
    //loop through csv to assign each set of csv attribute values to geojson region

	for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i]; //the current region
        var csvKey = csvRegion.diss_me; //the CSV primary key
		//console.log(csvKey)
        //loop through geojson regions to find correct region
        for (var a=0; a<US_states.length; a++){

            var geojsonProps = US_states[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.diss_me; //the geojson primary key
			//console.log(geojsonKey)
            //where primary keys match, transfer csv data to geojson properties object
            if (parseInt(geojsonKey) == parseInt(csvKey)){
	
                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
            };
        };
    };
    return US_states;
};

function setEnumerationUnits(US_states, map, path, colorScale){
	//console.log(US_states)
    var regions = map.selectAll(".regions")
        .data(US_states)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "regions " + d.properties.adm1_code;
        })
        .attr("d", path)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale);
        })
        .on("mouseover", function(d){
            highlight(d.properties);
        })
        .on("mouseout", function(d){
            dehighlight(d.properties);
        })
		.on("click", function(d){
			clickpop(d.properties);
		console.log(d.properties);
		})
        .on("mousemove", moveLabel);
    var desc = regions.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');
	//console.log(colorScale)
};


//function to create color scale generator
function makeColorScale(data){
	//console.log(data)
    var colorClasses = [
        "#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043"
    ];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);
		
////other colorScales
/*     //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray); */

/*     //build two-value array of minimum and maximum expressed attribute values
    var minmax = [
        d3.min(data, function(d) { return parseFloat(d[expressed]); }),
        d3.max(data, function(d) { return parseFloat(d[expressed]); })
    ];
    //assign two-value array as scale domain
    colorScale.domain(minmax); */

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
    //reset domain array to cluster minimums
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove first value from domain array to create class breakpoints
    domainArray.shift();

    //assign array of last 4 cluster minimums as domain
    colorScale.domain(domainArray);
	
    return colorScale;
};

//function to create a dropdown menu for attribute selection
function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};

//dropdown change listener handler
function changeAttribute(attribute, csvData){
    //change the expressed attribute
    expressed = attribute;

    //recreate the color scale
    var colorScale = makeColorScale(csvData);

    //recolor enumeration units
    var regions = d3.selectAll(".regions")
        .transition()
        .duration(1000)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });

    //re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
        //re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
        .transition() //add animation
        .delay(function(d, i){
            return i * 20
        })
        .duration(500);
		
	//create a scale to size bars proportionally to frame and for axis		
	var maxattr = d3.max(csvData, function(d){return parseFloat(d[expressed])});
	yScale = d3.scaleLinear()
		.range([585, 0])
		.domain([0, maxattr*1.05]);
		
	//console.log(maxattr*1.05)
	d3.select(".axis").remove();
	//create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);
	yAxis.tickSizeOuter([0]);
	
    //place axis
    var axis = d3.select(".chart").append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);
	
		
    updateChart(bars, csvData.length, colorScale);
}; //end of changeAttribute()


//function to position, size, and color bars in chart
function updateChart(bars, n, colorScale){


    //position bars
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return 585 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
	//add text to chart title
    var chartTitle = d3.select(".chartTitle")
        .text(expressed + " in each state");
};

//function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};

//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 595,
        leftPadding = 30,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
			//console.log(d)
            return "bar " + d.adm1_code;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel)
		.on("click", clickpop);
    var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 100)
        .attr("y", 30)
        .attr("class", "chartTitle")
        .text(expressed + " in each state");

    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);
	yAxis.tickSizeOuter([0]);
	
    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
	
    //set bar positions, heights, and colors
    updateChart(bars, csvData.length, colorScale);
}; //end of setChart()

//function to highlight enumeration units and bars
function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.adm1_code)
        .style("stroke", "blue")
        .style("stroke-width", "2");
	setLabel(props);
};

//function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.adm1_code)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });
    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
    d3.select(".infolabel")
        .remove();
    d3.select(".popwindow")
        .remove();
};

function clickpop(props){
	var selected = d3.selectAll("." + props.adm1_code)
        .style("stroke", "orange")
        .style("stroke-width", "4");
	console.log(props)
	setPopup(props);
};

function setPopup(props){
	var popAttribute = "</b>" + attr0 +
        "</h1><b>" + props[attr0] + "</h1>"; 
/* 		+ props[attr1] + 
		"</h1><b>" + attr1 + 
		"</b>" + props[attr2] + 
		"</h1><b>" + attr2 + 
		"</b>" + props[attr3] + 
		"</h1><b>" + attr3 + 
		"</b>" + props[attr4] + 
		"</h1><b>" + attr4 + "</b>"; */
	var info = svg.append("text").attr("class","info");
	info.text(attr0);
	var popwindow = d3.select("body")
        .append("div")
        .attr("class", "popwindow")
        .attr("id", props.adm1_code + "_label")
        .html(popAttribute);
    var popregionName = popwindow.append("div")
        .attr("class", "labelname")
        .html(props.name);		
};		
		
//function to create dynamic label
function setLabel(props){
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.adm1_code + "_label")
        .html(labelAttribute);

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.name);
};

//function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;
	//console.log(labelWidth)
    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};

})(); //last line of main.js