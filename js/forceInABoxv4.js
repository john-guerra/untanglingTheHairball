/* global d3 */

function forceInABox(alpha) {
  function index(d) {
    return d.index;
  }

  function find(nodeById, nodeId) {
    var node = nodeById.get(nodeId);
    if (!node) throw new Error("missing: " + nodeId);
    return node;
  }

  var id = index,
      nodes,
      links, //needed for the force version
      count,
      tree,
      size = [100,100],
      nodeSize = 5, // The expected node size used for computing the cluster node
      foci = {},
      // oldStart = force.start,
      // oldLinkStrength = force.linkStrength(),
      // oldGravity = force.gravity(),
      templateNodes = [],
      templateForce,
      templateNodesSel,
      groupBy = function (d) { return d.cluster; },
      template = "treemap",
      enableGrouping = true,
      strength = 0.1,
      gravityOverall = 0.01;
      // showingTemplate = false;


  function force(alpha) {
    if (!enableGrouping) {
      return force;
    }
    if (template==="force") {
      //Do the tick of the template force and get the new focis
      templateForce.tick();
      getFocisFromTemplate();
    }

    for (var i = 0, n = nodes.length, node, k = alpha * strength; i < n; ++i) {
      node = nodes[i];
      node.vx += (foci[groupBy(node)].x - node.x) * k;
      node.vy += (foci[groupBy(node)].y - node.y) * k;
    }

  }

  function initialize() {
    if (!nodes) return;

    // var i,
    //     n = nodes.length,
    //     m = links.length,
    //     nodeById = map(nodes, id),
    //     link;

    if (template==="treemap") {
      initializeWithTreemap();
    } else {
      initializeWithForce();
    }


  }

  force.initialize = function(_) {
    nodes = _;
    initialize();
  };

  function getLinkKey(l) {
    var sourceID = groupBy(l.source),
      targetID = groupBy(l.target);

    return sourceID <= targetID ?
      sourceID + "~" + targetID :
      targetID + "~" + sourceID;
  }

  function computeClustersNodeCounts(nodes) {
    var clustersCounts = d3.map();

    nodes.forEach(function (d) {
      if (!clustersCounts.has(groupBy(d))) {
        clustersCounts.set(groupBy(d), 0);
      }
    });

    nodes.forEach(function (d) {
      // if (!d.show) { return; }
      clustersCounts.set(groupBy(d), clustersCounts.get(groupBy(d)) + 1);
    });

    return clustersCounts;
  }

  //Returns
  function computeClustersLinkCounts(links) {
    var dClusterLinks =  d3.map(),
      clusterLinks = [];
    links.forEach(function (l) {
      var key = getLinkKey(l), count;
      if (dClusterLinks.has(key)) {
        count = dClusterLinks.get(key);
      } else {
        count = 0;
      }
      count += 1;
      dClusterLinks.set(key, count);
    });

    dClusterLinks.entries().forEach(function (d) {
      var source, target;
      source = d.key.split("~")[0];
      target = d.key.split("~")[1];
      clusterLinks.push({
        "source":source,
        "target":target,
        "count":d.value,
      });
    });
    return clusterLinks;
  }

  //Returns the metagraph of the clusters
  function getGroupsGraph() {
    var gnodes = [],
      glinks = [],
      // edges = [],
      dNodes = d3.map(),
      // totalSize = 0,
      clustersList,
      c, i, size,
      clustersCounts,
      clustersLinks;

    clustersCounts = computeClustersNodeCounts(nodes);
    clustersLinks = computeClustersLinkCounts(links);

    //map.keys() is really slow, it's crucial to have it outside the loop
    clustersList = clustersCounts.keys();
    for (i = 0; i< clustersList.length ; i+=1) {
      c = clustersList[i];
      size = clustersCounts.get(c);
      gnodes.push({id : c, size :size });
      dNodes.set(c, i);
      // totalSize += size;
    }

    clustersLinks.forEach(function (l) {
      var source=dNodes.get(l.source),
        target = dNodes.get(l.target);
      if (!source || !target) return;
      glinks.push({
        "source": source,
        "target": target,
        "count":l.count
      });
    });


    return {nodes: gnodes, links: glinks};
  }


  function getGroupsTree() {
    var children = [],
      totalSize = 0,
      clustersList,
      c, i, size, clustersCounts;

    clustersCounts = computeClustersNodeCounts(force.nodes());

    //map.keys() is really slow, it's crucial to have it outside the loop
    clustersList = clustersCounts.keys();
    for (i = 0; i< clustersList.length ; i+=1) {
      c = clustersList[i];
      size = clustersCounts.get(c);
      children.push({id : c, size :size });
      totalSize += size;
    }
    // return {id: "clustersTree", size: totalSize, children : children};
    return {id: "clustersTree",  children : children};
  }


  function getFocisFromTemplate() {
    //compute foci
    foci.none = {x : 0, y : 0};
    templateNodes.forEach(function (d) {
      if (template==="treemap") {
        foci[d.data.id] = {
          x : (d.x0 + (d.x1-d.x0) / 2),
          y : (d.y0 + (d.y1-d.y0) / 2)
        };
      } else {
        foci[d.id] = {x : d.x , y : d.y };
      }
    });
  }
  function initializeWithTreemap() {
    var treemap = d3.treemap()
      .size(force.size())

    tree = d3.hierarchy(getGroupsTree())
      // .sort(function (p, q) { return d3.ascending(p.size, q.size); })
      // .count()
      .sum(function (d) { return d.size; })
      .sort(function(a, b) {
        return b.height - a.height || b.value - a.value; })
      ;


    templateNodes = treemap(tree).leaves();

    getFocisFromTemplate();
  }

  function initializeWithForce() {
    var net;

    net = getGroupsGraph();
    templateForce = d3.forceSimulation(net.nodes)
      .force("x", d3.forceX(size[0]/2).strength(0.5))
      .force("y", d3.forceY(size[1]/2).strength(0.5))
      .force("collide", d3.forceCollide(function (d) { return d.size*nodeSize; }))
      .force("charge", d3.forceManyBody().strength(function (d) { return -200 * d.size; }))
      .force("links", d3.forceLink(net.links))

    templateNodes = templateForce.nodes();

    getFocisFromTemplate();
  }


  function drawTreemap(container) {
    container.selectAll(".cell").remove();
    container.selectAll("cell")
      .data(templateNodes)
      .enter().append("svg:rect")
      .attr("class", "cell")
      .attr("x", function (d) { return d.x0; })
      .attr("y", function (d) { return d.y0; })
      .attr("width", function (d) { return d.x1-d.x0; })
      .attr("height", function (d) { return d.y1-d.y0; });

  }

  function drawGraph(container) {
    container.selectAll(".cell").remove();
    templateNodesSel = container.selectAll("cell")
      .data(templateNodes);
    templateNodesSel
      .enter().append("svg:circle")
      .attr("class", "cell")
      .attr("cx", function (d) { return d.x; })
      .attr("cy", function (d) { return d.y; })
      .attr("r", function (d) { return d.size*nodeSize; });

  }

  force.drawTemplate = function (container) {
    // showingTemplate = true;
    if (template === "treemap") {
      drawTreemap(container);
    } else {
      drawGraph(container);
    }
    return force;
  };

  //Backwards compatibility
  force.drawTreemap = force.drawTemplate;

  force.deleteTemplate = function (container) {
    // showingTemplate = false;
    container.selectAll(".cell").remove();

    return force;
  };


  force.template = function (x) {
    if (!arguments.length) return template;
    template = x;
    initialize();
    return force;
  };

  force.groupBy = function (x) {
    if (!arguments.length) return groupBy;
    if (typeof x === "string") {
      groupBy = function (d) {return d[x]; };
      return force;
    }
    groupBy = x;
    return force;
  };

  // var update = function () {
  //   if (enableGrouping) {
  //     force.gravity(gravityOverall);
  //   } else {
  //     force.gravity(oldGravity);
  //   }
  // };

  force.enableGrouping = function (x) {
    if (!arguments.length) return enableGrouping;
    enableGrouping = x;
    // update();
    return force;
  };

  force.strength = function (x) {
    if (!arguments.length) return strength;
    strength = x;
    return force;
  };

  force.gravityOverall = function (x) {
    if (!arguments.length) return gravityOverall;
    gravityOverall = x;
    return force;
  };


  // force.linkStrength(function (e) {
  //   if (!enableGrouping || groupBy(e.source) === groupBy(e.target)) {
  //     if (typeof(oldLinkStrength)==="function") {
  //       return oldLinkStrength(e);
  //     } else {
  //       return oldLinkStrength;
  //     }
  //   } else {
  //     if (typeof(linkStrengthInterCluster)==="function") {
  //       return linkStrengthInterCluster(e);
  //     } else {
  //       return linkStrengthInterCluster;
  //     }
  //   }
  // });


  force.id = function(_) {
    return arguments.length ? (id = _, force) : id;
  };

  force.size = function(_) {
    return arguments.length ? (size = _, force) : size;
  };

  force.nodes = function(_) {
    return arguments.length ? (nodes = _, force) : nodes;
  };

  force.links = function(_) {
    return arguments.length ? (links = _, force) : links;
  };

  force.nodeSize = function(_) {
    return arguments.length ? (nodeSize = _, force) : nodeSize;
  };

  // force.strength = function(_) {
  //   return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initializeStrength(), force) : strength;
  // };


  return force;
}
