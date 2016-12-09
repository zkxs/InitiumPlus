// ==UserScript==
// @name        InitiumPlus
// @namespace   michaelripley.net
// @description Show Initium Path IDs
// @version     0.4.0
// @include     /^https?://(www\.)?playinitium\.com/main\.jsp(\?.*)?#?$/
// @require     names.js
// @require     gm_config.js
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_log
// ==/UserScript==

// SET UP LOGGING
function log(item) {
	console.log("[Initium+] " + item);
}

log("Initializing...");

// DECLARE CONSTANTS:
var MAX_INT = 4294967295;
var buttonXpath = "//a[contains(@class, 'main-button')]";
var labelXpath = "span[contains(@class, 'iPlusIdLabel')]";
var toolbarXpath = "//div[contains(@class, 'header-stats')]";
var gotoEventRegex = /doGoto\(event,\s*(\d+)\)/;

// DEFINE GLOBALS
var buttonIdLabels = [];

// DECLARE FUNCTIONS: 

function addStyle() {
	var styleElement = document.createElement("style");
	styleElement.textContent = ".iPlusIdLabel { font-size: 14px; color: #AAAAAA; white-space: nowrap; }\n";
	styleElement.textContent += ".main-button { font-size: 18px; }\n";
	styleElement.textContent += "#iPlusToolbarIcon { text-decoration: none; }\n";
	document.head.appendChild(styleElement);
}

function titleCase(someString) {
	var lower = someString.toLowerCase();
	return lower[0].toUpperCase() + lower.substring(1, lower.length);
}

function getName(someLong) {
	// old method
	// var idHigh = Math.floor(someLong / MAX_INT);
	// var idLow = Math.floor(someLong % MAX_INT);
	
	// var first = titleCase(firstNames[idHigh % firstNames.length]);
	// var last  = titleCase( lastNames[idLow  %  lastNames.length]);
	
	// return first + " " + last;
	
	return titleCase(firstNames[someLong % firstNames.length]);
}

function getDisplayedId(realId) {
	switch (GM_config.get("idDisplayMode")) {
		case "memorable": return getName(realId);
		case "raw":       return realId;
		case "both":      return getName(realId) + " / " + realId;
		case "none":      return "";
		default:          return "";
	}
}

function setLabel(label, id) {
	var labelText = getDisplayedId(id);
	if (labelText) {
		label.innerHTML = "id:" + getDisplayedId(id);
	} else {
		label.innerHTML = "";
	}
}

function labelButtons() {
	// iterate over all buttons
	var buttons = document.evaluate(buttonXpath, document.body, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	for (var idx = 0; idx < buttons.snapshotLength; idx++) {
		var button = buttons.snapshotItem(idx);
		var onclick = button.getAttribute("onclick");
		
		var match = onclick.match(gotoEventRegex);
		if (match) {
			
			// move text content into a span
			button.innerHTML += " ";
			
			// get event ID
			var eventId = parseInt(match[1], 10);
			
			var idLabel = document.createElement("span");
			setLabel(idLabel, eventId);
			idLabel.classList.add("iPlusIdLabel");
			button.appendChild(idLabel);
			
			buttonIdLabels.push({
				'id': eventId,
				'node': idLabel
			});
		}
	}
}

function updateLabels() {
	for (var i = 0; i < buttonIdLabels.length; i++) {
		var label = buttonIdLabels[i];
		setLabel(label.node, label.id);
	}
}

// BEGIN SCRIPT

addStyle(); // inject extra css

// set up GM_config
GM_config.init(
{
  'id': 'iPlusConfig', // The id used for this instance of GM_config
  'title': 'Initium+ Configuration',
  'fields': // Fields object
  {
    'idDisplayMode': // This is the id of the field
    {
      'label': 'ID Display Mode', // Appears next to field
      'type': 'select', // Makes this setting a text field
      'options': ['memorable', 'raw', 'both', 'none'],
      'default': 'raw' // Default value if user doesn't change it
    }
  },
  'events': // Callback functions object
  {
    'save': updateLabels
  },
  'css': '@font-face {font-family: "DOS"; src: url("https://www.playinitium.com/odp/DOS.ttf");} #iPlusConfig {color: #FFFFFF; background-color: #1E1B16;} #iPlusConfig .reset, #iPlusConfig .reset a, #iPlusConfig_buttons_holder {color: #FFFFFF;} #iPlusConfig * {font-family: DOS, Monospace;}'
});

labelButtons();

// set up event listener to open config
var toolbars = document.evaluate(toolbarXpath, document.body, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
if (toolbars.snapshotLength > 0) {
	var toolbar = toolbars.snapshotItem(0);
	var icon = document.createElement("a");
	icon.id = "iPlusToolbarIcon";
	icon.classList.add("header-stats-caption");
	icon.innerHTML = "i+";
	icon.addEventListener('click', function() {
		GM_config.open();
		document.getElementById("iPlusConfig").style.zIndex = 999999999999999999; // the stupid chat window has a z-index of 1000100 for some reason
	}, true);
	toolbar.insertBefore(icon, toolbar.firstChild);
	console.log(toolbar);
	console.log(icon);
} else {
	log("Error: toolbars.snapshotLength == " + toolbars.snapshotLength);
}

log("Done.");