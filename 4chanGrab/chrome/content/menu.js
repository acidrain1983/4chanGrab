var n4cStyle;

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
    else if (/gentoochan\.org\/.*/.test(loc)) {
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
  if(n4cStyle == 1 || n4cStyle == 3 || n4cStyle == 4) {
    links = doc.getElementsByTagName("span");
  }
  else if(n4cStyle == 2) {
    links = doc.getElementsByTagName("div");
  }
  else {
    links = [];
  }
  var threadSubject = '';
  var cnames = ["subject", "filetitle"];

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

  if (n4cStyle == 4) {
    links = doc.getElementsByTagName("p");
  }

  if (n4cStyle == 3) {
    n4cGrabAPICall(threadSubject);
    return;
  }

  //Backwards compatibility code
  var urls = new Array();
  var names = new Array();
  var extraData = new Array();

  var cnames = ["filesize", "orange", "fileText", "fileinfo"];
  for(var i = 0; i < cnames.length; ++i) {
    for(var j = 0; j < links.length; ++j) {
      var cname = links[j].className;
      if(cname != cnames[i]) {
        continue;
      }
      var href = "";
      var title = "";
      var children = links[j].childNodes;

      var filesize_match = links[j].innerHTML.match(/-\((\d{1,}) KB\, \d{1,}x\d{1,},/);
      var filesize = false;
      var md5 = '';

      try {
        if (filesize_match.length == 2) {
          filesize = filesize_match[1];
        }

        var elements = links[j].parentNode.parentNode.getElementsByClassName('ca_thumb');
        if (elements.length > 0) {
          md5 = elements.item(0).getAttribute('data-md5');
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
    window.openDialog("chrome://4chanGrab/content/4chanGrab.xul", "_blank", "chrome,resizable", urls, names, extraData, threadSubject);
  }
  else {
    alert("No images found!");
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

function n4cLoad(ev) {
  var doc = ev.originalTarget;
  n4cSage(doc);
  var menu = document.getElementById("contentAreaContextMenu");
  menu.addEventListener("popupshowing", n4cContext, false);
}

window.addEventListener("load", n4cLoad, true);
