/**
 * Extract the contest ID and problem index from a Codeforces problem URL.
 * @returns {void}
*/
const sub_id_xpath= '//*[@id="pageContent"]/div[2]/div[6]/table/tbody/tr[2]/td[1]';
const result2 = document.evaluate(sub_id_xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
const targetElement2 = result2.singleNodeValue;
console.log(targetElement2.textContent);


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
    const apiUrl = `https://codeforces.com/api/contest.status?contestId=${contestID}&asManager=false&from=1&count=100000`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Check if the response is successful
        if (data.status !== "OK") {
            console.error("Failed to fetch data from Codeforces API");
            return;
        }

        // Filter submissions that match the given problemIndex
        const matchingSubmissions = data.result.filter(
            submission => submission.problem.index === problemIndex
        );

        // If no matching submissions are found
        if (matchingSubmissions.length === 0) {
            console.log("Problem not found");
            console.log(matchingSubmissions);
            return;
        }

        // Filter for OK verdicts among the matching submissions
        const okSubmissions = matchingSubmissions.filter(
            submission => submission.verdict === "OK"
        );

        // Display details for OK submissions
        displayOkSubmissionDetails(okSubmissions, contestID, problemIndex);
    } catch (error) {
        console.error("Error fetching submission data:", error);
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
let time_consumed = new Array(250).fill(0);  // For time consumed (mod 10)
let time_consumed_without_0 = new Array();
//store the maximum number of submissions with same time
let submission_id = new Array(250).fill(0);  // For submission id (mod 10)
let submission_id_without_0 = new Array(250).fill(0);
//store the height of each bar relative to the maximum number of submissions with same time
let relative_to_max = new Array(250).fill(0);
let relative_to_max_without_0 = new Array(250).fill(0);
// contain all non zero value's index of submission_id
let index_of_non_zero = new Array();

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
        newElement.innerHTML = `<strong>Contest ID:</strong> ${contestID} | <strong>Problem Index:</strong> ${problemIndex}<br><br>`;

        // Filter submissions to only include those with an OK verdict
        const okSubmissions = submissions.filter(submission => submission.verdict === "OK");

        // Display time and memory for each OK submission
        let submissionDetails = "<strong>Successful Submissions (OK Verdict):</strong><br>";
        okSubmissions.forEach(submission => {
            
            // submissionDetails += `Submission ID: ${submission.id} | 
            //     Time Consumed: ${submission.timeConsumedMillis} ms | 
            //     Memory Consumed: ${(submission.memoryConsumedBytes)}<br>`;

                if (submission.id == targetElement2.textContent) {
                    // console.log("Matching submission found:");
                    // console.log("Submission ID:", submission.id);
                    console.log("Time Consumed (ms):", submission.timeConsumedMillis);
                    locate_time=submission.timeConsumedMillis;
                    bar_number = Math.floor(submission.timeConsumedMillis / 10);
                    console.log(bar_number);
                } 
                // console.log("Matching submission found:");
                // console.log("Submission ID:", submission.id);
                // console.log("Time Consumed (ms):", submission.timeConsumedMillis);
                
            // Increment counts in time_consumed and map2 based on mod 10
            time_consumed[Math.floor(submission.timeConsumedMillis / 10)] += 1; // Use Math.floor to ensure correct indexing
            // map2[Math.floor(submission.memoryConsumedBytes / 10)] += 1; // Same here
            if(submission_id[Math.floor(submission.timeConsumedMillis / 10)] == 0) {
                submission_id[Math.floor(submission.timeConsumedMillis / 10)] = submission.id;
            }
        });

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
        submissionDetails += "<br>";
        submission_id.forEach(sub_id);
        function sub_id(value , index){
            relative_to_max[index] = (4*time_consumed[index])/max_time;
            // submissionDetails += `Submission ID Mod ${index}: ${value} : ${relative_to_max[index]}<br>`;
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

        if (okSubmissions.length === 0) {
            submissionDetails = "<strong>No successful submissions (OK verdict) found.</strong><br>";
        }

        newElement.innerHTML += submissionDetails;

        // Append the new element to the target element
        targetElement.appendChild(newElement);

        // Add count of successful submissions
        const countElement = document.createElement('div');
        countElement.style.fontSize = '16px';
        countElement.style.fontWeight = 'bold';
        countElement.style.color = '#007bff';
        countElement.style.marginTop = '10px';
        countElement.innerHTML = `<strong>Total Successful Submissions (OK verdict):</strong> ${okSubmissions.length}`;
        targetElement.appendChild(countElement);
        draw_graph();
        
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

let photox,photoy;

function draw_graph() {
    // Filter non-zero values from submission_id and relative_to_max
    const relative_to_max_without_0 = relative_to_max.filter(value => value !== 0);
    time_consumed_without_0 = time_consumed.filter(value => value !== 0);
    const index_of_non_zero = [];
    submission_id.forEach((value, index) => {
        if (value !== 0) {
            index_of_non_zero.push(index * 10); // Store the corresponding index (scaled by 10)
        }
    });

    if (index_of_non_zero.length === 0 || relative_to_max_without_0.length === 0) {
        console.error("No valid data to draw the graph.");
        return;
    }
    

    const xpath = '//*[@id="pageContent"]/div[2]';
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);

    const targetElement = result.singleNodeValue;

    if (!targetElement) {
        console.error('Element with XPath ' + xpath + ' not found.');
        return;
    }

    // Append the canvas to the found element
    targetElement.appendChild(canvas);

    // Graph parameters
    const barWidth = 15; // Width of each bar
    const barSpacing = 5; // Space between bars
    const maxBarHeight = 350; // Maximum height of bars
    const xOffset = 50; // Offset for the graph to start
    const yOffset = 450; // Y-offset for the baseline of the graph
    const maxValue = Math.max(...relative_to_max_without_0); // Find the maximum value for scaling

    // Draw bars
    

    loop1:
    for (let index = 0; index < relative_to_max_without_0.length; index++) {
        const value = relative_to_max_without_0[index];
        const barHeight = (value / maxValue) * maxBarHeight; // Scale the bar height
        // Set minimum bar height to 5 pixels
        const finalBarHeight = barHeight < 5 ? 5 : barHeight;

        const x = xOffset + index * (barWidth + barSpacing); // X-coordinate for the bar
        const y = yOffset - finalBarHeight; // Y-coordinate (top of the bar)

        bars.push({
            x: x,
            y: y,
            width: barWidth,
            height: finalBarHeight,
            index: index // Storing index of the bar for reference
        });

        // Set bar color
        ctx.fillStyle = 'rgba(54, 162, 235, 0.8)';
        ctx.fillRect(x, y, barWidth, finalBarHeight); // Draw the bar

        // Draw the submission ID or labels on the x-axis
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        
        // if(index_of_non_zero[index]==(parseInt((locate_time)/10))*10){
        //     photox= x + barWidth / 2;
        //     //     // photoy=yOffset + 15;
        // }
        // console.log((parseInt((locate_time)/10))*10);
        // // for (let index = 0; index < index_of_non_zero.length; index++) {
        // //     console.log(index_of_non_zero[index]);
            
        // }
        // Check if current index is divisible by 100
        if (index_of_non_zero[index] % 100 === 0) {
            ctx.fillText(index_of_non_zero[index], x + barWidth / 2, yOffset + 15); // X is centered on the bar
            continue; // Skip to the next iteration
        }
        if(index == index_of_non_zero.length - 1){
            ctx.fillText(index_of_non_zero[index], x + barWidth / 2, yOffset + 15); // X is centered on the bar
        }
        // Safeguard to avoid accessing undefined values at the end of the array
        if (index < index_of_non_zero.length - 1) {
            if (index_of_non_zero[index + 1] % 100 === 0) {
                // ctx.fillText(index_of_non_zero[index], x + barWidth / 2, yOffset + 15); // X is centered on the bar
                continue; // Skip to the next iteration
            }
            const current = Math.floor(index_of_non_zero[index] / 100);
            const next = Math.floor(index_of_non_zero[index + 1] / 100);

            // Only add a new label if there's a gap in 100s
            if (current !== next) {
                ctx.fillText((current + 1) * 100, x + barWidth / 2, yOffset + 15);
            }
        }
    }
    //finding location of photo

    // console.log('barheight'+bars[bar_number-1].height);
    // bars.forEach(height => {
    //     console.log(height);
    // });
    // console.log("bar_height" + bar_number-1);
    photox=bars[bar_number-1].x+barWidth/2;
    // photoy=bars[bar_number-1].y+bars[bar_number-1].height-100;
    photoy=450-bars[bar_number-1].height-80;
    console.log("barheight "+ photoy);
    // Draw the Y-axis
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xOffset - 10, yOffset - maxBarHeight-50); // Top of the Y-axis
    ctx.lineTo(xOffset - 10, yOffset); // Bottom of the Y-axis
    ctx.stroke();

    // Draw the X-axis
    ctx.beginPath();
    ctx.moveTo(xOffset - 10, yOffset); // Left of the X-axis
    ctx.lineTo(xOffset + (relative_to_max_without_0.length * (barWidth + barSpacing)), yOffset); // Right of the X-axis
    ctx.stroke();

    // Add labels to the Y-axis
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= maxValue; i += Math.ceil(maxValue / 10)) {
        const y = yOffset - (i / maxValue) * maxBarHeight;
        ctx.fillText(i, xOffset - 15, y + 5);
    }

    // Print multiples of 100 on the X-axis
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    let lastHoveredBarIndex = -1; // Keep track of the last hovered bar
    
    displayPhoto();
    canvas.addEventListener('mousemove', (event) => {
        const mouseX = event.offsetX; // X position of mouse relative to canvas
        const mouseY = event.offsetY; // Y position of mouse relative to canvas
    
        let hoveredBarIndex = -1; // Initialize no hovered bar
    
        // Loop through the bars to check if the mouse is inside any bar
        bars.forEach((bar, index) => {
            if (
                mouseX >= bar.x && // Check left boundary
                mouseX <= bar.x + bar.width && // Check right boundary
                mouseY >= bar.y && // Check top boundary
                mouseY <= bar.y + bar.height // Check bottom boundary
            ) {
                hoveredBarIndex = index; // Store the index of the hovered bar
            }
        });
    
        const ctx = canvas.getContext('2d');
    
        if (hoveredBarIndex !== lastHoveredBarIndex) {
            // Clear the last hovered bar if it exists
            if (lastHoveredBarIndex !== -1) {
                const lastBar = bars[lastHoveredBarIndex];
                ctx.clearRect(lastBar.x - 1, lastBar.y - 1, lastBar.width + 2, lastBar.height + 2); // Clear the last bar area
                ctx.fillStyle = 'rgba(54, 162, 235, 0.8)'; // Original bar color
                ctx.fillRect(lastBar.x, lastBar.y, lastBar.width, lastBar.height); // Redraw the last bar
                
                ctx.clearRect(lastBar.x -5.2, lastBar.y - 40, 25.7, 20); 

                // Redraw the X-axis portion below this bar
                ctx.fillStyle = '#000'; // X-axis color
                ctx.fillRect(lastBar.x - 1, canvas.height - 51, lastBar.width + 2, 2); // Redraw the X-axis
            }
    
            // Highlight the newly hovered bar
            if (hoveredBarIndex !== -1) {
                const hoveredBar = bars[hoveredBarIndex];
                ctx.clearRect(hoveredBar.x - 1, hoveredBar.y - 1, hoveredBar.width + 2, hoveredBar.height + 2); // Clear the bar area
                ctx.fillStyle = 'rgba(255, 99, 132, 0.8)'; // Highlight color
                ctx.fillRect(hoveredBar.x, hoveredBar.y, hoveredBar.width, hoveredBar.height); // Redraw the hovered bar
    
                // Redraw the X-axis portion below this bar
                ctx.fillStyle = '#000'; // X-axis color
                ctx.fillRect(hoveredBar.x - 1, canvas.height - 51, hoveredBar.width + 2, 2); // Redraw the X-axis
                // let text_print=((hoveredBar.height/100)*max_time)/4;
                console.log(hoveredBar.height/100);    
                ctx.fillText(time_consumed_without_0[hoveredBarIndex], hoveredBar.x+8,hoveredBar.y-30)
            }
    
            // Update the last hovered bar index
            lastHoveredBarIndex = hoveredBarIndex;
        }
        
    });
    
}


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


