const width = 1600;
const height = 1200;
const radius = Math.min(width, height) / 2;

// Define a function to load and process JSON data
function loadData(url, callback) {
    d3.json(url).then(data => {
        // Process data based on format
        const processedData = processData(data);
        callback(processedData);
    });
}

// Function to process data
function processData(data) {
    // Determine the format and transform to hierarchical structure if needed
    if (Array.isArray(data)) {
        // Example case where 'id' needs to be transformed into a hierarchical structure
        if (data[0].id && !data[0].ID) {
            const root = { name: "root", children: [] };
            data.forEach(d => {
                const parts = d.id.split(".");
                let currentLevel = root.children;
                parts.forEach((part, index) => {
                    let existing = currentLevel.find(d => d.name === part);
                    if (!existing) {
                        existing = { name: part, children: [] };
                        currentLevel.push(existing);
                    }
                    if (index === parts.length - 1) {
                        existing.value = d.value || d.size;
                    }
                    currentLevel = existing.children;
                });
            });
            return root;
        }
        // Case where data is already in a flat structure with IDs
        if (data[0].ID) {
            const root = { name: "root", children: [] };
            data.forEach(d => {
                const parts = d.ID.split(".");
                let currentLevel = root.children;
                parts.forEach((part, index) => {
                    let existing = currentLevel.find(d => d.name === part);
                    if (!existing) {
                        existing = { name: part, children: [] };
                        currentLevel.push(existing);
                    }
                    if (index === parts.length - 1) {
                        existing.value = d.POBL_2022;
                    }
                    currentLevel = existing.children;
                });
            });
            return root;
        }
    }
    return data;
}

// Function to create Treemap
function createTreemap(data) {
    const root = d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

    d3.treemap()
        .size([width, height])
        .padding(1)
        (root);

    const svg = d3.select("#treemap").append("svg")
        .attr("width", width)
        .attr("height", height);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const cell = svg.selectAll("g")
        .data(root.leaves())
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    cell.append("rect")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", d => color(d.data.name));

    cell.append("text")
        .attr("x", 3)
        .attr("y", 13)
        .text(d => d.data.name)
        .attr("font-size", "14px")
        .attr("fill", "white");
}

// Function to create Radial layout
function createRadial(data) {
    const root = d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

    const partition = d3.partition()
        .size([2 * Math.PI, radius]);

    partition(root);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .innerRadius(d => d.y0)
        .outerRadius(d => d.y1);

    const svg = d3.select("#radial").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    svg.selectAll("path")
        .data(root.descendants())
        .enter().append("path")
        .attr("display", d => d.depth ? null : "none")
        .attr("d", arc)
        .style("stroke", "#fff")
        .style("fill", d => color(d.data.name));

    svg.selectAll("text")
        .data(root.descendants())
        .enter().append("text")
        .attr("class", "radial-label")
        .attr("transform", function(d) {
            const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
            const y = (d.y0 + d.y1) / 2;
            return `rotate(${x - 90})translate(${y},0)rotate(${x < 180 ? 0 : 180})`;
        })
        .attr("dx", "6")
        .attr("dy", ".35em")
        .text(d => d.depth ? d.data.name : "")
        .attr("font-size", "12px");
}

// Function to create Partition layout
function createPartition(data) {
    const root = d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

    d3.partition()
        .size([width, height])
        (root);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const svg = d3.select("#partition").append("svg")
        .attr("width", width)
        .attr("height", height);

    const cell = svg.selectAll("g")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.y0},${d.x0})`);

    cell.append("rect")
        .attr("width", d => d.y1 - d.y0)
        .attr("height", d => d.x1 - d.x0)
        .attr("fill", d => color(d.data.name));

    cell.append("text")
        .attr("x", 5)
        .attr("y", 15)
        .text(d => d.data.name)
        .attr("font-size", "14px")
        .attr("fill", "white");
}

// Function to create Circle Packing layout
function createCirclePacking(data) {
    const root = d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

    d3.pack()
        .size([width - 2, height - 2])
        .padding(1.5)
        (root);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const svg = d3.select("#circlePacking").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    const node = svg.selectAll("g")
        .data(root.descendants())
        .enter().append("g")
        .attr("transform", d => `translate(${d.x - root.x},${d.y - root.y})`);

    node.append("circle")
        .attr("r", d => d.r)
        .attr("fill", d => color(d.data.name))
        .attr("stroke", "#fff");

    node.append("text")
        .attr("dy", ".3em")
        .attr("font-size", "14px")
        .attr("fill", "white")
        .text(d => d.depth ? d.data.name : "");
}

// Function to create Sunburst layout
function createSunburst(data) {
    const root = d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

    d3.partition()
        .size([2 * Math.PI, radius])
        (root);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .innerRadius(d => d.y0)
        .outerRadius(d => d.y1);

    const svg = d3.select("#sunburst").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    svg.selectAll("path")
        .data(root.descendants().filter(d => d.depth))
        .enter().append("path")
        .attr("d", arc)
        .style("stroke", "#fff")
        .style("fill", d => color(d.data.name));

    svg.selectAll("text")
        .data(root.descendants().filter(d => d.depth))
        .enter().append("text")
        .attr("transform", function(d) {
            const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
            const y = (d.y0 + d.y1) / 2;
            return `rotate(${x - 90})translate(${y},0)rotate(${x < 180 ? 0 : 180})`;
        })
        .attr("dx", "6")
        .attr("dy", ".35em")
        .text(d => d.data.name)
        .attr("font-size", "14px")
        .attr("fill", "white");
}

// Load and visualize data
function visualizeData(file) {
    loadData(file, data => {
        createTreemap(data);
        createRadial(data);
        createPartition(data);
        createCirclePacking(data);
        createSunburst(data);
    });
}

// Load and visualize data from flare.json
visualizeData("flare.json");
