const {app, clipboard} = require('electron').remote;

var angApp = angular.module('mainApp', ['angularMoment']);

angApp.controller('mainCtrl', ($scope, $http, moment, $interval, amMoment) => {
	$scope.firstSessionRun = true; // Pierwsza iteracja podczas sesji, głównie do animacji
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
			active: true,
			theme: 'light'
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
					var fade;
					if($scope.firstSessionRun) {
						fade = 0;
						if(i == len - 1) {
							$scope.firstSessionRun = false;
						}
					} else {
						fade = 1;
					}
					let item = results.rows.item(i);
					var clip = {
						rowid: item.rowid,
						content: item.content,
						dt: moment(item.dt),
						fade: fade
					}
					// clip.fade jest dla animacji, 0 kiedy nowo dodany, 1 kiedy bez zmian, 2 kiedy usuwany
					$scope.clips.push(clip);
				}
			})
		})
	}

	// Usuwanie clippa
	$scope.delete = function(rowid) {
		for(i = 0; i < $scope.clips.length; i++) {
			var clip = $scope.clips[i];
			if(clip.rowid == rowid) {
				$scope.clips[i].fade = 2;
				setTimeout(() => {
					$scope.update();
				}, 1000)
			}
		}
		db.transaction((tx) => {
			tx.executeSql('DELETE FROM clips WHERE rowid = ' + rowid);
		})
	}

	// Kopiowanie clippa
	$scope.copy = function(content) {
		$scope.lastClip = content;
		clipboard.writeText(content);
	}
	// Utworzenie tabeli jeśli nie istnieje
	db.transaction((tx) => {
		tx.executeSql('CREATE TABLE IF NOT EXISTS clips (content, dt)');
		// $scope.update();
	})
	$scope.addClip = function(clip) {
		if($scope.firstSessionRun) {
			$scope.firstSessionRun = false;
		}
		clip.fade = 0;
		clip.dt = moment(clip.dt);
		$scope.clips.unshift(clip);
	}
	// Pobranie listy tekstów
	$scope.setLocale = function() {
		amMoment.changeLocale($scope.config.locale);
		// Ustawienie języka dla aplikacji
		$scope.locale = $scope.config.locale;
		$scope.locale = $scope.locale.split('-');
		$scope.locale = $scope.locale[0];
		$http.get(`lib/locales/${$scope.locale}.json`)
			.then((res) => {
				$scope.strings = res.data;
			})
		$scope.update();
	}
	// Ustaw język
	$scope.setLocale();
	// Lista języków (dla ustawień)
	$scope.locales = ['pl', 'en'];
	// Lista motywów (dla ustawień)
	$scope.themes = ['light', 'dark'];
	// Sprawdzanie schowka
	$scope.checkClipboard = function() {
		var temp = clipboard.readText();
		if($scope.config.active) {
			if(temp != $scope.lastClip && temp.trim() != "") {
				var dt = new Date(), rowid;
				dt = dt.getTime();
				db.transaction((tx) => {
					tx.executeSql('INSERT INTO clips (content, dt) VALUES (?, ?)', [temp, dt], (tx, r) => {
						rowid = r.insertId;
						$scope.addClip({content: temp, dt: dt, rowid: rowid});
					});
				})

			}
		}
		// Ustaw zawartość schowka na odczytaną nawet kiedy clipper ma być niekatywny
		// Zapobiegnie to zapisaniu wartości z czasu niekatywności, kiedy użytkownik ponownie aktywuje clippera
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
