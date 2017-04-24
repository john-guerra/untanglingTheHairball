/*global Reveal, ScrollableHairball,ScrollableTips, d3 */

var scrollables = {
  "tips": ScrollableTips(),
  "hairball": ScrollableHairball(),
};


Reveal.addEventListener( "slidechanged", function( event ) {
  var scrollable;

  if (d3.select(event.currentSlide).classed("scroll")) {
    if (d3.select(event.currentSlide).attr("step") && d3.select(event.currentSlide).attr("scrollable")) {
      scrollable = d3.select(event.currentSlide).attr("scrollable");
      console.log("Scrollable = " + scrollable + " step "+ d3.select(event.currentSlide).attr("step"));
      d3.select(".scrollable-"+scrollable).style("display", "block");
      d3.select(".reveal").classed("scrolling", true);
      scrollables[scrollable].scroll(d3.select(event.currentSlide).attr("step"));
    }
  } else {
    // Not scrolling

    // Stop all scrollables
    for (var s in scrollables) {
      scrollables[s].stop();
    }
    d3.selectAll(".scrollable").style("display", "none");
    d3.select(".reveal").classed("scrolling", false);
  }


  // console.log(event.previousSlide);
  // console.log(event.currentSlide);
  // console.log(event.indexh);
  // console.log(event.indexv);
} );

