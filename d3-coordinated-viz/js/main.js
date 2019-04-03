//Main JavaScript by Yuqi Shi, 2019

//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){

    //map frame dimensions
    var width = 960,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
    var projection = d3.geoAlbers()
        .center([9, 50])
        .rotate([105, 11])
        .parallels([45, 45])
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
        //Example 2.5 line 3...create graticule generator
        var graticule = d3.geoGraticule()
            .step([10, 10]); //place graticule lines every 5 degrees of longitude and latitude

        //create graticule background
        var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule
			console.log(gratBackground);
        //Example 2.6 line 5...create graticule lines
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines		
		
		//translate states TopoJSON
		var US_states = topojson.feature(states, states.objects.Export_Output).features;
		console.log(US_states);
		//examine the results
		//console.log(europeCountries);
        //console.log(csvData);
        //console.log(US_states);
        //add France regions to map
        var regions = map.selectAll(".regions")
            .data(US_states)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "regions " + d.properties.adm1_code;
            })
            .attr("d", path);
		console.log(regions)
    };
};





 


