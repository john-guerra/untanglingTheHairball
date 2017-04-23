/*global d3 , Scrollable, networkCanvasChart */

function Scrollable() {
  var scrollable={};

  scrollable.scroll = function(step) {
    steps[step]();
  };


  var steps={
    allGraph:allGraph,
    onlyCommunity:onlyCommunity,
    top300:top300,
    clusters:clusters,
    fixedAxis:fixedAxis,
    linksOnDemand:linksOnDemand,
  };

  function allGraph() {
    plot.onlyMostFollowed = false;
    plot.onlyOriginals = false;
    plot.showClusters = false;
    plot.useFixedAxis = false;
    plot.drawLinks = true;
    plot.onlyDrawSelectedLinks = false;
    plot.useCharge = true;
    plot.charge = -100;
    plot.radiusRange = [4, 12];
    update();
  }
  function onlyCommunity() {
    plot.onlyMostFollowed = true;
    plot.onlyOriginals = false;
    plot.showClusters = false;
    plot.useFixedAxis = false;
    plot.drawLinks = true;
    plot.onlyDrawSelectedLinks = false;
    plot.useCharge = true;
    plot.charge = -100;
    plot.radiusRange = [4, 16];
    update();
  }
  function top300() {
    plot.onlyMostFollowed = true;
    plot.onlyOriginals = true;
    plot.showClusters = false;
    plot.useFixedAxis = false;
    plot.drawLinks = true;
    plot.onlyDrawSelectedLinks = false;
    plot.useCharge = true;
    plot.charge = -300;
    plot.radiusRange = [8, 25];
    update();
  }
  function clusters() {
    plot.onlyMostFollowed = true;
    plot.onlyOriginals = true;
    plot.showClusters = true;
    plot.useFixedAxis = false;
    plot.drawLinks = true;
    plot.onlyDrawSelectedLinks = false;
    plot.useCharge = true;
    plot.charge = -300;
    plot.radiusRange = [8, 25];
    update();
  }
  function fixedAxis() {
    plot.onlyMostFollowed = true;
    plot.onlyOriginals = true;
    plot.showClusters = true;
    plot.useFixedAxis = true;
    plot.drawLinks = true;
    plot.onlyDrawSelectedLinks = false;
    plot.useCharge = false;
    plot.charge = 0;
    plot.radiusRange = [8, 25];
    update();
  }
  function linksOnDemand() {
    plot.onlyMostFollowed = true;
    plot.onlyOriginals = true;
    plot.showClusters = true;
    plot.useFixedAxis = true;
    plot.drawLinks = true;
    plot.onlyDrawSelectedLinks = true;
    plot.useCharge = false;
    plot.charge = 0;
    plot.radiusRange = [8, 25];
    update();
  }
  /* ------- The Viz ------------ */
  var width = window.innerWidth,
    height = Math.max(window.innerHeight*0.8, 400) ;
  var query="openvisconf";

  var color = d3.scaleOrdinal(d3.schemaCategory20);

  var imageSize = function (d) {
    return d.original ?  30 : rScale(d.degreeIn);
  };

  var rScale = d3.scaleLinear().range([5, 10]);
  // var xInfluentials = d3.scaleOrdinal().rangeBands([20, width-20]);
  // var xTweeters = d3.scale.ordinal().rangeBands([20, width-20]);


  var plot = networkCanvasChart();
  plot.collide = true;
  plot.onlyMostFollowed = false;
  plot.onlyOriginals = false;


  var graph = null;
  var originalNodes;

  // Load data
  d3.json("../data/"+ query+"NetworkClustered.json", function(error, _graph) {
    if (error) throw error;
    graph = _graph;
    originalNodes = graph.nodes;

    var dNodes =  d3.map();
    graph.nodes = graph.nodes.filter(function (d) {
        return +d.followers_count < 500000000;
      });


    graph.nodes
      .forEach(function (d) {
        dNodes.set(d.id, d);
        d.degreeIn =0;
        d.followers_count = +d.followers_count;
        d.utc_offset = +d.utc_offset;
        d.friends_count = +d.friends_count;
        d.listed_count = +d.listed_count;
        d.statuses_count = +d.statuses_count;
        d.favourites_count = +d.favourites_count;
        d.query_tweet_count = +d.query_tweet_count;
      });

    var links =[];
    graph.links = graph.links
      .map(function (d) {
        if (!dNodes.has(d.source) || !dNodes.has(d.target))
          return;
        d.source = dNodes.get(d.source);
        d.target = dNodes.get(d.target);
        // if (d.target.influential)
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
    plot.width = document.getElementById("networkChart").offsetWidth;
    plot.height = height;


    plot.graph.nodes = originalNodes;
    if (plot.onlyMostFollowed) {
      plot.graph.nodes = plot.graph.nodes.filter(function (d) {
        return d.influential;
      });
    }
    if (plot.onlyOriginals) {
      plot.graph.nodes = plot.graph.nodes.filter(function (d) {
        return d.original;
      });
    }
    console.log("updating nodes=" + plot.graph.nodes.length +  " originals =" + originalNodes.length);

    // plot.graph.nodes = originalNodes.filter(function (d) {
    //   return d.influential;
    // })
    // .slice(0,100);


    var canvas = d3.select("#networkChart")
      .attr("width", width)
      .attr("height", height)
      .datum(graph)
      .call(plot.update);

  }


  return scrollable;
}