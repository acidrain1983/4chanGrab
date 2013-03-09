var n4cPick;
var n4cNumDone;
var n4cNumFail;

var illegalCharacters = /\$|\?|\[|\]|\/|\\|\=|\+|\<|\>|\:|\;|\"|,|\*|\||\$/g; //All: /\$|,|@|#|~|`|\%|\*|\^|\&|\(|\)|\+|\=|\[|\-|\_|\]|\[|\}|\{|\;|\:|\'|\"|\<|\>|\?|\||\\|\!|\$/g;

// Load Preferences
var prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
//var autoUpdate = prefManager.getBoolPref("extensions.4changrab.autoUpdate");
//var autoClose = prefManager.getBoolPref("extensions.4changrab.autoClose");
var autoCloseOnFinish = prefManager.getBoolPref("extensions.4changrab.autoCloseOnFinish");
var replaceIllegalCharacters = prefManager.getBoolPref("extensions.4changrab.replaceIllegalCharacters");
var showAlertOnCompletion = prefManager.getBoolPref("extensions.4changrab.showAlertOnCompletion");
var pathsToRemember = prefManager.getCharPref("extensions.4changrab.pathsToRemember");
//var pathHistoryItemsTemp = prefManager.getCharPref("extensions.4changrab.pathHistoryItems");

Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {         
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};
function cleanArray(actual){
  var newArray = new Array();
  for(var i = 0; i<actual.length; i++){
      if (actual[i]){
        newArray.push(actual[i]);
    }
  }
  return newArray;
}

//cleanArray([1,2,,3,,3,,,,,,4,,4,,5,,6,,,,]);
Array.prototype.unique = function () {
	var r = new Array();
	o:for(var i = 0, n = this.length; i < n; i++)
	{
		for(var x = 0, y = r.length; x < y; x++)
		{
			if(r[x]==this[i])
			{
				continue o;
			}
		}
		r[r.length] = this[i];
	}
	return r;
}


// pathHistory ComboBox
var pathHistory = {
	createMenuItem: function(menuLabel){
		const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
		var item = document.createElementNS(XUL_NS, "menuitem"); // create a new XUL menuitem
		item.setAttribute("label", menuLabel);
		return item;
	},
	addToMenu : function(element, index, array) {
		//fully contained instead of multipart createMenuItem
		const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
  		var item = document.createElementNS(XUL_NS, "menuitem"); // create a new XUL menuitem
  		item.setAttribute("label", element);
		//var pathMenu = document.getElementById("menuHistory").appendChild(item)  ;
		document.getElementById("menuHistory").appendChild(item);
		//pathMenu.appendChild(item);
	},
		
	load: function(){
		try 
		{
			//alert(pathHistoryItemsTemp);
			var pathHistoryItems = new Array();
			var pathHistoryItemsTemp = prefManager.getCharPref("extensions.4changrab.pathHistoryItems");
			pathHistoryItems = pathHistoryItemsTemp.split(",").unique() ;

			var pathMenu = document.getElementById("menuHistory"); // a <menupopup> element
			
			for (var i = 0; i < (pathHistoryItems.length); i++) {
				if (i >= pathsToRemember) {
					break;
				}
				//pathsToRemember
				var temp = this.createMenuItem(pathHistoryItems[i]);

				pathMenu.appendChild(temp);
			}

  		}
		catch(err)
  		{
  			txt="There was an error on this page.\n\n";
  			txt+="Error description: " + err.description + "\n\n";
  			txt+="Click OK to continue.\n\n";
  			alert(txt);
  		}
	},
	setCurrent: function(){
		var currentPath = document.getElementById("n4cFolder");
		var pathMenu = document.getElementById("menuHistory");
		currentPath.insertItemAt(0, currentPath.label);
		
	},
	hideEmpty: function(){
		for (var i = 1; i < pathsToRemember; i++) {
			var curItem = document.getElementById("menuItem" + i);
			if (curItem.label == "") {
				curItem.setAttribute("hidden", "true");
			}
		}
	},
	moveUp: function(index){
		while (index < (pathsToRemember - 1)) {
			var curItem = document.getElementById("menuItem" + index);
			var nextItem = document.getElementById("menuItem" + (index + 1));
			curItem.setAttribute("label", nextItem.label);
			nextItem.setAttribute("label", "");
			++index;
		}
	},
	moveDown: function(index){
		while (index > 0) {
			var curItem = document.getElementById("menuItem" + index);
			var nextItem = document.getElementById("menuItem" + (index - 1));
			curItem.setAttribute("label", nextItem.label);
			nextItem.setAttribute("label", "");
			--index;
		}
	},
	setPaths: function(){
		var label = document.getElementById("n4cFolder");
		var value = label.getAttribute("value");
		label.setAttribute("value", value);
		label.setAttribute("label", value);
		label.value = value;
	},
	save: function(){
		//pathHistory.setPaths();
		pathHistory.setCurrent();
		var currentPath = document.getElementById("n4cFolder");
		var pathMenu = document.getElementById("menuHistory");
		var pathMenuItems = new Array();
		
		for (var i = 0; i < currentPath.itemCount; i++) {
			var temp = currentPath.getItemAtIndex(i);
			pathMenuItems[i] = temp.getAttribute("label");
		}
		prefManager.setCharPref("extensions.4changrab.pathHistoryItems", pathMenuItems.toString());
	},
	clearAll : function() {
		for(var i = 0; i < pathsToRemember; i++) {
			var curItem = document.getElementById("menuItem" + i);
			curItem.setAttribute("label", "");
		}	
	}
}

// fileList Actions
var fileList = {
	load: function(){
		var names = window.arguments[1];
		var box = document.getElementById("n4cListbox");
		for (var i = 0; i < names.length; ++i) {
			var name = names[i];
			if (replaceIllegalCharacters) { 
				name = name.replace(illegalCharacters, "");
			}
			var item = box.appendItem(name);
			item.setAttribute("id", "n4cLi" + i);
			item.setAttribute("type", "checkbox");
			item.setAttribute("checked", true);
		}
		box.scrollToIndex(names.length - 1);
		//window.sizeToContent();
	},
	toggle : function() {
		var urls = window.arguments[0];
  		for(var i = 0; i < urls.length; ++i) {
    		var item = document.getElementById("n4cLi" + i);
    		if(item.getAttribute("disabled")) {
      			continue;
    		}
    		if(item.getAttribute("checked")) {
      			item.removeAttribute("checked");
    		}
    		else {
      			item.setAttribute("checked", true);
    		}
 		}
	},
	reNumber : function() {
		var prefix = prompt("What would you like to rename the files to?","grab");
  		if(prefix != "" && prefix != null) { 
	  		var box = document.getElementById("n4cListbox");
	  		var names = window.arguments[1];
	  		for(var i = 0; i < names.length; ++i) {
	    		var item = document.getElementById("n4cLi" + i);
	    		if(item.getAttribute("disabled")) {
	      			continue;
	    		}
	    		var ext = names[i].replace(/.*\./, ".")
	    		var name = "0000" + (i + 1);
	    		name =  prefix + name.substr(-4) + ext;
	    		window.arguments[1][i] = name;
	    		item.setAttribute("label", name);
	  		}
	  		//window.sizeToContent();
  		}
	}
}


var files = {
	setStatus: function(){
		//n4cStatus()
		var label = document.getElementById("n4cStatus");
		var value = n4cPick.length + " picked " + n4cNumDone + " saved";
		if (n4cNumFail > 0) {
			value += " " + n4cNumFail + " failed";
		}
		label.setAttribute("value", value);
		//window.sizeToContent();
	},
	getSavePath: function(){
		//n4cGetDir()
		var label = document.getElementById("n4cFolder");
		//var value = label.getAttribute("value");
		//label.setAttribute("value", value);
		var value = document.getElementById("n4cFolder").value;
		label.setAttribute("value", value);
		return value;
	},
	setSavePath: function(){
		//n4cFolder
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		fp.init(window, "Select Target Folder", nsIFilePicker.modeGetFolder);
		var path = files.getSavePath();
		if (path != "") {
			var nsILocalFile = Components.interfaces.nsILocalFile;
			var fd = Components.classes["@mozilla.org/file/local;1"].createInstance(nsILocalFile);
			fd.initWithPath(path);
			fp.displayDirectory = fd;
		}
		var res = fp.show();
		if (res == nsIFilePicker.returnOK) {
			var label = document.getElementById("n4cFolder");
			label.setAttribute("value", fp.file.path);
			label.setAttribute("label", fp.file.path);
			label.value = fp.file.path;
			//window.sizeToContent();
		}
		////pathHistory.setPaths();
	},
	save: function(){
		//n4cSave()
		if (files.getSavePath() == "") {
			files.setSavePath();
			if (files.getSavePath() == "") {
				return;
			}
		}
		pathHistory.save();
		n4cPick = new Array();
		var urls = window.arguments[0];
		for (var i = 0; i < urls.length; ++i) {
			var item = document.getElementById("n4cLi" + i);
			if (item.getAttribute("disabled")) {
				continue;
			}
			if (item.getAttribute("checked")) {
				n4cPick[n4cPick.length] = i;
			}
			item.setAttribute("disabled", true);
		}
		n4cNumDone = 0;
		n4cNumFail = 0;
		files.setStatus();
		var button = document.getElementById("n4cChange");
		button.setAttribute("disabled", true);
		button = document.getElementById("n4cSave");
		button.setAttribute("disabled", true);
		files.saveFile(0);
	},
	saveFile: function(index){
		//n4cSaveFile(index)
		var urls = window.arguments[0];
		var names = window.arguments[1];
		while (index < n4cPick.length) {
			var pIndex = n4cPick[index];
			var url = urls[pIndex];
			var name = names[pIndex];
			if (replaceIllegalCharacters) {
				name = name.replace(illegalCharacters, "");
			}
			var item = document.getElementById("n4cLi" + pIndex);
			var nsILocalFile = Components.interfaces.nsILocalFile;
			var fp = Components.classes["@mozilla.org/file/local;1"].createInstance(nsILocalFile);
			fp.initWithPath(files.getSavePath());
			fp.append(name);
			if (fp.exists()) {
				item.removeAttribute("disabled");
				++n4cNumFail;
				files.setStatus();
				++index;
				continue;
			}
			fp.create(fp.NORMAL_FILE_TYPE, 0600);
			var nsIURI = Components.interfaces.nsIURI;
			var uri = Components.classes['@mozilla.org/network/standard-url;1'].createInstance(nsIURI);
			uri.spec = url;
			var nsIWebBrowserPersist = Components.interfaces.nsIWebBrowserPersist;
			var persist = Components.classes['@mozilla.org/embedding/browser/nsWebBrowserPersist;1'].createInstance(nsIWebBrowserPersist);
			persist.progressListener = new n4cListener(index);
            try {
			    persist.saveURI(uri, null, null, null, null, fp, null);
            } catch (e) {
                persist.saveURI(uri, null, null, null, null, fp);
            }
			return;
		}
		var value = "4chan grab: ";
		if (!n4cNumFail) {
			if (showAlertOnCompletion) {
				value += "Success " + n4cNumDone + " saved";
				alert(value);
			}
			if (autoCloseOnFinish) {
				window.close();
			}
		}
		else {
			var button = document.getElementById("n4cChange");
			button.removeAttribute("disabled");
			button = document.getElementById("n4cSave");
			button.removeAttribute("disabled");
			for (var i = 0; i < urls.length; ++i) {
				var item = document.getElementById("n4cLi" + i);
			}
			if (showAlertOnCompletion) {
				value += n4cNumDone + " saved " + n4cNumFail + " failed\n";
				value += "Some files already exist in this folder\n";
				value += "Change folders or delete duplicates and try again";
				alert(value);
			}
		}
	}
}


var chanGrab = {
	load : function() {
		//preferences.init();
		pathHistory.load();
		fileList.load();
		//var autoUpdateChk = document.getElementById("autoUpdate");
		//autoUpdateChk.setAttribute("checked",autoUpdate);
	},
	shutdown : function() {
		
		//pathHistory.save();
	}
}


function n4cListener(index) {
  this.index = index;
}
n4cListener.prototype = {
  QueryInterface : function(id) {
    if(id.equals(Components.interfaces.nsIWebProgressListener)
	|| id.equals(Components.interfaces.nsISupport)) {
      return this;
    }
    throw Components.results.NS_ERROR_NO_INTERFACE;
  },
  init : function() {},
  destroy : function() {},
  onStateChange : function(prog, req, state, status) {
    if(state & Components.interfaces.nsIWebProgressListener.STATE_STOP) {
      var pIndex = n4cPick[this.index];
      var item = document.getElementById("n4cLi" + pIndex);
      item.setAttribute("label", item.getAttribute("label") + " DONE");
      var box = document.getElementById("n4cListbox");
      box.ensureIndexIsVisible(pIndex);
      ++n4cNumDone;
      files.setStatus();
      files.saveFile(this.index + 1);
    }
  },
  onLocationChange : function(prog, req, loc) {},
  onProgressChange : function(prog, req, curself, maxself, curtot, maxtot) {},
  onSecurityChange : function(prog, req, state) {},
  onStatusChange : function(prog, req, status, message) {}
};

window.addEventListener("unload", function(e) { chanGrab.shutdown(); }, false);
