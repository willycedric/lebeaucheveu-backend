angular.module('hairdresser.index', ['ngRoute', 'security.authorization']);
angular.module('hairdresser.index').config(['$routeProvider', 'securityAuthorizationProvider', function($routeProvider, securityAuthorizationProvider){
  $routeProvider
    .when('/hairdresser', {
      templateUrl: 'hairdresser/hairdresser.tpl.html',
      controller: 'HairdresserCtrl',
      title: 'Hairdresser Area',
      resolve: {
        authenticatedUser: securityAuthorizationProvider.requireAuthenticatedUser
      }
    });
}]);
angular.module('hairdresser.index').controller('HairdresserCtrl', [ '$scope',
  function($scope){
    $scope.dayOfYear = moment().format('DDD');
    $scope.dayOfMonth = moment().format('D');
    $scope.weekOfYear = moment().format('w');
    $scope.dayOfWeek = moment().format('d');
    $scope.weekYear = moment().format('gg');
    $scope.hourOfDay = moment().format('H');
  }]);
