// Bakeoff #3 - Escrita em Smartwatches
// IPM 2020-21, Semestre 2
// Entrega: até dia 4 de Junho às 23h59 através do Fenix
// Bake-off: durante os laboratórios da semana de 31 de Maio

// p5.js reference: https://p5js.org/reference/

// Database (CHANGE THESE!)
const GROUP_NUMBER   = 47;      // add your group number here as an integer (e.g., 2, 3)
const BAKE_OFF_DAY   = false;  // set to 'true' before sharing during the simulation and bake-off days

let PPI, PPCM;                 // pixel density (DO NOT CHANGE!)
let second_attempt_button;     // button that starts the second attempt (DO NOT CHANGE!)

// Finger parameters (DO NOT CHANGE!)
let finger_img;                // holds our finger image that simules the 'fat finger' problem
let FINGER_SIZE, FINGER_OFFSET;// finger size and cursor offsett (calculated after entering fullscreen)

// Arm parameters (DO NOT CHANGE!)
let arm_img;                   // holds our arm/watch image
let ARM_LENGTH, ARM_HEIGHT;    // arm size and position (calculated after entering fullscreen)

// Study control parameters (DO NOT CHANGE!)
let draw_finger_arm  = false;  // used to control what to show in draw()
let phrases          = [];     // contains all 501 phrases that can be asked of the user
let current_trial    = 0;      // the current trial out of 2 phrases (indexes into phrases array above)
let attempt          = 0       // the current attempt out of 2 (to account for practice)
let target_phrase    = "";     // the current target phrase
let currently_typed  = "";     // what the user has typed so far
let entered          = new Array(2); // array to store the result of the two trials (i.e., the two phrases entered in one attempt)
let CPS              = 0;      // add the characters per second (CPS) here (once for every attempt)

// Metrics
let attempt_start_time, attempt_end_time; // attemps start and end times (includes both trials)
let trial_end_time;            // the timestamp of when the lastest trial was completed
let letters_entered  = 0;      // running number of letters entered (for final WPM computation)
let letters_expected = 0;      // running number of letters expected (from target phrase)
let errors           = 0;      // a running total of the number of errors (when hitting 'ACCEPT')
let database;                  // Firebase DB

// 2D Keyboard UI
let leftArrow, rightArrow;     // holds the left and right UI images for our basic 2D keyboard   
let ARROW_SIZE;                // UI button size
let current_letter = 'a';      // current char being displayed on our basic 2D keyboard (starts with 'a')

// Main Menu and Sub Menus
let status = 0;
let lines = [[["a","b","c"],["j","k","l"],["s","t","u"]],
             [["d","e","f"],["m","n","o"],["v","w","x"]],
             [["g","h","i"],["p","q","r"],["y","z"]]];
let current_word = "";

// To track CPS
let phrase_size = 0;

// Runs once before the setup() and loads our data (images, phrases)
function preload()
{    
  // Loads simulation images (arm, finger) -- DO NOT CHANGE!
  arm = loadImage("data/arm_watch.png");
  fingerOcclusion = loadImage("data/finger.png");
    
  // Loads the target phrases (DO NOT CHANGE!)
  phrases = loadStrings("data/phrases.txt");
  
  // Loads UI elements for our basic keyboard
  leftArrow = loadImage("data/left.png");
  rightArrow = loadImage("data/right.png");
}

let words;
// Runs once at the start
function setup()
{
  createCanvas(700, 500);   // window size in px before we go into fullScreen()
  frameRate(60);            // frame rate (DO NOT CHANGE!)
  
  // DO NOT CHANGE THESE!
  shuffle(phrases, true);   // randomize the order of the phrases list (N=501)
  target_phrase = phrases[current_trial];

  words = loadStrings('data/count_1w.txt')

  drawUserIDScreen();       // draws the user input screen (student number and display size)
}

function draw()
{ 
  if(draw_finger_arm)
  {
    background(255);           // clear background
    noCursor();                // hides the cursor to simulate the 'fat finger'
    
    drawArmAndWatch();         // draws arm and watch background
    writeTargetAndEntered();   // writes the target and entered phrases above the watch
    drawACCEPT();              // draws the 'ACCEPT' button that submits a phrase and completes a trial
    
    // Draws the non-interactive screen area (4x1cm) -- DO NOT CHANGE SIZE!
    noStroke();
    fill(125);
    rect(width/2 - 2.0*PPCM, height/2 - 2.0*PPCM, 4.0*PPCM, 1.0*PPCM);
    textAlign(CENTER); 
    textFont("Arial", 16);
    fill(0);
    text("NOT INTERACTIVE", width/2, height/2 - 1.3 * PPCM);

    // Draws the touch input area (4x3cm) -- DO NOT CHANGE SIZE!
    stroke(0, 255, 0);
    noFill();
    rect(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM, 4.0*PPCM, 3.0*PPCM);


    //DRAW AREA
    if(status == 0)
    {
      drawMainMenu();
    }
    else
    {
      drawSecondaryMenu(status);
    }
    
    drawFatFinger();        // draws the finger that simulates the 'fat finger' problem
  }
}

function drawMainMenu(){
  noStroke();
  fill(125);
  rect(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM, 4.0*PPCM/3.0, 2.5*PPCM);
  fill(150);
  rect(width/2 - 2.0*PPCM + 4.0*PPCM/3.0, height/2 - 1.0*PPCM, 4.0*PPCM/3.0, 2.5*PPCM);
  fill(175);
  rect(width/2 - 2.0*PPCM + 8.0*PPCM/3.0, height/2 - 1.0*PPCM, 4.0*PPCM/3.0, 2.5*PPCM);

  fill(200);
  rect(width/2 - 2.0*PPCM, height/2 + 1.5*PPCM, 2.0*PPCM, 0.5*PPCM);
  fill(225);
  rect(width/2, height/2 + 1.5*PPCM, 2.0*PPCM, 0.5*PPCM);

  textAlign(CENTER); 
  textFont("Arial", 18);
  fill(0);
  text("a b c", width/2 - 2.0*PPCM + 2.0*PPCM/3.0, height/2 - 1.1*PPCM/3.0);
  text("d e f", width/2 - 2.0*PPCM + 2.0*PPCM/3.0, height/2 + 1.4*PPCM/3.0);
  text("g h i", width/2 - 2.0*PPCM + 2.0*PPCM/3.0, height/2 + 3.9*PPCM/3.0);
  text("j k l", width/2, height/2 - 1.1*PPCM/3.0);
  text("m n o", width/2, height/2 + 1.4*PPCM/3.0);
  text("p q r", width/2, height/2 + 3.9*PPCM/3.0);
  text("s t u", width/2 - 2.0*PPCM + 10.0*PPCM/3.0, height/2 - 1.1*PPCM/3.0);
  text("v w x", width/2 - 2.0*PPCM + 10.0*PPCM/3.0, height/2 + 1.4*PPCM/3.0);
  text("y z", width/2 - 2.0*PPCM + 10.0*PPCM/3.0, height/2 + 3.9*PPCM/3.0);
  text("DEL", width/2 - PPCM, height/2 + 5.9*PPCM/3.0)
  text("SPACE", width/2 + PPCM, height/2 + 5.9*PPCM/3.0)
}

function drawSecondaryMenu(value){
  noStroke();
  for(let i = 0; i<3; ++i){
    for(let j = 0; j<3; ++j){
      fill(125);
      rect(width/2 - 2.0*PPCM + j*4.0*PPCM/3.0, height/2 - 1.0*PPCM + i*2.5*PPCM/3.0, 4.0*PPCM/3.0, 2.5*PPCM/3.0);
      textAlign(CENTER); 
      textFont("Arial", 18);
      fill(0);
      if(lines[i][value-1][j] != null)
        text(lines[i][value-1][j],width/2 - 2.0*PPCM + (j+0.5)*4.0*PPCM/3.0, height/2 + (i*2.5-1.1)*PPCM/3.0);
    }
  }
  textAlign(CENTER); 
  textFont("Arial", 14);
  let symbols = ["BACK", "SPACE", "DEL"];
  for(let j = 0; j<3; ++j){
    fill(150+25*j);
    rect(width/2 - 2.0*PPCM + j*4.0*PPCM/3.0, height/2 - 1.0*PPCM + 7.5*PPCM/3.0, 4.0*PPCM/3.0, 0.5*PPCM);
    fill(0);
    text(symbols[j],width/2 - 2.0*PPCM + (j+0.5)*4.0*PPCM/3.0, height/2 + 5.7*PPCM/3.0);
  }
}

/**
 * PROBLEM: nao podemos por no fim do mousePressed porque ha partes que dao
 * return, solucao kinda wack é por em todos os sitios que faz return
 */
function findSuggestion(){
  let result;
  for (let i in words) {
    if (words[i].startsWith(current_word)) {
      result = words[i];
      break;
    }
  }
  if(typeof result != undefined)
    console.log(result)
}

// Evoked when the mouse button was pressed
function mousePressed()
{
  findSuggestion()
  // Only look for mouse presses during the actual test
  if (draw_finger_arm)
  {                   
    // Check if mouse click happened within the touch input area
    if(mouseClickWithin(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM, 4.0*PPCM, 3.0*PPCM))  
    {    
      // MAIN MENU
      if (status == 0)
      {
        if (mouseClickWithin(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM, 4.0*PPCM/3.0, 2.5*PPCM))
        {
          status = 1;
        }
        else if (mouseClickWithin(width/2 - 2.0*PPCM + 4.0*PPCM/3.0, height/2 - 1.0*PPCM, 4.0*PPCM/3.0, 2.5*PPCM))
        {
          status = 2;
        }
        else if(mouseClickWithin(width/2 - 2.0*PPCM+ 8.0*PPCM/3.0, height/2 - 1.0*PPCM, 4.0*PPCM/3.0, 2.5*PPCM))
        {
          status = 3;
        }
        else if(mouseClickWithin(width/2 - 2.0*PPCM, height/2 + 1.5*PPCM, 2.0*PPCM, 0.5*PPCM))
        {
          currently_typed = currently_typed.substring(0, currently_typed.length - 1);
          current_word = current_word.substring(0, current_word.length - 1);
        }
        else if(mouseClickWithin(width/2, height/2 + 1.5*PPCM, 2.0*PPCM, 0.5*PPCM))
        {
          currently_typed += " ";
          current_word = "";
        }
      }
      else
      {
        for(let i = 0; i<3; ++i){
          for(let j = 0; j<3; ++j){
            if(!(i == 2 && status == 3 & j == 2) && mouseClickWithin(width/2 - 2.0*PPCM + j*4.0*PPCM/3.0, height/2 - 1.0*PPCM + i*2.5*PPCM/3.0, 4.0*PPCM/3.0, 2.5*PPCM/3.0))
            {
              currently_typed += lines[i][status-1][j];
              current_word += lines[i][status-1][j];
              return;
            }
          }
        }
        for(var j = 0; j<3; ++j){
          if(mouseClickWithin(width/2 - 2.0*PPCM + j*4.0*PPCM/3.0, height/2 - 1.0*PPCM + 7.5*PPCM/3.0, 4.0*PPCM/3.0, 0.5*PPCM))
            break;
        }
        if(j==0)
        {
          status = 0;
        }
        else if(j==1)
        {
          currently_typed += " ";
          //Note: user might want to go back to last word
          current_word = "";
        }
        else if(j==2)
        {
          currently_typed = currently_typed.substring(0, currently_typed.length - 1);
          current_word = current_word.substring(0, current_word.length - 1);
        }
      }
    
      /*
      // Check if mouse click was on left arrow (2D keyboard)
      if (mouseClickWithin(width/2 - ARROW_SIZE, height/2, ARROW_SIZE, ARROW_SIZE))
      {
        current_letter = getPreviousChar(current_letter);
        if (current_letter.charCodeAt(0) < '_'.charCodeAt(0)) current_letter = 'z';  // wrap around to z
      }
      // Check if mouse click was on right arrow (2D keyboard)
      else if (mouseClickWithin(width/2, height/2, ARROW_SIZE, ARROW_SIZE))
      {
        current_letter = getNextChar(current_letter);
        if (current_letter.charCodeAt(0) > 'z'.charCodeAt(0)) current_letter = '_'; // wrap back to space (i.e., the underscore)
      }
      else
      {
        // Click in whitespace indicates a character input (2D keyboard)
        if (current_letter == '_') currently_typed += " ";                          // if underscore, consider that a space bar
        else if (current_letter == '`' && currently_typed.length > 0)               // if `, treat that as delete
          currently_typed = currently_typed.substring(0, currently_typed.length - 1);
        else if (current_letter != '`') currently_typed += current_letter;          // if not any of the above cases, add the current letter to the entered phrase
      }
      */
    }
    
    // Check if mouse click happened within 'ACCEPT' 
    // (i.e., submits a phrase and completes a trial)
    else if (mouseClickWithin(width/2 - 2*PPCM, height/2 - 5.1*PPCM, 4.0*PPCM, 2.0*PPCM))
    {
      // Saves metrics for the current trial
      letters_expected += target_phrase.trim().length;
      letters_entered += currently_typed.trim().length;
      errors += computeLevenshteinDistance(currently_typed.trim(), target_phrase.trim());
      entered[current_trial] = currently_typed;
      trial_end_time = millis();
      phrase_size += currently_typed.length;
      current_trial++;

      // Check if the user has one more trial/phrase to go
      if (current_trial < 2)                                           
      {
        // Prepares for new trial
        currently_typed = "";
        current_word = "";
        target_phrase = phrases[current_trial];
      }
      else
      {
        // The user has completed both phrases for one attempt
        draw_finger_arm = false;
        attempt_end_time = millis();
        
        printAndSavePerformance();        // prints the user's results on-screen and sends these to the DB
        attempt++;

        // Check if the user is about to start their second attempt
        if (attempt < 2)
        {
          second_attempt_button = createButton('START 2ND ATTEMPT');
          second_attempt_button.mouseReleased(startSecondAttempt);
          second_attempt_button.position(width/2 - second_attempt_button.size().width/2, height/2 + 200);
        }
      }
    }
  }
}

// Resets variables for second attempt
function startSecondAttempt()
{
  // Re-randomize the trial order (DO NOT CHANGE THESE!)
  shuffle(phrases, true);
  current_trial        = 0;
  target_phrase        = phrases[current_trial];
  phrase_size = 0;

  // Resets performance variables (DO NOT CHANGE THESE!)
  letters_expected     = 0;
  letters_entered      = 0;
  errors               = 0;
  currently_typed      = "";
  CPS                  = 0;
  
  current_letter       = 'a';
  current_word         = "";
  
  // Show the watch and keyboard again
  second_attempt_button.remove();
  draw_finger_arm      = true;
  attempt_start_time   = millis();  
}

// Print and save results at the end of 2 trials
function printAndSavePerformance()
{
  // DO NOT CHANGE THESE
  let attempt_duration = (attempt_end_time - attempt_start_time) / 60000;          // 60K is number of milliseconds in minute
  let wpm              = (letters_entered / 5.0) / attempt_duration;      
  let freebie_errors   = letters_expected * 0.05;                                  // no penalty if errors are under 5% of chars
  let penalty          = max(0, (errors - freebie_errors) / attempt_duration); 
  let wpm_w_penalty    = max((wpm - penalty),0);                                   // minus because higher WPM is better: NET WPM
  let timestamp        = day() + "/" + month() + "/" + year() + "  " + hour() + ":" + minute() + ":" + second();

  //CPS
  let CPS              = phrase_size * 1000 / (attempt_end_time - attempt_start_time);
  
  background(color(0,0,0));    // clears screen
  cursor();                    // shows the cursor again
  
  textFont("Arial", 16);       // sets the font to Arial size 16
  fill(color(255,255,255));    //set text fill color to white
  text(timestamp, 100, 20);    // display time on screen 
  
  text("Finished attempt " + (attempt + 1) + " out of 2!", width / 2, height / 2); 
  
  // For each trial/phrase
  let h = 20;
  for(i = 0; i < 2; i++, h += 40 ) 
  {
    text("Target phrase " + (i+1) + ": " + phrases[i], width / 2, height / 2 + h);
    text("User typed " + (i+1) + ": " + entered[i], width / 2, height / 2 + h+20);
  }
  
  text("Raw WPM: " + wpm.toFixed(2), width / 2, height / 2 + h+20);
  text("Freebie errors: " + freebie_errors.toFixed(2), width / 2, height / 2 + h+40);
  text("Penalty: " + penalty.toFixed(2), width / 2, height / 2 + h+60);
  text("WPM with penalty: " + wpm_w_penalty.toFixed(2), width / 2, height / 2 + h+80);

  //CPS
  text("CPS: " + CPS.toFixed(2), width / 2, height / 2 + h+100);

  // Saves results (DO NOT CHANGE!)
  let attempt_data = 
  {
        project_from:         GROUP_NUMBER,
        assessed_by:          student_ID,
        attempt_completed_by: timestamp,
        attempt:              attempt,
        attempt_duration:     attempt_duration,
        raw_wpm:              wpm,      
        freebie_errors:       freebie_errors,
        penalty:              penalty,
        wpm_w_penalty:        wpm_w_penalty,
        cps:                  CPS
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

// Is invoked when the canvas is resized (e.g., when we go fullscreen)
function windowResized()
{
  resizeCanvas(windowWidth, windowHeight);
  let display    = new Display({ diagonal: display_size }, window.screen);
  
  // DO NO CHANGE THESE!
  PPI           = display.ppi;                        // calculates pixels per inch
  PPCM          = PPI / 2.54;                         // calculates pixels per cm
  FINGER_SIZE   = (int)(11   * PPCM);
  FINGER_OFFSET = (int)(0.8  * PPCM)
  ARM_LENGTH    = (int)(19   * PPCM);
  ARM_HEIGHT    = (int)(11.2 * PPCM);
  
  ARROW_SIZE    = (int)(2.2 * PPCM);
  
  // Starts drawing the watch immediately after we go fullscreen (DO NO CHANGE THIS!)
  draw_finger_arm = true;
  attempt_start_time = millis();
}