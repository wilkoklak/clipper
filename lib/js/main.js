const {app, clipboard} = require('electron').remote;

var angApp = angular.module('mainApp', ['angularMoment']);

angApp.run((amMoment) => {
	// Ustawienie języka dla moment.js
	amMoment.changeLocale(app.getLocale());
})

angApp.controller('mainCtrl', ($scope, $http, moment, $interval) => {
	// Odczytanie aktualnej zawartości schowka
	$scope.lastClip = clipboard.readText();

	// Widoczność okna ustawień
	$scope.settingsWindow = false;

	// Sprawdzenie konfiguracji
	if(window.localStorage.config) {
		$scope.config = JSON.parse(window.localStorage.config);
		if(!$scope.config.theme) {
			$scope.config.theme = 'light';
		}
	} else {
		// W razie jej braku, zostanie utworzona
		window.localStorage.config = JSON.stringify({
			locale: app.getLocale(),
			active: true
		})
		$scope.config = JSON.parse(window.localStorage.config);
	}
	// Inicjacja pustego zbioru clipów
	$scope.clips = [];
	// Baza danych z clippami
	var db = openDatabase('clipper', '1.0', 'Lista clipów', 5 * 1024 * 1024);

	// Aktualizacja listy clippów
	$scope.update = function() {
		db.transaction((tx) => {
			$scope.clips = [];
			tx.executeSql('SELECT content, dt, rowid FROM clips ORDER BY dt DESC', [], (tx, results) => {
				var len = results.rows.length;
				for(i = 0; i < len; i++) {
					let item = results.rows.item(i);
					let clip = {
						rowid: item.rowid,
						content: item.content,
						dt: moment(item.dt)
					}
					$scope.clips.push(clip);
				}
			})
		})
	}

	// Usuwanie clippa
	$scope.delete = function(rowid) {
		db.transaction((tx) => {
			tx.executeSql('DELETE FROM clips WHERE rowid = ' + rowid);
		})
		$scope.update();
	}

	// Kopiowanie clippa
	$scope.copy = function(content) {
		$scope.lastClip = content;
		clipboard.writeText(content);
	}
	db.transaction((tx) => {
		tx.executeSql('CREATE TABLE IF NOT EXISTS clips (content, dt)');
		$scope.update();
	})

	// Pobranie listy tekstów
	$scope.setLocale = function() {
		// Ustawienie języka dla aplikacji
		$scope.locale = $scope.config.locale;
		$scope.locale = $scope.locale.split('-');
		$scope.locale = $scope.locale[0];
		$http.get(`lib/locales/${$scope.locale}.json`)
			.then((res) => {
				$scope.strings = res.data;
			})
	}
	$scope.setLocale();
	$scope.locales = ['pl', 'en'];
	$scope.themes = ['light', 'dark'];
	// Sprawdzanie schowka
	$scope.checkClipboard = function() {
		var temp = clipboard.readText();
		if($scope.config.active) {
			if(temp != $scope.lastClip) {
				var dt = new Date();
				dt = dt.getTime();
				db.transaction((tx) => {
					tx.executeSql('INSERT INTO clips (content, dt) VALUES (?, ?)', [temp, dt]);
				})
				$scope.update();
			}
		}
		$scope.lastClip = temp;
	}

	// Interwał sprawdzania schowka
	$scope.checkInterval = $interval($scope.checkClipboard, 1000);

	// Otworzenie okna ustawień
	$scope.openSettings = function() {
		$scope.settingsWindow = !$scope.settingsWindow;
	}

	// Zapisanie ustawień w localStorage
	$scope.saveSettings = function() {
		window.localStorage.config = JSON.stringify($scope.config);
		$scope.settingsWindow = false;
		$scope.setLocale();
	}
})
