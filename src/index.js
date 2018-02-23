var width = 1800,
    height = 1800;

// load the data
d3.csv("./src/programming_focus_subset.csv", function (error, links) {

    var nodes = {};

    // parse nodes from links
    links.forEach(function (link) {
        link.source = nodes[link.source] ||
            (nodes[link.source] = {
                name: link.source,
                courseTitle: link.source_course_title,
            });
        link.target = nodes[link.target] ||
            (nodes[link.target] = {
                name: link.target,
                courseTitle: link.target_course_title,
                probability: link.value
            });
        link.value = +link.value;
    });

    var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(links)
        .size([width, height])
        .linkDistance(160)
        .charge(-1000)
        .on("tick", tick)
        .start();

    // Set the range
    var v = d3.scale.linear().range([0, 100]);

    // Scale the range of the data
    // Can probably remove
    v.domain([0, d3.max(links, function (d) {
        return d.value;
    })]);

    // asign a type per value to encode opacity
    // Thanks to Bostock for this!
    links.forEach(function (link) {
        if (v(link.value) <= 25) {
            link.type = "twofive";
        } else if (v(link.value) <= .50 && v(link.value) > .25) {
            link.type = "fivezero";
        } else if (v(link.value) <= .75 && v(link.value) > .50) {
            link.type = "sevenfive";
        } else if (v(link.value) <= 1 && v(link.value) > .75) {
            link.type = "onezerozero";
        }
    });

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

    // build the arrow
    var marker = svg.append("svg:defs").selectAll("marker")
        .data(["end"]) // Different link/path types can be defined here
        .enter().append("svg:marker") // This section adds in the arrows
        .attr("id", String)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", -1.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .style("fill", "#f3f6f8")
        .style("opacity", .9)
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");

    // add the links and the arrows
    var path = svg.append("svg:g").selectAll("path")
        .data(force.links())
        .enter().append("svg:path")
        .style("stroke", "#f3f6f8")
        .attr("class", function (d) {
            return "link " + d.type;
        })
        .attr("marker-end", "url(#end)");

    // build the tooltip
    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // define the nodes
    var node = svg.selectAll(".node")
        .data(force.nodes())
        .enter().append("g")
        .attr("class", "node")
        .on("click", click)
        .on("dblclick", dblclick)
        .on("mouseover", fade(0))
        .on("mouseout", fade(1))
        // .on("mouseover", mouseOver)
        // .on("mouseout", mouseOut)
        .call(force.drag);

    // add the nodes
    node.append("circle")
        .attr("r", 8)
        .style("fill", "#1d92c1");

    // add the text
    node.append("text")
        .attr("x", 12)
        .attr("dy", ".35em")
        .style("fill", "#f3f6f8")
        .text(function (d) {
            return d.courseTitle;
        });

    // Helpers to figure out connected nodes
    var linkedByIndex = {};
    links.forEach(function (d) {
        linkedByIndex[d.source.index + "," + d.target.index] = 1;
    });

    function isConnected(a, b) {
        return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index;
    }

    // add the curvy lines
    function tick() {
        path.attr("d", function (d) {
            var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);
            return "M" +
                d.source.x + "," +
                d.source.y + "A" +
                dr + "," + dr + " 0 0,1 " +
                d.target.x + "," +
                d.target.y;
        });

        node
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
    }

    // action to take on mouse click
    function click(d) {
        // d3.select(this).select("text").transition()
        //     .duration(750)
        //     .attr("x", 22)
        //     .style("fill", "#f3f6f8")
        //     // .style("stroke", "lightsteelblue")
        //     .style("stroke-width", ".5px")
        //     .style("font", "20px sans-serif");
        d3.select(this).select("circle")
            // .transition()
            // .duration(750)
            // .attr("r", 16)
            .style("fill", "#544BC2");
        showToolTip(d);
        // mouseOut(d);
    }

    // action to take on mouse double click
    function dblclick(d) {
        d3.select(this).select("circle").transition()
            .duration(750)
            .attr("r", 8)
            .style("fill", "#1d92c1");
        // d3.select(this).select("text").transition()
        //     .duration(750)
        //     .attr("x", 12)
        //     .style("stroke", "none")
        //     .style("fill", "#f3f6f8")
        //     .style("stroke", "none")
        //     .style("font", "10px sans-serif");
        showToolTip(d);
        // mouseOut(d);
    }


    function showToolTip(d) {
        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        tooltip.html("<p class='tooltip-title'>" + d.courseTitle + "</p>" + "Course Probability: " + Math.round(d.probability * 100) + "%")
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
    }

    function hideToolTip(d) {
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    }

    function fade(opacity) {
        return function (d) {
            node.style("stroke-opacity", function (o) {
                var thisOpacity = isConnected(d, o) ? 1 : opacity;
                this.setAttribute('fill-opacity', thisOpacity);
                return thisOpacity;
            });

            path.style("stroke-opacity", opacity).style("stroke-opacity", function (o) {
                return o.source === d || o.target === d ? 1 : opacity;
            });

            // marker.style("opacity", function (o) {
            //     debugger;
            //     return o.source === d || o.target === d ? 1 : opacity;
            // });

            d3.selectAll("marker")
                .style("opacity", opacity);
            hideToolTip(d);
        };
    }

    // TODO: Abstract all mouse behaviors into here
    // function mouseOver(d, i) {
    //     fade(.1, d);
    // }

    // function mouseOut(d, i) {
    //     fade(1, d);
    //     hideToolTip(d);
    // }
});