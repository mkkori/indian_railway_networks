export var q =d3.json("./india.json").then(world => {
    var svgx = d3.select('#map')
                .append('svg')
                .style('display','block')
                .style('margin','auto')
                .style('background-color','white')
                .style('border-radius','5px')
                .attr('height',600)
                .attr('width',600)
                .style('padding','10px');
                            
    var projection = d3.geoIdentity()
                        .reflectY(true)
                        .fitSize([600,600],topojson.feature(world, world.objects.india));
    

    var path = d3.geoPath().projection(projection);
    const g = svgx.append("g");

    g.append("g")
        .style("fill", "#fff")
        .attr("stroke","#6c757d")
        .selectAll("path")
        .data(topojson.feature(world, world.objects.india).features)
        .join("path")
        .attr("d", path)
        .attr("z-index",999);

    var div = d3.select("body").append("div")	
                .attr("class", "tooltip")				
                .style("opacity", 0);

    
    Promise.all([
                 d3.csv("./stations.csv"),
                 d3.csv("./trains.csv"),
                 d3.csv("./routes.csv")
    ]).then(function(files){
        var stations = files[0];
        var trains = files[1];
        var routes = files[2];

        drawStations(stations,routes);
    })
    
    function drawStations(stations,routes){
        var flag =0;
        var ls_la = d3.scaleLinear()
        .domain([68.0,97.2])
        .range([30.25175116166173, 569.7482488383382]) 
        var ls_ln = d3.scaleLinear()
        .domain([6.588028,37.1])
        .range([600, 0]) 

        var radscale = d3.scaleLinear()
        .domain([1,313])
        .range([0.4,7]) ;

        svgx
        .append("g")
        .attr("class","cg")
        .selectAll('circle')
            .data(stations.filter(function(d){return d.Trains>=0}))
            .enter()
            .append('circle')
            .attr("cursor", "pointer")
            .attr('r',function(d){return radscale(d.Trains)})
            .on("click",function(d){stationclick(this,d)})
            .on("mouseenter", function(d) {		
                div.transition()		
                    .duration(500)		
                    .style("opacity", .9);		
                div.html(d.name)	
                    .style("left", (d3.event.pageX+5) + "px")		
                    .style("top", (d3.event.pageY - 28) + "px")})
            .style('fill','rgba(255,7,58,.6)')
            .attr('class',"stations")
            .attr('id',function(d){return d.code})
            .attr('cx',function(d){return ls_la(+d.la)})
            .attr('cy',function(d){return ls_ln(+d.ln)});

        var lineFunction = d3.line()
                                .x(function(d) { return ls_la(+d.la); })
                                .y(function(d) { return ls_ln(+d.ln); });

        svgx.append("g")
            .attr("class","pathgroup")
            .selectAll('path')
            .data(["'15906'"])
            .enter()
            .append("path")
            .attr("d",function(d){ 
                
                var rt = routes.filter(function(k){ return k.train_no == d});
                var rt_ltln=leftJoin(rt,stations,"station_code","code");
                return lineFunction(rt_ltln)                
            })
            .attr("class",function(d){return d})
            .attr("stroke",'blue')
            .attr("fill","none")
            .attr("stroke-width",2);

          d3.select('#searchresults')
            .selectAll('div')
            .data(stations)
            .enter()
            .append('div')
            .attr('class','searchitem')
            .on('click',function(d){attachitemclick(d,this)})
            .text(function(d){return d.name})
            .style('display','none');


        function stationclick(sel,d){
            d3.selectAll('.spanname').style("background-color","white");
            d3.selectAll('.stations')
                .attr('stroke','none')
                .attr('r',function(d){return radscale(d.Trains)})
                .style('fill','rgba(255,7,58,.6)');
            d3.select(sel)
                .transition()
                .attr('stroke','blue')
                .attr('r',10)
                .style('fill','rgba(0,0,255,0.6)');
            d3.select('#stationname')
              .text(d.name);           
            d3.select('#statreach5')
              .text(d.train_orig);
  
            colorCircles(stations,routes,d)                               
        }

        function selcircle(stations,n){
            try{
            d3.select('.cg')
              .selectAll('circle')
                .data(stations.filter(function(d){return d.Trains>n}))
                .join(
                    enter => enter
                            .append('circle')
                            .attr("cursor", "pointer")
                            .attr('cx',function(d){return ls_la(+d.la)})
                            .attr('cy',function(d){return ls_ln(+d.ln)})
                            .on("click",function(d){stationclick(this,d)})
                            .on("mouseenter", function(d) {		
                                div.transition()		
                                    .duration(500)		
                                    .style("opacity", .9);		
                                div.html(d.name)	
                                    .style("left", (d3.event.pageX+5) + "px")		
                                    .style("top", (d3.event.pageY - 28) + "px")})
                            .style('fill','rgba(255,7,58,.6)')
                            .attr('class',"stations")
                            .attr('id',function(d){return d.code})
                            .transition().duration(1000)
                            .attr('r',function(d){return radscale(d.Trains)}),
                    update => update
                             .attr('cx',function(d){return ls_la(+d.la)})
                             .attr('cy',function(d){return ls_ln(+d.ln)})
                             .attr('r',0)
                             .attr('id',function(d){return d.code})
                             .transition().duration(1000)
                             .attr('r',function(d){return radscale(d.Trains)})
                             .style('fill','rgba(255,7,58,.6)'),
                    exit => exit
                            .transition().duration(1000)
                            .attr('r',function(d){ return 0})
                            .remove()            
                )                        
            }catch(err){

            }
        }
        
        function colorElements(d){
            d3.selectAll('.spanstat').style("background-color","white");
            d3.select(d).style("background-color","#fcf876");
        }

        function colorStations(d){
            d3.select(d).style("background-color","#fcf876");
        }

        function attachitemclick(d,sel){
          d3.selectAll('.searchitem')
            .style('display','none');
                
          document.getElementById("searchtext").value = d.name;
          stationclick('#'.concat(d.code),stations.filter(function(k){return k.code == d.code})[0]);
      }

        d3.select('#massive')
          .on("click",function(d){
              colorElements(this);
              selcircle(stations,200);
            });
        d3.select('#larger')
          .on("click",function(d){
              colorElements(this);
              selcircle(stations,100);
            });
        d3.select('#large')
          .on("click",function(d){
              colorElements(this);
              selcircle(stations,50);
            });
        d3.select('#allstation')
          .on("click",function(d){
              colorElements(this);
              selcircle(stations,0);
            });

        d3.select('#kanya')
          .on("click",function(d){
              stationclick("#CAPE",stations.filter(function(d){return d.code == "CAPE"})[0])
              colorStations(this);
            });
        d3.select('#srin')
          .on("click",function(d){
              stationclick("#SINA",stations.filter(function(d){return d.code == "SINA"})[0])
              colorStations(this);
            });
        d3.select('#ledos')
          .on("click",function(d){
              stationclick("#LEDO",stations.filter(function(d){return d.code == "LEDO"})[0])
              colorStations(this);
            });
        d3.select('#varv')
          .on("click",function(d){
              stationclick("#VVA",stations.filter(function(d){return d.code == "VVA"})[0])
              colorStations(this);
            });
        d3.select('#vijay')
          .on("click",function(d){
              stationclick("#BZA",stations.filter(function(d){return d.code == "BZA"})[0])
              colorStations(this);
            });
        d3.select('#vado')
          .on("click",function(d){
              stationclick("#BRC",stations.filter(function(d){return d.code == "BRC"})[0])
              colorStations(this);
            });
        d3.select('#kanp')
          .on("click",function(d){
              stationclick("#CNB",stations.filter(function(d){return d.code == "CNB"})[0])
              colorStations(this);
            });
        d3.select('#sura')
          .on("click",function(d){
              stationclick("#ST",stations.filter(function(d){return d.code == "ST"})[0])
              colorStations(this);
            });
        d3.select('#itar')
          .on("click",function(d){
              stationclick("#ET",stations.filter(function(d){return d.code == "ET"})[0])
              colorStations(this);
            });

        d3.select('#longesttrain')
          .on("click",function(d){ 
              if(flag == 0){
                d3.select(this).style("background-color","#fcf876");
                d3.select(".pathgroup").style("visibility","visible");  
                flag =1;
              }else{
                d3.select(this).style("background-color","white");
                d3.select(".pathgroup").style("visibility","hidden");   
                flag =0;   
              }
          })

        d3.select("#searchtext")
        .on('click',function(d){         
              d3.select('.tooltip')
                .style("opacity", 0);
              d3.select('#searchcomment')
                .style('display','block');
      
        })
        .on('keyup',function(d){filterSearchItems(this.value)});
    }

    function filterSearchItems(k){
      d3.selectAll('.searchitem')
        .style('display','none');

      if(k.length>0){
        d3.select('#searchcomment')
        .style('display','none')

        d3.selectAll('.searchitem')
        .filter(function(d){return d.name.toLowerCase().substring(0,k.length) == k.toLowerCase()})
        .style('display','block');
      }
    }

    function leftJoin(objArr1, objArr2, key1, key2){
        return objArr1.map(
            anObj1 => ({
                ...objArr2.find(
                    anObj2 => anObj1[key1] === anObj2[key2]
                ),
                ...anObj1
            })
        );
    }

    function colorCircles(stations,routes,sel_d){
        var st = sel_d.code;
        var tr_st = routes.filter(function(d){return d.station_code == st});
        var trs = d3.map(tr_st, function(d){return d.train_no;}).keys();

        var station_to = [];
        var station_from = [];
        console.log(sel_d);

        trs.forEach(d => 
          {
              var rt = routes.filter(function(k){ return k.train_no == d});
              var rt_ltln=leftJoin(rt,stations,"station_code","code");
              var ind = rt_ltln.findIndex(obj => obj.code==st);
              station_to = station_to.concat(rt_ltln.slice(ind+1));
              station_from = station_from.concat(rt_ltln.slice(0,ind));                
          })
      
      var station_to_dedup = d3.map(station_to,function(d){return d.name}).keys()
      var station_from_dedup = d3.map(station_from,function(d){return d.name}).keys();

      var station_tobig_dedup = d3.map(station_to.filter(function(k){return k.Trains > 50}),
                                       function(d){return d.name}).keys();

      var station_frombig_dedup = d3.map(station_from.filter(function(k){return k.Trains > 50}),
                                          function(d){return d.name}).keys();

      var allstations = station_to_dedup.concat(station_from_dedup);
      allstations = [...new Set(allstations)];    
      // var stations_onlyname =  stations.filter(function(d){return d.Trains>=50}).map(function(d){return d.name});
      
      d3.select("#statreach")
        .text(station_to_dedup.length);
      d3.select("#statreach2")
        .text(station_from_dedup.length)
      d3.select("#statreach3")
        .text(station_tobig_dedup.length)
      d3.select("#statreach4")
        .text(station_frombig_dedup.length)


      d3.selectAll(".stations")
        .filter(function(d) { return allstations.some((element) => element == d.name);})
        .style('fill','rgba(20,200,0,.7)');
        
        
        
        // var ls_la = d3.scaleLinear()
        // .domain([68.0,97.2])
        // .range([30.25175116166173, 569.7482488383382]) 
        // var ls_ln = d3.scaleLinear()
        // .domain([6.588028,37.1])
        // .range([600, 0]) 

        // var lineFunction = d3.line()
        //                   .x(function(d) { return ls_la(+d.la); })
        //                   .y(function(d) { return ls_ln(+d.ln); });
        
        // svgx.append("g")
        //     .selectAll('path')
        //     .data(trs)
        //     .enter()
        //     .append("path")
        //     .attr("d",function(d){ 
                
        //         var rt = routes.filter(function(k){ return k.train_no == d});
        //         var rt_ltln=leftJoin(rt,stations,"station_code","code");
        //         return lineFunction(rt_ltln)                
        //     })
        //     .attr("class",function(d){return d})
        //     .attr("stroke",'rgba(0, 158, 115,0.1)')
        //     .attr("fill","none")
        //     .attr("stroke-width",0.5);

        // console.log(station_to_dedup.length);
        // station_to_dedup.sort(d3.ascending)
        // station_from_dedup.sort(d3.ascending)

        // d3.select(".stationinfo-inner")
        //   .selectAll('div')
        //   .data(station_to_dedup)
        //   .join(
        //     enter => enter.append("div")
        //                   .attr("class","train_num")
        //                   .text(function(d){return d}),
        //     update => update
        //              .text(function(d){return d}),
        //     exit => exit
        //            .remove())

        // d3.select(".stationinfo-inner2")
        //   .selectAll('div')
        //   .data(station_from_dedup)
        //   .join(
        //     enter => enter.append("div")
        //                   .attr("class","train_num")
        //                   .text(function(d){return d}),
        //     update => update
        //              .text(function(d){return d}),
        //     exit => exit
        //            .remove())
          
    }

});

