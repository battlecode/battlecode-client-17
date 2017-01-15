// This is the electron 'main' file.
// All it does is launch a pseudo-browser that runs battlecode.

const electron = require('electron');
const {BrowserWindow} = require('electron');
const {ipcMain} = require('electron');
const path = require('path');
const url = require('url');


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow;

//define global variables that can be accessed in all contexts
global.appWindow = mainWindow;
global.appParameters = {params: process.argv};


initApp();


//Setup the application, including the event listeners that trigger the creation of the GUI
function initApp() {

    //Place any electron methods that need to be executed before the ready event here:
    // for example: electron.app.disableHardwareAcceleration();


    //Place electron app events here:

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    electron.app.on('ready', createWindow);

    // Quit when all windows are closed.
    electron.app.on('window-all-closed', () => {
      // On OS X it is common for applications and their menu bar
      // to stay active until the user quits explicitly with Cmd + Q
      if (process.platform !== 'darwin') {
        electron.app.quit();
      }
    });

    electron.app.on('activate', () => {
      // On OS X it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) {
        createWindow();
      }
    });
}

// Sets up and initializes the BrowserWindow used for displaying the content
function createWindow () {

  // Create the browser window but don't show it to the user yet
  mainWindow = new BrowserWindow({width: 1600, height: 1000, show: false, defaultEncoding: 'UTF-8'});
 //blinkFeatures: 'ExperimentalV8Extras,HeapCompaction,LazyParseCSS,SlimmingPaintV2,SlimmingPaintStrictCullRectClipping,PassPaintVisualRectToCompositor,CompositorWorker,CSSInBodyDoesNotBlockPaint'
  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true,
    options: {
      title: 'Battlecode 2017'
    }
  }));

  // Tells chromium to render the webpage content 60 times a second
  // This is not to be confused with the renderer FPS which is handled independently
  mainWindow.webContents.setFrameRate(60);

  // Register the event listeners for mainWindow that render and show it to the user
  registerEventListenersForMainWindow();

  // Tell the main context to start listening for renderer request events
  registerEventListenersForRendererRequestEvents();
}

// Registers the event listeners that activate upon the MainWindow DOM loading completion (aka, the HTML has finished
// being loaded). The event listeners begin the window render, and then show the window to the user upon the completion
// of that render.
function registerEventListenersForMainWindow(){

      //Wait for the window render to finish before showing the window to the user
      mainWindow.once('ready-to-show', function () {
        // And then triggers the show
        mainWindow.show();
      });

      // Wait for the window to be shown before starting the match
      mainWindow.once('show', function () {
          mainWindow.webContents.send('client-ready', 'true');

          // Open the DevTools.
          //mainWindow.webContents.openDevTools();
      });

      // Emitted when the window is closed.
      mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should devare the corresponding element.
        mainWindow = null;
      });

      // Clicking on a URL with target="_blank" should use your computer's
      // default browser.
      mainWindow.webContents.on('new-window', function(event, url){
        event.preventDefault();
        electron.shell.openExternal(url);
      });
}


// Registers event listeners that perform certain tasks for the renderer thread when they
// receive a 'renderer-request' event with a matching message type.
// Currently the supported request messages are: 'block-power-save' and 'unblock-power-save'
// The renderer thread can register for a callback 'renderer-request-response' event containing the
// original message + a boolean result field that represent success (true) or failure (false)
function registerEventListenersForRendererRequestEvents(){

  var powerBlockId = null;

  ipcMain.on('renderer-request', (event, message) => {
    if(message.type === 'block-power-save'){
        if(powerBlockId === null){
          powerBlockId = powerSaveBlocker.start("prevent-display-sleep");
          message.result = true;
        }else{
          console.warn("The 'block-power-save' request was unsuccessful.");
          message.result = false;
        }
    }
    else if(message.type === 'unblock-power-save'){
        if(powerBlockId !== null){
          powerSaveBlocker.stop(powerBlockId);
          powerBlockId = null;
          message.result = true;
        }else{
          console.warn("The 'unblock-power-save' request was unsuccessful.");
          message.result = false;
        }
    }
    event.sender.send('renderer-request-response', message);
  });
}
