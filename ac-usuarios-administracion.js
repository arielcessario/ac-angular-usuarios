(function () {
    'use strict';

    angular.module('acUsuariosAdministracion', [])
        .component('acUsuariosAdministracion', acUsuariosAdministracion());

    function acUsuariosAdministracion() {
        return {
            bindings: {
                searchFunction: '&'
            },
            templateUrl: window.installPath + '/ac-angular-usuarios/ac-usuarios-administracion.html',
            controller: AcUsuariosController
        }
    }

    AcUsuariosController.$inject = ["UserVars", 'UserService', "AcUtils"];
    /**
     * @param AcUsuarios
     * @constructor
     */
    function AcUsuariosController(UserVars, UserService, AcUtils) {
        var vm = this;

        vm.usuarios = [];
        vm.usuario = {};


        UserService.get().then(function (data) {


            vm.usuarios = data;
            vm.paginas = UserVars.paginas;
        });

        // Implementación de la paginación
        vm.start = 0;
        vm.limit = UserVars.paginacion;
        vm.pagina = UserVars.pagina;
        vm.paginas = UserVars.paginas;
        function paginar(vars) {
            vm.start = vars.start;
            vm.pagina = vars.pagina;
        }

        vm.next = function () {
            paginar(AcUtils.next(UserVars));
        };
        vm.prev = function () {
            paginar(AcUtils.prev(UserVars));
        };
        vm.first = function () {
            paginar(AcUtils.first(UserVars));
        };
        vm.last = function () {
            paginar(AcUtils.last(UserVars));
        };

        vm.goToPagina = function (pagina) {
            paginar(AcUtils.goToPagina(pagina, UserVars));
        }

    }


})();
