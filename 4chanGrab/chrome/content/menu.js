var n4cStyle;

var thisextentionid = "4chanGrab-acidrain1983@github.com";

function n4cContext() {
  var e = document.getElementById("n4cMenuItem");
  try {
    var doc = document.commandDispatcher.focusedWindow.document;
    var loc = doc.location.toString();
    // The first regex is to allow n4cStyle use the reply pages
    // so it can get the id and request the json API. Even if the HTML changes
    // the downloads will still work. Hell, Who uses grab on the board listings?!
    if (/^http[s]?:\/\/.*.4chan.org\/.*\/res\/[0-9]+/.test(loc)) {
      n4cStyle = 3;
    }
    else if (/^http[s]?:\/\/archive.foolz.us\/.*\/thread\/[0-9]+/.test(loc)) {
      n4cStyle = 4;
    }
    else if(/\/[0-9]*(|\.htm[l]?(#.*)?)$/.test(loc)) {
      n4cStyle = 1;
    }
    else if(/^http:\/\/[^\/]*not4chanserver.org\/.*\?t=[0-9]+/.test(loc)) {
      n4cStyle = 2;
    }
    else if(/^http[s]?:\/\/.*.4chan.org\/.*\/[0-9]+/.test(loc)) {
      n4cStyle = 1;
    }
    else if (/^http:\/\/(.*\.)?chanarchive.org\/.*\/.*\/.*\/.*/.test(loc)) {
      n4cStyle = 1;
    }
    else {
      throw 1;
    }
    e.setAttribute("hidden", false);
    e.previousSibling.setAttribute("hidden", false);
  }
  catch (x) {
    e.setAttribute("hidden", true);
    e.previousSibling.setAttribute("hidden", true);
    n4cStyle = 0;
  }
}

//Code to use the API to fetch posts list for the filenames instead of the HTML
function n4cGrabAPICall(threadSubject) {
    var doc = document.commandDispatcher.focusedWindow.document;
    var loc = doc.location.toString();
    var match = loc.match(/^(http[s]?):\/\/.*.4chan.org\/(.*)\/res\/([0-9]+)/i);
    var url = match[1] + '://api.4chan.org/' + match[2] + '/res/' + match[3] + '.json'; //http://api.4chan.org/x/res/123456789.json
    function reqListener () {
        var jsObject = JSON.parse(this.responseText);
        if (typeof jsObject == 'undefined' || jsObject == null || typeof jsObject.posts == 'undefined' || jsObject.posts == null || jsObject.posts.length == 0) {
            alert("No images found!");
            return;
        }
        var posts = jsObject.posts;
        var urls = new Array();
        var names = new Array();
        var extraData = new Array();
        
        for (i in posts){
            var post = jsObject.posts[i];
            //We only want posts with a filename, obviously
            if (typeof post.filename == 'string') {
                urls.push(match[1] + '://images.4chan.org/' + match[2] + '/src/' + post.tim + post.ext);
                names.push(post.filename + post.ext);
                extraData.push({ 'md5': post.md5, 'filesize': post.fsize });
            }
        }
        
        if(urls.length > 0) {
            n4cTrack();
            window.openDialog("chrome://4chanGrab/content/4chanGrab.xul", "_blank", "chrome,resizable", urls, names, extraData, threadSubject);
        }
        else {
            alert("No images found!");
        }
    };

    var oReq = new XMLHttpRequest();
    oReq.onload = reqListener;
    oReq.open("GET", url, true);
    oReq.send();
}


function n4cGrab() {
  var doc = document.commandDispatcher.focusedWindow.document;
  var links;
  if(n4cStyle == 1 || n4cStyle == 3) {
    links = doc.getElementsByTagName("span");
  }
  else if(n4cStyle == 2) {
    links = doc.getElementsByTagName("div");
  }
  else if (n4cStyle == 4) {
   links = doc.getElementsByTagName("h2"); 
  }
  else {
    links = [];
  }
  var threadSubject = '';
  var cnames = ["subject", "filetitle"];

  if (n4cStyle == 4) {
    cnames = ["post_title"];
  }

  subject:
  for (var j = 0; j < links.length; ++j) {
    var cname = links[j].className;
    for (var i = 0; i < cnames.length; ++i) {
        if(cname != cnames[i]) {
          continue;
        }

        if (links[j].childElementCount == 0) {
          threadSubject = links[j].innerHTML;
          break subject;
        }
    }
  }

  if (n4cStyle == 3) {
    n4cGrabAPICall(threadSubject);
    return;
  }

  if (n4cStyle == 4) {
    links = doc.getElementsByTagName("div");
  }

  //Backwards compatibility code
  var urls = new Array();
  var names = new Array();
  var extraData = new Array();

  var cnames = ["filesize", "orange", "fileText", "fileinfo", "thread_image_box"];
  for(var i = 0; i < cnames.length; ++i) {
    for(var j = 0; j < links.length; ++j) {
      var cname = links[j].className;
      if(cname != cnames[i]) {
        continue;
      }
      var href = "";
      var title = "";
      var children = links[j].childNodes;

      var filesize_match;
      if(n4cStyle == 4) {
        if (links[j].parentNode.nodeName != "ARTICLE") {
          filesize_match = links[j].parentNode.innerHTML.match(/(\d{1,}) kB\, \d{1,}x\d{1,}/i);
        } else {
          filesize_match = links[j].innerHTML.match(/(\d{1,}) kB\, \d{1,}x\d{1,}/i);
        }
      } else {
        filesize_match = links[j].innerHTML.match(/-\((\d{1,}) KB\, \d{1,}x\d{1,},/);
      }
      var filesize = false;
      var md5 = '';

      try {
          if (filesize_match.length == 2) {
            filesize = filesize_match[1];
          }

          if(n4cStyle == 4) {
            var elements = links[j].getElementsByClassName('thread_image');
            if (elements.length > 0) {
              md5 = elements.item(0).getAttribute('data-md5');
            }

            var elements = links[j].getElementsByClassName('post_image');
            if (elements.length > 0) {
              md5 = elements.item(0).getAttribute('data-md5');
            }
          } else {
            var elements = links[j].parentNode.parentNode.getElementsByClassName('ca_thumb');
            if (elements.length > 0) {
              md5 = elements.item(0).getAttribute('data-md5');
            }
          }
      } catch(err) {}

      for(var k = 0; k < children.length; ++k) {
        var node = children.item(k);
        if(node.href) {
            href = node.href;
            if(n4cStyle == 2) {
                title = node.innerHTML;
                break;
            }
        }
        if(node.title) {
            title = node.title;
        }
        else if(node.className == "filename") {
          title = node.innerHTML;
        }
      }
      if(href == "") {
        continue;
      }

      if(title == "") {
        title = href.replace(/.*\//, "");
      }
      urls.push(href);
      names.push(title);
      extraData.push({ 'md5': md5, 'filesize': filesize });
    }
    if(urls.length > 0) {
      break;
    }
  }
  if(urls.length > 0) {
    n4cTrack();
    window.openDialog("chrome://4chanGrab/content/4chanGrab.xul", "_blank", "chrome,resizable", urls, names, extraData, threadSubject);
  }
  else {
    alert("No images found!");
  }
}

/**
 * Google Analytics JS v1
 * http://code.google.com/p/google-analytics-js/
 * Copyright (c) 2009 Remy Sharp remysharp.com / MIT License
 * $Date: 2009-02-25 14:25:01 +0000 (Wed, 25 Feb 2009) $
 */
function n4cgaTrack(urchinCode, domain, url, utme, version) {
  var utmevar = utme || ''

  if (utmevar !== '') {
    utmevar = '&utme=' + utmevar;
  }

  function rand(min, max) {
      return min + Math.floor(Math.random() * (max - min));
  }
  window.screen.colorDepth
  //&utmsr=1280×1024
  //&utme=5(Out*action*label)(1)
  var i=1000000000,
      utmn=rand(i,9999999999), //random request number
      cookie=rand(10000000,99999999), //random cookie number
      random=rand(i,2147483647), //number under 2147483647
      today=(new Date()).getTime(),
      win = window.location,
      img = new Image(),
      screensize = window.screen.width +'×'+ window.screen.height,
      colordepth = window.screen.colorDepth + '-bit',
      urchinUrl = 'http://www.google-analytics.com/__utm.gif?utmwv=1.3&utmn='
          +utmn+'&utmsr='
          +screensize+'&utmsc='
          +colordepth+'&utmul=-&utmje=0&utmfl=-&utmdt=-' + utmevar
          +'&utmhn='
          +domain+'&utmr='+win+'&utmp='
          +url+'&utmac='
          +urchinCode+'&utmcc=__utma%3D'
          +cookie+'.'+random+'.'+today+'.'+today+'.'
          +today+'.2%3B%2B__utmb%3D'
          +cookie+'%3B%2B__utmc%3D'
          +cookie+'%3B%2B__utmz%3D'
          +cookie+'.'+today
          +'.2.2.utmccn%3D(referral)%7Cutmcsr%3D' + win.host + '%7Cutmcct%3D' + win.pathname + '%7Cutmcmd%3Dreferral%3B%2B__utmv%3D'
          +cookie+'.Version%20'+ version +'%3B';

  // trigger the tracking
  img.src = urchinUrl;
}

//I'm going to track the usage of the extention, I only want to know how often its used and where.
//This information won't be made public and it'll only be triggered when the menu is used with valid images to download.
function n4cdoTrack(currentVersion) {
    try {
      var doc = document.commandDispatcher.focusedWindow.document;
      var loc = doc.location;

      var utme = '8(4chanGrabVersion*n4cStyle)9('+ currentVersion +'*'+n4cStyle+')11(1*2)';
      n4cgaTrack('UA-45940593-1', 'acidrain1983.github.io', '/4chanGrab/' + n4cStyle + '/' + loc.hostname + loc.pathname, utme, currentVersion);
    }
    catch (x) {}
}

function n4cTrack() {
  try {
      // Firefox 4 and later; Mozilla 2 and later
      Components.utils.import("resource://gre/modules/AddonManager.jsm");
      AddonManager.getAddonByID(thisextentionid, function(addon) {
          var currentVersion = addon.version;
          n4cdoTrack(currentVersion);
    });
  }
  catch (ex) {
      // Firefox 3.6 and before; Mozilla 1.9.2 and before
      var em = Components.classes["@mozilla.org/extensions/manager;1"]
               .getService(Components.interfaces.nsIExtensionManager);
      var addon = em.getItemForID(thisextentionid);

      var currentVersion = addon.version;
      n4cdoTrack(currentVersion);
  }
}

function n4cSage(doc) {
  var loc = doc.location.toString();
  if(!/\/[0-9]*\.html(#.*)?$/.test(loc)) {
    return false;
  }
  if(!/Posting mode: Reply/.test(doc.body.innerHTML)) {
    return false;
  }
  var val = "email";
  var links = doc.getElementsByName("email");
  if(links.length != 1) {
    val = "field2";
    var links = doc.getElementsByName("field2");
    if(links.length != 1) {
      return false;
    }
  }
  var emailElem = links[0];
  if(!emailElem) {
    return false;
  }
  val = "this.form." + val + ".value";
  var labelElem = doc.createElement("label");
  emailElem.parentNode.insertBefore(labelElem, emailElem.nextSibling);
  var checkElem = doc.createElement("input");
  checkElem.setAttribute("name", "n4cSage");
  checkElem.setAttribute("type", "checkbox");
  checkElem.setAttribute("onclick",
      'if(this.form.n4cSage.checked) {' + val + ' = "sage";} \
      else {' + val + ' = "";}');
  labelElem.appendChild(checkElem);
  var textElem = doc.createTextNode("SAGE");
  labelElem.appendChild(textElem);
  emailElem.setAttribute("onchange",
      'if(this.form.n4cSage.checked) {' + val + ' = "sage";}');
  return true;
}

function n4cCheckInstall() {
  try {
      // Firefox 4 and later; Mozilla 2 and later
      Components.utils.import("resource://gre/modules/AddonManager.jsm");
      AddonManager.getAddonByID(thisextentionid, function(addon) {
          var currentVersion = addon.version;
          n4cLogInstall(currentVersion);
    });
  }
  catch (ex) {
      // Firefox 3.6 and before; Mozilla 1.9.2 and before
      var em = Components.classes["@mozilla.org/extensions/manager;1"]
               .getService(Components.interfaces.nsIExtensionManager);
      var addon = em.getItemForID(thisextentionid);

      var currentVersion = addon.version;
      n4cLogInstall(currentVersion);
  }
}

function n4cLogInstall(currentVersion) {
  try {
    var prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
    var lastInstalledVersion = prefManager.getCharPref("extensions.4changrab.lastInstalledVersion");

    if (!lastInstalledVersion) {
      //New Install
      prefManager.setCharPref("extensions.4changrab.lastInstalledVersion", currentVersion);
      var utme = '8(4chanGrabVersion)9('+ currentVersion +')11(1)';
      n4cgaTrack('UA-45940593-1', 'acidrain1983.github.io', '/4chanGrabExtention/New/'+currentVersion, utme, currentVersion);
    } else if (currentVersion != lastInstalledVersion) {
      prefManager.setCharPref("extensions.4changrab.lastInstalledVersion", currentVersion);
      var utme = '8(4chanGrabVersion*4chanGrabVersionUpdated)9('+ lastInstalledVersion +'*'+ currentVersion +')11(1*2)';
      n4cgaTrack('UA-45940593-1', 'acidrain1983.github.io', '/4chanGrabExtention/Updated/'+lastInstalledVersion+'/'+currentVersion, utme, currentVersion);
    }
  } catch(x){}
}

function n4cLoad(ev) {  
  n4cCheckInstall();

  var doc = ev.originalTarget;
  n4cSage(doc);
  var menu = document.getElementById("contentAreaContextMenu");
  menu.addEventListener("popupshowing", n4cContext, false);
}

window.addEventListener("load", n4cLoad, true);
