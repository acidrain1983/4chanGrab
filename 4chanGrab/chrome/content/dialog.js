var n4cPick;
var n4cNumDone;
var n4cNumFail;

function n4cDialog() {
  var names = window.arguments[1];
  var box = document.getElementById("n4cListbox");
  for(var i = 0; i < names.length; ++i) {
    var name = names[i];
    var item = box.appendItem(name);
    item.setAttribute("id", "n4cLi" + i);
    item.setAttribute("type", "checkbox");
    item.setAttribute("checked", true);
  }
  box.scrollToIndex(names.length - 1);
  window.sizeToContent();
}

function n4cToggle() {
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
}

function n4cNumber() {
  var box = document.getElementById("n4cListbox");
  var names = window.arguments[1];
  for(var i = 0; i < names.length; ++i) {
    var item = document.getElementById("n4cLi" + i);
    if(item.getAttribute("disabled")) {
      continue;
    }
    var ext = names[i].replace(/.*\./, ".")
    var name = "0000" + (i + 1);
    name = "grab" + name.substr(-4) + ext;
    window.arguments[1][i] = name;
    item.setAttribute("label", name);
  }
  window.sizeToContent();
}

function n4cGetDir() {
  var label = document.getElementById("n4cFolder");
  //var value = label.getAttribute("value");
  var value = document.getElementById("n4cFolder").value;
  label.setAttribute("value", value);
  return value;
}

function n4cStatus() {
  var label = document.getElementById("n4cStatus");
  var value = n4cPick.length + " picked " + n4cNumDone + " saved";
  if(n4cNumFail > 0) {
    value += " " + n4cNumFail + " failed";
  }
  label.setAttribute("value", value);
  window.sizeToContent();
}

function n4cSave() {
  if(n4cGetDir() == "") {
    n4cFolder();
    if(n4cGetDir() == "") {
      return;
    }
  }
  n4cPick = new Array();
  var urls = window.arguments[0];
  for(var i = 0; i < urls.length; ++i) {
    var item = document.getElementById("n4cLi" + i);
    if(item.getAttribute("disabled")) {
      continue;
    }
    if(item.getAttribute("checked")) {
      n4cPick[n4cPick.length] = i;
    }
    item.setAttribute("disabled", true);
  }
  n4cNumDone = 0;
  n4cNumFail = 0;
  n4cStatus();
  var button = document.getElementById("n4cChange");
  button.setAttribute("disabled", true);
  button = document.getElementById("n4cSave");
  button.setAttribute("disabled", true);
  n4cSaveFile(0);
}

function n4cSaveFile(index) {
  var urls = window.arguments[0];
  var names = window.arguments[1];
  while(index < n4cPick.length) {
    var pIndex = n4cPick[index];
    var url = urls[pIndex];
    var name = names[pIndex];
    var item = document.getElementById("n4cLi" + pIndex);
    var nsILocalFile = Components.interfaces.nsILocalFile;
    var fp = Components.classes["@mozilla.org/file/local;1"]
	.createInstance(nsILocalFile);
    fp.initWithPath(n4cGetDir());
    fp.append(name);
    if(fp.exists()) {
      item.removeAttribute("disabled");
      ++n4cNumFail;
      n4cStatus();
      ++index;
      continue;
    }
    fp.create(fp.NORMAL_FILE_TYPE, 0600);
    var nsIURI = Components.interfaces.nsIURI;
    var uri = Components.classes['@mozilla.org/network/standard-url;1']
	.createInstance(nsIURI);
    uri.spec = url;
    var nsIWebBrowserPersist = Components.interfaces.nsIWebBrowserPersist;
    var persist = Components
	.classes['@mozilla.org/embedding/browser/nsWebBrowserPersist;1']
	.createInstance(nsIWebBrowserPersist);
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
  if(!n4cNumFail) {
    value += "Success " + n4cNumDone + " saved";
    alert(value);
    window.close();
  }
  else {
    var button = document.getElementById("n4cChange");
    button.removeAttribute("disabled");
    button = document.getElementById("n4cSave");
    button.removeAttribute("disabled");
    for(var i = 0; i < urls.length; ++i) {
      var item = document.getElementById("n4cLi" + i);
    }
    value += n4cNumDone + " saved " + n4cNumFail + " failed\n";
    value += "Some files already exist in this folder\n";
    value += "Change folders or delete duplicates and try again";
    alert(value);
  }
}

function n4cFolder() {
  var nsIFilePicker = Components.interfaces.nsIFilePicker;
  var fp = Components.classes["@mozilla.org/filepicker;1"]
      .createInstance(nsIFilePicker);
  fp.init(window, "Select Target Folder", nsIFilePicker.modeGetFolder);
  var path = n4cGetDir();
  if(path != "") {
    var nsILocalFile = Components.interfaces.nsILocalFile;
    var fd = Components.classes["@mozilla.org/file/local;1"]
	.createInstance(nsILocalFile);
    fd.initWithPath(path);
    fp.displayDirectory = fd;
  }
  var res = fp.show();
  if(res == nsIFilePicker.returnOK) {
    var label = document.getElementById("n4cFolder");
    label.setAttribute("value", fp.file.path);
    window.sizeToContent();
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
      n4cStatus();
      n4cSaveFile(this.index + 1);
    }
  },
  onLocationChange : function(prog, req, loc) {},
  onProgressChange : function(prog, req, curself, maxself, curtot, maxtot) {},
  onSecurityChange : function(prog, req, state) {},
  onStatusChange : function(prog, req, status, message) {}
};
