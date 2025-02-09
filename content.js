/**
 * Extract the contest ID and problem index from a Codeforces problem URL.
 * @returns {void}
*/

// Maps to store various submission-related IDs and data
let sub_id_cod = new Map();          // Stores submission IDs mapped to specific keys
let sub_id_cod_memo = new Map();     // Memoization for submission IDs
let sub_id_cod_memo2 = new Map();    // Secondary memoization storage
let sub_id_cod2_memo = new Map();    // Another memoization storage for IDs
let submission_id_memo = new Array(500000).fill(0);  // Array to track submission IDs for onClick events

// User submission tracking variables
let targetX, targetY = 0;          // Coordinates for user submission tracking
let user_point_memo;               // Stores the user's memory consumption
const user_point_memo_xpath = '//*[@id="pageContent"]/div[2]/div[6]/table/tbody/tr[2]/td[7]';
const user_point_memo_result = document.evaluate(user_point_memo_xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
let user_point_memo_text = user_point_memo_result.singleNodeValue;  // Extracted memory usage of user's submission

// Extract the time consumed by the user’s submission
const time_user_xpath = '//*[@id="pageContent"]/div[2]/div[6]/table/tbody/tr[2]/td[6]';
const result3 = document.evaluate(time_user_xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
const targetElement3 = result3.singleNodeValue;  // DOM element containing the time taken by the user's submission

// Variables to track submission comparison results
let more_than = 0, less_than = 0, total_subimssions;
let more_than_user_memo = -1, total_subimssions_memory = -1; 

// Extract the submission ID from the page
const sub_id_xpath = '//*[@id="pageContent"]/div[2]/div[6]/table/tbody/tr[2]/td[1]';
const result2 = document.evaluate(sub_id_xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
const targetElement2 = result2.singleNodeValue;  // Extracted submission ID



// contest id 
let contestID, problemIndex;

// Call the function to start the process
if (window.location.href.match(/^https:\/\/codeforces\.com\/contest\/\d+\/submission\/\d+$/)) {
    // check is login user sub or not 
    const xpath_username ='//*[@id="header"]/div[2]/div[2]/a[1]'
    const username_res = document.evaluate(xpath_username, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const username_login = username_res.singleNodeValue;

    const xpath_username_sub ='//*[@id="pageContent"]/div[2]/div[6]/table/tbody/tr[2]/td[2]/a'
    const username_sub_res = document.evaluate(xpath_username_sub, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const username_sub = username_sub_res.singleNodeValue;

    const xpath_is_accepted = '//*[@id="pageContent"]/div[2]/div[6]/table/tbody/tr[2]/td[5]/span'
    const is_accepted_res = document.evaluate(xpath_is_accepted, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const is_accepted = is_accepted_res.singleNodeValue;

    if(username_sub.textContent==username_login.textContent && is_accepted.textContent=="Accepted"){
        extractContestAndProblem();
    }
}
else{
    console.log("Not a submission page");
}


function extractContestAndProblem() {
    const xpath = '//*[@id="pageContent"]/div[2]/div[6]/table/tbody/tr[2]/td[3]/a';
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    let contest_problem;
    
    // Check if the element exists
    if (result.singleNodeValue) {
        const element = result.singleNodeValue;
        const href = element.getAttribute('href'); // Get the href attribute
        contest_problem = "https://codeforces.com" + href;
    } else {
        console.error("Element not found for the given XPath.");
        return;
    }
    
    const parsedUrl = new URL(contest_problem);
    const pathParts = parsedUrl.pathname.split('/');
    
    // Determine the URL pattern and extract the contest ID and problem index
    if (pathParts.includes("problemset")) {
        // For URLs like: https://codeforces.com/problemset/problem/{contestID}/{problemIndex}
        contestID = pathParts[3];
        problemIndex = pathParts[4];
    } else if (pathParts.includes("contest")) {
        // For URLs like: https://codeforces.com/contest/{contestID}/problem/{problemIndex}
        contestID = pathParts[2];
        problemIndex = pathParts[4];
    }
    
    // Call API to fetch submissions data and process it
    fetchSubmissionsData(contestID, problemIndex);
}




async function fetchSubmissionsData(contestID, problemIndex) {
    const apiUrl1 = `https://codeforces.com/api/contest.status?contestId=${contestID}&from=1&count=50000`;
    const apiUrl2 = `https://codeforces.com/api/contest.status?contestId=${contestID}&from=50001&count=100000`;
    
    // Find the target element using XPath
    const xpath = '//*[@id="pageContent"]/div[2]';
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const targetElement = result.singleNodeValue;

    if (!targetElement) {
        console.error('Element with XPath ' + xpath + ' not found.');
        return;
    }

    // Create a modern loading animation
    const loadingElement = document.createElement('div');
    loadingElement.id = 'loading-container';
    loadingElement.innerHTML = `
    
        <div class="loading-animation">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
        </div>
        <p class="loading-text">Analyzing your submissions...</p>
    `;

    // Append CSS styles dynamically
    const style = document.createElement('style');
    style.innerHTML = `
        #loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100px;
            background: #f4f4f4;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
        }

        .loading-animation {
            display: flex;
            gap: 5px;
        }

        .dot {
            width: 12px;
            height: 12px;
            background-color: #007bff;
            border-radius: 50%;
            animation: bounce 1.5s infinite ease-in-out;
        }

        .dot:nth-child(2) {
            animation-delay: 0.2s;
        }

        .dot:nth-child(3) {
            animation-delay: 0.4s;
        }

        @keyframes bounce {
            0%, 80%, 100% {
                transform: scale(0);
            }
            40% {
                transform: scale(1);
            }
        }

        .loading-text {
            margin-top: 10px;
            font-size: 16px;
            color: #333;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);

    targetElement.appendChild(loadingElement);

    try {
        const [response1, response2] = await Promise.all([fetch(apiUrl1), fetch(apiUrl2)]);
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
// Maps for submission ID tracking
let submission_id_code = new Map();  
let submission_id_code_memp = new Map();
let sub_id_cod2 = new Map();

// Arrays to store time and memory-related data
let time_consumed = new Uint16Array(500); // Uses less memory than Array(500).fill(0)
let time_consumed_without_0 = []; // Dynamically store only non-zero values
let time_limit = [];  // X-axis time labels
let memory_limit = []; // X-axis memory labels

// Submission ID storage
let submission_id = new Uint32Array(500); // More efficient than Array(500).fill(0)
let submission_id_without_0 = new Uint32Array(500);

// Store height of bars relative to max submissions in a time slot
let relative_to_max = new Float32Array(500);
let relative_to_max_without_0 = new Float32Array(500);

// Track indices of non-zero submission IDs
let index_of_non_zero = [];

// Store memory consumption per submission
let store_memory = new Map();

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

        // Add header
        // newElement.innerHTML = `<strong>Contest ID:</strong> ${contestID} | <strong>Problem Index:</strong> ${problemIndex}<br><br>`;

        // Filter submissions to only include those with an OK verdict
        const okSubmissions = submissions.filter(submission => submission.verdict === "OK");

        //total submissions
        total_subimssions = okSubmissions.length;
        total_subimssions_memory= okSubmissions.length; 
        // Display time and memory for each OK submission
        let time_user = targetElement3.textContent.trim().substring(0,4);
        okSubmissions.forEach(submission => {

            if(parseInt(submission.memoryConsumedBytes/1000) > parseInt(user_point_memo_text.textContent)){
                more_than_user_memo++;
            }
            else if(parseInt(submission.memoryConsumedBytes/1000) == parseInt(user_point_memo_text.textContent)){
               total_subimssions_memory--;
            }
            if(parseInt(submission.timeConsumedMillis) > parseInt(time_user)){
                more_than++;
            }
            else if(parseInt(submission.timeConsumedMillis) < parseInt(time_user)){
                less_than++;
            }
            else{
                total_subimssions--;
            }
            let memory = submission.memoryConsumedBytes/1000;
            // If the memory value already exists in the map, increment its count
            if (store_memory.has(parseInt(memory/100))) {
                store_memory.set(parseInt(memory/100), store_memory.get(parseInt(memory/100)) + 1);
            }
            // Otherwise, add it to the map with a count of 1
            else {
                store_memory.set(parseInt(memory/100), 1);
            }
            if (submission.id == targetElement2.textContent) {
                user_point_memo =submission.memoryConsumedBytes/1000;
                locate_time=submission.timeConsumedMillis;
                bar_number = Math.floor(submission.timeConsumedMillis / 10);
                targetX=(Math.floor(submission.timeConsumedMillis / 10))*10;
            } 

            time_consumed[Math.floor(submission.timeConsumedMillis / 10)] += 1; // Use Math.floor to ensure correct indexing
            
            if(submission_id[Math.floor(submission.timeConsumedMillis / 10)] == 0) {
                submission_id[Math.floor(submission.timeConsumedMillis / 10)] = submission.id;
                sub_id_cod[submission.timeConsumedMillis]=submission.id;
                sub_id_cod2[Math.floor(submission.timeConsumedMillis / 10)]=submission.timeConsumedMillis;
            }
            else{
                let time_temp=submission.timeConsumedMillis;
                let temp2 = sub_id_cod2[Math.floor(submission.timeConsumedMillis / 10)];
                if(Number(time_temp)<Number(temp2)){
                    submission_id[Math.floor(submission.timeConsumedMillis / 10)] = submission.id;
                    sub_id_cod[submission.timeConsumedMillis]=submission.id;
                    sub_id_cod2[Math.floor(submission.timeConsumedMillis / 10)]=submission.timeConsumedMillis;
                }
            }
            if (submission_id_memo[Math.floor(submission.memoryConsumedBytes / 100000)*100] == 0) {
                submission_id_memo[Math.floor(submission.memoryConsumedBytes / 100000)*100] = submission.id;
                sub_id_cod_memo[submission.memoryConsumedBytes] = submission.id;
                sub_id_cod2_memo[Math.floor(submission.memoryConsumedBytes / 100000)*100] = submission.memoryConsumedBytes;
            } 
            else {
                let memory_temp = submission.memoryConsumedBytes;
                let temp2_memo = sub_id_cod2_memo[Math.floor(submission.memoryConsumedBytes / 100000)*100];
                if(memory_temp != temp2_memo)
                if (Number(memory_temp) < Number(temp2_memo)) {
                    submission_id_memo[Math.floor(submission.memoryConsumedBytes / 100000)*100] = submission.id;
                    sub_id_cod_memo[submission.memoryConsumedBytes] = submission.id;
                    sub_id_cod2_memo[Math.floor(submission.memoryConsumedBytes / 100000)*100] = submission.memoryConsumedBytes;
                }
            }
            

        });
        
        submission_id_memo.forEach((value , index)=>{
            if(value!=0){
                if(submission_id_code_memp.has(index)){
                    let temp=submission_id_code_memp.get(index);
                    if(Number(value)<Number(temp)){
                        submission_id_code_memp.set(index,value);
                    }
                    
                }
                else{
                    submission_id_code_memp.set(index,value);
                }
                memory_limit.push(index);
            }
        });
        submission_id.forEach((value , index)=>{

            if(value!=0){
                if(submission_id_code.has(index*10)){
                    let temp=submission_id_code.get(index*10);
                    if(Number(value)<Number(temp)){
                        submission_id_code.set(index*10,value);
                    }
                    
                }
                else{
                    submission_id_code.set(index*10,value);
                }
                time_limit.push(index*10);
            }
        });

        time_consumed.forEach((value, index) => {
            max_time=Math.max(max_time,value);
        });
        submission_id.forEach(sub_id);
        function sub_id(value , index){
            relative_to_max[index] = (4*time_consumed[index])/max_time;
        }
        
        targetElement.appendChild(newElement);

        draw_time_graph();
        draw_memory_Graph();
        
    } else {
        console.error("Target element not found.");
    }
    
}



// Store data of all bars for hover effect
const bars = [];

// Create a canvas element
const canvas = document.createElement('canvas');
canvas.width = 1350; // Set canvas width
canvas.height = 500; // Set canvas height

const ctx = canvas.getContext('2d');




function showPopup(mem_limit, time_KB, sub_id) {
    // Remove existing popup if any
    const existingPopup = document.getElementById("graphPopup");
    if (existingPopup) existingPopup.remove();

    // Create the popup container
    const popup = document.createElement("div");
    popup.id = "graphPopup";
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 950px;
        height: 200px;
        background: white;
        border-radius: 10px;
        box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
        padding: 20px;
        font-family: Arial, sans-serif;
        z-index: 1000;
        text-align: center;
    `;



    // Popup content
    popup.innerHTML = `
<div style="
    padding: 1.5em; 
    font-family: Arial, sans-serif; 
    text-align: left;
">
    <h3 style="margin-top: 0;">Sample ${mem_limit} ${time_KB} Code</h3>

    <div style="
        width: 900px;
        height: 120px;
        border: 1px solid #ccc;
        padding: 12px;
        overflow-y: auto; 
        white-space: pre-wrap; 
        background-color: #f9f9f9;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
    ">
        <a href="https://codeforces.com/contest/${contestID}/submission/${sub_id}" 
            target="_blank" 
            style="
                font-size: 16px;
                color: #007bff; 
                text-decoration: none;
                font-weight: bold;
            "
            onmouseover="this.style.color='#0056b3'"
            onmouseout="this.style.color='#007bff'">
            Click here to view the code
        </a>
    </div>

    <button onclick="document.getElementById('graphPopup').remove()" 
        style="
            position: absolute;
            bottom: 190px;
            right: 20px;
            background: #ff4d4d;
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: 0.3s;
            box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
        "
        onmouseover="this.style.background='#cc0000'"
        onmouseout="this.style.background='#ff4d4d'">
        Close
    </button>
</div>
`;


    // Append to body
    document.body.appendChild(popup);
}

function draw_time_graph() {
    // Filter non-zero values from time_consumed
    const timeConsumedFiltered = time_consumed.filter(value => value !== 0);

    // Calculate scaled indices for non-zero values in submission_id
    const nonZeroIndices = submission_id.reduce((indices, value, index) => {
        if (value !== 0) indices.push(index * 10); // Scale index by 10
        return indices;
    }, []);


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
    `;

    // Add a canvas element for the graph
    const canvas = document.createElement("canvas");
    canvas.id = "timeGraph";
    container.appendChild(canvas);

    // Handle click event on graph
    canvas.onclick = function (evt) {
        const points = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
        
        if (points.length) {
            const index = points[0].index;
            const timeLimit = time_limit[index];
            const timeConsumed = timeConsumedFiltered[index];
            const sub_id = submission_id_code.get(timeLimit);
            showPopup(timeLimit, "ms", sub_id);
        }
    };

    // Append container to target element
    targetElement.appendChild(container);

    // Ensure Chart.js is loaded
    if (typeof Chart === "undefined") {
        console.error("Chart.js is not loaded properly.");
        return;
    }

    // Define colors for highlighting bars
    const highlightColor = "rgba(255, 99, 132, 0.8)"; // Red color
    const defaultColor = "rgba(75, 192, 192, 0.2)"; // Default blue color

    // Prepare chart data
    const chartData = {
        labels: time_limit,
        datasets: [
            {
                label: "You",
                data: timeConsumedFiltered,
                backgroundColor: time_limit.map(label => label === targetX ? highlightColor : defaultColor),
                borderColor: time_limit.map(label => label === targetX ? highlightColor : "rgba(75, 192, 192, 1)"),
                borderWidth: 1,
                stack: 'stack0'
            },
            {
                label: "Others",
                data: [],
                backgroundColor: highlightColor,
                borderColor: defaultColor,
                borderWidth: 1,
                stack: 'stack0',
                hidden: false
            }
        ]
    };
    
    // Configure chart options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: { top: 50 }
        },
        scales: {
            x: {
                title: { display: true, text: "Time Limit (ms)" },
                ticks: { autoSkip: true, maxTicksLimit: 10, maxRotation: 0, minRotation: 0 },
                grid: { display: true, drawBorder: false, color: '#e0e0e0' }
            },
            y: {
                beginAtZero: true,
                title: { display: true, text: "No. of Users" },
                ticks: { callback: value => `${value}` },
                grid: { display: true, color: '#e0e0e0' }
            }
        },
        onHover: (event, chartElement) => {
            const target = event.native ? event.native.target : event.target;
            target.style.cursor = chartElement[0] ? 'pointer' : 'default';
        },
        plugins: {
            title: {
                display: true,
                text: "No. of Users vs Time Limit",
                font: { size: 16, weight: 'bold' },
                padding: { top: 10, bottom: 10 }
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
                onClick: null
            },
            tooltip: {
                callbacks: {
                    title: function(tooltipItems) { return `${tooltipItems[0].raw}`; },
                    label: function(tooltipItem) { return [`Time(ms) : ${tooltipItem.label}`]; }
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
            id: 'customTextPlugin',
            afterDraw: (chart) => {
                const ctx = chart.ctx;
                ctx.save();
                ctx.font = "bold 18px Arial";
                ctx.fillStyle = "#333";
                ctx.textAlign = "center";
                ctx.fillText("Submission-Analyzer", 100, 25);

                const boxText = `You beat ${(((more_than * 100) / total_subimssions).toFixed(2))} %`;
                ctx.font = "16px Arial";
                ctx.fillStyle = "#555";
                ctx.textAlign = "center";

                const textWidth = ctx.measureText(boxText).width;
                const boxWidth = textWidth + 20;
                const boxHeight = 30;
                const boxX = (chart.width - boxWidth) / 2;
                const boxY = 40;

                ctx.strokeStyle = "black";
                ctx.lineWidth = 2;
                ctx.strokeRect(10, 50, boxWidth, boxHeight);
                ctx.fillText(boxText, 10 + boxWidth / 2, boxY + boxHeight / 2 + 10);

                ctx.restore();
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
    `;

    // Add a canvas element for the graph
    const canvas = document.createElement("canvas");
    canvas.id = "MemoryGraph";
    container.appendChild(canvas);

    // Handle click event on graph
    canvas.onclick = function (evt) {
        const points = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
        if (points.length) {
            const index = points[0].index;
            const memory_limits = memory_limit[index];
            const mem_id = submission_id_code_memp.get(memory_limits);
            showPopup(memory_limits, "KB", mem_id);
        }
    };

    // Append the container to the target element
    targetElement.appendChild(container);

    // Ensure Chart.js is loaded
    if (typeof Chart === "undefined") {
        console.error("Chart.js is not loaded properly.");
        return;
    }

    const highlightColor = "rgba(255, 99, 132, 0.8)";
    const defaultColor = "rgba(75, 192, 192, 0.2)";

    // Sort and structure memory data
    const sortedData = Array.from(store_memory.entries())
        .map(([key, value]) => ({ label: parseFloat(key * 100), value }))
        .sort((a, b) => a.label - b.label);

    const sortedLabels = sortedData.map(item => item.label.toString());
    const sortedValues = sortedData.map(item => item.value);

    // Prepare chart data
    const chartData = {
        labels: sortedLabels,
        datasets: [
            {
                label: "You",
                data: sortedValues, // Y-axis data
                backgroundColor: Array.from(sortedLabels).map(label =>  
                    label.toString() === (parseInt(user_point_memo/100)*100).toString() ? highlightColor : defaultColor
                ),
                borderColor: Array.from(sortedLabels).map(label => 
                    label.toString() === (parseInt(user_point_memo/100)*100).toString() ? highlightColor : "rgba(75, 192, 192, 1)"
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

    // Configure chart options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 50 } },
        scales: {
            x: {
                title: { display: true, text: "Memory Consumed (KB)" },
                ticks: { autoSkip: true, maxTicksLimit: 10, maxRotation: 0, minRotation: 0 },
                grid: { display: true, drawBorder: false, color: '#e0e0e0' }
            },
            y: {
                beginAtZero: true,
                title: { display: true, text: "No. of Users" },
                ticks: { callback: value => `${value}` },
                grid: { display: true, color: '#e0e0e0' }
            }
        },
        onHover: (event, chartElement) => {
            const target = event.native ? event.native.target : event.target;
            target.style.cursor = chartElement[0] ? 'pointer' : 'default';
        },
        plugins: {
            title: {
                display: true,
                text: "No. of Users Vs Memory Consumed",
                font: { size: 16, weight: 'bold' },
                padding: { top: 10, bottom: 10 }
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
                    title: function(tooltipItems) { return `${tooltipItems[0].raw}`; },
                    label: function(tooltipItem) { return [`Memory(KB) : ${tooltipItem.label}`]; }
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
            id: 'customTextPlugin',
            afterDraw: (chart) => {
                const ctx = chart.ctx;
                ctx.save();

                const boxText = `You beat ${(((Math.max(more_than_user_memo, 0) * 100) / Math.max(total_subimssions_memory, 1)).toFixed(2))} %`;
                ctx.font = "16px Arial";
                ctx.fillStyle = "#555";
                ctx.textAlign = "center";

                const textWidth = ctx.measureText(boxText).width;
                const boxPadding = 10;
                const boxWidth = textWidth + boxPadding * 2;
                const boxHeight = 30;
                const boxX = (chart.width - boxWidth) / 2;
                const boxY = 40;

                ctx.strokeStyle = "black";
                ctx.lineWidth = 2;
                ctx.strokeRect(10, 50, boxWidth, boxHeight);
                ctx.fillText(boxText, 10 + boxWidth / 2, boxY + boxHeight / 2 + 10);
                ctx.restore();
            }
        }]
    });
}




