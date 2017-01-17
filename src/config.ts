var nomnom = require('nomnom');
var fileUrl = require('file-url');

if(process.env.ELECTRON === true ){
  var electron = require('electron');
}


/**
 * All of the top-level tunable options for the game client.
 */
export interface Config {
  /**
   * The version of the game we're simulating.
   */
  readonly gameVersion: string;

  /**
   * Whether to try to run the game in full-screen
   */
  readonly fullscreen: boolean;

  /**
   * Dimensions of the canvas
   */
  readonly width: number;
  readonly height: number;

  /**
   * Turns per second.
   *
   * (DISTINCT from fps!)
   */
  readonly defaultTPS: number;

  /**
   * The url to listen for websocket data on, if any.
   */
  readonly websocketURL: string | null;

  /**
   * The match file URL to load when we start.
   */
  readonly matchFileURL: string | null;

  /**
   * How often to poll the server via websocket, in ms.
   */
  readonly pollEvery: number;

  /**
   * Whether or not to interpolate between frames.
   */
  interpolate: boolean;

  /**
   * Whether or not to display health bars
   */
  healthBars: boolean;

  /**
   * Whether or not to draw a circle under each robot
   */
  circleBots: boolean;

  /**
   * Whether or not to display indicator dots and lines
   */
  indicators: boolean;

  /**
   * Whether or not to display the sight radius
   */
  sightRadius: boolean;

  /**
   * Whether or not to display the bullet sight radius
   */
  bulletSightRadius: boolean;

  /**
   * The mode the GUI window should show when initialized
   */
  mode: Mode;
}

/**
 * Different modes that determine what is displayed on the client
 */
export enum Mode {
  GAME,
  HELP,
  MAPEDITOR,
  CONSOLE,
  QUEUE
}

/**
 * Determine the configured settings for this execution of the client. Prioritizes configurations in this order:
 * directly supplied configurations, then user supplied paramaters, then sensible default values.
 */
export function defaults(supplied: any): Config {
  console.log('Processing script parameters');

  var scriptParameters: any;

  if(process.env.ELECTRON === true ){
    //load parameters from command line parameters given to electron executable
    scriptParameters = electron.remote.getGlobal('appParameters').params.slice(1);
  }else{
    //load parameters from url parameters of current page
    scriptParameters = window.location.search.substr(1).split('&');
  }

  console.log("Raw parameters: " + JSON.stringify(scriptParameters));

  var parameters: any = nomnom
    .script('Battlecode Client.exe --')
    .option('fullscreen',
    {
        abbr: 'f',
        full: 'fullscreen',
        choices: ['true', 'false'],
        default: false,
        type: 'boolean',
        help: '\n\tWhether to try to run the game in full-screen',
        metavar: '<true or false>'
    })
    .option('width',
    {
        abbr: 'w',
        full: 'width',
        default: 600,
        callback: function(input){verifyPositiveIntString(input, '--width [-w]')},
        type: 'number',
        help: '\n\tThe width dimension of the client window',
        metavar: '<positive-number>'
    })
    .option('height',
    {
        abbr: 'h',
        full: 'height',
        default: 600,
        callback: function(input){verifyPositiveIntString(input, '--height [-h]')},
        type: 'number',
        help: '\n\tThe height dimension of the client window',
        metavar: '<positive-number>'
    })
    .option('circleBots',
    {
        abbr: 'c',
        full: 'circles',
        choices: ['true', 'false'],
        default: false,
        type: 'boolean',
        help: '\n\tWhether or not to draw a circle under each robot',
        metavar: '<true or false>'
    })
    .option('indicators',
    {
        abbr: 'r',
        full: 'indicators',
        choices: ['true', 'false'],
        default: true,
        type: 'boolean',
        help: '\n\tWhether or not to display indicator dots and lines',
        metavar: '<true or false>'
    })
    .option('healthBars',
    {
        abbr: 'b',
        full: 'bars',
        choices: ['true', 'false'],
        default: true,
        type: 'boolean',
        help: '\n\tWhether or not to show the health bars',
        metavar: '<true or false>'
    })
    .option('mode',
    {
        abbr: 'k',
        full: 'mode',
        choices: [ 'GAME', 'HELP', 'MAPEDITOR', 'CONSOLE', 'QUEUE'],
        default: Mode.GAME,
        transform: function(input){ return transformStringToModeEnum(input)},
        type: 'string',
        help: '\n\tWhat mode should the GUI window show when initialized',
        metavar: '<GAME or HELP or MAPEDITOR or CONSOLE or QUEUE>'
    })
    .option('gameVersion',
    {
        abbr: 'v',
        full: 'version',
        default: 'ANY',
        type: 'number',
        help: '\n\tThe version of the game we are simulating',
        metavar: '<version-string>'
    })
    .option('defaultTPS',
    {
        abbr: 't',
        full: 'turns',
        default: 20,
        callback: function(input){verifyPositiveIntString(input, '--turns [-t]')},
        type: 'number',
        help: '\n\tThe number of turns to evaluate per second (not the same as FPS)',
        metavar: '<positive-number>'
    })
    .option('websocketURL',
    {
        abbr: 's',
        full: 'socket',
        default: null,
        callback: function(input){verifyStringIsValidURL(input, '--socket [-s]')},
        type: 'string',
        help: '\n\tThe URL to bind for the websocket used for communication between the server and client',
        metavar: '<url>'
    })
    .option('matchURL',
    {
        abbr: 'm',
        full: 'match',
        default: null,
        callback: function(input){verifyStringIsValidURL(input, '--match [-m]')},
        transform: function(input){ return transformStringFilePathToURL(input)},
        type: 'string',
        help: '\n\tA relative path to a match file which you want opened immediately upon starting (this does not work in the browser!)',
        metavar: '<url>'
    })
    .option('pollEvery',
    {
        abbr: 'p',
        full: 'pollrate',
        default: 500,
        callback: function(input){verifyPositiveIntString(input, '--pollrate [-p]')},
        type: 'number',
        help: '\n\tHow often to poll the server via websocket in ms',
        metavar: '<positive-number>'
    })
    .option('interpolate',
    {
        abbr: 'i',
        full: 'interpolate',
        choices: ['true', 'false'],
        default: true,
        type: 'boolean',
        help: '\n\tWhether or not the client should interpolate between frames',
        metavar: '<true or false>'
    })
    .option('sightRadius',
    {
        abbr: 'g',
        full: 'sight',
        choices: ['true', 'false'],
        default: false,
        type: 'boolean',
        help: '\n\tWhether or not to display the sight radius',
        metavar: '<true or false>'
    })
    .option('bulletSightRadius',
    {
        abbr: 'u',
        full: 'bulletsight',
        choices: ['true', 'false'],
        default: false,
        type: 'boolean',
        help: '\n\tWhether or not to display the bullet sight radius',
        metavar: '<true or false>'
    })
    .printer(function(str, code){printUsageMessage(str,code)})
    .parse(scriptParameters);

    console.log('Refined parameters: '+ JSON.stringify(parameters));

     const defaults: Config =
     {
       gameVersion: <string> suppliedOrParameter(supplied.Gameversion, parameters.gameVersion),
       fullscreen: <boolean> suppliedOrParameter(supplied.fullscreen, parameters.fullscreen),
       width: <number> suppliedOrParameter(supplied.Width, parameters.width),
       height: <number> suppliedOrParameter(supplied.Height, parameters.height),
       defaultTPS: <number> suppliedOrParameter(supplied.Turnspersecond, parameters.defaultTPS),
       websocketURL: <string> suppliedOrParameter(supplied.Socketurl, parameters.websocketURL),
       matchFileURL: <string> suppliedOrParameter(supplied.matchurl, parameters.matchURL),
       pollEvery: <number> suppliedOrParameter(supplied.pollEvery, parameters.pollEvery),
       interpolate: <boolean> suppliedOrParameter(supplied.interpolate, parameters.interpolate),
       healthBars: <boolean> suppliedOrParameter(supplied.healthBars, parameters.healthBars),
       circleBots: <boolean> suppliedOrParameter(supplied.circlebots, parameters.circleBots),
       indicators: <boolean> suppliedOrParameter(supplied.indicators, parameters.indicators),
       sightRadius: <boolean> suppliedOrParameter(supplied.sightRadius, parameters.sightRadius),
       bulletSightRadius: <boolean> suppliedOrParameter(supplied.bulletSightRadius, parameters.bulletSightRadius),
       mode: <Mode> suppliedOrParameter(supplied.Mode, parameters.mode)
      };

     console.log('Usable parameters/defaults: ' + JSON.stringify(defaults));

     return defaults;

}

// Writes the given string to the process output stream and exits the process using the given exit code
// Or if in browser simply writes to console
function printUsageMessage (str: string, code: number) {
   if(process.env.ELECTRON === true ){
    electron.remote.process.stdout.write(str);

    const errorCode: number = code || 0;
    electron.remote.app.exit(errorCode);
   }else{
    console.log(str);
   }
}

// Verifies the given string can be successfully converted into a positive real integer
// If that verification fails it uses the given option identifier to print an error message
function verifyPositiveIntString(input: string, id: string) {
     const inputAsInt: number = parseInt(input);
     if (inputAsInt === NaN || inputAsInt < 1) {
        return id + ' must be a positive number!';
     }
}

// Verifies the given string is a valid URL via a regex
// If that verification fails it uses the given option identifier to print an error message
function verifyStringIsValidURL(input: string, id: string){
    const ValidURL: RegExp = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i;
    if(!ValidURL.test(input)){
      return id + ' must be a valid URL';
    }
}

// Generates a file URL from the given path and returns it. Otherwise, if a failure occurs, this method returns null.
function transformStringFilePathToURL(input: string): string | null{
    const url: string = fileUrl(input);

    console.log("Attempting to use match: path= " + input + " url= " + url );

    if(url){
        return url;
    }
    else {
        return null;
    }
}

// Verifies the given string can be successfully converted into a value of the Mode enum
// If that verification fails it uses the given option identifier to print an error message
function transformStringToModeEnum(input: string){
    return (<any>Mode)[input];
}

// Returns the suppliedValue if it exists, otherwise it returns the user proved parameter value if it exists,
// otherwise it returns a default value for the parameter.
function suppliedOrParameter(suppliedValue: any, parameter: any): any{
    if(suppliedValue){
      return suppliedValue;
    }else{
      return parameter;
    }
}
