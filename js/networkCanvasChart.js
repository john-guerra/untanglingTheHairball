/* global d3, networkCanvasChart, forceInABox */

var networkCanvasChart = function () {
  "use strict";
  // constants to define the size
  // and margins of the vis area.
  var chart = this;
  var nameAttr = function (d) { return d.name; };

  chart.useFixedAxis = false;
  chart.drawLinks = true;
  chart.onlyDrawSelectedLinks = false;
  chart.xAttr = "followers_count";
  chart.rAttr = function () { return 1; };
  chart.xTitle = "Followers overall";
  chart.yAttr = "count_followers_in_query";
  chart.yTitle = "Followers in OpenVisConf";
  chart.width = 600;
  chart.height = 520;
  chart.showClusters = false;
  chart.useForceInABox = false;
  chart.forceInABoxTemplate = "force"; // "force" | "treemap"
  chart.forceInABoxAttr = "cluster";
  chart.charge = -100;
  chart.useCharge = true;
  chart.zoomScale = 0.8;
  chart.linkDistance= 50;
  chart.linkStrengh = 0.1;
  chart.zoomTranslate = [80,0];
  chart.collide = false;
  chart.gravity = 0.2;
  // Node's radius
  chart.radiusRange = [4,15];
  chart.showImages = true;

  var width,height;
  var margin = {top:10, left:40, bottom:60, right:10};


  // Colors for clusters
  var color = d3.scaleOrdinal(d3.schemeCategory20);
  // Should we show images

  // Should we show clusters?



  var xScale = d3.scalePow().exponent(0.25);
  // var xScale = d3.scaleLinear();
  var yScale = d3.scaleLinear();
  var rScale = d3.scaleLinear();

  var yAxis = d3.axisLeft(yScale);
            // .ticks(20, ".1s");
  var xAxis = d3.axisBottom(xScale)
            .ticks(5, ".0f");

  chart.xScale = function(_) { return arguments.length ? (xScale = _, chart) : xScale; };
  chart.xAxis = function(_) { return arguments.length ? (xAxis = _, chart) : xAxis; };
  chart.yScale = function(_) { return arguments.length ? (yScale = _, chart) : yScale; };
  chart.yAxis = function(_) { return arguments.length ? (yAxis = _, chart) : yAxis; };
  chart.rScale = function(_) { return arguments.length ? (rScale = _, chart) : rScale; };
  chart.color = function(_) { return arguments.length ? (color = _, chart) : color; };
  chart.nameAttr = function(_) { return arguments.length ? (nameAttr = _, chart) : nameAttr; };


  var zoom_transform = d3.zoomIdentity;

  // main canvas, context used for visualization
  var canvas = null;
  var context = null;

  // The svg for the axis
  var svg = null;

  // The force simulation
  var simulation = d3.forceSimulation();
  simulation.stop();

  // A cluster nest for more efficiently drawing the clusters
  var clusters = null;

  var foci = {};
  // Currently visible nodes
  var filteredNodes = [];
  // For jump into cluster
  var oldFilteredNodes = [];

  // Currently visible links
  var filteredLinks = [];

  var selectedLinks = null,
    nonSelectedLinks = null,
    selectedNode = null,
    selectedLinkedNodes = null,
    nonSelectedLinkedNodes = null;

  var zoom = d3.zoom().scaleExtent([1/2, Infinity])
            // .translateExtent([[30,0], [width,height]])
            // .scaleTo(3)
            .on("zoom", zoomed);


  var setupData = function(graph) {
    graph.nodes.forEach(function (d) {
      d.nodeImg = new Image();
      d.nodeImg.src = d.profile_image_url;
      d.nodeImgData = null;
      d.nodeImg.onload = function() {
        // console.log("Loaded image" + d.profile_image_url);
        d.nodeImgData = this;
      };
      d.count_followers_in_query = +d.count_followers_in_query;
    });

    // graph.nodes = graph.nodes.slice(0,1);


    // graph.links.forEach(function (d) {
    //   d.sourceID = d.source;
    //   d.targetID = d.target;
    // });
  };

  function updateNodes(nodes) {
    filteredNodes = nodes;
    simulation.nodes(filteredNodes);
    updateClusters();

    console.log("Updated nodes count:" + filteredNodes.length);
  }

  /**
  *  Shows only the links for the currently shown nodes
  */
  function updateLinks() {
    var dictNodes = {},
      allLinks = chart.graph.links;

    filteredLinks = [];

    filteredNodes.forEach(function (d) {
      dictNodes[d.id] = d;
    });


    filteredLinks = allLinks.filter(function (d) {
      return dictNodes[d.source.id] !== undefined &&
        dictNodes[d.target.id] !== undefined;
    });


    console.log("updating links, all links count: " + allLinks.length +  " filtered: " + filteredLinks.length);

    if (chart.drawLinks) {
      simulation.force("link")
            .links(filteredLinks);

    }
  }

  function updateClusters() {
    clusters = d3.nest()
      .key(function(d) { return chart.showClusters ? d.cluster : "none"; })
      .entries(simulation.nodes())
      .sort(function(a, b) { return b.values.length - a.values.length; });


    // var treemap = d3.treemap()
    //   .size([width, height])
    //   .padding(1);

    // var root = d3.hierarchy({values: clusters}, function(d) { return d.values; })
    //   .sum(function() { return 1; });
    //   // .sort(function(a, b) { return b.value - a.value; });

    // treemap(root);
    // foci={};
    // root.children.forEach(function (child) {
    //   foci[child.data.key] = [child.x0 + (child.x1-child.x0)/2, child.y0 + (child.y1-child.y0)/2];
    // });

    // simulation
      // .force("x", d3.forceX(function (d) { return foci[d.cluster][0]; }).strength(0.5))
      // .force("y", d3.forceY(function (d) { return foci[d.cluster][1]; }).strength(0.5))
      // .force("x", d3.forceX(width/2).strength(0.2))
      // .force("x", d3.forceX(function (d) { return xScale(d[chart.xAttr]); }).strength(0.2))
      // .force("y", d3.forceY(function (d) { return yScale(d[chart.yAttr]); }).strength(0.2))

    // simulation.force("link",
    //   d3.forceLink()
    //     .id(function (d) { return d.id; } )
    //     .distance(chart.linkDistance)
    //     .strength(chart.useFixedAxis? 0.0000: chart.linkStrengh)
    // );

    // console.log("clusters");
    // console.log(clusters);
  }

  function addAxis() {
    d3.selectAll(".axis").remove();

    svg.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis.scale(yScale))
      .append("text")
        .attr("x", 10)
        .attr("y", 10)
        .attr("dy", ".71em")
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .text(chart.yTitle);

    svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis.scale(xScale))
      .append("text")
        .attr("x", width - 10)
        .attr("y", -10)
        .attr("dy", "-.35em")
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "end")
        .text(chart.xTitle);

  }

  function zoomed() {

    zoom_transform = d3.event.transform;
    // simulation.stop();
    var zxScale = zoom_transform.rescaleX(xScale);
    var zyScale = zoom_transform.rescaleY(yScale);


    d3.select(".axis--x").call(xAxis.scale(zxScale));
    // d3.select(".axis--y").call(yAxis.scale(zyScale));

    // context.save();
    // context.clearRect(0, 0, width, height);
    // context.translate(zoom_transform.x, zoom_transform.y);
    // context.scale(zoom_transform.k, zoom_transform.k);


    // context.restore();
    // console.log("xForce", chart.xAttr);
    if (chart.useFixedAxis) {
      simulation.force("x", d3.forceX(function (d) {
        // console.log(chart.xAttr);
        return zxScale(d[chart.xAttr]);
      }).strength(0.2))
        // .force("y", d3.forceY(function (d) { return zyScale(d[chart.yAttr]); }).strength(0.2))
        .force("y", d3.forceY(function (d) { return yScale(d[chart.yAttr]); }).strength(0.2))
      simulation.alphaTarget(0.1).restart();

    }
    // console.log("zoomed");
    // console.log(zxScale.domain());
    // console.log(zoom_transform.x, zoom_transform.k);
  }

  chart.stop = function() {
    if (simulation)
      simulation.stop();
  };

  chart.update = function(selection) {
    selection.each(function(graph) {
      simulation.stop();
      //Load Images and preprocess data
      setupData(graph);
      // zoom.scaleBy(3);

      width = chart.width - margin.left - margin.right;
      height = chart.height - margin.top - margin.bottom;


      zoom = d3.zoom().scaleExtent([1 / 2, Infinity])
            // .translateExtent([[30,0], [width,height]])
            // .scaleTo(3)
            .on("zoom", zoomed)
            .translateExtent([[0,0], [width,height]]);

      function extentWithMargins(extent, margin) {
        margin = margin || 20;
        var range = extent[1]-extent[0];
        return [Math.max(0,extent[0]-margin), extent[1]+margin]
      }
      xScale.domain(extentWithMargins(
        d3.extent(graph.nodes, function (d) {
          return d[chart.xAttr];
        })),3)
        .range([0, width]);
      yScale.domain(
        [-5,
          d3.max(graph.nodes,
            function (d) {
              return d[chart.yAttr];
            }
          ) + 5
        ]).range([height, 0]);
      rScale.domain(d3.extent(graph.nodes, chart.rAttr))
        .range(chart.radiusRange);

      graph.nodes.forEach(function (d) {
        d.r = rScale(chart.rAttr(d));
      });

      var canvasEle = d3.select(this).selectAll("canvas").data([graph]);
      var canvasEnter = canvasEle.enter().append("canvas");
      var svgEle = d3.select(this).selectAll("svg").data([graph]);
      var svgEnter = svgEle.enter().append("svg");


      svg = svgEle.merge(svgEnter)
        // .style("pointer-events", "none")
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
          .call(zoom)
        .attr("width", width + margin.left+ margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      d3.selectAll("#tooltip").remove();
      svg.append("text")
        .attr("id", "tooltip")
        .attr("transform", "translate(-500, -500)"); //hidden
      svg.select("#tooltip").append("tspan").attr("id","name").attr("x",0).attr("dy","1.2em");
      svg.select("#tooltip").append("tspan").attr("id","x").attr("x",0).attr("dy","1.2em");
      svg.select("#tooltip").append("tspan").attr("id","y").attr("x",0).attr("dy","1.2em");


      // canvas = document.querySelector("canvas");
      canvas = selection.select("canvas").nodes()[0];
      context = canvas.getContext("2d");
      canvasEle.merge(canvasEnter)
        .style("margin-left", margin.left+"px")
        .style("margin-top", margin.top+"px")
        .style("background-color", "#eee");
      canvas.width = width;
      canvas.height = height;


      if (chart.useFixedAxis) {
        addAxis(svg);
      } else {
        d3.selectAll(".axis").remove();
      }



      // context.translate(margin.left, margin.top);

      // Manual Zoom
      if (chart.xAttr === "followers_count" || chart.xAttr === "friends_count") {
        svgEle.merge(svgEnter).transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity
            // .translate(width/2, height/2)
            .scale(chart.zoomScale)
            // .translate(80, 0)
            .translate(chart.zoomTranslate[0], chart.zoomTranslate[1])
            );

      } else {
        svgEle.merge(svgEnter).transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity
            // .translate(width/2, height/2)
            );

      }

      if (chart.useForceInABox) {
        simulation
          .force("group", forceInABox()
            .nodes(chart.graph.nodes)
            .links(chart.graph.links)
            .strength(0.3)
            .gravityOverall(0.05)
            .template(chart.forceInABoxTemplate)
            .groupBy(chart.forceInABoxAttr)
            .size([width, height]));
      } else {
        simulation
          .force("group", function () {});
      }
      simulation
          .force("link", d3.forceLink().id(function (d) { return d.id; } )
            .strength(function (l) {
              if (chart.useFixedAxis) return 0;
              if (chart.useForceInABox) {
                if (l.source[chart.forceInABoxAttr]!==l.target[chart.forceInABoxAttr]) {
                  return 0.01;
                } else {
                  return chart.linkStrengh;
                }
              } else {
                return chart.linkStrengh;
              }
            }).distance(chart.linkDistance))
          //Better than forceCenter because I can control the strength
          .force("x", d3.forceX(width/2).strength(chart.gravity))
          .force("y", d3.forceY(height/2).strength(chart.gravity));
          // .force("center", d3.forceCenter(width / 2, height / 2))
          // .force("forceX", d3.forceCenter(width / 2, height / 2));
          // .force("forceY", d3.forceCenter(width / 2, height / 2));


      if (chart.collide===true)
        simulation.force("collide", d3.forceCollide(function (d) { return d.r+3; }).iterations(8));
      else
        simulation.force("collide", function () {});

      if (chart.useCharge===true) {
        simulation.force("charge", d3.forceManyBody().strength(chart.charge));
      } else {
        simulation.force("charge",  function () {});
      }

      // if (error) throw error;
      // console.log("Clustering");
      // netClustering.cluster(graph.nodes, graph.links);
      // console.log("done");


      updateNodes(graph.nodes);
      updateLinks();



      simulation
          .on("tick", ticked);

      simulation.alpha(1).restart();

      // d3.select(canvas)
          // .call(d3.drag()
          //     .container(canvas)
          //     .subject(dragsubject)
          //     .on("start", dragstarted)
          //     .on("drag", dragged)
          //     .on("end", dragended))

      function ticked() {
        context.clearRect(0, 0, width, height);
        context.save();
        // context.translate(width / 2, height / 2);


        // ------- Draw links ----------
        if (chart.drawLinks) {
          if (chart.onlyDrawSelectedLinks) {

            if (selectedNode && selectedLinks && nonSelectedLinks) {
              context.beginPath();
              selectedLinks.forEach(drawLink);
              context.strokeStyle = "rgba(255,200,200,1.0)";
              context.lineWidth = 1;
              context.stroke();

              // context.beginPath();
              // nonSelectedLinks.forEach(drawLink);
              // context.strokeStyle = 'rgba(200,200,200,0.05)';
              // context.lineWidth = 1;
              // context.stroke();
            } else {
              // context.beginPath();
              // simulation.force("link").links().forEach(drawLink);
              // context.strokeStyle = 'rgba(200,200,200,0.2)';
              // context.lineWidth = 1;
              // context.stroke();
            }
          } else {
            context.beginPath();
            simulation.force("link").links().forEach(drawLink);
            context.strokeStyle = "rgba(200,200,200,0.6)";
            context.lineWidth = 1;
            context.stroke();
          }

        }


        // ----------- Draw Nodes ------------

        if (selectedNode && selectedLinkedNodes && nonSelectedLinkedNodes) {
          context.globalAlpha = 1.0;
          context.beginPath();
          selectedLinkedNodes.forEach(drawNode);
          // context.fillStyle = color("none");
          context.fill();

          selectedLinkedNodes.forEach(drawPic);


          context.globalAlpha = 0.1;
          context.beginPath();
          nonSelectedLinkedNodes.forEach(drawNode);
          // context.fillStyle = color("none");
          context.fill();
          nonSelectedLinkedNodes.forEach(drawPic);

        } else {
          clusters.forEach(function(cluster) {
            context.beginPath();
            cluster.values.forEach(drawNode);
            context.fillStyle = color(chart.showClusters ? cluster.key : "none");
            context.fill();
          });

          context.globalAlpha = 1.0;
          simulation.nodes().forEach(drawPic);
        }


        // simulation.nodes().forEach(drawNode);

        context.restore();
      }

      // function dragsubject() {
      //   return simulation.find(d3.event.x, d3.event.y);
      // }
      // // });

      // function dragstarted() {
      //   if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      //   d3.event.subject.fx = d3.event.subject.x;
      //   d3.event.subject.fy = d3.event.subject.y;
      // }

      // function dragged() {
      //   d3.event.subject.fx = d3.event.x;
      //   d3.event.subject.fy = d3.event.y;
      // }

      // function dragended() {
      //   if (!d3.event.active) simulation.alphaTarget(0);
      //   d3.event.subject.fx = null;
      //   d3.event.subject.fy = null;
      //   console.log(d3.event.subject);
      // }

      function mousemove() {

        if (!d3.event.active) simulation.alphaTarget(0);


        var node = simulation.find(d3.mouse(this)[0] - margin.left,
          d3.mouse(this)[1] - margin.top
          );

        console.log((d3.mouse(this)[0]-margin.left) + " - " + (d3.mouse(canvas)[0]-margin.left) );
        console.log((d3.mouse(this)[1]-margin.top) + " - " + (d3.mouse(canvas)[1]-margin.top) );

        svg.select("#tooltip")
          .attr("dy", (node.r*2 + 10) + "px")
          .attr("dx", (node.r/2) + "px")
          .attr("transform", "translate("+ node.x + "," + node.y +")")
          .select("#name")
          .style("font-size","200%")
          .text(nameAttr(node));
        svg.select("#tooltip")
          .select("#x")
          .text(chart.xTitle + "  " + node[chart.xAttr]);
        if(chart.yTitle) {
          svg.select("#tooltip")
            .select("#y")
            .text(chart.yTitle + "  " + node[chart.yAttr]);

        }

        // console.log(node);

        selectedNode = node;
        selectedLinks = simulation.force("link").links().filter(function (d) {
          return d.source === selectedNode || d.target === selectedNode;
        });
        nonSelectedLinks = simulation.force("link").links().filter(function (d) {
          return d.source !== selectedNode && d.target !== selectedNode;
        });
        // Search the nodes linked to the selected one
        var dSelectedLinkedNodes = {};
        selectedLinks.forEach(function (d) {
          dSelectedLinkedNodes[d.source.id] = d.source;
          dSelectedLinkedNodes[d.target.id] = d.target;
        });
        selectedLinkedNodes = d3.values(dSelectedLinkedNodes);
        var selectedLinkedNodesIDs = d3.keys(dSelectedLinkedNodes).map(function (id) { return +id; });
        nonSelectedLinkedNodes = simulation.nodes().filter(function (d) {
          return selectedLinkedNodesIDs.indexOf(d.id) === -1;
        });
        console.log("selectedLinked = " + selectedLinkedNodes.length + " non " + nonSelectedLinkedNodes.length +  " total " + simulation.nodes().length);
        simulation.alphaTarget(0).restart();

      }

      function mouseleave() {
        selectedLinkedNodes = null;
        nonSelectedLinkedNodes = null;
        selectedNode = null;
        selectedLinks = null;
        nonSelectedLinks = null;

        svg.select("#tooltip")
          .attr("dy", 20 + "px")
          .attr("transform", "translate(-500,-500)");
        svg.select("#tooltip").select("#name").text("");
        svg.select("#tooltip").select("#x").text("");
        svg.select("#tooltip").select("#y").text("");
      }



      function drawLink(d) {
        context.moveTo(d.source.x+d.source.r/2, d.source.y+d.source.r/2);
        context.lineTo(d.target.x+d.target.r/2, d.target.y+d.target.r/2);
      }



      function drawNode(d) {
        if (!chart.showImages) {
          // context.moveTo(d.x + d.r/2, d.y + d.r/2);
          // context.arc(d.x + d.r/2, d.y+ d.r/2, d.r, 0, 2 * Math.PI);
          context.moveTo(d.x , d.y);
          context.arc(d.x+d.r/2, d.y+d.r/2, d.r, 0, 2 * Math.PI);

        } else {
          // context.restore();

          context.moveTo(d.x + d.r, d.y+d.r);
          context.arc(d.x+d.r/2, d.y+d.r/2, d.r+2, 0, 2 * Math.PI);
          // context.fillStyle = color(chart.showClusters ? d.cluster : "none");
          // context.fill();

        }

      }// drawNode

      function drawPic(d) {
        if (chart.showImages) {
          context.save();
          context.beginPath();
          context.arc(d.x + d.r/2, d.y+d.r/2, d.r, 0, Math.PI * 2, true);
          context.clip();

          try {
            context.drawImage(d.nodeImg, d.x - d.r/2, d.y- d.r/2, d.r*2, d.r*2);
          } catch (e) {
            console.error("Error drawing the image ");
            console.error(e);
          }

          // context.beginPath();
          // context.arc(d.x+d.r, d.y+d.r, d.r, 0, Math.PI * 2, true);
          // context.clip();
          // context.stroke();
          // context.fill();
          context.closePath();
          context.restore();
        }

      }
    });


  }; //chart




  return chart;
}; // networkCanvasChart
