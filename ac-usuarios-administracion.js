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

    AcUsuariosController.$inject = ["UserService", "UserVars", "$timeout"];
    /**
     * @param AcUsuarios
     * @constructor
     */
    function AcUsuariosController(UserService, UserVars, $timeout) {
        var vm = this;

        vm.usuarios = [];
        vm.usuario = {};


        UserService.get().then(function (data) {
            vm.usuarios = data;
            vm.paginas = UserVars.paginas;
        });

        // Implementación de la paginación
        vm.start = 0;
        vm.end = UserVars.paginacion;
        vm.pagina = UserVars.pagina;
        vm.paginas = UserVars.paginas;

        vm.next = function () {
            vm.start = UserService.next().start;
            vm.pagina = UserVars.pagina;
        };

        vm.prev = function () {
            vm.start = UserService.prev().start;
            vm.pagina = (UserVars.pagina == 0) ? 1 : UserVars.pagina;
        };

        vm.goToPagina = function () {
            if (vm.pagina != null) {
                vm.start = UserService.goToPagina(vm.pagina).start;
                vm.pagina = UserVars.pagina + 1;
            }
        };

        vm.first = function(){
            vm.pagina = 1;
            vm.goToPagina();
        };

        vm.last = function(){
            vm.pagina = vm.paginas;
            vm.goToPagina();
        };
    }


})();
