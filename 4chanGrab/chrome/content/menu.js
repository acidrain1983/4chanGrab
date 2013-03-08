var n4cStyle;

function n4cContext() {
  var e = document.getElementById("n4cMenuItem");
  try {
    var doc = document.commandDispatcher.focusedWindow.document;
    var loc = doc.location.toString();
    //if(/\/[0-9]*\.html(#.*)?$/.test(loc)) {
    if (/^http[s]?:\/\/.*.4chan.org\/.*\/[0-9]+/.test(loc)) {
      n4cStyle = 3;
	}
    else if (/\/[0-9]*(|\.html(#.*)?)$/.test(loc)) {
      n4cStyle = 1;
    }
    else if (/^http:\/\/[^\/]*not4chanserver.org\/.*\?t=[0-9]+/.test(loc)) {
      n4cStyle = 2;
    }
	else if(/^http:\/\/4chanarchive.org\/.*\/.*\?thread_id=[0-9]+/.test(loc)) {
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

function n4cGrabAPICall() {
    var doc = document.commandDispatcher.focusedWindow.document;
    var loc = doc.location.toString();
    var match = loc.match(/^(http[s]?):\/\/.*.4chan.org\/(.*)\/res\/([0-9]+)/i); //http://api.4chan.org/x/res/123456789.json
    var url = match[1] + '://api.4chan.org/' + match[2] + '/res/' + match[3] + '.json';
    function reqListener () {
        var jsObject = JSON.parse(this.responseText);
        if (typeof jsObject == 'undefined' || jsObject == null || typeof jsObject.posts == 'undefined' || jsObject.posts == null || jsObject.posts.length == 0) {
            alert("No images found! 1");
            return;
        }
        var posts = jsObject.posts;
        var urls = new Array();
        var names = new Array();
        
        for (i in posts){
            var post = jsObject.posts[i];
            if (typeof post.filename == 'string') {
                urls.push(match[1] + '://images.4chan.org/' + match[2] + '/src/' + post.tim + post.ext);
                names.push(post.filename + post.ext);
            }
        }
        
        if(urls.length > 0) {
            window.openDialog("chrome://4chanGrab/content/dialog.xul",
            "_blank", "chrome,centerscreen,dialog", urls, names);
        }
        else {
            alert("No images found! 2");
        }
    };

    var oReq = new XMLHttpRequest();
    oReq.onload = reqListener;
    oReq.open("GET", url, true);
    oReq.send();
}

function n4cGrab() {
  if (n4cStyle == 3) {
    n4cGrabAPICall();
    return;
  }
  var urls = new Array();
  var names = new Array();
  var doc = document.commandDispatcher.focusedWindow.document;
  var links;
  if(n4cStyle == 1) {
    links = doc.getElementsByTagName("span");
  }
  else if(n4cStyle == 2) {
    links = doc.getElementsByTagName("div");
  }
  
  else {
    links = [];
  }
  var cnames = ["filesize", "orange", "fileText"];
  for(var i = 0; i < cnames.length; ++i) {
    for(var j = 0; j < links.length; ++j) {
      var cname = links[j].className;
      if(cname != cnames[i]) {
	continue;
      }
      var href = "";
      var title = "";
      var children = links[j].childNodes;
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
      urls[urls.length] = href;
      names[names.length] = title;
    }
    if(urls.length > 0) {
      break;
    }
  }
  if(urls.length > 0) {
    window.openDialog("chrome://4chanGrab/content/dialog.xul", "_blank", "chrome,resizable,centerscreen,dialog", urls, names);
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
