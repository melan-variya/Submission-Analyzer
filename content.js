/**
 * Extract the contest ID and problem index from a Codeforces problem URL.
 * @returns {void}
*/
// import Chart from 'chart.js/auto';

// import { Chart } from "chart.js";

// submission id of the user

let targetX, targetY=0;
let user_point_memo;
const sub_id_xpath= '//*[@id="pageContent"]/div[2]/div[6]/table/tbody/tr[2]/td[1]';
const result2 = document.evaluate(sub_id_xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
const targetElement2 = result2.singleNodeValue;
console.log(targetElement2.textContent);

const user_point_memo_xpath = '//*[@id="pageContent"]/div[2]/div[6]/table/tbody/tr[2]/td[7]';
const user_point_memo_result = document.evaluate(user_point_memo_xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
const user_point_memo_text = user_point_memo_result.singleNodeValue;
// timeconsumed of the user
const time_user_xpath= '//*[@id="pageContent"]/div[2]/div[6]/table/tbody/tr[2]/td[6]';
const result3 = document.evaluate(time_user_xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
const targetElement3 = result3.singleNodeValue.textContent;
let more_than=0 , less_than=0 ,total_subimssions;
let more_than_user_memo=0, total_subimssions_memory=0; 

function extractContestAndProblem() {

    
    const xpath = '//*[@id="pageContent"]/div[2]/div[6]/table/tbody/tr[2]/td[3]/a';
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    let contest_problem ;
    // Check if the element exists
    if (result.singleNodeValue) {
        const element = result.singleNodeValue;
        const href = element.getAttribute('href'); // Get the href attribute
        contest_problem="https://codeforces.com"+href;
        console.log("link:", contest_problem);
    } else {
        console.error("Element not found for the given XPath.");
    }
    // const url = window.location.href;
    // const parsedUrl = contest_problem;
    const parsedUrl = new URL(contest_problem);
    // console.log(url)
    const pathParts = parsedUrl.pathname.split('/');
    let contestID, problemIndex;
    
    

    // const url = contest_problem;
    // const parsedUrl = new URL(url);
    // const pathParts = parsedUrl.pathname.split('/');
    // let contestID, problemIndex;

    // Determine the URL pattern and extract the contest ID and problem index
    if (pathParts.includes("problemset")) {
        // For URLs like: https://codeforces.com/problemset/problem/{contestID}/{problemIndex}
        // /contest/2049/problem/A
        contestID = pathParts[3];
        problemIndex = pathParts[4];
        console.log("contestID:", contestID);   
    } else if (pathParts.includes("contest")) {
        // For URLs like: https://codeforces.com/contest/{contestID}/problem/{problemIndex}
        contestID = pathParts[2];
        problemIndex = pathParts[4];
        console.log("contestID:", contestID);   
        console.log("problem index:", problemIndex);   
    }


    // Call API to fetch submissions data and process it
    fetchSubmissionsData(contestID, problemIndex);
}


/**
 * Fetch the submissions data from the Codeforces API for a specific contest and problem.
 * @param {string} contestID - The contest ID.
 * @param {string} problemIndex - The problem index (e.g., 'A', 'B', etc.).
 * @returns {void}
 */
async function fetchSubmissionsData(contestID, problemIndex) {
    const apiUrl1 = `https://codeforces.com/api/contest.status?contestId=${contestID}&from=1&count=5000`;
    const apiUrl2 = `https://codeforces.com/api/contest.status?contestId=${contestID}&from=5001&count=10000`;
    const apiUrl3 = `https://codeforces.com/api/contest.status?contestId=${contestID}&from=10001&count=15000`;
    const apiUrl4 = `https://codeforces.com/api/contest.status?contestId=${contestID}&from=15001&count=20000`;
     
    // Find the target element using XPath
    const xpath = '//*[@id="pageContent"]/div[2]';
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const targetElement = result.singleNodeValue;

    if (!targetElement) {
        console.error('Element with XPath ' + xpath + ' not found.');
        return;
    }

    // Show loading context with GIF
    const loadingElement = document.createElement('div');
    loadingElement.id = 'loading';
    loadingElement.style.fontSize = '16px';
    loadingElement.style.fontWeight = 'bold';
    loadingElement.style.color = '#007bff';
    loadingElement.style.marginTop = '10px';
    loadingElement.innerHTML = 'Submission-Analyzer<br><br><img src="https://raw.githubusercontent.com/melan-variya/Weather-App/refs/heads/main/loading.gif" alt="Loading..." style="width: 50px; height: 50px; display: block; margin: 0 auto;">';
    targetElement.appendChild(loadingElement);

    try {
        const [response1, response2] = await Promise.all([fetch(apiUrl1), fetch(apiUrl2), fetch(apiUrl3), fetch(apiUrl4)]);
        const data1 = await response1.json();
        const data2 = await response2.json();

        // Check if the responses are successful
        if (data1.status !== "OK" || data2.status !== "OK") {
            console.error("Failed to fetch data from Codeforces API");
            return;
        }

        // Combine results from both API calls
        const combinedResults = [...data1.result, ...data2.result];

        // Filter submissions that match the given problemIndex and have an OK verdict
        const okSubmissions = combinedResults.filter(
            submission => submission.problem.index === problemIndex && submission.verdict === "OK"
        );

        // If no matching submissions are found
        if (okSubmissions.length === 0) {
            console.log("Problem not found");
            return;
        }

        // Display details for OK submissions
        displayOkSubmissionDetails(okSubmissions, contestID, problemIndex);
    } catch (error) {
        console.error("Error fetching submission data:", error);
    } finally {
        // Remove loading context
        targetElement.removeChild(loadingElement);
    }
}


/**
 * Display the time and memory consumed for each successful submission (OK verdict).
 * @param {Array} submissions - Array of submission data.
 * @param {string} contestID - The contest ID.
 * @param {string} problemIndex - The problem index.
 * @returns {void}
*/
// Initialize the arrays with 10 elements, all set to 0
let time_consumed = new Array(250).fill(0);  // store the number of people with same time limit
let time_consumed_without_0 = new Array();// same as time_consumed just does not contain 0 entry
//store time for x axis
let time_limit= new Array();
// For submission id 
let submission_id = new Array(250).fill(0);  // used to show code of a bar onclick
let submission_id_without_0 = new Array(250).fill(0);
//store the height of each bar relative to the maximum number of submissions with same time
let relative_to_max = new Array(250).fill(0);
let relative_to_max_without_0 = new Array(250).fill(0);
// contain all non zero value's index of submission_id
let index_of_non_zero = new Array();

// store Memory
let store_memory= new Map();

let max_time = 0;

let locate_time;
let bar_number;

function displayOkSubmissionDetails(submissions, contestID, problemIndex) {
    // let map2 = new Array(250).fill(0);  // For memory consumed (mod 10)

    // Find the target element using XPath
    // const xpath = "//*[@id='pageContent']/div[3]/div[2]/div";
    const xpath = '//*[@id="pageContent"]/div[2]';
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const targetElement = result.singleNodeValue;

    if (targetElement) {
        const newElement = document.createElement('div');
        newElement.style.fontSize = '16px';
        newElement.style.fontWeight = 'bold';
        newElement.style.color = '#007bff';
        newElement.style.marginTop = '10px';

        // Add header
        // newElement.innerHTML = `<strong>Contest ID:</strong> ${contestID} | <strong>Problem Index:</strong> ${problemIndex}<br><br>`;

        // Filter submissions to only include those with an OK verdict
        const okSubmissions = submissions.filter(submission => submission.verdict === "OK");

        //total submissions
        total_subimssions = okSubmissions.length;
        total_subimssions_memory= okSubmissions.length; 
        // Display time and memory for each OK submission
        console.log(more_than_user_memo+ " "+total_subimssions_memory)
        okSubmissions.forEach(submission => {
            
            // submissionDetails += `Submission ID: ${submission.id} | 
            //     Time Consumed: ${submission.timeConsumedMillis} ms | 
            //     Memory Consumed: ${(submission.memoryConsumedBytes)}<br>`;
            if(parseInt(submission.memoryConsumedBytes/1000) > parseInt(user_point_memo_text.textContent)){
                    console.log(submission.memoryConsumedBytes/1000+" "+user_point_memo_text.textContent);
                    more_than_user_memo++;
                }
                else if(parseInt(submission.memoryConsumedBytes/1000) == parseInt(user_point_memo_text.textContent)){
                    total_subimssions_memory--;
                }
                if(parseInt(submission.timeConsumedMillis) > parseInt(targetElement3)){
                    more_than++;
                }
                else if(parseInt(submission.timeConsumedMillis) < parseInt(targetElement3)){
                    less_than++;
                }
                else{
                    total_subimssions--;
                }
                // console.log(submission.memoryConsumedBytes);
                let memory = submission.memoryConsumedBytes/1000;
                // If the memory value already exists in the map, increment its count
                if (store_memory.has(memory)) {
                    store_memory.set(memory, store_memory.get(memory) + 1);
                }
                // Otherwise, add it to the map with a count of 1
                else {
                    store_memory.set(memory, 1);
                }
                // if(memory==user_point_memo_text.textContent){
                // }
                // console.log(memory);
                if (submission.id == targetElement2.textContent) {
                    // console.log("Matching submission found:");
                    // console.log("Submission ID:", submission.id);
                    console.log("Time Consumed (ms):", submission.timeConsumedMillis);
                    console.log("Memory consumed (Bytes):", submission.memoryConsumedBytes);
                    user_point_memo =submission.memoryConsumedBytes/1000;
                    locate_time=submission.timeConsumedMillis;
                    bar_number = Math.floor(submission.timeConsumedMillis / 10);
                    targetX=(Math.floor(submission.timeConsumedMillis / 10))*10;
                    console.log("x"+targetX);
                    console.log(bar_number);
                } 
            // store_memory[submission.memoryConsumedBytes]+=1;
            // Increment counts in time_consumed and map2 based on mod 10
            time_consumed[Math.floor(submission.timeConsumedMillis / 10)] += 1; // Use Math.floor to ensure correct indexing
            // map2[Math.floor(submission.memoryConsumedBytes / 10)] += 1; // Same here
            if(submission_id[Math.floor(submission.timeConsumedMillis / 10)] == 0) {
                submission_id[Math.floor(submission.timeConsumedMillis / 10)] = submission.id;
            }
        });
        console.log(store_memory);
        submission_id.forEach((value , index)=>{
            if(value!=0){
                time_limit.push(index*10);
            }
        });
        

        console.log(more_than+" "+less_than +" "+total_subimssions);
        console.log("percent "+(more_than*100)/total_subimssions);
        console.log("Memo"+total_subimssions_memory+ " "+more_than_user_memo);
        // let submissionDetails = `Submission-Analyzer <br><br><div style="border: 2px solid black; padding: 10px; display: inline-block;">You beat ${(((more_than * 100) / total_subimssions).toFixed(2))} %</div><br>`;
        // finding location of bar for printing photo
        let cou=0;
        for (let index = 0; index < bar_number; index++) {
            const element = time_consumed[index];
            if(element==0){
                cou++;
            }
            
        }
        if(cou){
            cou--;
        }
        bar_number-=cou;
        // Add counts for time consumed
        // submissionDetails += "<strong>Time Consumed Distribution:</strong><br>";
        time_consumed.forEach((value, index) => {
            max_time=Math.max(max_time,value);
            // submissionDetails += `Time Consumed Mod ${index}: ${value} occurrences<br>`;
        });
        // submissionDetails += "<br>";
        submission_id.forEach(sub_id);
        function sub_id(value , index){
            relative_to_max[index] = (4*time_consumed[index])/max_time;
            // submissionDetails += `Submission ID Mod ${index}: ${value} : ${relative_to_max[index]}<br>`;
            // submissionDetails += `${submission_id[index]}<br>`;
        }
        
        // submissionDetails+= "<br>";
        // submissionDetails = "<strong>Submission ID Distribution:</strong><br>";
        // submissionDetails+= "<br>";
        // submissionDetails+=draw_graph();
        // Add counts for memory consumed
        // submissionDetails += "<strong>Memory Consumed Distribution:</strong><br>";
        // map2.forEach((value, index) => {
            // submissionDetails += `Memory Consumed Mod ${index}: ${value} occurrences<br>`;
        // });

        // if (okSubmissions.length === 0) {
        //     submissionDetails = "<strong>No successful submissions (OK verdict) found.</strong><br>";
        // }

        // newElement.innerHTML += submissionDetails;

        // Append the new element to the target element
        targetElement.appendChild(newElement);

        // Add count of successful submissions
        // const countElement = document.createElement('div');
        // countElement.style.fontSize = '16px';
        // countElement.style.fontWeight = 'bold';
        // countElement.style.color = '#007bff';
        // countElement.style.marginTop = '10px';
        // countElement.innerHTML = `<strong>Total Successful Submissions (OK verdict):</strong> ${okSubmissions.length}`;
        // targetElement.appendChild(countElement);
        // draw_graph();
        draw_time_graph();
        draw_memory_Graph();
        
    } else {
        console.error("Target element not found.");
    }
    store_memory.forEach((key,value)=>{
        if(!key){
            console.log(key+" "+value);
        }
    })
}



// Store data of all bars for hover effect
const bars = [];

// Create a canvas element
const canvas = document.createElement('canvas');
canvas.width = 1350; // Set canvas width
canvas.height = 500; // Set canvas height

const ctx = canvas.getContext('2d');

let photox,photoy;


function draw_time_graph() {
    // Filter non-zero values from time_consumed
    const timeConsumedFiltered = time_consumed.filter(value => value !== 0);

    // Calculate scaled indices for non-zero values in submission_id
    const nonZeroIndices = submission_id.reduce((indices, value, index) => {
        if (value !== 0) indices.push(index * 10); // Scale index by 10
        return indices;
    }, []);

    console.log("Non-zero indices count:", nonZeroIndices.length);
    console.log("Time limit count:", time_limit.length);

    // Locate the target element using XPath
    const xpath = "//*[@id='pageContent']/div[2]";
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const targetElement = result.singleNodeValue;

    if (!targetElement) {
        console.error("Target element not found.");
        return;
    }

    // Get the target element's width
    const targetWidth = targetElement.offsetWidth;
    console.log(targetX);

    // Create a container for the graph
    const container = document.createElement("div");
    container.id = "graph-container";
    container.style = `
        width: ${targetWidth - 20}px;
        height: 550px;
        background-color: white;
        border: 1px solid #ccc;
        box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
        padding: 10px;
        margin-top: 20px;
    `;

    // Add a canvas element for the graph
    const canvas = document.createElement("canvas");
    canvas.id = "timeGraph";
    container.appendChild(canvas);

    // Append the container to the target element
    targetElement.appendChild(container);

    // Ensure Chart.js is loaded
    if (typeof Chart === "undefined") {
        console.error("Chart.js is not loaded properly.");
        return;
    }

    const highlightColor = "rgba(255, 99, 132, 0.8)"; // Red color
    const defaultColor = "rgba(75, 192, 192, 0.2)"; // Default blue color

    // Data for the graph
    const chartData = {
        labels: time_limit, // X-axis data
        datasets: [
            {
                label: "You",
                data: timeConsumedFiltered,
                backgroundColor: time_limit.map(label => 
                    label === targetX ? highlightColor : defaultColor
                ),
                borderColor: time_limit.map(label => 
                    label === targetX ? highlightColor : "rgba(75, 192, 192, 1)"
                ),
                borderWidth: 1,
                stack: 'stack0'
            },
            {
                label: "Others",
                data: [], // Empty data as this is just for legend
                backgroundColor: highlightColor, // Red color for Others
                borderColor: highlightColor,
                borderWidth: 1,
                stack: 'stack0',
                hidden: false
            }
        ]
    };
    
    // Chart configuration
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                top: 50, // Add padding to avoid overlap with the text
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Time Limit (ms)"
                },
                ticks: {
                    autoSkip: true,
                    maxTicksLimit: 10,
                    maxRotation: 0,
                    minRotation: 0
                },
                grid: {
                    display: true,
                    drawBorder: false,
                    color: '#e0e0e0',
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "No. of Users"
                },
                ticks: {
                    callback: (value) => `${value}`,
                },
                grid: {
                    display: true,
                    color: '#e0e0e0',
                }
            }
        },
        plugins: {
            title: {
                display: true, // Re-enable the title
                text: "No. of Users vs Time Limit", // Set the title text
                font: {
                    size: 16,
                    weight: 'bold'
                },
                padding: {
                    top: 10, // Adjust padding to avoid overlap with custom text and box
                    bottom: 10
                }
            },
            legend: {
                display: true,
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    generateLabels: function(chart) {
                        const defaultLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                        
                        // Modify the first label ("You") to use the highlight color (red)
                        if (defaultLabels[0]) {
                            defaultLabels[0].fillStyle = highlightColor; // Use the highlight color for "You"
                            defaultLabels[0].strokeStyle = highlightColor;
                        }
                    
                        // Leave the second label ("Others") with the default color
                        if (defaultLabels[1]) {
                            defaultLabels[1].fillStyle = defaultColor; // Use the default color for "Others"
                            defaultLabels[1].strokeStyle = defaultColor;
                        }
                    
                        return defaultLabels; // Return the modified labels
                    }
                },
                onClick: null // Disable the click event on legend items
            },
            // tooltip: {
            //     callbacks: {
            //         label: (context) => `Time: ${context.raw} ms`
            //     }
            // },
            tooltip: {
                callbacks: {
                    // Customize the title
                    title: function(tooltipItems) {
                        return `${tooltipItems[0].raw}`;
                    },
                    // Customize the label
                    label: function(tooltipItem) {
                        const value = tooltipItem.raw; // Y-axis value
                        const label = tooltipItem.label; // X-axis label
                        return [`Time(ms) : ${label}`]; // Multi-line tooltip
                    },
                }
            }
        }
    };

    // Initialize Chart.js
    const ctx = canvas.getContext("2d");
    const chart = new Chart(ctx, {
        type: "bar",
        data: chartData,
        options: chartOptions,
        plugins: [{
            id: 'customTextPlugin', // Unique ID for the plugin
            afterDraw: (chart) => {
                const ctx = chart.ctx;
                ctx.save(); // Save the current context state

                // Draw "Submission-Analyzer" text
                ctx.font = "bold 18px Arial";
                ctx.fillStyle = "#333";
                ctx.textAlign = "center";
                ctx.fillText("Submission-Analyzer", 100, 25);

                // Draw the box for "You beat X.XX %"
                const boxText = `You beat ${(((more_than * 100) / total_subimssions).toFixed(2))} %`;
                ctx.font = "16px Arial";
                ctx.fillStyle = "#555";
                ctx.textAlign = "center";

                // Measure the text width
                const textWidth = ctx.measureText(boxText).width;

                // Box dimensions
                const boxPadding = 10;
                const boxWidth = textWidth + boxPadding * 2;
                const boxHeight = 30;
                const boxX = (chart.width - boxWidth) / 2; // Center the box horizontally
                const boxY = 40; // Position below the "Submission-Analyzer" text

                // Draw the box border
                ctx.strokeStyle = "black";
                ctx.lineWidth = 2;
                ctx.strokeRect(10, 50, boxWidth, boxHeight);

                // Draw the text inside the box
                ctx.fillText(boxText, 10+boxWidth/2, boxY + boxHeight / 2 + 10);

                ctx.restore(); // Restore the context state
            }
        }]
    });
}



function draw_memory_Graph() {

    // Locate the target element using XPath
    const xpath = "//*[@id='pageContent']/div[2]";
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const targetElement = result.singleNodeValue;

    if (!targetElement) {
        console.error("Target element not found.");
        return;
    }

    // Get the target element's width
    const targetWidth = targetElement.offsetWidth;

    // Create a container for the graph
    const container = document.createElement("div");
    container.id = "graph-container";
    container.style = `
        width: ${targetWidth - 20}px;
        height: 550px;
        background-color: white;
        border: 1px solid #ccc;
        box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
        padding: 10px;
        margin-top: 20px;
    `;

    // Add a canvas element for the graph
    const canvas = document.createElement("canvas");
    canvas.id = "MemoryGraph";
    container.appendChild(canvas);

    // Append the container to the target element
    targetElement.appendChild(container);

    // Ensure Chart.js is loaded
    if (typeof Chart === "undefined") {
        console.error("Chart.js is not loaded properly.");
        return;
    }

    const highlightColor = "rgba(255, 99, 132, 0.8)"; // Red color
    const defaultColor = "rgba(75, 192, 192, 0.2)"; // Default blue color

    // Sort data by labels
    const sortedData = Array.from(store_memory.entries())
        .map(([key, value]) => ({ label: parseFloat(key), value })) // Ensure numerical sorting
        .sort((a, b) => a.label - b.label);

    const sortedLabels = sortedData.map(item => item.label.toString());
    const sortedValues = sortedData.map(item => item.value);
    console.log("ne"+user_point_memo);
    // Chart data
    const chartData = {
        labels: sortedLabels, // X-axis data
        datasets: [
            {
                label: "You",
                data: sortedValues, // Y-axis data
                backgroundColor: Array.from(sortedLabels).map(label =>  
                    label.toString() === user_point_memo.toString() ? highlightColor : defaultColor
                ),
                borderColor: Array.from(sortedLabels).map(label => 
                    label.toString() === user_point_memo.toString() ? highlightColor : "rgba(75, 192, 192, 1)"
                ),
                borderWidth: 1,
                stack: 'stack0'
            },
            {
                label: "Others",
                data: [], // Empty data as this is just for legend
                backgroundColor: highlightColor,
                borderColor: highlightColor,
                borderWidth: 1,
                stack: 'stack0',
                hidden: false
            }
        ]
    };

    // Chart configuration
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                top: 50
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Memory Consumed (KB)"
                },
                ticks: {
                    autoSkip: true,
                    maxTicksLimit: 10,
                    maxRotation: 0,
                    minRotation: 0
                },
                grid: {
                    display: true,
                    drawBorder: false,
                    color: '#e0e0e0',
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "No. of Users"
                },
                ticks: {
                    callback: value => `${value}`
                },
                grid: {
                    display: true,
                    color: '#e0e0e0',
                }
            }
        },
        plugins: {
            title: {
                display: true,
                text: "No. of Users Vs Memory Consumed", // Set the title text
                font: {
                    size: 16,
                    weight: 'bold'
                },
                padding: {
                    top: 10,
                    bottom: 10
                }
            },
            legend: {
                display: true,
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    generateLabels: function(chart) {
                        const defaultLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                        
                        // Modify the first label ("You") to use the highlight color (red)
                        if (defaultLabels[0]) {
                            defaultLabels[0].fillStyle = highlightColor; // Use the highlight color for "You"
                            defaultLabels[0].strokeStyle = highlightColor;
                        }
                    
                        // Leave the second label ("Others") with the default color
                        if (defaultLabels[1]) {
                            defaultLabels[1].fillStyle = defaultColor; // Use the default color for "Others"
                            defaultLabels[1].strokeStyle = defaultColor;
                        }
                    
                        return defaultLabels; // Return the modified labels
                    }
                },
                onClick: null // Disable the click event on legend items
            },
            tooltip: {
                callbacks: {
                    // Customize the title
                    title: function(tooltipItems) {
                        return `${tooltipItems[0].raw}`;
                    },
                    // Customize the label
                    label: function(tooltipItem) {
                        const value = tooltipItem.raw; // Y-axis value
                        const label = tooltipItem.label; // X-axis label
                        return [`Memory(KB) : ${label}`]; // Multi-line tooltip
                    },
                }
            }
        }
    };

    // Initialize Chart.js
    const ctx = canvas.getContext("2d");
    const chart = new Chart(ctx, {
        type: "bar",
        data: chartData,
        options: chartOptions,
        plugins: [{
            id: 'customTextPlugin', // Unique ID for the plugin
            afterDraw: (chart) => {
                const ctx = chart.ctx;
                ctx.save(); // Save the current context state

                // // Draw "Submission-Analyzer" text
                // ctx.font = "bold 18px Arial";
                // ctx.fillStyle = "#333";
                // ctx.textAlign = "center";
                // ctx.fillText("Submission-Analyzer", 100, 25);

                // Draw the box for "You beat X.XX %"
                // console.log(total_subimssions_memory+ " "+more_than_user_memo);
                const boxText = `You beat ${(((more_than_user_memo * 100) / total_subimssions_memory).toFixed(2))} %`;
                ctx.font = "16px Arial";
                ctx.fillStyle = "#555";
                ctx.textAlign = "center";

                // Measure the text width
                const textWidth = ctx.measureText(boxText).width;

                // Box dimensions
                const boxPadding = 10;
                const boxWidth = textWidth + boxPadding * 2;
                const boxHeight = 30;
                const boxX = (chart.width - boxWidth) / 2; // Center the box horizontally
                const boxY = 40; // Position below the "Submission-Analyzer" text

                // Draw the box border
                ctx.strokeStyle = "black";
                ctx.lineWidth = 2;
                ctx.strokeRect(10, 50, boxWidth, boxHeight);

                // Draw the text inside the box
                ctx.fillText(boxText, 10+boxWidth/2, boxY + boxHeight / 2 + 10);

                ctx.restore(); // Restore the context state
            }
        }]
    });
}



// Immediately draw the graph when the script is executed
// draw_time_graph();


// function draw_graph() {
    

//     if (index_of_non_zero.length === 0 || relative_to_max_without_0.length === 0) {
//         console.error("No valid data to draw the graph.");
//         return;
//     }
    

//     const xpath = '//*[@id="pageContent"]/div[2]';
//     const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);

//     const targetElement = result.singleNodeValue;

//     if (!targetElement) {
//         console.error('Element with XPath ' + xpath + ' not found.');
//         return;
//     }

//     // Append the canvas to the found element
//     targetElement.appendChild(canvas);

//     // Graph parameters
//     const barWidth = 15; // Width of each bar
//     const barSpacing = 5; // Space between bars
//     const maxBarHeight = 350; // Maximum height of bars
//     const xOffset = 50; // Offset for the graph to start
//     const yOffset = 450; // Y-offset for the baseline of the graph
//     const maxValue = Math.max(...relative_to_max_without_0); // Find the maximum value for scaling

//     // Draw bars
    

//     loop1:
//     for (let index = 0; index < relative_to_max_without_0.length; index++) {
//         const value = relative_to_max_without_0[index];
//         const barHeight = (value / maxValue) * maxBarHeight; // Scale the bar height
//         // Set minimum bar height to 5 pixels
//         const finalBarHeight = barHeight < 5 ? 5 : barHeight;

//         const x = xOffset + index * (barWidth + barSpacing); // X-coordinate for the bar
//         const y = yOffset - finalBarHeight; // Y-coordinate (top of the bar)

//         bars.push({
//             x: x,
//             y: y,
//             width: barWidth,
//             height: finalBarHeight,
//             index: index // Storing index of the bar for reference
//         });

//         // Set bar color
//         ctx.fillStyle = 'rgba(54, 162, 235, 0.8)';
//         ctx.fillRect(x, y, barWidth, finalBarHeight); // Draw the bar

//         // Draw the submission ID or labels on the x-axis
//         ctx.fillStyle = '#000';
//         ctx.font = '10px Arial';
//         ctx.textAlign = 'center';
        
//         // if(index_of_non_zero[index]==(parseInt((locate_time)/10))*10){
//         //     photox= x + barWidth / 2;
//         //     //     // photoy=yOffset + 15;
//         // }
//         // console.log((parseInt((locate_time)/10))*10);
//         // // for (let index = 0; index < index_of_non_zero.length; index++) {
//         // //     console.log(index_of_non_zero[index]);
            
//         // }
//         // Check if current index is divisible by 100
//         if (index_of_non_zero[index] % 100 === 0) {
//             ctx.fillText(index_of_non_zero[index], x + barWidth / 2, yOffset + 15); // X is centered on the bar
//             continue; // Skip to the next iteration
//         }
//         if(index == index_of_non_zero.length - 1){
//             ctx.fillText(index_of_non_zero[index], x + barWidth / 2, yOffset + 15); // X is centered on the bar
//         }
//         // Safeguard to avoid accessing undefined values at the end of the array
//         if (index < index_of_non_zero.length - 1) {
//             if (index_of_non_zero[index + 1] % 100 === 0) {
//                 // ctx.fillText(index_of_non_zero[index], x + barWidth / 2, yOffset + 15); // X is centered on the bar
//                 continue; // Skip to the next iteration
//             }
//             const current = Math.floor(index_of_non_zero[index] / 100);
//             const next = Math.floor(index_of_non_zero[index + 1] / 100);

//             // Only add a new label if there's a gap in 100s
//             if (current !== next) {
//                 ctx.fillText((current + 1) * 100, x + barWidth / 2, yOffset + 15);
//             }
//         }
//     }
//     //finding location of photo

//     // console.log('barheight'+bars[bar_number-1].height);
//     // bars.forEach(height => {
//     //     console.log(height);
//     // });
//     // console.log("bar_height" + bar_number-1);
//     photox=bars[bar_number-1].x+barWidth/2;
//     // photoy=bars[bar_number-1].y+bars[bar_number-1].height-100;
//     photoy=450-bars[bar_number-1].height-80;
//     console.log("barheight "+ photoy);
//     // Draw the Y-axis
//     ctx.strokeStyle = '#000';
//     ctx.lineWidth = 2;
//     ctx.beginPath();
//     ctx.moveTo(xOffset - 10, yOffset - maxBarHeight-50); // Top of the Y-axis
//     ctx.lineTo(xOffset - 10, yOffset); // Bottom of the Y-axis
//     ctx.stroke();

//     // Draw the X-axis
//     ctx.beginPath();
//     ctx.moveTo(xOffset - 10, yOffset); // Left of the X-axis
//     ctx.lineTo(xOffset + (relative_to_max_without_0.length * (barWidth + barSpacing)), yOffset); // Right of the X-axis
//     ctx.stroke();

//     // Add labels to the Y-axis
//     ctx.fillStyle = '#000';
//     ctx.font = '12px Arial';
//     ctx.textAlign = 'right';
//     for (let i = 0; i <= maxValue; i += Math.ceil(maxValue / 10)) {
//         const y = yOffset - (i / maxValue) * maxBarHeight;
//         ctx.fillText(i, xOffset - 15, y + 5);
//     }

//     // Print multiples of 100 on the X-axis
//     ctx.fillStyle = '#000';
//     ctx.font = '12px Arial';
//     ctx.textAlign = 'center';

//     let lastHoveredBarIndex = -1; // Keep track of the last hovered bar
    
//     displayPhoto();
//     canvas.addEventListener('mousemove', (event) => {
//         const mouseX = event.offsetX; // X position of mouse relative to canvas
//         const mouseY = event.offsetY; // Y position of mouse relative to canvas
    
//         let hoveredBarIndex = -1; // Initialize no hovered bar
    
//         // Loop through the bars to check if the mouse is inside any bar
//         bars.forEach((bar, index) => {
//             if (
//                 mouseX >= bar.x && // Check left boundary
//                 mouseX <= bar.x + bar.width && // Check right boundary
//                 mouseY >= bar.y && // Check top boundary
//                 mouseY <= bar.y + bar.height // Check bottom boundary
//             ) {
//                 hoveredBarIndex = index; // Store the index of the hovered bar
//             }
//         });
    
//         const ctx = canvas.getContext('2d');
    
//         if (hoveredBarIndex !== lastHoveredBarIndex) {
//             // Clear the last hovered bar if it exists
//             if (lastHoveredBarIndex !== -1) {
//                 const lastBar = bars[lastHoveredBarIndex];
//                 ctx.clearRect(lastBar.x - 1, lastBar.y - 1, lastBar.width + 2, lastBar.height + 2); // Clear the last bar area
//                 ctx.fillStyle = 'rgba(54, 162, 235, 0.8)'; // Original bar color
//                 ctx.fillRect(lastBar.x, lastBar.y, lastBar.width, lastBar.height); // Redraw the last bar
                
//                 ctx.clearRect(lastBar.x -5.2, lastBar.y - 40, 25.7, 20); 

//                 // Redraw the X-axis portion below this bar
//                 ctx.fillStyle = '#000'; // X-axis color
//                 ctx.fillRect(lastBar.x - 1, canvas.height - 51, lastBar.width + 2, 2); // Redraw the X-axis
//             }
    
//             // Highlight the newly hovered bar
//             if (hoveredBarIndex !== -1) {
//                 const hoveredBar = bars[hoveredBarIndex];
//                 ctx.clearRect(hoveredBar.x - 1, hoveredBar.y - 1, hoveredBar.width + 2, hoveredBar.height + 2); // Clear the bar area
//                 ctx.fillStyle = 'rgb(59, 89, 152)'; // Highlight color
//                 ctx.fillRect(hoveredBar.x, hoveredBar.y, hoveredBar.width, hoveredBar.height); // Redraw the hovered bar
    
//                 // Redraw the X-axis portion below this bar
//                 ctx.fillStyle = '#000'; // X-axis color
//                 ctx.fillRect(hoveredBar.x - 1, canvas.height - 51, hoveredBar.width + 2, 2); // Redraw the X-axis
//                 // let text_print=((hoveredBar.height/100)*max_time)/4;
//                 console.log(hoveredBar.height/100);    
//                 ctx.fillText(time_consumed_without_0[hoveredBarIndex], hoveredBar.x+8,hoveredBar.y-30)
//             }
    
//             // Update the last hovered bar index
//             lastHoveredBarIndex = hoveredBarIndex;
//         }
        
//     });
    
// }


// Call the function to start the process
extractContestAndProblem();



function displayPhoto() {
    // const xpath1='//*[@id="header"]/div[2]/div[2]/a[1]';
    const xpath1='//*[@id="pageContent"]/div[2]/div[6]/table/tbody/tr[2]/td[2]/a';
    const result1 = document.evaluate(xpath1, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const targetElement1 = result1.singleNodeValue;
    // console.log(targetElement1.textContent);
    handle=targetElement1.textContent;
    const apiUrl = `https://codeforces.com/api/user.info?handles=${handle}&checkHistoricHandles=false`;
    // write a code to show img at top always
    
    


    // Fetch data from the API
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const titlePhotoUrl = data.result[0].titlePhoto;

            // Create an image object
            const img = new Image();
            img.src = titlePhotoUrl;
            img.onload = () => {
                // Save the current canvas state
                ctx.save();

                // Define the circle's center and radius
                const circleX = photox;
                // const circleY = 500-photoy-100;
                const circleY = photoy;
                console.log(photox+" "+photoy);
                const radius = 15;

                // Draw the circular clipping region
                ctx.beginPath();
                ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
                ctx.clip();

                // Draw the image
                ctx.drawImage(img, circleX - radius, circleY - radius, radius * 2, radius * 2);

                // Restore the canvas state to remove the clipping region
                ctx.restore();

                // Draw an arrow
                // const x = 100, y = 40, width = 20, height = 20;
                // ctx.beginPath();
                // ctx.moveTo(x, y);
                // ctx.lineTo(x - width, y );
                // ctx.lineTo(x - width/2 , y + height);
                // ctx.closePath();
                // ctx.fillStyle = "black";
                // ctx.fill();

                

                // const text='//*[@id="pageContent"]/div[2]/div[6]/table/tbody/tr[2]/td[5]';
                // const result = document.evaluate(text, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                // if(result.textContent === "Compilation error"){
                //     console.log("Compilation error");
                // }
                // else{
                //     console.log(result);
                // }
                

            };
        })
        .catch(error => {
            console.error("There was a problem with the fetch operation:", error);
        });
}


