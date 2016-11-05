const {app, clipboard} = require('electron').remote;

var angApp = angular.module('mainApp', ['angularMoment']);

angApp.run((amMoment) => {
	// Ustawienie języka dla moment.js
	amMoment.changeLocale(app.getLocale());
})

angApp.controller('mainCtrl', ($scope, $http, moment, $interval) => {
	// Odczytanie aktualnej zawartości schowka
	$scope.lastClip = clipboard.readText();

	// Sprawdzenie konfiguracji
	if(window.localStorage.config) {
		$scope.config = JSON.parse(window.localStorage.config);
	} else {
		// W razie jej braku, zostanie utworzona
		window.localStorage.config = JSON.stringify({
			locale: app.getLocale(),
			active: true
		})
		$scope.config = JSON.parse(window.localStorage.config);
	}
	// Ustawienie języka dla aplikacji
	$scope.locale = $scope.config.locale;
	$scope.locale = $scope.locale.split('-');
	$scope.locale = $scope.locale[0];
	$scope.clips = [{
		content: 'aaa',
		dt: new Date()
	}]

	// Pobranie listy tekstów
	$http.get(`lib/locales/${$scope.locale}.json`)
		.then((res) => {
			$scope.strings = res.data;
		})

	// Sprawdzanie schowka
	$scope.checkClipboard = function() {
		if($scope.config.active) {
			var temp = clipboard.readText();
			if(temp != $scope.lastClip) {
				console.log(temp);
				$scope.lastClip = temp;
			}
		}
	}

	// Interwał sprawdzania schowka
	$scope.checkInterval = $interval($scope.checkClipboard, 1000);
})
