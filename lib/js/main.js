const {app} = require('electron').remote;

var angApp = angular.module('mainApp', []);

angApp.controller('mainCtrl', ($scope, $http) => {
	if(window.localStorage.config) {
		$scope.config = JSON.parse(window.localStorage.config);
		console.log($scope.config)
	} else {
		window.localStorage.config = JSON.stringify({
			locale: app.getLocale()
		})
	}
	$scope.locale = app.getLocale();
	$scope.locale = $scope.locale.split('-');
	$scope.locale = $scope.locale[0];
	$http.get(`lib/locales/${$scope.locale}.json`)
		.then((res) => {
			$scope.strings = res.data;
			console.log($scope.strings)
		})
})
