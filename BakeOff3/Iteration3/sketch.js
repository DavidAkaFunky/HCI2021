// Bakeoff #3 - Escrita em Smartwatches
// IPM 2020-21, Semestre 2
// Entrega: até dia 4 de Junho às 23h59 através do Fenix
// Bake-off: durante os laboratórios da semana de 31 de Maio

// p5.js reference: https://p5js.org/reference/

// Database (CHANGE THESE!)
const GROUP_NUMBER   = 47;      // add your group number here as an integer (e.g., 2, 3)
const BAKE_OFF_DAY   = true;  // set to 'true' before sharing during the simulation and bake-off days

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
let lines = [["a","b","c"],["d","e","f"],["g","h","i"],["j","k","l",],["m","n","o"],[["p","q"],["r","s"]],["t","u","v"],[["w","x"],["y","z"]]];
let current_word = "";
let result = [];
let letter;

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

  // Autocomplete
  words = loadStrings('data/words.txt')

  // Load Main Menu and Sub M
  mainMenu = loadImage("data/MainMenu.png");
  subMenu1 = loadImage("data/subMenu1.png");
  subMenu2 = loadImage("data/subMenu2.png");
  subMenu3 = loadImage("data/subMenu3.png");
  subMenu4 = loadImage("data/subMenu4.png");
  subMenu5 = loadImage("data/subMenu5.png");
  subMenu6 = loadImage("data/subMenu6.png");
  subMenu7 = loadImage("data/subMenu7.png");
  subMenu8 = loadImage("data/subMenu8.png");

  // Load arm cover
  armCover = loadImage("data/armCover.png");
}

function drawCover()
{
  imageMode(CENTER);
  image(armCover, width/2, height/2, ARM_LENGTH, ARM_HEIGHT);
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

  drawUserIDScreen();       // draws the user input screen (student number and display size)
  findSuggestion();
}

function draw()
{ 
  if(draw_finger_arm)
  {
    background(255);           // clear background
    noCursor();                // hides the cursor to simulate the 'fat finger'
    
    drawArmAndWatch();         // draws arm and watch background

    writeTargetAndEntered();   // writes the target and entered phrases above the watch
    
    // Draws the non-interactive screen area (4x1cm) -- DO NOT CHANGE SIZE!
    noStroke();
    fill(125);
    rect(width/2 - 2.0*PPCM, height/2 - 2.0*PPCM, 4.0*PPCM, 1.0*PPCM);
    //textAlign(CENTER); 
    //textFont("Arial", 16);
    //fill(0);
    //text("NOT INTERACTIVE", width/2, height/2 - 1.3 * PPCM);

    // Draws the touch input area (4x3cm) -- DO NOT CHANGE SIZE!
    stroke(0, 255, 0);
    noFill();
    rect(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM, 4.0*PPCM, 3.0*PPCM);


    //DRAW AREA
    if(status == 0)
      drawMainMenu();
    else
      drawSecondaryMenu(status);
    drawAutoComplete();
    // Cover to prevent words from "leaving" the smartwatch
    drawCover();
    drawACCEPT();              // draws the 'ACCEPT' button that submits a phrase and completes a trial
    drawFatFinger();        // draws the finger that simulates the 'fat finger' problem
  }

}

function drawMainMenu()
{
  imageMode(CENTER);
  image(mainMenu,width/2,height/2,4*PPCM,4*PPCM) 
}

function drawSecondaryMenu(value)
{
  imageMode(CENTER);
  switch(value)
  {
    case 1:
      image(subMenu1,width/2,height/2,4*PPCM,4*PPCM);
      break;
    case 2:
      image(subMenu2,width/2,height/2,4*PPCM,4*PPCM);
      break;
    case 3:
      image(subMenu3,width/2,height/2,4*PPCM,4*PPCM);
      break;
    case 4:
      image(subMenu4,width/2,height/2,4*PPCM,4*PPCM);
      break;
    case 5:
      image(subMenu5,width/2,height/2,4*PPCM,4*PPCM);
      break;
    case 6:
      image(subMenu6,width/2,height/2,4*PPCM,4*PPCM);
      break;
    case 7:
      image(subMenu7,width/2,height/2,4*PPCM,4*PPCM);
      break;
    case 8:
      image(subMenu8,width/2,height/2,4*PPCM,4*PPCM);
      break;
    default:
      console.log("ERROR");
  }
}

/**
 * PROBLEM: nao podemos por no fim do mousePressed porque ha partes que dao
 * return, solucao kinda wack é por em todos os sitios que faz return
 */
function findSuggestion()
{
  let count = 0;
  result = [];
  //if (current_word == "")
  //  return;
  for (let i in words) 
  {
    if (words[i].startsWith(current_word) && words[i] != current_word) 
    {
      result.push(words[i]);
      if((++count) == 2)
        return;
    }
  }
}

function drawAutoComplete(){
  textFont("Arial", 18);
  fill(0);
  if (result.length == 1){
    textAlign(CENTER);
    text(result[0], width/2, height/2 - 1.35 *PPCM);
  }
  else if (result.length == 2){
    textAlign(LEFT);
    text(result[0], width/2 - 1.7 * PPCM, height/2 - 1.6 * PPCM);
    textAlign(RIGHT);
    text(result[1], width/2 + 1.7 * PPCM, height/2 - 1.1 * PPCM);
  }
}

// Evoked when the mouse button was pressed
function mousePressed()
{
  // Only look for mouse presses during the actual test
  if (draw_finger_arm)
  {                   
    // Check if mouse click happened within the touch input area
    if(mouseClickWithin(width/2 - 2.0*PPCM, height/2 - PPCM, 4.0*PPCM, 3.0*PPCM))  
    {
      if(mouseClickWithin(width/2 + PPCM, height/2 - PPCM, PPCM, PPCM))
      {
        currently_typed = currently_typed.substring(0, currently_typed.length - 1);
        if(current_word != "")
          current_word = current_word.substring(0, current_word.length - 1);
        else
        {
          previous_word = split(currently_typed," ");
          current_word = previous_word[previous_word.length-1];
        }
        findSuggestion();
      }
      else if(mouseClickWithin(width/2 + PPCM, height/2, PPCM, PPCM))
      {
        currently_typed += " ";
        current_word = "";
        findSuggestion();
      }
      // MAIN MENU
      else{
        if(result.length == 1 && mouseClickWithin(width/2, height/2 + PPCM, 2*PPCM, PPCM))
          {
            currently_typed = currently_typed.substring(0,currently_typed.length-current_word.length);
            currently_typed += result[0] + " ";
            current_word = "";
            result = [];
            status = 0;
            findSuggestion();
            return;
          }
        else if (result.length == 2)
          for(let i = 0; i < 2; ++i)
            if(mouseClickWithin(width/2 + i*PPCM, height/2 + PPCM, PPCM, PPCM))
            {
              currently_typed = currently_typed.substring(0,currently_typed.length-current_word.length);
              currently_typed += result[i] + " ";
              current_word = "";
              result = [];
              status = 0;
              findSuggestion();
              return;
            }
        switch(status){
          case 0:
            if (mouseClickWithin(width/2 - 2*PPCM, height/2 - PPCM, PPCM, PPCM))
              status = 1;
            else if(mouseClickWithin(width/2 - PPCM, height/2 - PPCM, PPCM, PPCM))
              status = 2;
            else if(mouseClickWithin(width/2, height/2 - PPCM, PPCM, PPCM))
              status = 3;
            else if (mouseClickWithin(width/2 - 2*PPCM, height/2, PPCM, PPCM))
              status = 4;
            else if(mouseClickWithin(width/2 - PPCM, height/2, PPCM, PPCM))
              status = 5;
            else if(mouseClickWithin(width/2, height/2, PPCM, PPCM))
              status = 6;
            else if (mouseClickWithin(width/2 - 2*PPCM, height/2 + PPCM, PPCM, PPCM))
              status = 7;
            else if(mouseClickWithin(width/2 - PPCM, height/2 + PPCM, PPCM, PPCM))
              status = 8;
            break;
  
          case 1: case 2: case 3: case 4: case 5: case 7:
            if (mouseClickWithin(width/2 - 2*PPCM, height/2 + PPCM, 2*PPCM, PPCM)){
              status = 0;
              return;
            }
            for(let i = 0; i<3; ++i)
              if(mouseClickWithin(width/2 - (2-i)*PPCM, height/2 - PPCM, PPCM, 2*PPCM))
              {
                letter = lines[status-1][i];
                currently_typed += letter;
                current_word += letter;
                findSuggestion();
                status = 0;
                return;
              }
            break;
          case 6: case 8:
            if (mouseClickWithin(width/2 - 2*PPCM, height/2 + PPCM, 2*PPCM, PPCM)){
              status = 0;
              return;
            }
            for(let i = 0; i<2; ++i)
              for(let j = 0; j<2; ++j)
                if(mouseClickWithin(width/2 - (2-j*1.5)*PPCM, height/2 - (1-i)*PPCM, 1.5*PPCM, PPCM))
                {
                  letter = lines[status-1][i][j];
                  currently_typed += letter;
                  current_word += letter;
                  findSuggestion();
                  status = 0;
                  return;
                }
            break;
          default:
            console.log("ERROR");
        }
      }
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
  result               = [];
  
  // Show the watch and keyboard again
  findSuggestion();
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