/*global Reveal, d3 */

var scrollableHairball = Scrollable() ;



Reveal.addEventListener( "slidechanged", function( event ) {
  // console.log(event.previousSlide);
  // console.log(event.currentSlide);
  // console.log(event.indexh);
  // console.log(event.indexv);

  if (d3.select(event.currentSlide).classed("scroll")) {
    d3.select(".scrollable").style("display", "block");
    d3.select(".reveal").classed("scrolling", true);
    if (d3.select(event.currentSlide).attr("step"))
      scrollableHairball.scroll(d3.select(event.currentSlide).attr("step"));
  } else {
    d3.select(".scrollable").style("display", "none");
    d3.select(".reveal").classed("scrolling", false);
  }

} );

