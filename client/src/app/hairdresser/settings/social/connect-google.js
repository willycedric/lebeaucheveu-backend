angular.module('hairdresser.settings.social.google', ['security']);
angular.module('hairdresser.settings.social.google').config(['$routeProvider', function($routeProvider){
  $routeProvider
    .when('/hairdresser/settings/google/callback', {
      resolve: {
        connect: ['$log', '$q', '$location', '$route', 'security', function($log, $q, $location, $route, security){
          var code = $route.current.params.code || '';
          var search = {};
          var promise = security.socialConnect('google', code)
            .then(function(data){
              if(data.success){
                search.success = 'true';
              }else{
                search.success = 'false';
                search.reason = data.errors[0];
              }
              return $q.reject();
            })
            .catch(function(){
              search.provider = 'google';
              search.success = search.success || 'false';
              $location.search({}); //remove search param "code" added by google
              $location.search(search);
              $location.path('/hairdresser/settings');
              return $q.reject();
            });
          return promise;
        }]
      },
      reloadOnSearch: false
    });
}]);