importScripts('FileStreamer.js', 'CryptoJS-md5.js', 'CryptoJS-typedarrays.js');

var MD5 = {
	_md5: null
	,md5: function(file, callback) {
		var blob = '';
		var fs = new FileStreamer(4 * 1024 * 1024, true);

		var md5 = CryptoJS.algo.MD5.create();
		fs.streamAsArrayBuffer(file, function (data, eof) {
			md5.update( CryptoJS.lib.WordArray.create(data) );

			if (eof) {
				var hash = md5.finalize().toString();
				callback(hash);
			}
		});
	}
}
 
self.onmessage = function (oEvent) {
	var data = oEvent.data;
	var pIndex = data.pIndex;
	var file = data.file;

	var md5sum = MD5.md5(file, function(md5sum) {
		postMessage({ "pIndex": pIndex, "md5": md5sum });
	});
};