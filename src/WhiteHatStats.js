import React, {useEffect, useRef,useMemo} from 'react';
import useSVGCanvas from './useSVGCanvas.js';
import * as d3 from 'd3';

//change the code below to modify the bottom plot view
export default function WhiteHatStats(props){
    //this is a generic component for plotting a d3 plot
    const d3Container = useRef(null);
    //this automatically constructs an svg canvas the size of the parent container (height and width)
    //tTip automatically attaches a div of the class 'tooltip' if it doesn't already exist
    //this will automatically resize when the window changes so passing svg to a useeffect will re-trigger
    const [svg, height, width, tTip] = useSVGCanvas(d3Container);

 
    const margin = 50;
    const radius = 10;


    //TODO: modify or replace the code below to draw a more truthful or insightful representation of the dataset. This other representation could be a histogram, a stacked bar chart, etc.
    //this loop updates when the props.data changes or the window resizes
    //we can edit it to also use props.brushedState if you want to use linking
    useEffect(()=>{
        //wait until the data loads
        if(svg === undefined | props.data === undefined){ return }

        //aggregate gun deaths by state
        const data = props.data.states;
        
        //get data for each state
        const plotData = [];
        for(let state of data){
            const dd = drawingDifficulty[state.abreviation];
            let entry = {
                'count': state.count,
                'name': state.state,
                'population': state.population,
                'easeOfDrawing': dd === undefined? 5: dd,
                'genderRatio': state.male_count/state.count,
                'male_count': state.male_count
            }
            plotData.push(entry)
        }

        //get transforms for each value into x and y coordinates
        let xScale = d3.scaleLinear()
            //.domain(d3.extent(plotData,d=>d.easeOfDrawing))
            //paul
            //.domain(d3.extent(plotData,d=>(d.count*100000/d.population)))
            .domain(d3.extent(plotData,d=>(d.genderRatio*100)))
            .range([margin,width-margin]);
        let yScale = d3.scaleLinear()
            //paul
            //.domain(d3.extent(plotData,d=>d.count))

            //.domain(d3.extent(plotData,d=>d.count*100000/d.population))
            .domain([0,d3.extent(plotData,d=>d.count*100000/d.population)[1]])

            //.range([height-margin-radius,margin+radius]);
            .range([height-margin,margin]);//height - margin.bottom, margin.top
            //.range([margin,height - margin]);//height - margin.bottom, margin.top

        let yScale2 = d3.scaleLinear()
            .domain(d3.extent(plotData,d=>d.count))
            //.range([height-margin-radius,margin+radius]);
            .range([margin,height-margin]);//height - margin.bottom, margin.top
            //.range([0,height]);


        //draw a line showing the mean values across the curve
        //this probably isn't actually regression
        const regressionLine = [];
        for(let i = 0; i <= 10; i+= 1){
            let pvals = plotData.filter(d => Math.abs(d.easeOfDrawing - i) <= .5);
            let meanY = 0;
            if(pvals.length > 0){
                for(let entry of pvals){
                    meanY += entry.count/pvals.length
                }
            }
            let point = [xScale(i),yScale(meanY)]
            //paul
            //regressionLine.push(point)
        }
        
        //scale color by gender ratio for no reason
        let colorScale = d3.scaleDiverging()
            .domain([0,1])
            .range(['white','red']);

        //draw the circles for each state
        //paul
        svg.selectAll('.rect').remove();
        //svg.selectAll('.dot').data(plotData)
        svg.selectAll('.rect').data(plotData)
            //.data(plotData)
            //.enter().append('circle')
            .enter().append('rect')//paul?
            //.attr('cy',d=> yScale(d.count))
            //.attr('x', d => xScale(d.count*100000/d.population))
            .attr('x', d => xScale(d.genderRatio*100))

            //.attr('y', d => yScale(d.count))
            .attr('y', d => yScale(d.count*100000/d.population))
            //.attr('height',d=> yScale(0) - yScale(d.count))// - yScale2(0)
            .attr('height',d=> yScale(0) - yScale(d.count*100000/d.population))// - yScale2(0)
            //.attr('cx',d=>xScale(d.easeOfDrawing))
            //.attr('width',d=>xScale(d.easeOfDrawing))
            .attr('width',5)
            //.attr('fill',d=> colorScale(d.genderRatio))
            .attr('fill','darkorange')
            //.attr('r',10)
            .on('mouseover',(e,d)=>{
                let string = d.name + '</br>'
                    + 'Gun Deaths: ' + d.count + '</br>'
                    //+ 'Difficulty Drawing: ' + d.easeOfDrawing;
                    + 'Gun Deaths/100K: ' + (d.count*100000/d.population).toFixed(2) + '</br>'
                    + '% Male Victims: ' + (d.genderRatio*100).toFixed(2);
                props.ToolTip.moveTTipEvent(tTip,e)
                tTip.html(string)
            }).on('mousemove',(e)=>{
                props.ToolTip.moveTTipEvent(tTip,e);
            }).on('mouseout',(e,d)=>{
                props.ToolTip.hideTTip(tTip);
            });
           
            //paul
        // //draw the line
        // svg.selectAll('.regressionLine').remove();
        // svg.append('path').attr('class','regressionLine')
        //     .attr('d',d3.line().curve(d3.curveBasis)(regressionLine))
        //     .attr('stroke-width',5)
        //     .attr('stroke','black')
        //     .attr('fill','none');
        
        

        //change the title
        const labelSize = margin/2;
        svg.selectAll('text').remove();
        svg.append('text')
            .attr('x',width/2)
            .attr('y',labelSize)
            .attr('text-anchor','middle')
            .attr('font-size',labelSize)
            .attr('font-weight','bold')
            .text('Gender vs Gun Deaths');

        //change the disclaimer here
        // svg.append('text')
        //     .attr('x',width-20)
        //     .attr('y',height/3)
        //     .attr('text-anchor','end')
        //     .attr('font-size',10)
        //     .text("I'm just asking questions");

        //draw basic axes using the x and y scales
        svg.selectAll('g').remove()
        svg.append('g')
            .attr('transform',`translate(0,${height-margin+1})`)
            .call(d3.axisBottom(xScale))

        svg.append('g')
            .attr('transform',`translate(${margin-2},0)`)
            .call(d3.axisLeft(yScale))
        
        svg.append("text")
            // .attr("text-anchor", "end")
            // .attr("x", width)
            // .attr("y", height + margin.top + 20)
            .attr('x',width/2)
            //.attr('y',labelSize+290)
            .attr('y',height-5)
            .attr('text-anchor','middle')
            .text("states (ordered by % male victims)")
            .attr('font-weight','bold')

        // Y axis label:
        svg.append("text")
            .attr("text-anchor", "middle")
            //.attr("transform", "rotate(-90)")
            .attr('x',97)
            .attr('y',labelSize+40)
            .text('gun deaths per 100K')
            .attr('font-weight','bold')
        
        
    },[props.data,svg]);

    return (
        <div
            className={"d3-component"}
            style={{'height':'99%','width':'99%'}}
            ref={d3Container}
        ></div>
    );
}
//END of TODO #1.

 
const drawingDifficulty = {
    'IL': 9,
    'AL': 2,
    'AK': 1,
    'AR': 3,
    'CA': 9.51,
    'CO': 0,
    'DE': 3.1,
    'DC': 1.3,
    'FL': 8.9,
    'GA': 3.9,
    'HI': 4.5,
    'ID': 4,
    'IN': 4.3,
    'IA': 4.1,
    'KS': 1.6,
    'KY': 7,
    'LA': 6.5,
    'MN': 2.1,
    'MO': 5.5,
    'ME': 7.44,
    'MD': 10,
    'MA': 6.8,
    'MI': 9.7,
    'MN': 5.1,
    'MS': 3.8,
    'MT': 1.4,
    'NE': 1.9,
    'NV': .5,
    'NH': 3.7,
    'NJ': 9.1,
    'NM': .2,
    'NY': 8.7,
    'NC': 8.5,
    'ND': 2.3,
    'OH': 5.8,
    'OK': 6.05,
    'OR': 4.7,
    'PA': 4.01,
    'RI': 8.4,
    'SC': 7.1,
    'SD': .9,
    'TN': 3.333333,
    'TX': 8.1,
    'UT': 2.8,
    'VT': 2.6,
    'VA': 8.2,
    'WA': 9.2,
    'WV': 7.9,
    'WY': 0,
}
