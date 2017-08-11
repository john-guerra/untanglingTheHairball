/*global d3, networkCanvasChart, netClustering */

function ScrollableTips() {
  var scrollable={};

  scrollable.scroll = function(step) {
    steps[step]();
  };

  scrollable.stop = function () {
    if (plot)
      plot.stop();
  };


  var steps={
    step0:step0,
    filter:filter,
    neighborhood:neighborhood,
    step3:step3,
    navigateIntoCluster:navigateIntoCluster,
    step5:step5,
    step6:step6,
    step7:step7,
    step8:step8,
    step9:step9,
    step10:step10,
    doNetClustering: doNetClustering,
    forceInABoxTreemap: forceInABoxTreemap,
    forceInABoxForce: forceInABoxForce,
  };

  function step0() {
    plot.filterTop=false;
    plot.filterNeighbors=false;
    plot.charge = -100;
    plot.showClusters = false;
    plot.useForceInABox = false;
    plot.navigateIntoCluster = false;
    update();
  }

  function filter() {
    plot.filterTop=true;
    plot.filterNeighbors=false;
    plot.charge = -200;
    plot.showClusters = false;
    plot.useForceInABox = false;
    plot.navigateIntoCluster = false;
    update();
  }
  function neighborhood() {
    plot.filterTop=true;
    plot.filterNeighbors=true;
    plot.charge = -200;
    plot.showClusters = false;
    plot.useForceInABox = false;
    plot.navigateIntoCluster = false;
    update();
  }
  function step3() {
    plot.showClusters = false;
    plot.useForceInABox = false;
    plot.navigateIntoCluster = false;
    update();
  }
  function doNetClustering() {
    plot.filterTop=true;
    plot.filterNeighbors=true;
    plot.charge = -200;
    plot.showClusters = true;
    plot.useForceInABox = false;
    plot.navigateIntoCluster = false;
    update();
  }
  function forceInABoxTreemap() {
    plot.filterTop=true;
    plot.filterNeighbors=true;
    plot.charge = -200;
    plot.showClusters = true;
    plot.useForceInABox = true;
    plot.forceInABoxTemplate = "treemap";
    plot.navigateIntoCluster = false;
    update();
  }
  function forceInABoxForce() {
    plot.filterTop=true;
    plot.filterNeighbors=true;
    plot.charge = -200;
    plot.showClusters = true;
    plot.useForceInABox = true;
    plot.forceInABoxTemplate = "force";
    plot.navigateIntoCluster = false;
    update();
  }


  function navigateIntoCluster() {
    plot.filterTop=true;
    plot.filterNeighbors=true;
    plot.charge = -200;
    plot.showClusters = true;
    plot.useForceInABox = true;
    plot.forceInABoxTemplate = "force";
    plot.navigateIntoCluster = true;
    update();
  }

  function step5() {
    update();
  }
  function step6() {
    update();
  }
  function step7() {
    update();
  }
  function step8() {
    update();
  }
  function step9() {
    update();
  }
  function step10() {
    update();
  }

  /* ------- The Viz ------------ */

  // var color = d3.scaleOrdinal(d3.schemaCategory20);

  // var imageSize = function (d) {
  //   return d.original ?  30 : rScale(d.degreeIn);
  // };

  // var rScale = d3.scaleLinear().range([5, 10]);
  // var xInfluentials = d3.scaleOrdinal().rangeBands([20, width-20]);
  // var xTweeters = d3.scale.ordinal().rangeBands([20, width-20]);


  var plot = new networkCanvasChart();

  plot.collide = true;
  plot.showImages = false;
  plot.rAttr= function (d) { return d.value; };
  plot.drawLinks = true;
  plot.charge = -50;
  plot.showClusters = false;
  plot.filterTop = false;


  var graph = null;
  var originalNodes, originalLinks;

  // Load data
  d3.json("./data/"+"citationsNetwork.json", function(error, _graph) {
    if (error) throw error;

    console.log("loaded citationsNetwork.json");
    graph = _graph;
    originalNodes = _graph.nodes;
    originalLinks = _graph.links;

    var dNodes = d3.map();

    graph.nodes
      .forEach(function (d, i) {
        dNodes.set(d.index, d);
        d.degreeIn =0;
        d.id = i;
        d.value = +d.value;
        d.weight = +d.weight;
        delete d.x;
        delete d.y;
        delete d.px;
        delete d.py;
      });



    var links =[];
    graph.links = graph.links
      .map(function (d) {
        if (!dNodes.has(d.source) || !dNodes.has(d.target))
          return;
        // if (+d.value<2) return;
        // d.source = graph.nodes[d.source];
        // d.target = graph.nodes[d.target];
        d.source = dNodes.get(d.source);
        d.target = dNodes.get(d.target);


        d.target.degreeIn +=1;
        d.source.degreeIn +=1;

        links.push(d);
        return  d;
      }).filter(function (d) { return d!==undefined; });


    // links = links
    //   // Only show links to influentials
    //   .filter(function (d) {
    //     return d.target.influential;
    //   });
    // graph.links = graph.links
    //     // Only show links to influentials
    //     .filter(function (d) {
    //       return d.count>5;
    //     });

    // nodes_ids = graph.nodes.map(function (d) { return ""+d.id; });
    // links_ids = graph.links.map(function (d) { return {source:""+d.source.id, target:""+d.target.id, weight:d.count!==undefined? d.count : 1}});
    // var community = jLouvain().nodes(nodes_ids).edges(links_ids);
    // var result  = community();
    // for (var id in result) {
    //   var node = dNodes.get(id);
    //   node.cluster = result[id];
    //   dNodes.set(id, node);
    // }
      // netClustering.cluster(graph.nodes, graph.links, "cluster", "count");
      // graph.nodes = graph.nodes.sort(function (a, b) {
      //   return d3.descending(a.degreeIn, b.degreeIn);
      // });

    plot.graph = graph;

    update();
  });


  function update() {
    if(graph===null) return;

    // plot.collide = d3.select("#chkCollide").property("checked") ;
    // plot.onlyMostFollowed = d3.select("#chkOnlyMostFollowed").property("checked");
    // plot.onlyOriginals = d3.select("#chkOnlyOriginals").property("checked");

    // plot.xAttr = d3.select("#slAttr").property("value");
    // plot.xTitle = dTitle[plot.xAttr];
    plot.width = document.getElementById("networkChartTips").offsetWidth;
    plot.height = Math.max(window.innerHeight*0.8, 400);

    plot.graph.nodes = originalNodes;
    plot.graph.links = originalLinks;

    // plot.graph.nodes = originalNodes.filter(function (d) { return d.value> 250; });
    plot.rAttr = function (d) { return d.value; };
    plot.nameAttr = function (d) { return d.name; };
    plot.xAttr = "value";
    plot.xTitle = "Citations";
    plot.yAttr = "weight";
    plot.yTitle = "";

    var MIN_CORE = 450;
    var MIN_NEIGH = 250;

    plot.graph.nodes = originalNodes;

    var dNodes = d3.map();

    if (plot.filterNeighbors) {

      plot.graph.links.forEach(function(e) {
        if (e.source.value>MIN_CORE || e.target.value>MIN_CORE) {
          if (e.source.value>MIN_NEIGH)
            dNodes.set(e.source.index, e.source);
          if (e.target.value>MIN_NEIGH)
            dNodes.set(e.target.index, e.target);
        }
      });
      plot.graph.nodes =dNodes.values();
    } else {
      if (plot.filterTop) {
        plot.graph.nodes = originalNodes.filter(function (d) {
          return d.value>MIN_CORE;
        });
        plot.graph.nodes.forEach(function (d) { dNodes.set(d.index, d); });
      }
    }

    if (plot.showClusters) {
      plot.graph.links = originalLinks.filter(function (e) {
        return dNodes.has(e.source.index) && dNodes.has(e.target.index);
      });
      // netClustering.cluster(plot.graph.nodes, plot.graph.links);
    }

    if (plot.navigateIntoCluster) {
      plot.graph.nodes = plot.graph.nodes.filter(function (d) {
        return d.cluster==="2";
      });
    }


    // .slice(0,100);
    // plot.graph.links = [];
    console.log("IEEVIS Updating nodes=" + plot.graph.nodes.length +  " unfilteredNodes =" + originalNodes.length);
    console.log("links= " + plot.graph.links.length + " originalLinks " + originalLinks.length);

    d3.select("#networkChartTips")
      .attr("width", plot.width)
      .attr("height", plot.height)
      .datum(graph)
      .call(plot.update);

  }


  return scrollable;
}