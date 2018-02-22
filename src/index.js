var width = 1800,
    height = 1800;



d3.csv(("./src/knowledge_graph_final_result.csv"), function (error, links) {
    var nodes = {};

    // Compute the distinct nodes from the links.
    links.forEach(function (link) {
        link.source = nodes[link.source] ||
            (nodes[link.source] = {
                name: link.source,
                courseTitle: link.course_title_x,
                probability: link.value
            });
        link.target = nodes[link.target] ||
            (nodes[link.target] = {
                name: link.target,
                targetCourseTitle: link.target_course_title,
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

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

    // build the arrow.
    svg.append("svg:defs").selectAll("marker")
        .data(["end"]) // Different link/path types can be defined here
        .enter().append("svg:marker") // This section adds in the arrows
        .attr("id", String)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", -1.5)
        .attr("markerWidth", 10)
        .attr("markerHeight", 10)
        .attr("orient", "auto")
        .append("svg:path")
        .style("fill", "#FFF")
        .attr("d", "M0,-5L10,0L0,5");

    // add the links and the arrows
    var path = svg.append("svg:g").selectAll("path")
        .data(force.links())
        .enter().append("svg:path")
        //    .attr("class", function(d) { return "link " + d.type; })
        .attr("class", "link")
        .attr("marker-end", "url(#end)");

    // define the nodes
    var node = svg.selectAll(".node")
        .data(force.nodes())
        .enter().append("g")
        .attr("class", "node")
        .style("fill", "#33AADA")
        .call(force.drag);

    // add the nodes
    node.append("circle")
        .attr("r", 8)
        .style("stroke",  "#fff")
        .style("stroke-width", 1.5)

    svg.selectAll("circle")
        .on("mouseover", function(d,i) {
            var probability = d.probability * 100;
            d3.selectAll("text")
                .style("opacity", .1);

            d3.select(this.parentNode).append("text")
            .attr("x", d3.select(this).attr("cx"))
            .attr("dy", 30)
            .attr("stroke", "#fff")
            .attr("stroke-width", ".9")
            .text(function (d) {
                return d.targetCourseTitle ? d.targetCourseTitle
                    : d.courseTitle;
            });


            d3.select(this.parentNode).append("text")
                .attr("x", d3.select(this).attr("cx"))
                .attr("dy", 50)
                .attr("stroke", "#fff")
                .attr("stroke-width", ".9")
                .text(function (d) {
                    debugger;
                    return d.targetCourseTitle ?
                        `${Math.round(probability)}% match`
                        : null;
                });

        })
        .on("mouseout", function(d,i) {
            d3.selectAll("text")
                .style("opacity", 1);

            d3.select(this.parentNode).selectAll("text").remove();
            node.append("text")
            .attr("x", 12)
            .attr("dy", ".35em")
            .attr("stroke", "#fff")
            .attr("stroke-width", ".9")
            .text(function (d) {
                return d.courseTitle;
            });
        })

    // add the text
    var nodeText = node.append("text")
        .attr("x", 12)
        .attr("dy", ".35em")
        .attr("stroke", "#fff")
        .attr("stroke-width", ".9")
        .text(function (d) {
            return d.courseTitle;
        });

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
});



