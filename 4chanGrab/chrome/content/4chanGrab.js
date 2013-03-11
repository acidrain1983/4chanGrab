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
var checkFiles = prefManager.getBoolPref("extensions.4changrab.checkFiles");
var checkThreadTitle = prefManager.getBoolPref("extensions.4changrab.checkThreadTitle");
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

var n4utils = {
	isUTF8: function (charset) {
		var type = typeof(charset);

		if (type === "undefined") {
			return false;
		}

		if (type === "string" && charset.toLowerCase() === "utf-8") {
			return true;
		}

		throw new Error("The charset argument can be only 'utf-8'");
	}
	,base64decode: function (data, charset) {
		if (n4utils.isUTF8(charset)) {
			return decodeURIComponent(escape(atob(data)));
		}

		return atob(data);
	}
	,base64encode: function (data, charset) {
		if (n4utils.isUTF8(charset)) {
			return btoa(unescape(encodeURIComponent(data)));
		}

		return btoa(data);
	}
	,bin2hex: function(hash) {
		// return the two-digit hexadecimal code for a byte
		function toHexString(charCode)
		{
			return ("0" + charCode.toString(16)).slice(-2);
		}

		// convert the binary hash data to a hex string.
		return [toHexString(hash.charCodeAt(i)) for (i in hash)].join("");
	}
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

		var threadTitle = window.arguments[3];
		threadTitle = threadTitle.replace(illegalCharacters, "");
		document.getElementById("n4cFolderTitle").value = threadTitle;

		if (threadTitle != '' && checkThreadTitle) {
			document.getElementById("n4cUseFolder").setAttribute("checked", true);
		}

		if (checkFiles) {
			files.checkFiles();
		}
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
	getSavePathWithTitle: function(dir) {
		var nsILocalFile = Components.interfaces.nsILocalFile;
		var aFile = Components.classes["@mozilla.org/file/local;1"].createInstance(nsILocalFile);
		aFile.initWithPath(files.getSavePath());
		aFile.append(dir);
		if (!aFile.exists()) {
			var create = arguments[1];
			if (create != null && create == false) {
				return false;
			}
			var res = aFile.createUnique(Components.interfaces.nsIFile.DIRECTORY_TYPE, nsILocalFile.PERMS_DIRECTORY /*0644*/);
			if (res != nsILocalFile.returnOK) {
				return false;
			}
		}
		return true;
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
		files.getPicks();
		n4cNumDone = 0;
		n4cNumFail = 0;
		files.setStatus();
		files.disableButtons();

		if (checkFiles) {
			n4cMd5Checker.init(0, true);
		} else {
			files.saveFile(0);
		}
	},

	disableButtons: function() {
		var ids = ["n4cChange", "n4cSave", "n4cToggle", "n4cNumber", "n4cFolderTitle", "n4cFolder", "n4cUseFolder", "n4ccheckFiles"];
		for (var i = 0; i < ids.length; ++i) {
			var el = document.getElementById(ids[i]);
			el.setAttribute("disabled", true);
		}
	},

	enableButtons: function() {
		var ids = ["n4cChange", "n4cSave", "n4cToggle", "n4cNumber", "n4cFolderTitle", "n4cFolder", "n4cUseFolder", "n4ccheckFiles"];
		for (var i = 0; i < ids.length; ++i) {
			var el = document.getElementById(ids[i]);
			el.removeAttribute("disabled");
		}
	},

	getPicks: function() {
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
	},

	getFileInstance: function(name, n4cFolderTitle, useCustomFolder, checkMode) {
		if (replaceIllegalCharacters) {
			name = name.replace(illegalCharacters, "");
		}

		var nsILocalFile = Components.interfaces.nsILocalFile;
		var fp = Components.classes["@mozilla.org/file/local;1"].createInstance(nsILocalFile);
		fp.initWithPath(files.getSavePath());
		if (useCustomFolder) {
			var autoCreate = !(checkMode);
			var newPath = files.getSavePathWithTitle(n4cFolderTitle, autoCreate);
			if (newPath || !autoCreate) {
				fp.append(n4cFolderTitle);
			}
		}
		fp.append(name);

		return fp;
	},

	checkFiles: function() {
		if (files.getSavePath() == "") {
			files.setSavePath();
			if (files.getSavePath() == "") {
				return;
			}
		}

		files.getPicks();

		n4cMd5Checker.init(0, false);
	},

	saveFile: function(index){
		//n4cSaveFile(index)
		var n4cUseFolder = document.getElementById("n4cUseFolder");
		var useCustomFolder = n4cUseFolder.getAttribute("checked");

		var n4cFolderTitle = document.getElementById("n4cFolderTitle").value;
		if (n4cFolderTitle == '') {
			useCustomFolder = false;
		}

		var urls = window.arguments[0];
		var names = window.arguments[1];
		while (index < n4cPick.length) {
			var pIndex = n4cPick[index];
			var url = urls[pIndex];
			var name = names[pIndex];
			var item = document.getElementById("n4cLi" + pIndex);
			
			var fp = files.getFileInstance(name, n4cFolderTitle, useCustomFolder, false);

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

			var nsILoadContext = null;
			try {
				// with persist flags if desired
				const flags = nsIWebBrowserPersist.PERSIST_FLAGS_REPLACE_EXISTING_FILES;
				persist.persistFlags = flags | nsIWebBrowserPersist.PERSIST_FLAGS_FROM_CACHE;
				Components.utils.import("resource://gre/modules/PrivateBrowsingUtils.jsm");

				var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
				var win = wm.getMostRecentWindow("navigator:browser");
				nsILoadContext = PrivateBrowsingUtils.getPrivacyContextFromWindow(win);
			}
			catch(err) {}

			persist.saveURI(uri, null, null, null, null, fp, nsILoadContext);
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
			files.enableButtons();
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

var n4cMd5Checker = {
	worker: null
	,index: 0
	,init: function(index, saveMode) {
		n4cMd5Checker.index = index;
		n4cMd5Checker.saveMode = saveMode;

		n4cMd5Checker.worker = new Worker('chrome://4chanGrab/content/MD5WebWorker.js');

		n4cMd5Checker.worker.onmessage = function(event) {
	  		n4cMd5Checker.onWorkerMessage.call(n4cMd5Checker, event);
		}
		n4cMd5Checker.worker.onerror = function(event) { }

		files.disableButtons();
		var label = document.getElementById("n4cStatus");
		label.setAttribute("value", "Checking existing files...");
		n4cMd5Checker.checkFile();
	}

	,checkFile: function() {
		var index = n4cMd5Checker.index;

		var n4cUseFolder = document.getElementById("n4cUseFolder");
		var useCustomFolder = n4cUseFolder.getAttribute("checked");

		var n4cFolderTitle = document.getElementById("n4cFolderTitle").value;
		if (n4cFolderTitle == '') {
			useCustomFolder = false;
		}

		var localmd5bin = '';
		var names = window.arguments[1];
		var extraDatas = window.arguments[2];
		while (index < n4cPick.length) {
			var pIndex = n4cPick[index];
			var name = names[pIndex];
			var extraData = extraDatas[pIndex];
			var md5 = extraData.md5;
			var filesize = extraData.filesize;
			var item = document.getElementById("n4cLi" + pIndex);
			if (md5 != '') {
				var fp = files.getFileInstance(name, n4cFolderTitle, useCustomFolder, true);
				if (fp.exists()) {
					var file = new File(fp.path);

					var filesizematched = false;
					if (typeof filesize == 'number') {
						if (file.size === filesize) {
							filesizematched = true;
						}
					} else if (filesize != false) {
						var file_size = Math.round( ( file.size / 1024) );
						if (file_size == filesize) {
							filesizematched = true;
						}
					}

					if (filesize == false || filesizematched) {
						n4cMd5Checker.worker.postMessage({'pIndex': pIndex, 'file': file});
						return; //Return and let the response from the worker continue the next file
					}
				}
			}
			item.removeAttribute("disabled");
			n4cMd5Checker.next();
			return;
		}
	}

	,next: function() {
		n4cMd5Checker.index++;
		if (n4cMd5Checker.index >= n4cPick.length) {
			n4cMd5Checker.worker.terminate();
			files.enableButtons();

			var label = document.getElementById("n4cStatus");
			label.setAttribute("value", "");

			if (n4cMd5Checker.saveMode) {
				files.getPicks();
				n4cNumDone = 0;
				n4cNumFail = 0;
				files.setStatus();
				files.saveFile(0);
			}
		} else {
			n4cMd5Checker.checkFile();
		}
	}

	,onWorkerMessage: function(event) {
		var pIndex = event.data.pIndex;
		var extraDatas = window.arguments[2];
		var extraData = extraDatas[pIndex];
		var md5 = extraData.md5;

		var item = document.getElementById("n4cLi" + pIndex);
		var localmd5bin = event.data.md5;
		
		if (localmd5bin != false) {
			/*var localmd5 = n4utils.bin2hex(localmd5bin);
			var md5 = n4utils.bin2hex(n4utils.base64decode(md5));

			localmd5bin = n4utils.base64encode(localmd5bin);*/

			var md5 = n4utils.bin2hex(n4utils.base64decode(md5));

			//Encode the binary to base64 to match the string from the source
			var localmd5 = localmd5bin;
			if (localmd5 === md5) {
				item.setAttribute("checked", false);
				item.setAttribute("disabled", true);
				item.setAttribute("disabledbymd5sum", true);
				item.setAttribute("label", item.getAttribute("label") + " (MD5 Sum Matched)");

				n4cMd5Checker.next();
				return;
			}
		}
		item.removeAttribute("disabled");
		n4cMd5Checker.next();
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
