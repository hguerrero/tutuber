'use strict';

var app = angular.module('TuTuberApp', ['ui.bootstrap']);

app.constant('YT_event', {
	STOP:            0, 
	PLAY:            1,
	PAUSE:           2,
	STATUS_CHANGE:   3
});

//Upon loading, the Google APIs JS client automatically invokes this callback.
function googleApiClientReady() {
	gapi.client.setApiKey('AIzaSyCDUr8nrUethpGftjt4uLtj6PvgW6vuvFg');
	gapi.client.load('youtube', 'v3', function() {
//		handleAPILoaded();
	});
};

app.controller('TuTuberCtrl', function($scope) {
	$scope.query = { 
			term : '',
			results : ''
	};
	
	$scope.playlist = { items: [] };
	
	$scope.yt = {
			title: 'Video Title',
			width: 600, 
			height: 480, 
			videoid: "M7lc1UVf-VE",
			playerStatus: "NOT PLAYING",
			playerPaused: true
	};

	$scope.sendControlEvent = function (ctrlEvent) {
		this.$broadcast(ctrlEvent);
	};
});

app.controller('YouTubeCtrl', function($scope, YT_event) {
	//initial settings
	$scope.YT_event = YT_event;

	$scope.$on(YT_event.STATUS_CHANGE, function(event, data) {
		$scope.yt.playerStatus = data;
		if (data != 'PLAYING') {
			$scope.yt.playerPaused = true;
		}
		else {
			$scope.yt.playerPaused = false;
		}
	});
	
	$scope.playbackPlayPause = function(){
		if ($scope.yt.playerPaused) {
			$scope.sendControlEvent(YT_event.PLAY);			
		}
		else {
			$scope.sendControlEvent(YT_event.PAUSE);
		}
	};
});

app.controller('SearchCtrl', function($scope) {
	// Search for a specified string.
	$scope.search = function() {
		var searchTerm = $scope.searchTerm;
		var request = gapi.client.youtube.search.list({
			q: searchTerm,
			maxResults: 25,
			order: 'viewCount',
			part: 'id,snippet'
		});

		request.execute(function(response) {
			$scope.query.term = searchTerm;
			$scope.query.results = response.result;
		});
	};
});

app.controller('ResultsCtrl', function($scope, YT_event) {
	$scope.play = function(index) {
		var result = $scope.query.results.items[index];
		var item = {
			id: result.id.videoId,
			title: result.snippet.title,
			thumbnail: result.snippet.thumbnails.default.url
		};
		
		$scope.playlist.items.push(item);
		
		$scope.yt.videoid = item.id;
		$scope.yt.title = item.title;
	};
});

app.directive('youtube', function($window, YT_event) {
	return {
		restrict: "E",

		scope: {
			height: "@",
			width: "@",
			videoid: "@"
		},

		template: '<div></div>',

		link: function(scope, element, attrs, $rootScope) {
			var tag = document.createElement('script');
			tag.src = "https://www.youtube.com/iframe_api";
			var firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

			var player = '';

			$window.onYouTubeIframeAPIReady = function() {

				player = new YT.Player(element.children()[0], {
					playerVars: {
						autoplay: 0,
						html5: 1,
						theme: "light",
						modesbranding: 0,
						color: "white",
						iv_load_policy: 3,
						showinfo: 0,
						rel: 0,
						controls: 0
					},

					height: scope.height,
					width: scope.width,
					videoId: scope.videoid, 

					events: {
						'onStateChange': function(event) {

							var message = {
									event: YT_event.STATUS_CHANGE,
									data: ""
							};

							switch(event.data) {
							case YT.PlayerState.PLAYING:
								message.data = "PLAYING";
								break;
							case YT.PlayerState.ENDED:
								message.data = "ENDED";
								break;
							case YT.PlayerState.UNSTARTED:
								message.data = "NOT PLAYING";
								break;
							case YT.PlayerState.PAUSED:
								message.data = "PAUSED";
								break;
							}

							scope.$apply(function() {
								scope.$emit(message.event, message.data);
							});
						}
					} 
				});
			};

			scope.$watch('height + width', function(newValue, oldValue) {
				if (newValue == oldValue) {
					return;
				}

				player.setSize(scope.width, scope.height);

			});

			scope.$watch('videoid', function(newValue, oldValue) {
				if (newValue == oldValue) {
					return;
				}

				player.cueVideoById(scope.videoid);
				player.playVideo();
			});

			scope.$on(YT_event.STOP, function () {
				player.seekTo(0);
				player.stopVideo();
			});

			scope.$on(YT_event.PLAY, function () {
				player.playVideo();
			}); 

			scope.$on(YT_event.PAUSE, function () {
				player.pauseVideo();
			});  

		}  
	};
});

app.filter('truncate', function () {
	return function (text, length, end) {
		if (isNaN(length))
			length = 10;

		if (end === undefined)
			end = "...";

		if (text.length <= length || text.length - end.length <= length) {
			return text;
		}
		else {
			return String(text).substring(0, length-end.length) + end;
		}

	};
});