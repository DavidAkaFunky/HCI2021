// Bakeoff #2 - Seleção de Alvos e Fatores Humanos
// IPM 2020-21, Semestre 2
// Entrega: até dia 7 de Maio às 23h59 através do Fenix
// Bake-off: durante os laboratórios da semana de 3 de Maio

// p5.js reference: https://p5js.org/reference/

// Database (CHANGE THESE!)
const GROUP_NUMBER   = 47;      // Add your group number here as an integer (e.g., 2, 3)
const BAKE_OFF_DAY   = false;  // Set to 'true' before sharing during the simulation and bake-off days

// Target and grid properties (DO NOT CHANGE!)
let PPI, PPCM;
let TARGET_SIZE;
let TARGET_PADDING, MARGIN, LEFT_PADDING, TOP_PADDING;
let continue_button;

// Metrics
let testStartTime, testEndTime;// time between the start and end of one attempt (48 trials)
let hits 			 = 0;      // number of successful selections
let misses 			 = 0;      // number of missed selections (used to calculate accuracy)
let database;                  // Firebase DB  

// Study control parameters
let draw_targets     = false;  // used to control what to show in draw()
let trials 			     = [];     // contains the order of targets that activate in the test
let current_trial    = 0;      // the current trial number (indexes into trials array above)
let attempt          = 0;      // users complete each test twice to account for practice (attemps 0 and 1)
let clicks           = [];
let fitts_IDs        = [];     // add the Fitts ID for each selection here (-1 when there is a miss)
let targets          = [];

// Target class (position and width)
class Target
{
  constructor(x, y, w)
  {
    this.x = x;
    this.y = y;
    this.w = w;
  }
}

// Runs once at the start
function setup()
{
  createCanvas(700, 500);    // window size in px before we go into fullScreen()
  frameRate(60);             // frame rate (DO NOT CHANGE!)
  
  randomizeTrials();         // randomize the trial order at the start of execution
  
  textFont("Arial", 18);     // font size for the majority of the text
  drawUserIDScreen();        // draws the user input screen (student number and display size)
}

// Runs every frame and redraws the screen
function draw()
{
  if (draw_targets)
  {
    // The user is interacting with the 4x4 target grid
    background(color(0,0,0));        // sets background to black
    
    // Print trial count at the top left-corner of the canvas
    fill(color(255,255,255));
    textAlign(LEFT);
    text("Trial " + (current_trial + 1) + " of " + trials.length, 50, 20);

    // Draw all 16 targets
	  for (var i = 0; i < 16; i++) drawTarget(i);
    
    // Draw line
    next_target = getTargetBounds(trials[current_trial]);
    strokeWeight(3);
    stroke(color('white'));
    line(mouseX,mouseY,next_target.x, next_target.y);
    noStroke();
  }
}

function checkValue(value){
  if (value == -2)
    return "---";
  if (value == -1)
    return "MISSED";
  return value;
}

// Print and save results at the end of 48 trials
function printAndSavePerformance()
{
  // DO NOT CHANGE THESE! 
  let accuracy			    = parseFloat(hits * 100) / parseFloat(hits + misses);
  let test_time         = (testEndTime - testStartTime) / 1000;
  let time_per_target   = nf((test_time) / parseFloat(hits + misses), 0, 3);
  let penalty           = constrain((((parseFloat(95) - (parseFloat(hits * 100) / parseFloat(hits + misses))) * 0.2)), 0, 100);
  let target_w_penalty	= nf(((test_time) / parseFloat(hits + misses) + penalty), 0, 3);
  let timestamp         = day() + "/" + month() + "/" + year() + "  " + hour() + ":" + minute() + ":" + second();
  
  background(color(0,0,0));   // clears screen
  fill(color(255,255,255));   // set text fill color to white
  text(timestamp, 10, 20);    // display time on screen (top-left corner)
  
  textAlign(CENTER);
  text("Attempt " + (attempt + 1) + " out of 2 completed!", width/2, 60); 
  text("Hits: " + hits, width/2, 100);
  text("Misses: " + misses, width/2, 120);
  text("Accuracy: " + accuracy + "%", width/2, 140);
  text("Total time taken: " + test_time + "s", width/2, 160);
  text("Average time per target: " + time_per_target + "s", width/2, 180);
  text("Average time for each target (+ penalty): " + target_w_penalty + "s", width/2, 220);
  text("Fitts Index of Performance", width/2, 260);
  // Print Fitts IDS (one per target, -1 if failed selection)
  // 
  fitts_IDs.push(-2);
  for (var i = 0; i < clicks.length - 1; ++i){
    if (clicks[i][2]){
      //let x_dist = targets[i+1][0] - clicks[i][0];
      //let y_dist = targets[i+1][1] - clicks[i][1];
      distancia = dist(targets[i+1][0], targets[i+1][1], clicks[i][0], clicks[i][1]);

      console.log(targets[i+1][0], targets[i+1][1],clicks[i][0], clicks[i][1]);

      value = log((sqrt(distancia)/TARGET_SIZE)+1)/log(2)
      fitts_IDs.push(round(value,3));
    }
    else
      fitts_IDs.push(-1);
  }
  for (var i = 0; i < fitts_IDs.length/2 ; ++i){
    let value1 = checkValue(fitts_IDs[i]);
    let value2 = checkValue(fitts_IDs[fitts_IDs.length/2 + i]);
    text("Target " + (i+1) + ": " + value1 + "                      Target " + (fitts_IDs.length/2 + i + 1) + ": " + value2, width/2, 280 + 20*i);
  }
  // Saves results (DO NOT CHANGE!)
  let attempt_data = 
  {
        project_from:       GROUP_NUMBER,
        assessed_by:        student_ID,
        test_completed_by:  timestamp,
        attempt:            attempt,
        hits:               hits,
        misses:             misses,
        accuracy:           accuracy,
        attempt_duration:   test_time,
        time_per_target:    time_per_target,
        target_w_penalty:   target_w_penalty,
        fitts_IDs:          fitts_IDs
  }
  
  // Send data to DB (DO NOT CHANGE!)
  if (BAKE_OFF_DAY)
  {
    // Access the Firebase DB
    if (attempt === 0)
    {
      firebase.initializeApp(firebaseConfig);
      database = firebase.database();
    }
    
    // Add user performance results
    let db_ref = database.ref('G' + GROUP_NUMBER);
    db_ref.push(attempt_data);
  }
}

// Mouse button was pressed - lets test to see if hit was in the correct target
function mousePressed() 
{
  // Only look for mouse releases during the actual test
  // (i.e., during target selections)
  if (draw_targets)
  {
    // Get the location and size of the target the user should be trying to select
    let target = getTargetBounds(trials[current_trial]);
    let hit = true;   
    
    // Check to see if the mouse cursor is inside the target bounds,
    // increasing either the 'hits' or 'misses' counters
    if (dist(target.x, target.y, mouseX, mouseY) < target.w/2)
      hits++;    
    else{
      hit = false;
      misses++;
    }
    clicks.push([mouseX, mouseY, hit]);
    targets.push([target.x, target.y]);
    current_trial++;                 // Move on to the next trial/target
    
    // Check if the user has completed all 48 trials
    if (current_trial === trials.length)
    {
      testEndTime = millis();
      draw_targets = false;          // Stop showing targets and the user performance results
      printAndSavePerformance();     // Print the user's results on-screen and send these to the DB
      attempt++;                      
      
      // If there's an attempt to go create a button to start this
      if (attempt < 2)
      {
        continue_button = createButton('START 2ND ATTEMPT');
        continue_button.mouseReleased(continueTest);
        continue_button.position(width/2 - continue_button.size().width/2, height/2 - continue_button.size().height/2);
      }
    } 
  }
}

// Draw target on-screen
function drawTarget(i)
{
  // Get the location and size for target (i)
  let target = getTargetBounds(i);             
  let same_target = false;

  // Check whether this target is the target the user should be trying to select
  if (trials[current_trial] === i)
    if (trials[current_trial] === trials[current_trial + 1])
      same_target = true;
    else
      fill(color(0,255,0));

  else if (trials[current_trial + 1] === i){
    fill(color(0,0,255));
  }

  else
    fill(color(119,119,119));     // Delta-E = 50.0344 (118 doesn't work)

  if (same_target){
    fill(color(0,0,255));
    circle(target.x, target.y, target.w);
    fill(color(0,255,0));
    circle(target.x, target.y, 2*target.w/3);
  }
  else{
    circle(target.x, target.y, target.w);
  }
}

// Returns the location and size of a given target
function getTargetBounds(i)
{
  var x = parseInt(LEFT_PADDING) + parseInt((i % 4) * (TARGET_SIZE + TARGET_PADDING) + MARGIN);
  var y = parseInt(TOP_PADDING) + parseInt(Math.floor(i / 4) * (TARGET_SIZE + TARGET_PADDING) + MARGIN);

  return new Target(x, y, TARGET_SIZE);
}

// Evoked after the user starts its second (and last) attempt
function continueTest()
{
  // Re-randomize the trial order
  shuffle(trials, true);
  current_trial = 0;
  print("trial order: " + trials);
  
  // Resets performance variables
  hits = 0;
  misses = 0;
  fitts_IDs = [];
  clicks = [];
  targets = [];
  
  continue_button.remove();
  
  // Shows the targets again
  draw_targets = true;
  testStartTime = millis();  
}

// Is invoked when the canvas is resized (e.g., when we go fullscreen)
function windowResized() 
{
  resizeCanvas(windowWidth, windowHeight);
    
  let display    = new Display({ diagonal: display_size }, window.screen);

  // DO NOT CHANGE THESE!
  PPI            = display.ppi;                        // calculates pixels per inch
  PPCM           = PPI / 2.54;                         // calculates pixels per cm
  TARGET_SIZE    = 1.5 * PPCM;                         // sets the target size in cm, i.e, 1.5cm
  TARGET_PADDING = 1.5 * PPCM;                         // sets the padding around the targets in cm
  MARGIN         = 1.5 * PPCM;                         // sets the margin around the targets in cm

  // Sets the margin of the grid of targets to the left of the canvas (DO NOT CHANGE!)
  LEFT_PADDING   = width/2 - TARGET_SIZE - 1.5 * TARGET_PADDING - 1.5 * MARGIN;        
  
  // Sets the margin of the grid of targets to the top of the canvas (DO NOT CHANGE!)
  TOP_PADDING    = height/2 - TARGET_SIZE - 1.5 * TARGET_PADDING - 1.5 * MARGIN;
  
  // Starts drawing targets immediately after we go fullscreen
  draw_targets = true;
}