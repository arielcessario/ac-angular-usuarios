(function () {
    'use strict';

    var scripts = document.getElementsByTagName("script");
    var currentScriptPath = scripts[scripts.length - 1].src;

    if (currentScriptPath.length == 0) {
        currentScriptPath = window.installPath + '/ac-angular-usuarios/includes/ac-usuarios.php';
    }

    angular.module('acUsuarios', [])
        .config(function Config($httpProvider, jwtInterceptorProvider) {
            // Please note we're annotating the function so that the $injector works when the file is minified
            jwtInterceptorProvider.tokenGetter = [function() {
                console.log('entra');
                return localStorage.getItem(window.app);
            }];

            $httpProvider.interceptors.push('jwtInterceptor');
        })
        //.config(['$routeProvider', 'jwtInterceptorProvider', '$httpProvider',
        //    function ($routeProvider, jwtInterceptorProvider, $httpProvider) {
        //
        //        jwtInterceptorProvider.tokenGetter = function (store) {
        //            return store.get(window.app);
        //        };
        //        $httpProvider.interceptors.push('jwtInterceptor');
        //    }])
        .run(function ($rootScope, jwtHelper, $location, UserVars) {
            // Para activar la seguridad en una vista, agregar data:{requiresLogin:false} dentro de $routeProvider.when


            $rootScope.$on('$routeChangeStart', function (e, to) {
                if (to && to.data && to.data.requiresLogin) {
                    if (!localStorage.getItem(window.app)) {
                        e.preventDefault();
                        $location.path(UserVars.loginPath);
                    }
                }
            });
        })
        .factory('UserService', UserService)
        .service('UserVars', UserVars)
        .component('usuarioLogin', usuarioLogin())
        .component('usuarioLogout', usuarioLogout())
    ;

    function usuarioLogin() {
        return {
            bindings: {
                'sucursales': '=',
                'cajas': '=',
                'redirect': '='
            },
            templateUrl: window.installPath + '/ac-angular-usuarios/ac-usuarios-login.html',
            controller: AcLoginController
        }
    }

    AcLoginController.$inject = ["UserService", '$location'];
    /**
     * @param UserService
     * @param $location
     * @constructor
     */
    function AcLoginController(UserService, $location) {
        var vm = this;
        vm.email = '';
        vm.password = '';
        vm.sucursal = {sucursal_id: -1};
        vm.caja = {caja_id: -1};
        vm.dir = (vm.redirect == undefined) ? '/' : vm.redirect;

        vm.login = login;
        vm.loginFacebook = loginFacebook;
        vm.loginGoogle = loginGoogle;

        function login() {
            UserService.login(vm.email, vm.password, vm.sucursal.sucursal_id, vm.caja.caja_id).then(function (data) {
                $location.path(vm.dir);
            })
        }

        function loginFacebook() {

        }

        function loginGoogle() {
            UserService.loginGoogle(function (data) {
                $location.path(vm.dir);
            })
        }


    }

    function usuarioLogout() {
        return {
            bindings: {
                'redirect': '='
            },
            template: '<button class="ac-usuarios-logout" ng-click="$ctrl.logout()">{{"LOGOUT"|xlat}}</button>',
            controller: AcLogoutController
        }
    }

    AcLogoutController.$inject = ["UserService", '$location'];
    /**
     * @param $scope
     * @constructor
     */
    function AcLogoutController(UserService, $location) {
        var vm = this;
        vm.dir = (vm.redirect == undefined) ? '/' : vm.redirect;
        vm.logout = logout;

        function logout() {
            UserService.logout(function () {
                $location.path(vm.dir);
            });

        }
    }


    UserService.$inject = ['$http', 'UserVars', '$cacheFactory', 'AcUtils', 'jwtHelper', 'auth', 'ErrorHandler', '$q'];
    function UserService($http, UserVars, $cacheFactory, AcUtils, jwtHelper, auth, ErrorHandler, $q) {
        //Variables
        var service = {};

        var url = currentScriptPath.replace('ac-usuarios.js', '/includes/ac-usuarios.php');

        //Function declarations
        service.getLogged = getLogged;
        service.getFromToken = getFromToken;
        service.setLogged = setLogged;
        service.checkLastLogin = checkLastLogin;

        service.create = create;
        service.createFromSocial = createFromSocial;
        service.remove = remove;
        service.update = update;


        service.get = get;
        service.getDeudores = getDeudores;
        service.getDeudorById = getDeudorById;
        service.getById = getById;
        service.getByParams = getByParams;


        service.login = login;
        service.loginSocial = loginSocial;
        service.loginFacebook = loginFacebook;
        service.loginGoogle = loginGoogle;
        service.logout = logout;

        service.userExist = userExist;
        service.forgotPassword = forgotPassword;
        service.changePassword = changePassword;

        service.goToPagina = goToPagina;
        service.next = next;
        service.prev = prev;

        return service;

        //Functions
        /**
         * @description Obtiene un deudor espec�fico
         * @param id
         * @param callback
         */
        function getDeudorById(id, callback) {
            getDeudores(function (data) {
                var response = data.filter(function (elem, index, array) {
                    return id = elem.usuario_id;
                })[0];

                callback(response);
            })
        }

        /**
         * Obtiene todo los deudores
         * @param callback
         * @returns {*}
         */
        function getDeudores(callback) {
            return $http.post(url, {'function': 'getDeudores'})
                .success(function (data) {
                    callback(data);
                })
                .error(function (data) {
                    callback(data);
                });
        }


        /**
         *
         * @description Retorna la lista filtrada de productos
         * @param param -> String, separado por comas (,) que contiene la lista de par�metros de b�squeda, por ej: nombre, sku, tienen que ser el mismo nombre que en la base
         * @param value -> termino a buscar
         * @param exact_match -> true, busca la palabra exacta, false, busca si el termino aparece
         * @param callback
         */
        function getByParams(params, values, exact_match, callback) {
            get(function (data) {
                AcUtils.getByParams(params, values, exact_match, data, callback);
            })
        }


        /** @name: remove
         * @param usuario_id, callback
         * @description: Elimina el usuario seleccionado.
         */
        function remove(usuario_id, callback) {
            return $http.post(url,
                {'function': 'remove', 'usuario_id': usuario_id})
                .success(function (data) {
                    //console.log(data);
                    if (data !== 'false') {
                        UserVars.clearCache = true;
                        callback(data);
                    }
                })
                .error(function (data) {
                    callback(data);
                })
        }

        /** @name: get
         * @param callback
         * @description: Retorna todos los usuario de la base.
         */
        function get() {
            var urlGet = url + '?function=get';
            var $httpDefaultCache = $cacheFactory.get('$http');
            var cachedData = [];

            // Verifica si existe el cache de usuarios
            if ($httpDefaultCache.get(urlGet) != undefined) {
                if (UserVars.clearCache) {
                    $httpDefaultCache.remove(urlGet);
                }
                else {
                    var deferred = $q.defer();
                    cachedData = $httpDefaultCache.get(urlGet);
                    deferred.resolve(cachedData);
                    return deferred.promise;
                }
            }


            return $http.get(urlGet, {cache: true})
                .then(function (response) {
                    $httpDefaultCache.put(urlGet, response.data);
                    UserVars.clearCache = false;
                    UserVars.paginas = (response.data.length % UserVars.paginacion == 0) ? parseInt(response.data.length / UserVars.paginacion) : parseInt(response.data.length / UserVars.paginacion) + 1;
                    return response.data;
                })
                .catch(function (response) {
                    ErrorHandler(response);
                });

        }

        /** @name: getById
         * @param id
         * @param callback
         * @description: Retorna el usuario que tenga el id enviado.
         */
        function getById(id, callback) {
            get(function (data) {
                var response = data.filter(function (elem, index, array) {
                    return elem.usuario_id == id;
                })[0];
                callback(response);
            });
        }

        /**
         * todo: Hay que definir si vale la pena
         */
        function checkLastLogin() {

        }


        /** @name: userExist
         * @param mail
         * @description: Verifica que el mail no exista en la base.
         */
        function userExist(mail, callback) {
            return $http.post(url,
                {'function': 'userExist', 'mail': mail})
                .success(function (data) {
                    callback(data);
                })
                .error(function (data) {
                })
        }

        /**
         * Realiza logout
         */
        function logout(callback) {
            localStorage.removeItem(window.app);
            UserVars.clearCache = true;
            callback();
        }


        /**
         *
         * @description: realiza login
         * @param mail
         * @param password
         * @param sucursal_id
         * @param caja_id
         * @returns {*}
         */
        function login(mail, password, sucursal_id, caja_id) {

            return $http.post(url,
                {
                    'function': 'login',
                    'mail': mail,
                    'password': password,
                    'sucursal_id': sucursal_id,
                    'caja_id': caja_id
                })
                .then(function (response) {
                    console.log(response.data);
                    localStorage.setItem(window.app, response.data.token);
                    return response.data;
                })
                .catch(function (response) {
                    ErrorHandler(response);
                })
        }

        /**
         * @description Login directo a partir de los datos obtenidos socialamente
         * @param user
         * @param token
         */
        function loginSocial(user, token) {
            $http.post(url, {'function': 'loginSocial', 'token': token, 'user': JSON.stringify(user)})
                .success(function (data) {
                    if (data != -1) {
                        localStorage.setItem(window.appName, data.token);
                    }
                    callback_social(data);
                })
                .error(function (data) {
                    callback_social(data);
                })

        }


        /**
         * @description function intermedia para poder seguir utilizando el callback del llamador en loginSocial
         * @param data
         */
        var callback_social = function (data) {
        };


        /**
         * @description Login para facebook
         * @param callback
         */
        function loginFacebook(callback) {

            callback_social = callback;
            auth.signin({
                popup: true,
                connections: ['facebook'],
                scope: 'openid name email'
            }, onLoginSuccess, onLoginFailed);
        }


        /**
         * @description Login para gmail
         * @param callback
         */
        function loginGoogle(callback) {

            callback_social = callback;
            auth.signin({
                popup: true,
                connections: ['google-oauth2'],
                scope: 'openid name email'
            }, onLoginSuccess, onLoginFailed);
        }

        /**
         * @description Callback para la respuesta positiva del login con face o gmail
         * @param profile
         * @param token
         */
        function onLoginSuccess(profile, token) {
            userExist(profile.email, function (data) {

                if (data > 0) {
                    var user = {
                        mail: profile.email
                    };
                    $http.post(url, {'function': 'loginSocial', 'token': token, 'user': JSON.stringify(user)})
                        .success(function (data) {
                            if (data != -1) {
                                localStorage.setItem(window.app, data.token);
                            }
                            callback_social(data);
                        })
                        .error(function (data) {
                            callback_social(data);
                        })
                } else {
                    // El usuario no existe, lo mando a creación y asigno lo que me devolvió el login
                    UserVars.user_social = profile;
                    UserVars.token_social = token;
                    callback_social(data);

                }
            });

        }


        /**
         * @description Callback para la respuesta negativa del login con face o gmail
         * @param profile
         * @param token
         */
        function onLoginFailed(data) {
            callback_social(data);
            //$scope.message.text = 'invalid credentials';
        }


        /**
         * @description Crea un usuario a partir de los datos sociales
         * @param usuario
         * @param callback
         * @returns {*}
         */
        function createFromSocial(usuario, callback) {
            return $http.post(url,
                {
                    'function': 'create',
                    'user': JSON.stringify(usuario)
                })
                .success(function (data) {
                    UserVars.clearCache = true;
                    callback(data);
                })
                .error(function (data) {
                    UserVars.clearCache = true;
                    callback(data);
                });
        }

        /**
         * @description: Crea un usuario.
         * @param usuario
         * @param callback
         * @returns {*}
         */
        function create(usuario, callback) {
            return $http.post(url,
                {
                    'function': 'create',
                    'user': JSON.stringify(usuario)
                })
                .success(function (data) {
                    UserVars.clearCache = true;
                    callback(data);
                })
                .error(function (data) {
                    UserVars.clearCache = true;
                    callback(data);
                });
        }

        /** @name: getLogged
         * @description: Retorna si existe una cookie de usuario.
         */
        function getLogged() {
            //var globals = $cookieStore.get(window.appName);
            //
            //if (globals !== undefined) {
            //    return globals;
            //} else {
            //    return false;
            //}
        }


        /** @name: getFromToken
         * @description: Retorna si existe un token de usuario.
         */
        function getFromToken() {
            var globals = localStorage.getItem(window.app);

            if (globals !== undefined && globals !== null) {
                return jwtHelper.decodeToken(globals);
            } else {
                return false;
            }
        }

        /** @name: setLogged
         * @param user
         * @description: Setea al usuario en una cookie. No est� agregado al login ya que no en todos los casos se necesita cookie.
         */
        function setLogged(user) {
            //$cookieStore.put(window.appName, user);
        }

        /**
         * @description Cambia una contrase�a
         * @param usuario_id
         * @param pass_old
         * @param pass_new
         * @param callback
         * @returns {*}
         */
        function changePassword(usuario_id, pass_old, pass_new, callback) {
            return $http.post(url,
                {
                    'function': 'changePassword',
                    usuario_id: usuario_id,
                    pass_old: pass_old,
                    pass_new: pass_new
                })
                .success(function (data) {
                    UserVars.clearCache = true;
                    callback(data);
                })
                .error(function (data) {
                    callback(data);
                })
        }


        /** @name: update
         * @param usuario
         * @param callback
         * @description: Realiza update al usuario.
         */
        function update(usuario, callback) {
            return $http.post(url,
                {
                    'function': 'update',
                    'user': JSON.stringify(usuario)
                })
                .success(function (data) {
                    UserVars.clearCache = true;
                    callback(data);
                })
                .error(function (data) {
                    console.log(data);
                    callback(data);
                });
        }


        /** @name: forgotPassword
         * @param email
         * @description: Genera y reenvia el pass al usuario.
         */
        function forgotPassword(email, callback) {
            return $http.post(url,
                {
                    'function': 'forgotPassword',
                    'email': email
                })
                .success(function (data) {
                    callback(data);
                })
                .error(function (data) {
                    callback(data);
                });
        }

        /**
         * Para el uso de la p�ginaci�n, definir en el controlador las siguientes variables:
         *
         vm.start = 0;
         vm.pagina = UserVars.pagina;
         UserVars.paginacion = 5; Cantidad de registros por p�gina
         vm.end = UserVars.paginacion;


         En el HTML, en el ng-repeat agregar el siguiente filtro: limitTo:appCtrl.end:appCtrl.start;

         Agregar un bot�n de next:
         <button ng-click="appCtrl.next()">next</button>

         Agregar un bot�n de prev:
         <button ng-click="appCtrl.prev()">prev</button>

         Agregar un input para la p�gina:
         <input type="text" ng-keyup="appCtrl.goToPagina()" ng-model="appCtrl.pagina">

         */


        /**
         * @description: Ir a p�gina
         * @param pagina
         * @returns {*}
         * uso: agregar un m�todo
         vm.goToPagina = function () {
                vm.start= UserService.goToPagina(vm.pagina).start;
            };
         */
        function goToPagina(pagina) {
            if (isNaN(pagina) || pagina < 1) {
                UserVars.pagina = 1;
                return UserVars;
            }

            if (pagina > UserVars.paginas) {
                UserVars.pagina = UserVars.paginas;
                return UserVars;
            }

            UserVars.pagina = pagina - 1;
            UserVars.start = UserVars.pagina * UserVars.paginacion;
            return UserVars;
        }

        /**
         * @name next
         * @description Ir a pr�xima p�gina
         * @returns {*}
         * uso agregar un metodo
         vm.next = function () {
                vm.start = UserService.next().start;
                vm.pagina = UserVars.pagina;
            };
         */
        function next() {
            if (UserVars.pagina + 1 > UserVars.paginas) {
                return UserVars;
            }
            UserVars.start = (UserVars.pagina * UserVars.paginacion);
            UserVars.pagina = UserVars.pagina + 1;
            //UserVars.end = UserVars.start + UserVars.paginacion;
            return UserVars;
        }

        /**
         * @name previous
         * @description Ir a p�gina anterior
         * @returns {*}
         * uso, agregar un m�todo
         vm.prev = function () {
                vm.start= UserService.prev().start;
                vm.pagina = UserVars.pagina;
            };
         */
        function prev() {
            if (UserVars.pagina - 2 < 0) {
                return UserVars;
            }

            //UserVars.end = UserVars.start;
            UserVars.start = (UserVars.pagina - 2 ) * UserVars.paginacion;
            UserVars.pagina = UserVars.pagina - 1;
            return UserVars;
        }


    }


    UserVars.$inject = [];
    /**
     *
     * @constructor
     */
    function UserVars() {
        // Cantidad de p�ginas total del recordset
        this.paginas = 1;
        // P�gina seleccionada
        this.pagina = 1;
        // Cantidad de registros por p�gina
        this.paginacion = 10;
        // Registro inicial, no es p�gina, es el registro
        this.start = 0;

        // Usuario temporal Social
        this.user_social = {};
        this.token_social = '';

        // Indica si se debe limpiar el cach� la pr�xima vez que se solicite un get
        this.clearCache = true;

        // Path al login
        this.loginPath = '/login';
    }

})();