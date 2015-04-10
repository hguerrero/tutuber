// Upon loading, the Google APIs JS client automatically invokes this callback.
googleApiClientReady = function() {
	gapi.client.setApiKey('AIzaSyCDUr8nrUethpGftjt4uLtj6PvgW6vuvFg');
	loadAPIClientInterfaces();
};

//Load the client interfaces for the YouTube Analytics and Data APIs, which
//are required to use the Google APIs JS client. More info is available at
//http://code.google.com/p/google-api-javascript-client/wiki/GettingStarted#Loading_the_Client
function loadAPIClientInterfaces() {
	gapi.client.load('youtube', 'v3', function() {
		handleAPILoaded();
	});
}

// After the API loads, call a function to enable the search box.
function handleAPILoaded() {
  $('#search-button').attr('disabled', false);
}

// Search for a specified string.
function search() {
  var q = $('#query').val();
  var request = gapi.client.youtube.search.list({
    q: q,
    maxResults: 25,
    order: 'viewCount',
    type: 'video',
    videoEmbeddable: 'true',
    videoSyndicated: 'true',
    part: 'id,snippet'
  });

  request.execute(function(response) {
    var str = JSON.stringify(response.result);
    $('#search-container').html('<p>' + str + '</p');
  });
}
