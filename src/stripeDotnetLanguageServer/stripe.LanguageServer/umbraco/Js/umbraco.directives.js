(function () {
    'use strict';
    angular.module('umbraco.directives', [
        'umbraco.directives.editors',
        'umbraco.directives.html',
        'umbraco.directives.validation',
        'ui.sortable'
    ]);
    angular.module('umbraco.directives.editors', []);
    angular.module('umbraco.directives.html', []);
    angular.module('umbraco.directives.validation', []);
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:navResize
* @restrict A
 *
 * @description
 * Handles how the navigation responds to window resizing and controls how the draggable resize panel works
**/
    angular.module('umbraco.directives').directive('navResize', function (appState, eventsService, windowResizeListener) {
        return {
            restrict: 'A',
            link: function link(scope, element, attrs, ctrl) {
                var minScreenSize = 1100;
                var resizeEnabled = false;
                function setTreeMode() {
                    appState.setGlobalState('showNavigation', appState.getGlobalState('isTablet') === false);
                }
                function enableResize() {
                    //only enable when the size is correct and it's not already enabled
                    if (!resizeEnabled && appState.getGlobalState('isTablet') === false) {
                        element.resizable({
                            containment: $('#mainwrapper'),
                            autoHide: true,
                            handles: 'e',
                            alsoResize: '.navigation-inner-container',
                            resize: function resize(e, ui) {
                                var wrapper = $('#mainwrapper');
                                var contentPanel = $('#contentwrapper');
                                var umbNotification = $('#umb-notifications-wrapper');
                                var bottomBar = contentPanel.find('.umb-bottom-bar');
                                var navOffeset = $('#navOffset');
                                var leftPanelWidth = ui.element.width();
                                contentPanel.css({ left: leftPanelWidth });
                                bottomBar.css({ left: leftPanelWidth });
                                umbNotification.css({ left: leftPanelWidth });
                                navOffeset.css({ 'margin-left': ui.element.outerWidth() });
                            },
                            stop: function stop(e, ui) {
                            }
                        });
                        resizeEnabled = true;
                    }
                }
                function resetResize() {
                    if (resizeEnabled) {
                        //kill the resize
                        element.resizable('destroy');
                        element.css('width', '');
                        var navInnerContainer = element.find('.navigation-inner-container');
                        navInnerContainer.css('width', '');
                        $('#contentwrapper').css('left', '');
                        $('#umb-notifications-wrapper').css('left', '');
                        $('#navOffset').css('margin-left', '');
                        resizeEnabled = false;
                    }
                }
                var evts = [];
                //Listen for global state changes
                evts.push(eventsService.on('appState.globalState.changed', function (e, args) {
                    if (args.key === 'showNavigation') {
                        if (args.value === false) {
                            resetResize();
                        } else {
                            enableResize();
                        }
                    }
                }));
                var resizeCallback = function resizeCallback(size) {
                    //set the global app state
                    appState.setGlobalState('isTablet', size.width <= minScreenSize);
                    setTreeMode();
                };
                windowResizeListener.register(resizeCallback);
                //ensure to unregister from all events and kill jquery plugins
                scope.$on('$destroy', function () {
                    windowResizeListener.unregister(resizeCallback);
                    for (var e in evts) {
                        eventsService.unsubscribe(evts[e]);
                    }
                    var navInnerContainer = element.find('.navigation-inner-container');
                    navInnerContainer.resizable('destroy');
                });
                //init
                //set the global app state
                appState.setGlobalState('isTablet', $(window).width() <= minScreenSize);
                setTreeMode();
            }
        };
    });
    'use strict';
    (function () {
        'use strict';
        function AppHeaderDirective(eventsService, appState, userService, focusService) {
            function link(scope, el, attr, ctrl) {
                var evts = [];
                // the null is important because we do an explicit bool check on this in the view
                // the avatar is by default the umbraco logo
                scope.authenticated = null;
                scope.user = null;
                scope.avatar = [
                    { value: 'assets/img/application/logo.png' },
                    { value: 'assets/img/application/logo@2x.png' },
                    { value: 'assets/img/application/logo@3x.png' }
                ];
                // when a user logs out or timesout
                evts.push(eventsService.on('app.notAuthenticated', function () {
                    scope.authenticated = false;
                    scope.user = null;
                }));
                // when the application is ready and the user is authorized setup the data
                evts.push(eventsService.on('app.ready', function (evt, data) {
                    scope.authenticated = true;
                    scope.user = data.user;
                    if (scope.user.avatars) {
                        scope.avatar = [];
                        if (angular.isArray(scope.user.avatars)) {
                            for (var i = 0; i < scope.user.avatars.length; i++) {
                                scope.avatar.push({ value: scope.user.avatars[i] });
                            }
                        }
                    }
                }));
                evts.push(eventsService.on('app.userRefresh', function (evt) {
                    userService.refreshCurrentUser().then(function (data) {
                        scope.user = data;
                        if (scope.user.avatars) {
                            scope.avatar = [];
                            if (angular.isArray(scope.user.avatars)) {
                                for (var i = 0; i < scope.user.avatars.length; i++) {
                                    scope.avatar.push({ value: scope.user.avatars[i] });
                                }
                            }
                        }
                    });
                }));
                scope.rememberFocus = focusService.rememberFocus;
                scope.searchClick = function () {
                    var showSearch = appState.getSearchState('show');
                    appState.setSearchState('show', !showSearch);
                };
                // toggle the help dialog by raising the global app state to toggle the help drawer
                scope.helpClick = function () {
                    var showDrawer = appState.getDrawerState('showDrawer');
                    var drawer = {
                        view: 'help',
                        show: !showDrawer
                    };
                    appState.setDrawerState('view', drawer.view);
                    appState.setDrawerState('showDrawer', drawer.show);
                };
                scope.avatarClick = function () {
                    if (!scope.userDialog) {
                        scope.userDialog = {
                            view: 'user',
                            show: true,
                            close: function close(oldModel) {
                                scope.userDialog.show = false;
                                scope.userDialog = null;
                            }
                        };
                    } else {
                        scope.userDialog.show = false;
                        scope.userDialog = null;
                    }
                };
            }
            var directive = {
                transclude: true,
                restrict: 'E',
                replace: true,
                template: '<div><div class="umb-app-header"><umb-sections ng-if="authenticated" sections="sections"></umb-sections><div class="flex items-center"><ul class="umb-app-header__actions"><li data-element="global-search" class="umb-app-header__action"><button class="umb-app-header__button btn-reset" hotkey="ctrl+space" ng-click="searchClick()" ng-mousedown="rememberFocus()" prevent-default style="font-size: 20px;"><span class="sr-only">Open/Close backoffice search</span> <i class="umb-app-header__action-icon icon-search"></i></button></li><li data-element="global-help" class="umb-app-header__action"><button class="umb-app-header__button btn-reset" hotkey="ctrl+shift+h" ng-click="helpClick()" prevent-default><span class="sr-only">Open/Close backoffice help window</span> <i class="umb-app-header__action-icon icon-help-alt"></i></button></li><li data-element="global-user" class="umb-app-header__action"><button class="umb-app-header__button btn-reset" ng-click="avatarClick()" hotkey="ctrl+shift+u" title="{{user.name}}" aria-label="Open/Close your profile options window" prevent-default><umb-avatar class="umb-app-header__action-icon" size="xxs" color="secondary" name="{{user.name}}" img-src="{{avatar[0].value}}" img-srcset="{{avatar[1].value}} 2x, {{avatar[2].value}} 3x"></umb-avatar></button></li></ul></div></div><umb-overlay data-element="overlay-user" ng-if="userDialog.show" model="userDialog" view="userDialog.view" position="right"></umb-overlay></div>',
                link: link,
                scope: {}
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbAppHeader', AppHeaderDirective);
    }());
    'use strict';
    (function () {
        'use strict';
        function BackdropDirective($timeout, $http) {
            function link(scope, el, attr, ctrl) {
                var events = [];
                scope.clickBackdrop = function (event) {
                    if (scope.disableEventsOnClick === true) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                };
                function onInit() {
                    if (scope.highlightElement) {
                        setHighlight();
                    }
                }
                function setHighlight() {
                    scope.loading = true;
                    $timeout(function () {
                        // The element to highlight
                        var highlightElement = angular.element(scope.highlightElement);
                        if (highlightElement && highlightElement.length > 0) {
                            var offset = highlightElement.offset();
                            var width = highlightElement.outerWidth();
                            var height = highlightElement.outerHeight();
                            // Rounding numbers
                            var topDistance = offset.top.toFixed();
                            var topAndHeight = (offset.top + height).toFixed();
                            var leftDistance = offset.left.toFixed();
                            var leftAndWidth = (offset.left + width).toFixed();
                            // The four rectangles
                            var rectTop = el.find('.umb-backdrop__rect--top');
                            var rectRight = el.find('.umb-backdrop__rect--right');
                            var rectBottom = el.find('.umb-backdrop__rect--bottom');
                            var rectLeft = el.find('.umb-backdrop__rect--left');
                            // Add the css
                            scope.rectTopCss = {
                                'height': topDistance,
                                'left': leftDistance + 'px',
                                opacity: scope.backdropOpacity
                            };
                            scope.rectRightCss = {
                                'left': leftAndWidth + 'px',
                                'top': topDistance + 'px',
                                'height': height,
                                opacity: scope.backdropOpacity
                            };
                            scope.rectBottomCss = {
                                'height': '100%',
                                'top': topAndHeight + 'px',
                                'left': leftDistance + 'px',
                                opacity: scope.backdropOpacity
                            };
                            scope.rectLeftCss = {
                                'width': leftDistance,
                                opacity: scope.backdropOpacity
                            };
                            // Prevent interaction in the highlighted area
                            if (scope.highlightPreventClick) {
                                var preventClickElement = el.find('.umb-backdrop__highlight-prevent-click');
                                preventClickElement.css({
                                    'width': width,
                                    'height': height,
                                    'left': offset.left,
                                    'top': offset.top
                                });
                            }
                        }
                        scope.loading = false;
                    });
                }
                function resize() {
                    setHighlight();
                }
                events.push(scope.$watch('highlightElement', function (newValue, oldValue) {
                    if (!newValue) {
                        return;
                    }
                    if (newValue === oldValue) {
                        return;
                    }
                    setHighlight();
                }));
                $(window).on('resize.umbBackdrop', resize);
                scope.$on('$destroy', function () {
                    // unbind watchers
                    for (var e in events) {
                        events[e]();
                    }
                    $(window).off('resize.umbBackdrop');
                });
                onInit();
            }
            var directive = {
                transclude: true,
                restrict: 'E',
                replace: true,
                template: '<div class="umb-backdrop" ng-click="clickBackdrop($event)"><div ng-if="highlightElement && !loading" class="umb-backdrop__backdrop"><div class="umb-backdrop__rect umb-backdrop__rect--top" ng-style="rectTopCss"></div><div class="umb-backdrop__rect umb-backdrop__rect--right" ng-style="rectRightCss"></div><div class="umb-backdrop__rect umb-backdrop__rect--bottom" ng-style="rectBottomCss"></div><div class="umb-backdrop__rect umb-backdrop__rect--left" ng-style="rectLeftCss"></div></div><div ng-if="!highlightElement || loading" class="umb-backdrop__backdrop"><div class="umb-backdrop__rect" ng-style="{\'opacity\': backdropOpacity }"></div></div><div ng-if="highlightPreventClick" class="umb-backdrop__highlight-prevent-click"></div></div>',
                link: link,
                scope: {
                    backdropOpacity: '=?',
                    highlightElement: '=?',
                    highlightPreventClick: '=?',
                    disableEventsOnClick: '=?'
                }
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbBackdrop', BackdropDirective);
    }());
    'use strict';
    angular.module('umbraco.directives').directive('umbContextMenu', function (navigationService, keyboardService) {
        return {
            scope: {
                menuDialogTitle: '@',
                currentSection: '@',
                currentNode: '=',
                menuActions: '='
            },
            restrict: 'E',
            replace: true,
            template: '<div on-outside-click="outSideClick()"><div class="umb-modalcolumn-header"><h1>{{menuDialogTitle}}</h1></div><div class="umb-modalcolumn-body"><ul class="umb-actions"><li data-element="action-{{action.alias}}" ng-click="executeMenuItem(action)" class="umb-action" ng-class="{sep:action.separator, \'-opens-dialog\': action.opensDialog}" ng-repeat="action in menuActions"><button class="umb-action-link btn-reset umb-outline" prevent-default umb-auto-focus ng-if="$index === 0"><i class="icon icon-{{action.cssclass}}"></i> <span class="menu-label">{{action.name}}</span></button> <button class="umb-action-link btn-reset umb-outline" prevent-default ng-if="$index !== 0"><i class="icon icon-{{action.cssclass}}"></i> <span class="menu-label">{{action.name}}</span></button></li></ul></div></div>',
            link: function link(scope, element, attrs, ctrl) {
                //adds a handler to the context menu item click, we need to handle this differently
                //depending on what the menu item is supposed to do.
                scope.executeMenuItem = function (action) {
                    navigationService.executeMenuAction(action, scope.currentNode, scope.currentSection);
                };
                scope.outSideClick = function () {
                    navigationService.hideNavigation();
                };
                keyboardService.bind('esc', function () {
                    navigationService.hideNavigation();
                });
                //ensure to unregister from all events!
                scope.$on('$destroy', function () {
                    keyboardService.unbind('esc');
                });
            }
        };
    });
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbDrawer
@restrict E
@scope

@description
The drawer component is a global component and is already added to the umbraco markup. It is registered in globalState and can be opened and configured by raising events.

<h3>Markup example - how to open the drawer</h3>
<pre>
    <div ng-controller="My.DrawerController as vm">

        <umb-button
            type="button"
            label="Toggle drawer"
            action="vm.toggleDrawer()">
        </umb-button>

    </div>
</pre>

<h3>Controller example - how to open the drawer</h3>
<pre>
    (function () {
        "use strict";

        function DrawerController(appState) {

            var vm = this;

            vm.toggleDrawer = toggleDrawer;

            function toggleDrawer() {

                var showDrawer = appState.getDrawerState("showDrawer");            

                var model = {
                    firstName: "Super",
                    lastName: "Man"
                };

                appState.setDrawerState("view", "/App_Plugins/path/to/drawer.html");
                appState.setDrawerState("model", model);
                appState.setDrawerState("showDrawer", !showDrawer);
                
            }

        }

        angular.module("umbraco").controller("My.DrawerController", DrawerController);

    })();
</pre>

<h3>Use the following components in the custom drawer to render the content</h3>
<ul>
    <li>{@link umbraco.directives.directive:umbDrawerView umbDrawerView}</li>
    <li>{@link umbraco.directives.directive:umbDrawerHeader umbDrawerHeader}</li>
    <li>{@link umbraco.directives.directive:umbDrawerView umbDrawerContent}</li>
    <li>{@link umbraco.directives.directive:umbDrawerFooter umbDrawerFooter}</li>
</ul>

@param {string} view (<code>binding</code>): Set the drawer view
@param {string} model (<code>binding</code>): Pass in custom data to the drawer

**/
    function Drawer($location, $routeParams, helpService, userService, localizationService, dashboardResource) {
        return {
            restrict: 'E',
            // restrict to an element
            replace: true,
            // replace the html element with the template
            template: '<div class="umb-drawer"><div style="height: 100%;" ng-if="configuredView" ng-include="configuredView"></div></div>',
            transclude: true,
            scope: {
                view: '=?',
                model: '=?'
            },
            link: function link(scope, element, attr, ctrl) {
                function onInit() {
                    setView();
                }
                function setView() {
                    if (scope.view) {
                        //we do this to avoid a hidden dialog to start loading unconfigured views before the first activation
                        var configuredView = scope.view;
                        if (scope.view.indexOf('.html') === -1) {
                            var viewAlias = scope.view.toLowerCase();
                            configuredView = 'views/common/drawers/' + viewAlias + '/' + viewAlias + '.html';
                        }
                        if (configuredView !== scope.configuredView) {
                            scope.configuredView = configuredView;
                        }
                    }
                }
                onInit();
            }
        };
    }
    angular.module('umbraco.directives').directive('umbDrawer', Drawer);
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbDrawerContent
@restrict E
@scope

@description
Use this directive to render drawer content

<h3>Markup example</h3>
<pre>
	<umb-drawer-view>
        
        <umb-drawer-header
            title="Drawer Title"
            description="Drawer description">
        </umb-drawer-header>

        <umb-drawer-content>
            <!-- Your content here -->
            <pre>{{ model | json }}</pre>
        </umb-drawer-content>

        <umb-drawer-footer>
            <!-- Your content here -->
        </umb-drawer-footer>

	</umb-drawer-view>
</pre>


<h3>Use in combination with</h3>
<ul>
    <li>{@link umbraco.directives.directive:umbDrawerView umbDrawerView}</li>
    <li>{@link umbraco.directives.directive:umbDrawerHeader umbDrawerHeader}</li>
    <li>{@link umbraco.directives.directive:umbDrawerFooter umbDrawerFooter}</li>
</ul>

**/
    (function () {
        'use strict';
        function DrawerContentDirective() {
            var directive = {
                restrict: 'E',
                replace: true,
                transclude: true,
                template: '<div class="umb-drawer-content" ng-transclude></div>'
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbDrawerContent', DrawerContentDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbDrawerFooter
@restrict E
@scope

@description
Use this directive to render a drawer footer

<h3>Markup example</h3>
<pre>
	<umb-drawer-view>
        
        <umb-drawer-header
            title="Drawer Title"
            description="Drawer description">
        </umb-drawer-header>

        <umb-drawer-content>
            <!-- Your content here -->
            <pre>{{ model | json }}</pre>
        </umb-drawer-content>

        <umb-drawer-footer>
            <!-- Your content here -->
        </umb-drawer-footer>

	</umb-drawer-view>
</pre>

<h3>Use in combination with</h3>
<ul>
    <li>{@link umbraco.directives.directive:umbDrawerView umbDrawerView}</li>
    <li>{@link umbraco.directives.directive:umbDrawerHeader umbDrawerHeader}</li>
    <li>{@link umbraco.directives.directive:umbDrawerContent umbDrawerContent}</li>
</ul>

**/
    (function () {
        'use strict';
        function DrawerFooterDirective() {
            var directive = {
                restrict: 'E',
                replace: true,
                transclude: true,
                template: '<div class="umb-drawer-footer" ng-transclude></div>'
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbDrawerFooter', DrawerFooterDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbDrawerHeader
@restrict E
@scope

@description
Use this directive to render a drawer header

<h3>Markup example</h3>
<pre>
	<umb-drawer-view>
        
        <umb-drawer-header
            title="Drawer Title"
            description="Drawer description">
        </umb-drawer-header>

        <umb-drawer-content>
            <!-- Your content here -->
            <pre>{{ model | json }}</pre>
        </umb-drawer-content>

        <umb-drawer-footer>
            <!-- Your content here -->
        </umb-drawer-footer>

	</umb-drawer-view>
</pre>

<h3>Use in combination with</h3>
<ul>
    <li>{@link umbraco.directives.directive:umbDrawerView umbDrawerView}</li>
    <li>{@link umbraco.directives.directive:umbDrawerContent umbDrawerContent}</li>
    <li>{@link umbraco.directives.directive:umbDrawerFooter umbDrawerFooter}</li>
</ul>

@param {string} title (<code>attribute</code>): Set a drawer title.
@param {string} description (<code>attribute</code>): Set a drawer description.
**/
    (function () {
        'use strict';
        function DrawerHeaderDirective() {
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-drawer-header"><div class="umb-drawer-header__title">{{ title }}</div><div class="umb-drawer-header__subtitle">{{ description }}</div></div>',
                scope: {
                    'title': '@?',
                    'description': '@?'
                }
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbDrawerHeader', DrawerHeaderDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbDrawerView
@restrict E
@scope

@description
Use this directive to render drawer view

<h3>Markup example</h3>
<pre>
	<umb-drawer-view>
        
        <umb-drawer-header
            title="Drawer Title"
            description="Drawer description">
        </umb-drawer-header>

        <umb-drawer-content>
            <!-- Your content here -->
            <pre>{{ model | json }}</pre>
        </umb-drawer-content>

        <umb-drawer-footer>
            <!-- Your content here -->
        </umb-drawer-footer>

	</umb-drawer-view>
</pre>

<h3>Use in combination with</h3>
<ul>
    <li>{@link umbraco.directives.directive:umbDrawerHeader umbDrawerHeader}</li>
    <li>{@link umbraco.directives.directive:umbDrawerContent umbDrawerContent}</li>
    <li>{@link umbraco.directives.directive:umbDrawerFooter umbDrawerFooter}</li>
</ul>

**/
    (function () {
        'use strict';
        function DrawerViewDirective() {
            var directive = {
                restrict: 'E',
                replace: true,
                transclude: true,
                template: '<div class="umb-drawer-view" ng-transclude></div>'
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbDrawerView', DrawerViewDirective);
    }());
    'use strict';
    (function () {
        'use strict';
        angular.module('umbraco.directives').component('umbLogin', {
            template: '<div class="login-overlay"><div id="login" class="umb-modalcolumn umb-dialog" ng-class="{\'show-validation\': vm.loginForm.$invalid}" ng-cloak><div class="login-overlay__background-image" ng-style="{\'background-image\': \'url(\'+vm.backgroundImage+\')\'}"></div><div class="login-overlay__logo"><img src="assets/img/application/umbraco_logo_white.svg"></div><div ng-show="vm.invitedUser != null" class="umb-login-container"><form name="inviteUserPasswordForm" novalidate ng-submit="vm.inviteSavePassword()" val-form-manager><div class="form" ng-if="vm.inviteStep === 1"><h1 style="margin-bottom: 10px; text-align: left;">Hi, {{vm.invitedUser.name}}</h1><p style="line-height: 1.6; margin-bottom: 25px;"><localize key="user_userinviteWelcomeMessage">Welcome to Umbraco! Just need to get your password and avatar setup and then you\'re good to go</localize></p><div class="control-group" ng-class="{error: vm.setPasswordForm.password.$invalid}"><label><localize key="user_newPassword">New password</localize><small style="font-size: 13px;">{{vm.invitedUserPasswordModel.passwordPolicyText}}</small></label> <input type="password" ng-model="vm.invitedUserPasswordModel.password" name="password" class="-full-width-input" umb-auto-focus required val-server-field="value" ng-minlength="{{vm.invitedUserPasswordModel.passwordPolicies.minPasswordLength}}"> <span ng-messages="inviteUserPasswordForm.password.$error" show-validation-on-submit><span class="help-inline" ng-message="required"><localize key="user_passwordIsBlank">Your new password cannot be blank!</localize></span> <span class="help-inline" ng-message="minlength">Minimum {{vm.invitedUserPasswordModel.passwordPolicies.minPasswordLength}} characters</span> <span class="help-inline" ng-message="valServerField">{{inviteUserPasswordForm.password.errorMsg}}</span></span></div><div class="control-group" ng-class="{error: vm.setPasswordForm.confirmPassword.$invalid}"><label><localize key="user_confirmNewPassword">Confirm new password</localize></label> <input type="password" ng-model="vm.invitedUserPasswordModel.confirmPassword" name="confirmPassword" class="-full-width-input" required val-compare="password"> <span ng-messages="inviteUserPasswordForm.confirmPassword.$error" show-validation-on-submit><span class="help-inline" ng-message="required"><localize key="general_required">Required</localize></span> <span class="help-inline" ng-message="valCompare"><localize key="user_passwordMismatch">The confirmed password doesn\'t match the new password!</localize></span></span></div><div class="flex justify-between items-center"><umb-button type="submit" button-style="success" state="vm.invitedUserPasswordModel.buttonState" label="Save password"></umb-button></div></div></form><div class="form" ng-if="vm.inviteStep === 2"><div class="flex justify-center items-center"><ng-form name="vm.avatarForm"><umb-progress-bar style="max-width: 100px; margin-bottom: 5px;" ng-show="vm.avatarFile.uploadStatus === \'uploading\'" progress="{{ vm.avatarFile.uploadProgress }}" size="s"></umb-progress-bar><div class="umb-info-local-item text-error mt3" ng-if="vm.avatarFile.uploadStatus === \'error\'">{{ vm.avatarFile.serverErrorMessage }}</div><a class="umb-avatar-btn" ngf-select ng-model="vm.avatarFile.filesHolder" ngf-change="vm.changeAvatar($files, $event)" ngf-multiple="false" ngf-pattern="{{vm.avatarFile.acceptedFileTypes}}" ngf-max-size="{{ vm.avatarFile.maxFileSize }}"><umb-avatar color="gray" size="xl" unknown-char="+" img-src="{{vm.invitedUser.avatars[3]}}" img-srcset="{{vm.invitedUser.avatars[4]}} 2x, {{invitedUser.avatars[4]}} 3x"></umb-avatar></a></ng-form></div><h1 style="margin-bottom: 10px;">Upload a photo</h1><p style="text-align: center; margin-bottom: 25px; line-height: 1.6em;"><localize key="user_userinviteAvatarMessage"></localize></p><div class="flex justify-center items-center"><umb-button type="button" button-style="success" label="Done" action="vm.getStarted()"></umb-button></div></div></div><div ng-show="vm.invitedUser == null && vm.inviteStep === 3" ng-if="vm.inviteStep === 3" class="umb-login-container"><div class="form"><h1 style="margin-bottom: 10px; text-align: left;">Hi there</h1><p style="line-height: 1.6; margin-bottom: 25px;"><localize key="user_userinviteExpiredMessage">Welcome to Umbraco! Unfortunately your invite has expired. Please contact your administrator and ask them to resend it.</localize></p></div></div><div ng-show="vm.invitedUser == null && !vm.inviteStep" class="umb-login-container"><div class="form"><h1>{{greeting}}</h1><div ng-show="vm.view == \'login\'"><p><span ng-show="vm.isTimedOut"><localize key="login_timeout">Log in below</localize>.</span></p><div class="external-logins" ng-if="vm.externalLoginProviders.length > 0"><div class="text-error" ng-repeat="error in vm.externalLoginInfo.errors"><span>{{error}}</span></div><form method="POST" name="vm.externalLoginForm" action="{{vm.externalLoginFormAction}}"><div ng-repeat="login in vm.externalLoginProviders"><button type="submit" class="btn btn-block btn-social" ng-class="login.properties.SocialStyle" id="{{login.authType}}" name="provider" value="{{login.authType}}" title="Log in using your {{login.caption}} account"><i class="fa" ng-class="login.properties.SocialIcon"></i><localize key="login_signInWith">Sign in with</localize>{{login.caption}}</button></div></form></div><form method="POST" name="vm.loginForm" ng-submit="vm.loginSubmit()"><div ng-messages="vm.loginForm.$error" class="control-group" aria-live="assertive"><p ng-message="auth" class="text-error" role="alert">{{vm.errorMsg}}</p></div><div class="control-group" ng-class="{error: vm.loginForm.username.$invalid}"><label>{{vm.labels.usernameLabel}}</label> <input type="text" ng-model="vm.login" name="username" class="-full-width-input" placeholder="{{vm.labels.usernamePlaceholder}}" focus-when="{{vm.view === \'login\'}}"></div><div class="control-group" ng-class="{error: vm.loginForm.password.$invalid}"><label><localize key="general_password">Password</localize></label> <input type="password" ng-model="vm.password" name="password" class="-full-width-input" localize="placeholder" placeholder="@placeholders_password"><div class="password-toggle"><a href="#" prevent-default ng-click="vm.togglePassword()"><span class="password-text show"><localize key="login_showPassword">Show password</localize></span> <span class="password-text hide"><localize key="login_hidePassword">Hide password</localize></span></a></div></div><div class="flex justify-between items-center"><umb-button button-style="success" size="m" label-key="general_login" state="vm.loginStates.submitButton" type="submit"></umb-button><div ng-show="vm.allowPasswordReset"><a class="muted" style="text-decoration: underline;" href="#" prevent-default ng-click="vm.showRequestPasswordReset()"><localize key="login_forgottenPassword">Forgotten password?</localize></a></div></div></form></div><div ng-show="vm.view == \'request-password-reset\'"><p><localize key="login_forgottenPasswordInstruction">An email will be sent to the address specified with a link to reset your password</localize></p><form method="POST" name="vm.requestPasswordResetForm" ng-submit="vm.requestPasswordResetSubmit(email)"><div class="control-group" ng-class="{error: requestPasswordResetForm.email.$invalid}"><label><localize key="general_email">Email</localize></label> <input type="email" val-email ng-model="email" name="email" class="-full-width-input" localize="placeholder" placeholder="@placeholders_email" focus-when="{{vm.view === \'request-password-reset\'}}"></div><div class="control-group" ng-show="requestPasswordResetForm.$invalid"><div class="text-error">{{errorMsg}}</div></div><div class="control-group" ng-show="vm.showEmailResetConfirmation"><div class="text-info"><localize key="login_requestPasswordResetConfirmation">An email with password reset instructions will be sent to the specified address if it matched our records</localize></div></div><div class="flex justify-between items-center"><button type="submit" class="btn btn-success" val-trigger-change="#login .form input"><localize key="general_submit">Submit</localize></button> <a class="muted" href="#" prevent-default ng-click="vm.showLogin()" style="text-decoration: underline;"><localize key="login_returnToLogin">Return to login form</localize></a></div></form></div><div ng-show="vm.view == \'set-password\'"><p ng-hide="vm.resetComplete"><localize key="login_setPasswordInstruction">Please provide a new password.</localize></p><form method="POST" name="vm.setPasswordForm" ng-submit="vm.setPasswordSubmit(vm.password, vm.confirmPassword)"><div ng-hide="vm.resetComplete" class="control-group" ng-class="{error: vm.setPasswordForm.password.$invalid}"><label><localize key="user_newPassword">New password</localize></label> <input type="password" ng-model="vm.password" name="password" class="-full-width-input" localize="placeholder" placeholder="@placeholders_password" focus-when="{{vm.view === \'set-password\'}}"></div><div ng-hide="vm.resetComplete" class="control-group" ng-class="{error: vm.setPasswordForm.confirmPassword.$invalid}"><label><localize key="user_confirmNewPassword">Confirm new password</localize></label> <input type="password" ng-model="vm.confirmPassword" name="confirmPassword" class="-full-width-input" localize="placeholder" placeholder="@placeholders_confirmPassword"></div><div ng-hide="vm.resetComplete" class="control-group" ng-show="vm.setPasswordForm.$invalid"><div class="text-error">{{vm.errorMsg}}</div></div><div class="control-group" ng-show="vm.showSetPasswordConfirmation"><div class="text-info"><localize key="login_setPasswordConfirmation">Your new password has been set and you may now use it to log in.</localize></div></div><div class="flex justify-between items-center"><button ng-hide="vm.resetComplete" type="submit" class="btn btn-success" val-trigger-change="#login .form input"><localize key="general_submit">Submit</localize></button> <a class="muted" href="#" prevent-default ng-click="vm.showLogin()"><localize key="login_returnToLogin">Return to login form</localize></a></div></form></div><div ng-show="vm.view == \'password-reset-code-expired\'"><div class="text-error" ng-repeat="error in vm.resetPasswordCodeInfo.errors"><span>{{error}}</span></div><div class="switch-view"><a class="muted" href="#" prevent-default ng-click="vm.showLogin()"><localize key="login_returnToLogin">Return to login form</localize></a></div></div><div ng-show="vm.view == \'2fa-login\'"><div ng-include="vm.twoFactor.view"></div></div></div></div></div></div>',
            controller: UmbLoginController,
            controllerAs: 'vm',
            bindings: {
                isTimedOut: '<',
                onLogin: '&'
            }
        });
        function UmbLoginController($scope, $location, currentUserResource, formHelper, mediaHelper, umbRequestHelper, Upload, localizationService, userService, externalLoginInfo, resetPasswordCodeInfo, $timeout, authResource, $q) {
            var vm = this;
            vm.invitedUser = null;
            vm.invitedUserPasswordModel = {
                password: '',
                confirmPassword: '',
                buttonState: '',
                passwordPolicies: null,
                passwordPolicyText: ''
            };
            vm.loginStates = { submitButton: 'init' };
            vm.avatarFile = {
                filesHolder: null,
                uploadStatus: null,
                uploadProgress: 0,
                maxFileSize: Umbraco.Sys.ServerVariables.umbracoSettings.maxFileSize + 'KB',
                acceptedFileTypes: mediaHelper.formatFileTypes(Umbraco.Sys.ServerVariables.umbracoSettings.imageFileTypes),
                uploaded: false
            };
            vm.allowPasswordReset = Umbraco.Sys.ServerVariables.umbracoSettings.canSendRequiredEmail && Umbraco.Sys.ServerVariables.umbracoSettings.allowPasswordReset;
            vm.errorMsg = '';
            vm.externalLoginFormAction = Umbraco.Sys.ServerVariables.umbracoUrls.externalLoginsUrl;
            vm.externalLoginProviders = externalLoginInfo.providers;
            vm.externalLoginInfo = externalLoginInfo;
            vm.resetPasswordCodeInfo = resetPasswordCodeInfo;
            vm.backgroundImage = Umbraco.Sys.ServerVariables.umbracoSettings.loginBackgroundImage;
            vm.usernameIsEmail = Umbraco.Sys.ServerVariables.umbracoSettings.usernameIsEmail;
            vm.$onInit = onInit;
            vm.togglePassword = togglePassword;
            vm.changeAvatar = changeAvatar;
            vm.getStarted = getStarted;
            vm.inviteSavePassword = inviteSavePassword;
            vm.showLogin = showLogin;
            vm.showRequestPasswordReset = showRequestPasswordReset;
            vm.showSetPassword = showSetPassword;
            vm.loginSubmit = loginSubmit;
            vm.requestPasswordResetSubmit = requestPasswordResetSubmit;
            vm.setPasswordSubmit = setPasswordSubmit;
            vm.labels = {};
            localizationService.localizeMany([
                vm.usernameIsEmail ? 'general_email' : 'general_username',
                vm.usernameIsEmail ? 'placeholders_email' : 'placeholders_usernameHint'
            ]).then(function (data) {
                vm.labels.usernameLabel = data[0];
                vm.labels.usernamePlaceholder = data[1];
            });
            vm.twoFactor = {};
            function onInit() {
                // Check if it is a new user
                var inviteVal = $location.search().invite;
                //1 = enter password, 2 = password set, 3 = invalid token
                if (inviteVal && (inviteVal === '1' || inviteVal === '2')) {
                    $q.all([
                        //get the current invite user
                        authResource.getCurrentInvitedUser().then(function (data) {
                            vm.invitedUser = data;
                        }, function () {
                            //it failed so we should remove the search
                            $location.search('invite', null);
                        }),
                        //get the membership provider config for password policies
                        authResource.getMembershipProviderConfig().then(function (data) {
                            vm.invitedUserPasswordModel.passwordPolicies = data;
                            //localize the text
                            localizationService.localize('errorHandling_errorInPasswordFormat', [
                                vm.invitedUserPasswordModel.passwordPolicies.minPasswordLength,
                                vm.invitedUserPasswordModel.passwordPolicies.minNonAlphaNumericChars
                            ]).then(function (data) {
                                vm.invitedUserPasswordModel.passwordPolicyText = data;
                            });
                        })
                    ]).then(function () {
                        vm.inviteStep = Number(inviteVal);
                    });
                } else if (inviteVal && inviteVal === '3') {
                    vm.inviteStep = Number(inviteVal);
                }
                // set the welcome greeting
                setGreeting();
                // show the correct panel
                if (vm.resetPasswordCodeInfo.resetCodeModel) {
                    vm.showSetPassword();
                } else if (vm.resetPasswordCodeInfo.errors.length > 0) {
                    vm.view = 'password-reset-code-expired';
                } else {
                    vm.showLogin();
                }
            }
            function togglePassword() {
                var elem = $('form[name=\'vm.loginForm\'] input[name=\'password\']');
                elem.attr('type', elem.attr('type') === 'text' ? 'password' : 'text');
                elem.focus();
                $('.password-text.show, .password-text.hide').toggle();
            }
            function changeAvatar(files, event) {
                if (files && files.length > 0) {
                    upload(files[0]);
                }
            }
            function getStarted() {
                $location.search('invite', null);
                if (vm.onLogin) {
                    vm.onLogin();
                }
            }
            function inviteSavePassword() {
                if (formHelper.submitForm({ scope: $scope })) {
                    vm.invitedUserPasswordModel.buttonState = 'busy';
                    currentUserResource.performSetInvitedUserPassword(vm.invitedUserPasswordModel.password).then(function (data) {
                        //success
                        formHelper.resetForm({ scope: $scope });
                        vm.invitedUserPasswordModel.buttonState = 'success';
                        //set the user and set them as logged in
                        vm.invitedUser = data;
                        userService.setAuthenticationSuccessful(data);
                        vm.inviteStep = 2;
                    }, function (err) {
                        formHelper.handleError(err);
                        vm.invitedUserPasswordModel.buttonState = 'error';
                    });
                }
            }
            function showLogin() {
                vm.errorMsg = '';
                resetInputValidation();
                vm.view = 'login';
            }
            function showRequestPasswordReset() {
                vm.errorMsg = '';
                resetInputValidation();
                vm.view = 'request-password-reset';
                vm.showEmailResetConfirmation = false;
            }
            function showSetPassword() {
                vm.errorMsg = '';
                resetInputValidation();
                vm.view = 'set-password';
            }
            function loginSubmit() {
                // make sure that we are returning to the login view.
                vm.view = 'login';
                // TODO: Do validation properly like in the invite password update
                //if the login and password are not empty we need to automatically
                // validate them - this is because if there are validation errors on the server
                // then the user has to change both username & password to resubmit which isn't ideal,
                // so if they're not empty, we'll just make sure to set them to valid.
                if (vm.login && vm.password && vm.login.length > 0 && vm.password.length > 0) {
                    vm.loginForm.username.$setValidity('auth', true);
                    vm.loginForm.password.$setValidity('auth', true);
                }
                if (vm.loginForm.$invalid) {
                    return;
                }
                vm.loginStates.submitButton = 'busy';
                userService.authenticate(vm.login, vm.password).then(function (data) {
                    vm.loginStates.submitButton = 'success';
                    userService._retryRequestQueue(true);
                    if (vm.onLogin) {
                        vm.onLogin();
                    }
                }, function (reason) {
                    //is Two Factor required?
                    if (reason.status === 402) {
                        vm.errorMsg = 'Additional authentication required';
                        show2FALoginDialog(reason.data.twoFactorView);
                    } else {
                        vm.loginStates.submitButton = 'error';
                        vm.errorMsg = reason.errorMsg;
                        //set the form inputs to invalid
                        vm.loginForm.username.$setValidity('auth', false);
                        vm.loginForm.password.$setValidity('auth', false);
                    }
                    userService._retryRequestQueue();
                });
                //setup a watch for both of the model values changing, if they change
                // while the form is invalid, then revalidate them so that the form can
                // be submitted again.
                vm.loginForm.username.$viewChangeListeners.push(function () {
                    if (vm.loginForm.$invalid) {
                        vm.loginForm.username.$setValidity('auth', true);
                        vm.loginForm.password.$setValidity('auth', true);
                    }
                });
                vm.loginForm.password.$viewChangeListeners.push(function () {
                    if (vm.loginForm.$invalid) {
                        vm.loginForm.username.$setValidity('auth', true);
                        vm.loginForm.password.$setValidity('auth', true);
                    }
                });
            }
            function requestPasswordResetSubmit(email) {
                // TODO: Do validation properly like in the invite password update
                if (email && email.length > 0) {
                    vm.requestPasswordResetForm.email.$setValidity('auth', true);
                }
                vm.showEmailResetConfirmation = false;
                if (vm.requestPasswordResetForm.$invalid) {
                    return;
                }
                vm.errorMsg = '';
                authResource.performRequestPasswordReset(email).then(function () {
                    //remove the email entered
                    vm.email = '';
                    vm.showEmailResetConfirmation = true;
                }, function (reason) {
                    vm.errorMsg = reason.errorMsg;
                    vm.requestPasswordResetForm.email.$setValidity('auth', false);
                });
                vm.requestPasswordResetForm.email.$viewChangeListeners.push(function () {
                    if (vm.requestPasswordResetForm.email.$invalid) {
                        vm.requestPasswordResetForm.email.$setValidity('auth', true);
                    }
                });
            }
            function setPasswordSubmit(password, confirmPassword) {
                vm.showSetPasswordConfirmation = false;
                if (password && confirmPassword && password.length > 0 && confirmPassword.length > 0) {
                    vm.setPasswordForm.password.$setValidity('auth', true);
                    vm.setPasswordForm.confirmPassword.$setValidity('auth', true);
                }
                if (vm.setPasswordForm.$invalid) {
                    return;
                }
                // TODO: All of this logic can/should be shared! We should do validation the nice way instead of all of this manual stuff, see: inviteSavePassword
                authResource.performSetPassword(vm.resetPasswordCodeInfo.resetCodeModel.userId, password, confirmPassword, vm.resetPasswordCodeInfo.resetCodeModel.resetCode).then(function () {
                    vm.showSetPasswordConfirmation = true;
                    vm.resetComplete = true;
                    //reset the values in the resetPasswordCodeInfo angular so if someone logs out the change password isn't shown again
                    resetPasswordCodeInfo.resetCodeModel = null;
                }, function (reason) {
                    if (reason.data && reason.data.Message) {
                        vm.errorMsg = reason.data.Message;
                    } else {
                        vm.errorMsg = reason.errorMsg;
                    }
                    vm.setPasswordForm.password.$setValidity('auth', false);
                    vm.setPasswordForm.confirmPassword.$setValidity('auth', false);
                });
                vm.setPasswordForm.password.$viewChangeListeners.push(function () {
                    if (vm.setPasswordForm.password.$invalid) {
                        vm.setPasswordForm.password.$setValidity('auth', true);
                    }
                });
                vm.setPasswordForm.confirmPassword.$viewChangeListeners.push(function () {
                    if (vm.setPasswordForm.confirmPassword.$invalid) {
                        vm.setPasswordForm.confirmPassword.$setValidity('auth', true);
                    }
                });
            }
            ////
            function setGreeting() {
                var date = new Date();
                localizationService.localize('login_greeting' + date.getDay()).then(function (label) {
                    $scope.greeting = label;
                });
            }
            function upload(file) {
                vm.avatarFile.uploadProgress = 0;
                Upload.upload({
                    url: umbRequestHelper.getApiUrl('currentUserApiBaseUrl', 'PostSetAvatar'),
                    fields: {},
                    file: file
                }).progress(function (evt) {
                    if (vm.avatarFile.uploadStatus !== 'done' && vm.avatarFile.uploadStatus !== 'error') {
                        // set uploading status on file
                        vm.avatarFile.uploadStatus = 'uploading';
                        // calculate progress in percentage
                        var progressPercentage = parseInt(100 * evt.loaded / evt.total, 10);
                        // set percentage property on file
                        vm.avatarFile.uploadProgress = progressPercentage;
                    }
                }).success(function (data, status, headers, config) {
                    vm.avatarFile.uploadProgress = 100;
                    // set done status on file
                    vm.avatarFile.uploadStatus = 'done';
                    vm.invitedUser.avatars = data;
                    vm.avatarFile.uploaded = true;
                }).error(function (evt, status, headers, config) {
                    // set status done
                    vm.avatarFile.uploadStatus = 'error';
                    // If file not found, server will return a 404 and display this message
                    if (status === 404) {
                        vm.avatarFile.serverErrorMessage = 'File not found';
                    } else if (status == 400) {
                        //it's a validation error
                        vm.avatarFile.serverErrorMessage = evt.message;
                    } else {
                        //it's an unhandled error
                        //if the service returns a detailed error
                        if (evt.InnerException) {
                            vm.avatarFile.serverErrorMessage = evt.InnerException.ExceptionMessage;
                            //Check if its the common "too large file" exception
                            if (evt.InnerException.StackTrace && evt.InnerException.StackTrace.indexOf('ValidateRequestEntityLength') > 0) {
                                vm.avatarFile.serverErrorMessage = 'File too large to upload';
                            }
                        } else if (evt.Message) {
                            vm.avatarFile.serverErrorMessage = evt.Message;
                        }
                    }
                });
            }
            function show2FALoginDialog(viewPath) {
                vm.twoFactor.submitCallback = function submitCallback() {
                    vm.onLogin();
                };
                vm.twoFactor.view = viewPath;
                vm.view = '2fa-login';
            }
            function resetInputValidation() {
                vm.confirmPassword = '';
                vm.password = '';
                vm.login = '';
                if (vm.loginForm) {
                    vm.loginForm.username.$setValidity('auth', true);
                    vm.loginForm.password.$setValidity('auth', true);
                }
                if (vm.requestPasswordResetForm) {
                    vm.requestPasswordResetForm.email.$setValidity('auth', true);
                }
                if (vm.setPasswordForm) {
                    vm.setPasswordForm.password.$setValidity('auth', true);
                    vm.setPasswordForm.confirmPassword.$setValidity('auth', true);
                }
            }
        }
    }());
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:umbNavigation
* @restrict E
**/
    function umbNavigationDirective() {
        return {
            restrict: 'E',
            // restrict to an element
            replace: true,
            // replace the html element with the template
            template: '<div id="leftcolumn" ng-controller="Umbraco.NavigationController" ng-mouseleave="leaveTree($event)" ng-mouseenter="enterTree($event)"><div id="navigation" ng-show="showNavigation" class="fill umb-modalcolumn" ng-animate="\'slide\'" nav-resize ng-class="{\'--notInFront\': infiniteMode}"><div class="navigation-inner-container"><div class="umb-language-picker" ng-if="currentSection === \'content\' && languages.length > 1" on-outside-click="page.languageSelectorIsOpen = false"><div class="umb-language-picker__toggle" ng-click="toggleLanguageSelector()"><div>{{selectedLanguage.name}}</div><ins class="umb-language-picker__expand" ng-class="{\'icon-navigation-down\': !page.languageSelectorIsOpen, \'icon-navigation-up\': page.languageSelectorIsOpen}">&nbsp;</ins></div><div class="umb-language-picker__dropdown" ng-if="page.languageSelectorIsOpen"><a class="umb-language-picker__dropdown-item" ng-class="{\'umb-language-picker__dropdown-item--current\': language.active}" ng-click="selectLanguage(language)" ng-repeat="language in languages">{{language.name}}</a></div></div><div id="tree" ng-show="authenticated"><umb-tree api="treeApi" on-init="onTreeInit()"></umb-tree></div></div><div class="offset6" id="navOffset" style="z-index: 10"><div id="contextMenu" class="umb-modalcolumn fill shadow" ng-if="showContextMenu" ng-animate="\'slide\'"><umb-context-menu menu-dialog-title="{{menuDialogTitle}}" current-section="{{currentSection}}" current-node="menuNode" menu-actions="menuActions"></umb-context-menu></div><umb-context-dialog ng-if="showContextMenuDialog" dialog-title="menuDialogTitle" current-node="menuNode" view="dialogTemplateUrl"></umb-context-dialog></div><div class="umb-editor__overlay"></div></div></div>'
        };
    }
    angular.module('umbraco.directives').directive('umbNavigation', umbNavigationDirective);
    'use strict';
    (function () {
        'use strict';
        /**
   * A component to render the pop up search field
   */
        var umbSearch = {
            template: '<div class="umb-search" on-outside-click="vm.closeSearch()" ng-keydown="vm.handleKeyDown($event)"><div class="flex items-center"><i class="umb-search-input-icon icon-search" ng-click="vm.focusSearch()"></i> <input class="umb-search-input" type="text" ng-model="vm.searchQuery" ng-model-options="{ debounce: 200 }" ng-change="vm.search(vm.searchQuery)" placeholder="Search..." focus-when="{{vm.searchHasFocus}}"> <button ng-if="vm.searchQuery.length > 0" tabindex="-1" class="umb-search-input-clear umb-animated" ng-click="vm.clearSearch()">Clear</button></div><div class="umb-search-results"><div class="umb-search-group" ng-repeat="(key, group) in vm.searchResults"><div class="umb-search-group__title">{{key}}</div><ul class="umb-search-items"><li class="umb-search-item" ng-repeat="result in group.results" active-result="{{result === vm.activeResult}}"><a class="umb-search-result__link" ng-href="#/{{result.editorPath}}" ng-click="vm.clickItem(result)"><i class="umb-search-result__icon {{result.icon}}"></i> <span class="umb-search-result__meta"><span class="umb-search-result__name">{{result.name}}</span> <span class="umb-search-result__description" ng-show="result.subTitle">{{result.subTitle}}</span></span></a></li></ul></div></div></div>',
            controllerAs: 'vm',
            controller: umbSearchController,
            bindings: { onClose: '&' }
        };
        function umbSearchController($timeout, backdropService, searchService, focusService) {
            var vm = this;
            vm.$onInit = onInit;
            vm.$onDestroy = onDestroy;
            vm.search = search;
            vm.clickItem = clickItem;
            vm.clearSearch = clearSearch;
            vm.handleKeyDown = handleKeyDown;
            vm.closeSearch = closeSearch;
            vm.focusSearch = focusSearch;
            //we need to capture the focus before this element is initialized.
            vm.focusBeforeOpening = focusService.getLastKnownFocus();
            vm.activeResult = null;
            vm.activeResultGroup = null;
            function onInit() {
                vm.searchQuery = '';
                vm.searchResults = [];
                vm.hasResults = false;
                focusSearch();
                backdropService.open();
            }
            function onDestroy() {
                backdropService.close();
            }
            /**
     * Handles when a search result is clicked
     */
            function clickItem() {
                closeSearch();
            }
            /**
     * Clears the search query
     */
            function clearSearch() {
                vm.searchQuery = '';
                vm.searchResults = [];
                vm.hasResults = false;
                focusSearch();
            }
            /**
     * Add focus to the search field
     */
            function focusSearch() {
                vm.searchHasFocus = false;
                $timeout(function () {
                    vm.searchHasFocus = true;
                });
            }
            /**
     * Handles all keyboard events
     * @param {object} event
     */
            function handleKeyDown(event) {
                // esc
                if (event.keyCode === 27) {
                    event.stopPropagation();
                    event.preventDefault();
                    closeSearch();
                    return;
                }
                // up/down (navigate search results)
                if (vm.hasResults && (event.keyCode === 38 || event.keyCode === 40)) {
                    event.stopPropagation();
                    event.preventDefault();
                    var allGroups = _.values(vm.searchResults);
                    var down = event.keyCode === 40;
                    if (vm.activeResultGroup === null) {
                        // it's the first time navigating, pick the appropriate group and result 
                        // - first group and first result when navigating down
                        // - last group and last result when navigating up
                        vm.activeResultGroup = down ? _.first(allGroups) : _.last(allGroups);
                        vm.activeResult = down ? _.first(vm.activeResultGroup.results) : _.last(vm.activeResultGroup.results);
                    } else if (down) {
                        // handle navigation down through the groups and results
                        if (vm.activeResult === _.last(vm.activeResultGroup.results)) {
                            if (vm.activeResultGroup === _.last(allGroups)) {
                                vm.activeResultGroup = _.first(allGroups);
                            } else {
                                vm.activeResultGroup = allGroups[allGroups.indexOf(vm.activeResultGroup) + 1];
                            }
                            vm.activeResult = _.first(vm.activeResultGroup.results);
                        } else {
                            vm.activeResult = vm.activeResultGroup.results[vm.activeResultGroup.results.indexOf(vm.activeResult) + 1];
                        }
                    } else {
                        // handle navigation up through the groups and results
                        if (vm.activeResult === _.first(vm.activeResultGroup.results)) {
                            if (vm.activeResultGroup === _.first(allGroups)) {
                                vm.activeResultGroup = _.last(allGroups);
                            } else {
                                vm.activeResultGroup = allGroups[allGroups.indexOf(vm.activeResultGroup) - 1];
                            }
                            vm.activeResult = _.last(vm.activeResultGroup.results);
                        } else {
                            vm.activeResult = vm.activeResultGroup.results[vm.activeResultGroup.results.indexOf(vm.activeResult) - 1];
                        }
                    }
                    $timeout(function () {
                        var resultElementLink = angular.element('.umb-search-item[active-result=\'true\'] .umb-search-result__link');
                        resultElementLink[0].focus();
                    });
                }
            }
            /**
     * Used to proxy a callback
     */
            function closeSearch() {
                if (vm.focusBeforeOpening) {
                    vm.focusBeforeOpening.focus();
                }
                if (vm.onClose) {
                    vm.onClose();
                }
            }
            /**
     * Used to search
     * @param {string} searchQuery
     */
            function search(searchQuery) {
                if (searchQuery.length > 0) {
                    var search = { 'term': searchQuery };
                    searchService.searchAll(search).then(function (result) {
                        //result is a dictionary of group Title and it's results
                        var filtered = {};
                        _.each(result, function (value, key) {
                            if (value.results.length > 0) {
                                filtered[key] = value;
                            }
                        });
                        // bind to view model
                        vm.searchResults = filtered;
                        // check if search has results
                        vm.hasResults = Object.keys(vm.searchResults).length > 0;
                    });
                } else {
                    clearSearch();
                }
            }
        }
        angular.module('umbraco.directives').component('umbSearch', umbSearch);
    }());
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:umbSections
* @restrict E
**/
    function sectionsDirective($timeout, $window, navigationService, treeService, sectionService, appState, eventsService, $location, historyService) {
        return {
            restrict: 'E',
            // restrict to an element
            replace: true,
            // replace the html element with the template
            template: '<div><div id="applications" ng-class="{faded:stickyNavigation}"><ul class="sections" data-element="sections"><li data-element="section-{{section.alias}}" ng-repeat="section in sections | limitTo: maxSections" ng-class="{current: section.alias == currentSection}"><a href="#/{{section.alias}}" ng-dblclick="sectionDblClick(section)" ng-click="sectionClick($event, section)" prevent-default><span class="section__name">{{section.name}}</span></a></li><li data-element="section-expand" class="expand" ng-class="{ \'open\': showTray === true }" ng-show="needTray"><a ng-click="trayClick()"><i></i><i></i><i></i></a><ul id="applications-tray" class="sections-tray shadow-depth-2" ng-if="showTray" on-outside-click="trayClick()"><li ng-repeat="section in sections | limitTo: overflowingSections" ng-class="{current: section.alias == currentSection}"><a href="#/{{section.alias}}" ng-dblclick="sectionDblClick(section)" ng-click="sectionClick($event, section)" prevent-default><span class="section__name">{{section.name}}</span></a></li></ul></li></ul></div></div>',
            link: function link(scope, element, attr, ctrl) {
                var sectionItemsWidth = [];
                var evts = [];
                var maxSections = 8;
                //setup scope vars
                scope.maxSections = maxSections;
                scope.overflowingSections = 0;
                scope.sections = [];
                scope.currentSection = appState.getSectionState('currentSection');
                scope.showTray = false;
                //appState.getGlobalState("showTray");
                scope.stickyNavigation = appState.getGlobalState('stickyNavigation');
                scope.needTray = false;
                function loadSections() {
                    sectionService.getSectionsForUser().then(function (result) {
                        scope.sections = result;
                        // store the width of each section so we can hide/show them based on browser width 
                        // we store them because the sections get removed from the dom and then we 
                        // can't tell when to show them gain
                        $timeout(function () {
                            $('#applications .sections li').each(function (index) {
                                sectionItemsWidth.push($(this).outerWidth());
                            });
                        });
                        calculateWidth();
                    });
                }
                function calculateWidth() {
                    $timeout(function () {
                        //total width minus room for avatar, search, and help icon
                        var windowWidth = $(window).width() - 150;
                        var sectionsWidth = 0;
                        scope.totalSections = scope.sections.length;
                        scope.maxSections = maxSections;
                        scope.overflowingSections = scope.maxSections - scope.totalSections;
                        scope.needTray = scope.sections.length > scope.maxSections;
                        // detect how many sections we can show on the screen
                        for (var i = 0; i < sectionItemsWidth.length; i++) {
                            var sectionItemWidth = sectionItemsWidth[i];
                            sectionsWidth += sectionItemWidth;
                            if (sectionsWidth > windowWidth) {
                                scope.needTray = true;
                                scope.maxSections = i - 1;
                                scope.overflowingSections = scope.maxSections - scope.totalSections;
                                break;
                            }
                        }
                    });
                }
                //Listen for global state changes
                evts.push(eventsService.on('appState.globalState.changed', function (e, args) {
                    if (args.key === 'showTray') {
                        scope.showTray = args.value;
                    }
                    if (args.key === 'stickyNavigation') {
                        scope.stickyNavigation = args.value;
                    }
                }));
                evts.push(eventsService.on('appState.sectionState.changed', function (e, args) {
                    if (args.key === 'currentSection') {
                        scope.currentSection = args.value;
                    }
                }));
                evts.push(eventsService.on('app.reInitialize', function (e, args) {
                    //re-load the sections if we're re-initializing (i.e. package installed)
                    loadSections();
                }));
                //ensure to unregister from all events!
                scope.$on('$destroy', function () {
                    for (var e in evts) {
                        eventsService.unsubscribe(evts[e]);
                    }
                });
                //on page resize
                window.onresize = calculateWidth;
                scope.sectionClick = function (event, section) {
                    if (event.ctrlKey || event.shiftKey || event.metaKey || // apple
                        event.button && event.button === 1    // middle click, >IE9 + everyone else
) {
                        return;
                    }
                    navigationService.hideSearch();
                    navigationService.showTree(section.alias);
                    //in some cases the section will have a custom route path specified, if there is one we'll use it
                    if (section.routePath) {
                        $location.path(section.routePath);
                    } else {
                        var lastAccessed = historyService.getLastAccessedItemForSection(section.alias);
                        var path = lastAccessed != null ? lastAccessed.link : section.alias;
                        $location.path(path);
                    }
                    navigationService.clearSearch();
                };
                scope.sectionDblClick = function (section) {
                    navigationService.reloadSection(section.alias);
                };
                scope.trayClick = function () {
                    if (appState.getGlobalState('showTray') === true) {
                        navigationService.hideTray();
                    } else {
                        navigationService.showTray();
                    }
                };
                loadSections();
            }
        };
    }
    angular.module('umbraco.directives').directive('umbSections', sectionsDirective);
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbTour
@restrict E
@scope

@description
<b>Added in Umbraco 7.8</b>. The tour component is a global component and is already added to the umbraco markup. 
In the Umbraco UI the tours live in the "Help drawer" which opens when you click the Help-icon in the bottom left corner of Umbraco. 
You can easily add you own tours to the Help-drawer or show and start tours from 
anywhere in the Umbraco backoffice. To see a real world example of a custom tour implementation, install <a href="https://our.umbraco.com/projects/starter-kits/the-starter-kit/">The Starter Kit</a> in Umbraco 7.8

<h1><b>Extending the help drawer with custom tours</b></h1>
The easiet way to add new tours to Umbraco is through the Help-drawer. All it requires is a my-tour.json file. 
Place the file in <i>App_Plugins/{MyPackage}/backoffice/tours/{my-tour}.json</i> and it will automatically be 
picked up by Umbraco and shown in the Help-drawer.

<h3><b>The tour object</b></h3>
The tour object consist of two parts - The overall tour configuration and a list of tour steps. We have split up the tour object for a better overview.
<pre>
// The tour config object
{
    "name": "My Custom Tour", // (required)
    "alias": "myCustomTour", // A unique tour alias (required)
    "group": "My Custom Group" // Used to group tours in the help drawer
    "groupOrder": 200 // Control the order of tour groups
    "allowDisable": // Adds a "Don't" show this tour again"-button to the intro step
    "culture" : // From v7.11+. Specifies the culture of the tour (eg. en-US), if set the tour will only be shown to users with this culture set on their profile. If omitted or left empty the tour will be visible to all users
    "requiredSections":["content", "media", "mySection"] // Sections that the tour will access while running, if the user does not have access to the required tour sections, the tour will not load.   
    "steps": [] // tour steps - see next example
}
</pre>
<pre>
// A tour step object
{
    "title": "Title",
    "content": "<p>Step content</p>",
    "type": "intro" // makes the step an introduction step,
    "element": "[data-element='my-table-row']", // the highlighted element
    "event": "click" // forces the user to click the UI to go to next step
    "eventElement": "[data-element='my-table-row'] [data-element='my-tour-button']" // specify an element to click inside a highlighted element
    "elementPreventClick": false // prevents user interaction in the highlighted element
    "backdropOpacity": 0.4 // the backdrop opacity
    "view": "" // add a custom view
    "customProperties" : {} // add any custom properties needed for the custom view
}
</pre>

<h1><b>Adding tours to other parts of the Umbraco backoffice</b></h1>
It is also possible to add a list of custom tours to other parts of the Umbraco backoffice, 
as an example on a Dashboard in a Custom section. You can then use the {@link umbraco.services.tourService tourService} to start and stop tours but you don't have to register them as part of the tour service.

<h1><b>Using the tour service</b></h1>
<h3>Markup example - show custom tour</h3>
<pre>
    <div ng-controller="My.TourController as vm">

        <div>{{vm.tour.name}}</div>
        <button type="button" ng-click="vm.startTour()">Start tour</button>

        <!-- This button will be clicked in the tour -->
        <button data-element="my-tour-button" type="button">Click me</button>

    </div>
</pre>

<h3>Controller example - show custom tour</h3>
<pre>
    (function () {
        "use strict";

        function TourController(tourService) {

            var vm = this;

            vm.tour = {
                "name": "My Custom Tour",
                "alias": "myCustomTour",
                "steps": [
                    {
                        "title": "Welcome to My Custom Tour",
                        "content": "",
                        "type": "intro"
                    },
                    {
                        "element": "[data-element='my-tour-button']",
                        "title": "Click the button",
                        "content": "Click the button",
                        "event": "click"
                    }
                ]
            };

            vm.startTour = startTour;

            function startTour() {
                tourService.startTour(vm.tour);
            }

        }

        angular.module("umbraco").controller("My.TourController", TourController);

    })();
</pre>

<h1><b>Custom step views</b></h1>
In some cases you will need a custom view for one of your tour steps. 
This could be for validation or for running any other custom logic for that step. 
We have added a couple of helper components to make it easier to get the step scaffolding to look like a regular tour step. 
In the following example you see how to run some custom logic before a step goes to the next step.

<h3>Markup example - custom step view</h3>
<pre>
    <div ng-controller="My.TourStep as vm">

        <umb-tour-step on-close="model.endTour()">
                
            <umb-tour-step-header
                title="model.currentStep.title">
            </umb-tour-step-header>
            
            <umb-tour-step-content
                content="model.currentStep.content">

                <!-- Add any custom content here  -->

            </umb-tour-step-content>

            <umb-tour-step-footer class="flex justify-between items-center">

                <umb-tour-step-counter
                    current-step="model.currentStepIndex + 1"
                    total-steps="model.steps.length">
                </umb-tour-step-counter>

                <div>
                    <umb-button 
                        size="xs" 
                        button-style="action" 
                        type="button" 
                        action="vm.initNextStep()" 
                        label="Next">
                    </umb-button>
                </div>

            </umb-tour-step-footer>

        </umb-tour-step>

    </div>
</pre>

<h3>Controller example - custom step view</h3>
<pre>
    (function () {
        "use strict";

        function StepController() {

            var vm = this;
            
            vm.initNextStep = initNextStep;

            function initNextStep() {
                // run logic here before going to the next step
                $scope.model.nextStep();
            }

        }

        angular.module("umbraco").controller("My.TourStep", StepController);

    })();
</pre>


<h3>Related services</h3>
<ul>
    <li>{@link umbraco.services.tourService tourService}</li>
</ul>

@param {string} model (<code>binding</code>): Tour object

**/
    (function () {
        'use strict';
        function TourDirective($timeout, $http, $q, tourService, backdropService) {
            function link(scope, el, attr, ctrl) {
                var popover;
                var pulseElement;
                var pulseTimer;
                scope.loadingStep = false;
                scope.elementNotFound = false;
                scope.model.nextStep = function () {
                    nextStep();
                };
                scope.model.endTour = function () {
                    unbindEvent();
                    tourService.endTour(scope.model);
                    backdropService.close();
                };
                scope.model.completeTour = function () {
                    unbindEvent();
                    tourService.completeTour(scope.model).then(function () {
                        backdropService.close();
                    });
                };
                scope.model.disableTour = function () {
                    unbindEvent();
                    tourService.disableTour(scope.model).then(function () {
                        backdropService.close();
                    });
                };
                function onInit() {
                    popover = el.find('.umb-tour__popover');
                    pulseElement = el.find('.umb-tour__pulse');
                    popover.hide();
                    scope.model.currentStepIndex = 0;
                    backdropService.open({ disableEventsOnClick: true });
                    startStep();
                }
                function setView() {
                    if (scope.model.currentStep.view && scope.model.alias) {
                        //we do this to avoid a hidden dialog to start loading unconfigured views before the first activation
                        var configuredView = scope.model.currentStep.view;
                        if (scope.model.currentStep.view.indexOf('.html') === -1) {
                            var viewAlias = scope.model.currentStep.view.toLowerCase();
                            var tourAlias = scope.model.alias.toLowerCase();
                            configuredView = 'views/common/tours/' + tourAlias + '/' + viewAlias + '/' + viewAlias + '.html';
                        }
                        if (configuredView !== scope.configuredView) {
                            scope.configuredView = configuredView;
                        }
                    } else {
                        scope.configuredView = null;
                    }
                }
                function nextStep() {
                    popover.hide();
                    pulseElement.hide();
                    $timeout.cancel(pulseTimer);
                    scope.model.currentStepIndex++;
                    // make sure we don't go too far
                    if (scope.model.currentStepIndex !== scope.model.steps.length) {
                        startStep();    // tour completed - final step
                    } else {
                        scope.loadingStep = true;
                        waitForPendingRerequests().then(function () {
                            scope.loadingStep = false;
                            // clear current step
                            scope.model.currentStep = {};
                            // set popover position to center
                            setPopoverPosition(null);
                            // remove backdrop hightlight and custom opacity
                            backdropService.setHighlight(null);
                            backdropService.setOpacity(null);
                        });
                    }
                }
                function startStep() {
                    scope.loadingStep = true;
                    backdropService.setOpacity(scope.model.steps[scope.model.currentStepIndex].backdropOpacity);
                    backdropService.setHighlight(null);
                    waitForPendingRerequests().then(function () {
                        scope.model.currentStep = scope.model.steps[scope.model.currentStepIndex];
                        setView();
                        // if highlight element is set - find it
                        findHighlightElement();
                        // if a custom event needs to be bound we do it now
                        if (scope.model.currentStep.event) {
                            bindEvent();
                        }
                        scope.loadingStep = false;
                    });
                }
                function findHighlightElement() {
                    scope.elementNotFound = false;
                    $timeout(function () {
                        // clear element when step as marked as intro, so it always displays in the center
                        if (scope.model.currentStep && scope.model.currentStep.type === 'intro') {
                            scope.model.currentStep.element = null;
                            scope.model.currentStep.eventElement = null;
                            scope.model.currentStep.event = null;
                        }
                        // if an element isn't set - show the popover in the center
                        if (scope.model.currentStep && !scope.model.currentStep.element) {
                            setPopoverPosition(null);
                            return;
                        }
                        var element = angular.element(scope.model.currentStep.element);
                        // we couldn't find the element in the dom - abort and show error
                        if (element.length === 0) {
                            scope.elementNotFound = true;
                            setPopoverPosition(null);
                            return;
                        }
                        var scrollParent = element.scrollParent();
                        var scrollToCenterOfContainer = element[0].offsetTop - scrollParent[0].clientHeight / 2 + element[0].clientHeight / 2;
                        // Detect if scroll is needed
                        if (element[0].offsetTop > scrollParent[0].clientHeight) {
                            scrollParent.animate({ scrollTop: scrollToCenterOfContainer }, function () {
                                // Animation complete.
                                setPopoverPosition(element);
                                setPulsePosition();
                                backdropService.setHighlight(scope.model.currentStep.element, scope.model.currentStep.elementPreventClick);
                            });
                        } else {
                            setPopoverPosition(element);
                            setPulsePosition();
                            backdropService.setHighlight(scope.model.currentStep.element, scope.model.currentStep.elementPreventClick);
                        }
                    });
                }
                function setPopoverPosition(element) {
                    $timeout(function () {
                        var position = 'center';
                        var margin = 20;
                        var css = {};
                        var popoverWidth = popover.outerWidth();
                        var popoverHeight = popover.outerHeight();
                        var popoverOffset = popover.offset();
                        var documentWidth = angular.element(document).width();
                        var documentHeight = angular.element(document).height();
                        if (element) {
                            var offset = element.offset();
                            var width = element.outerWidth();
                            var height = element.outerHeight();
                            // messure available space on each side of the target element
                            var space = {
                                'top': offset.top,
                                'right': documentWidth - (offset.left + width),
                                'bottom': documentHeight - (offset.top + height),
                                'left': offset.left
                            };
                            // get the posistion with most available space
                            position = findMax(space);
                            if (position === 'top') {
                                if (offset.left < documentWidth / 2) {
                                    css.top = offset.top - popoverHeight - margin;
                                    css.left = offset.left;
                                } else {
                                    css.top = offset.top - popoverHeight - margin;
                                    css.left = offset.left - popoverWidth + width;
                                }
                            }
                            if (position === 'right') {
                                if (offset.top < documentHeight / 2) {
                                    css.top = offset.top;
                                    css.left = offset.left + width + margin;
                                } else {
                                    css.top = offset.top + height - popoverHeight;
                                    css.left = offset.left + width + margin;
                                }
                            }
                            if (position === 'bottom') {
                                if (offset.left < documentWidth / 2) {
                                    css.top = offset.top + height + margin;
                                    css.left = offset.left;
                                } else {
                                    css.top = offset.top + height + margin;
                                    css.left = offset.left - popoverWidth + width;
                                }
                            }
                            if (position === 'left') {
                                if (offset.top < documentHeight / 2) {
                                    css.top = offset.top;
                                    css.left = offset.left - popoverWidth - margin;
                                } else {
                                    css.top = offset.top + height - popoverHeight;
                                    css.left = offset.left - popoverWidth - margin;
                                }
                            }
                        } else {
                            // if there is no dom element center the popover
                            css.top = 'calc(50% - ' + popoverHeight / 2 + 'px)';
                            css.left = 'calc(50% - ' + popoverWidth / 2 + 'px)';
                        }
                        popover.css(css).fadeIn('fast');
                    });
                }
                function setPulsePosition() {
                    if (scope.model.currentStep.event) {
                        pulseTimer = $timeout(function () {
                            var clickElementSelector = scope.model.currentStep.eventElement ? scope.model.currentStep.eventElement : scope.model.currentStep.element;
                            var clickElement = $(clickElementSelector);
                            var offset = clickElement.offset();
                            var width = clickElement.outerWidth();
                            var height = clickElement.outerHeight();
                            pulseElement.css({
                                'width': width,
                                'height': height,
                                'left': offset.left,
                                'top': offset.top
                            });
                            pulseElement.fadeIn();
                        }, 1000);
                    }
                }
                function waitForPendingRerequests() {
                    var deferred = $q.defer();
                    var timer = window.setInterval(function () {
                        var requestsReady = false;
                        var animationsDone = false;
                        // check for pending requests both in angular and on the document
                        if ($http.pendingRequests.length === 0 && document.readyState === 'complete') {
                            requestsReady = true;
                        }
                        // check for animations. ng-enter and ng-leave are default angular animations. 
                        // Also check for infinite editors animating
                        if (document.querySelectorAll('.ng-enter, .ng-leave, .umb-editor--animating').length === 0) {
                            animationsDone = true;
                        }
                        if (requestsReady && animationsDone) {
                            $timeout(function () {
                                deferred.resolve();
                                clearInterval(timer);
                            });
                        }
                    }, 50);
                    return deferred.promise;
                }
                function findMax(obj) {
                    var keys = Object.keys(obj);
                    var max = keys[0];
                    for (var i = 1, n = keys.length; i < n; ++i) {
                        var k = keys[i];
                        if (obj[k] > obj[max]) {
                            max = k;
                        }
                    }
                    return max;
                }
                function bindEvent() {
                    var bindToElement = scope.model.currentStep.element;
                    var eventName = scope.model.currentStep.event + '.step-' + scope.model.currentStepIndex;
                    var removeEventName = 'remove.step-' + scope.model.currentStepIndex;
                    var handled = false;
                    if (scope.model.currentStep.eventElement) {
                        bindToElement = scope.model.currentStep.eventElement;
                    }
                    $(bindToElement).on(eventName, function () {
                        if (!handled) {
                            unbindEvent();
                            nextStep();
                            handled = true;
                        }
                    });
                    // Hack: we do this to handle cases where ng-if is used and removes the element we need to click.
                    // for some reason it seems the elements gets removed before the event is raised. This is a temp solution which assumes:
                    // "if you ask me to click on an element, and it suddenly gets removed from the dom, let's go on to the next step".
                    $(bindToElement).on(removeEventName, function () {
                        if (!handled) {
                            unbindEvent();
                            nextStep();
                            handled = true;
                        }
                    });
                }
                function unbindEvent() {
                    var eventName = scope.model.currentStep.event + '.step-' + scope.model.currentStepIndex;
                    var removeEventName = 'remove.step-' + scope.model.currentStepIndex;
                    if (scope.model.currentStep.eventElement) {
                        angular.element(scope.model.currentStep.eventElement).off(eventName);
                        angular.element(scope.model.currentStep.eventElement).off(removeEventName);
                    } else {
                        angular.element(scope.model.currentStep.element).off(eventName);
                        angular.element(scope.model.currentStep.element).off(removeEventName);
                    }
                }
                function resize() {
                    findHighlightElement();
                }
                onInit();
                $(window).on('resize.umbTour', resize);
                scope.$on('$destroy', function () {
                    $(window).off('resize.umbTour');
                    unbindEvent();
                    $timeout.cancel(pulseTimer);
                });
            }
            var directive = {
                transclude: true,
                restrict: 'E',
                replace: true,
                template: '<div class="umb-tour"><div class="umb-loader umb-tour__loader" ng-if="loadingStep"></div><div class="umb-tour__pulse"></div><div class="umb-tour__popover shadow-depth-2" ng-class="{\'umb-tour__popover--l\': model.currentStep.type === \'intro\' || model.currentStepIndex === model.steps.length}"><div ng-if="!configuredView && !elementNotFound"><umb-tour-step ng-if="model.currentStepIndex < model.steps.length" on-close="model.endTour()"><umb-tour-step-header title="model.currentStep.title"></umb-tour-step-header><umb-tour-step-content content="model.currentStep.content"></umb-tour-step-content><umb-tour-step-footer><div class="flex justify-between items-center"><div><umb-tour-step-counter current-step="model.currentStepIndex + 1" total-steps="model.steps.length"></umb-tour-step-counter><div ng-if="model.allowDisable && model.currentStep.type === \'intro\'" style="font-size: 13px;"><a class="underline" ng-click="model.disableTour()">Don\'t show this tour again</a></div></div><div ng-if="model.currentStep.type !== \'intro\'"><umb-button size="xs" ng-if="!model.currentStep.event" button-style="action" type="button" action="model.nextStep()" label="Next"></umb-button></div><div ng-if="model.currentStep.type === \'intro\'"><umb-button size="m" button-style="action" type="button" action="model.nextStep()" label="Start tour"></umb-button></div></div></umb-tour-step-footer></umb-tour-step><umb-tour-step ng-if="model.currentStepIndex === model.steps.length" class="tc" hide-close="model.currentStepIndex === model.steps.length"><umb-tour-step-content><div class="flex items-center justify-center"><umb-checkmark size="xl" checked="true"></umb-checkmark></div><h3 class="bold">Congratulations!</h3><p>You have reached the end of the <b>{{model.name}}</b> tour - way to go!</p></umb-tour-step-content><umb-tour-step-footer><umb-button type="button" button-style="action" size="m" action="model.completeTour()" label="Complete"></umb-button></umb-tour-step-footer></umb-tour-step></div><div ng-if="configuredView && !loadingStep && !elementNotFound" ng-include="configuredView"></div><div ng-if="elementNotFound && !loadingStep"><umb-tour-step class="tc"><umb-tour-step-header><h4 class="bold color-red">Oh, we got lost!</h4></umb-tour-step-header><umb-tour-step-content><p>We lost the next step <b>{{ model.currentStep.title }}</b> and don\'t know where to go.</p><p>Please go back and start the tour again.</p></umb-tour-step-content><umb-tour-step-footer><umb-button size="s" button-style="action" type="button" action="model.endTour()" label="End tour"></umb-button></umb-tour-step-footer></umb-tour-step></div></div></div>',
                link: link,
                scope: { model: '=' }
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbTour', TourDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbTourStep
@restrict E
@scope

@description
<b>Added in Umbraco 7.8</b>. The tour step component is a component that can be used in custom views for tour steps.

@param {callback} onClose The callback which should be performened when the close button of the tour step is clicked
@param {boolean=} hideClose A boolean indicating if the close button needs to be shown

**/
    (function () {
        'use strict';
        function TourStepDirective() {
            function link(scope, element, attrs, ctrl) {
                scope.close = function () {
                    if (scope.onClose) {
                        scope.onClose();
                    }
                };
            }
            var directive = {
                restrict: 'E',
                replace: true,
                transclude: true,
                template: '<div class="umb-tour-step umb-tour-step--{{size}}"><div ng-if="hideClose !== true"><button class="icon-wrong umb-tour-step__close" ng-click="close()"></button></div><div ng-transclude></div></div>',
                scope: {
                    size: '@?',
                    onClose: '&?',
                    hideClose: '=?'
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbTourStep', TourStepDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbTourStepContent
@restrict E
@scope

@description
<b>Added in Umbraco 7.8</b>. The tour step content component is a component that can be used in custom views for tour steps.
It's meant to be used in the umb-tour-step directive.
All markup in the body of the directive will be shown after the content attribute

@param {string} content The content that needs to be shown
**/
    (function () {
        'use strict';
        function TourStepContentDirective() {
            var directive = {
                restrict: 'E',
                replace: true,
                transclude: true,
                template: '<div class="umb-tour-step__content"><div ng-bind-html="content"></div><div ng-transclude></div></div>',
                scope: { content: '=' }
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbTourStepContent', TourStepContentDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbTourStepCounter
@restrict E
@scope

@description
<b>Added in Umbraco 7.8</b>. The tour step counter component is a component that can be used in custom views for tour steps.
It's meant to be used in the umb-tour-step-footer directive. It will show the progress you have made in a tour eg. step 2/12


@param {int} currentStep The current step the tour is on
@param {int} totalSteps The current step the tour is on
**/
    (function () {
        'use strict';
        function TourStepCounterDirective() {
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-tour-step__counter">{{ currentStep }}/{{ totalSteps }}</div>',
                scope: {
                    currentStep: '=',
                    totalSteps: '='
                }
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbTourStepCounter', TourStepCounterDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbTourStepFooter
@restrict E
@scope

@description
<b>Added in Umbraco 7.8</b>. The tour step footer component is a component that can be used in custom views for tour steps. It's meant to be used in the umb-tour-step directive.
All markup in the body of the directive will be shown as the footer of the tour step


**/
    (function () {
        'use strict';
        function TourStepFooterDirective() {
            var directive = {
                restrict: 'E',
                replace: true,
                transclude: true,
                template: '<div class="umb-tour-step__footer" ng-transclude></div>'
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbTourStepFooter', TourStepFooterDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbTourStepHeader
@restrict E
@scope

@description
<b>Added in Umbraco 7.8</b>. The tour step header component is a component that can be used in custom views for tour steps. It's meant to be used in the umb-tour-step directive.


@param {string} title The title that needs to be shown
**/
    (function () {
        'use strict';
        function TourStepHeaderDirective() {
            var directive = {
                restrict: 'E',
                replace: true,
                transclude: true,
                template: '<div class="umb-tour-step__header"><div class="umb-tour-step__title">{{title}}</div><div ng-transclude></div></div>',
                scope: { title: '=' }
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbTourStepHeader', TourStepHeaderDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbButton
@restrict E
@scope

@description
Use this directive to render an umbraco button. The directive can be used to generate all types of buttons, set type, style, translation, shortcut and much more.

<h3>Markup example</h3>
<pre>
    <div ng-controller="My.Controller as vm">

        <umb-button
            action="vm.clickButton()"
            type="button"
            button-style="action"
            state="vm.buttonState"
            shortcut="ctrl+c"
            label="My button"
            disabled="vm.buttonState === 'busy'">
        </umb-button>

    </div>
</pre>

<h3>Controller example</h3>
<pre>
    (function () {
        "use strict";

        function Controller(myService) {

            var vm = this;
            vm.buttonState = "init";

            vm.clickButton = clickButton;

            function clickButton() {

                vm.buttonState = "busy";

                myService.clickButton().then(function() {
                    vm.buttonState = "success";
                }, function() {
                    vm.buttonState = "error";
                });

            }
        }

        angular.module("umbraco").controller("My.Controller", Controller);

    })();
</pre>

@param {callback} action The button action which should be performed when the button is clicked.
@param {string=} href Url/Path to navigato to.
@param {string=} type Set the button type ("button" or "submit").
@param {string=} buttonStyle Set the style of the button. The directive uses the default bootstrap styles ("primary", "info", "success", "warning", "danger", "inverse", "link", "block"). Pass in array to add multple styles [success,block].
@param {string=} state Set a progress state on the button ("init", "busy", "success", "error").
@param {string=} shortcut Set a keyboard shortcut for the button ("ctrl+c").
@param {string=} label Set the button label.
@param {string=} labelKey Set a localization key to make a multi lingual button ("general_buttonText").
@param {string=} icon Set a button icon.
@param {string=} size Set a button icon ("xs", "m", "l", "xl").
@param {boolean=} disabled Set to <code>true</code> to disable the button.
@param {string=} addEllipsis Adds an ellipsis character (…) to the button label which means the button will open a dialog or prompt the user for more information.
@param {string=} showCaret Shows a caret on the right side of the button label

**/
    (function () {
        'use strict';
        angular.module('umbraco.directives').component('umbButton', {
            transclude: true,
            template: '<div class="umb-button" ng-class="{\'ml0\': vm.generalActions, \'umb-button--block\': vm.blockElement}" data-element="{{ vm.alias ? \'button-\' + vm.alias : \'\' }}"><div ng-if="vm.innerState"><div class="icon-check umb-button__success" ng-class="{\'-hidden\': vm.innerState !== \'success\', \'-white\': vm.isPrimaryButtonStyle}"></div><div class="icon-delete umb-button__error" ng-class="{\'-hidden\': vm.innerState !== \'error\', \'-white\': vm.isPrimaryButtonStyle}"></div><div class="umb-button__progress" ng-class="{\'-hidden\': vm.innerState !== \'busy\', \'-white\': vm.isPrimaryButtonStyle}"></div><div ng-if="vm.innerState !== \'init\'" class="umb-button__overlay"></div></div><a ng-if="vm.type === \'link\'" ng-href="{{vm.href}}" class="btn umb-button__button {{vm.style}} umb-button--{{vm.size}}" ng-click="vm.clickButton($event)" hotkey="{{vm.shortcut}}" hotkey-when-hidden="{{vm.shortcutWhenHidden}}"><span class="umb-button__content" ng-class="{\'-hidden\': vm.innerState !== \'init\'}"><i ng-if="vm.icon" class="{{vm.icon}} umb-button__icon"></i> {{vm.buttonLabel}} <span ng-if="vm.showCaret" class="umb-button__caret caret"></span></span></a> <button ng-if="vm.type === \'button\'" type="button" class="btn umb-button__button {{vm.style}} umb-button--{{vm.size}}" ng-click="vm.clickButton($event)" hotkey="{{vm.shortcut}}" hotkey-when-hidden="{{vm.shortcutWhenHidden}}" ng-disabled="vm.disabled" umb-auto-focus="{{vm.autoFocus && !vm.disabled ? \'true\' : \'false\'}}"><span class="umb-button__content" ng-class="{\'-hidden\': vm.innerState !== \'init\'}"><i ng-if="vm.icon" class="{{vm.icon}} umb-button__icon"></i> {{vm.buttonLabel}} <span ng-if="vm.showCaret" class="umb-button__caret caret"></span></span></button> <button ng-if="vm.type === \'submit\'" type="submit" class="btn umb-button__button {{vm.style}} umb-button--{{vm.size}}" hotkey="{{vm.shortcut}}" hotkey-when-hidden="{{vm.shortcutWhenHidden}}" ng-disabled="vm.disabled" umb-auto-focus="{{vm.autoFocus && !vm.disabled ? \'true\' : \'false\'}}"><span class="umb-button__content" ng-class="{\'-hidden\': vm.innerState !== \'init\'}"><i ng-if="vm.icon" class="{{vm.icon}} umb-button__icon"></i> {{vm.buttonLabel}} <span ng-if="vm.showCaret" class="umb-button__caret caret"></span></span></button></div>',
            controller: UmbButtonController,
            controllerAs: 'vm',
            bindings: {
                action: '&?',
                href: '@?',
                type: '@',
                buttonStyle: '@?',
                state: '<?',
                shortcut: '@?',
                shortcutWhenHidden: '@',
                label: '@?',
                labelKey: '@?',
                icon: '@?',
                disabled: '<?',
                size: '@?',
                alias: '@?',
                addEllipsis: '@?',
                showCaret: '@?',
                autoFocus: '@?'
            }
        });
        // TODO: This doesn't seem necessary?
        UmbButtonController.$inject = [
            '$timeout',
            'localizationService'
        ];
        function UmbButtonController($timeout, localizationService) {
            var vm = this;
            vm.$onInit = onInit;
            vm.$onChanges = onChanges;
            vm.clickButton = clickButton;
            function onInit() {
                vm.blockElement = false;
                vm.style = null;
                vm.innerState = 'init';
                vm.generalActions = vm.labelKey === 'general_actions';
                vm.buttonLabel = vm.label;
                // is this a primary button style (i.e. anything but an 'info' button)?
                vm.isPrimaryButtonStyle = vm.buttonStyle && vm.buttonStyle !== 'info';
                if (vm.buttonStyle) {
                    // make it possible to pass in multiple styles
                    if (vm.buttonStyle.startsWith('[') && vm.buttonStyle.endsWith(']')) {
                        // when using an attr it will always be a string so we need to remove square brackets
                        // and turn it into and array
                        var withoutBrackets = vm.buttonStyle.replace(/[\[\]']+/g, '');
                        // split array by , + make sure to catch whitespaces
                        var array = withoutBrackets.split(/\s?,\s?/g);
                        angular.forEach(array, function (item) {
                            vm.style = vm.style + ' ' + 'btn-' + item;
                            if (item === 'block') {
                                vm.blockElement = true;
                            }
                        });
                    } else {
                        vm.style = 'btn-' + vm.buttonStyle;
                        if (vm.buttonStyle === 'block') {
                            vm.blockElement = true;
                        }
                    }
                }
                setButtonLabel();
            }
            function onChanges(changes) {
                // watch for state changes
                if (changes.state) {
                    if (changes.state.currentValue) {
                        vm.innerState = changes.state.currentValue;
                    }
                    if (changes.state.currentValue === 'success' || changes.state.currentValue === 'error') {
                        // set the state back to 'init' after a success or error 
                        $timeout(function () {
                            vm.innerState = 'init';
                        }, 2000);
                    }
                }
                // watch for disabled changes
                if (changes.disabled) {
                    if (changes.disabled.currentValue) {
                        vm.disabled = changes.disabled.currentValue;
                    }
                }
                // watch for label changes
                if (changes.label && changes.label.currentValue) {
                    vm.buttonLabel = changes.label.currentValue;
                    setButtonLabel();
                }
                // watch for label key changes
                if (changes.labelKey && changes.labelKey.currentValue) {
                    setButtonLabel();
                }
            }
            function clickButton(event) {
                if (vm.action) {
                    vm.action({ $event: event });
                }
            }
            function setButtonLabel() {
                // if the button opens a dialog add "..." to the label
                if (vm.addEllipsis === 'true') {
                    vm.buttonLabel = vm.buttonLabel + '...';
                }
                // look up localization key
                if (vm.labelKey) {
                    localizationService.localize(vm.labelKey).then(function (value) {
                        vm.buttonLabel = value;
                        // if the button opens a dialog add "..." to the label
                        if (vm.addEllipsis === 'true') {
                            vm.buttonLabel = vm.buttonLabel + '...';
                        }
                    });
                }
            }
        }
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbButtonGroup
@restrict E
@scope

@description
Use this directive to render a button with a dropdown of alternative actions.

<h3>Markup example</h3>
<pre>
    <div ng-controller="My.Controller as vm">

        <umb-button-group
           ng-if="vm.buttonGroup"
           default-button="vm.buttonGroup.defaultButton"
           sub-buttons="vm.buttonGroup.subButtons"
           direction="down"
           float="right">
        </umb-button-group>

    </div>
</pre>

<h3>Controller example</h3>
<pre>
    (function () {
        "use strict";

        function Controller() {

            var vm = this;

            vm.buttonGroup = {
                defaultButton: {
                    labelKey: "general_defaultButton",
                    hotKey: "ctrl+d",
                    hotKeyWhenHidden: true,
                    handler: function() {
                        // do magic here
                    }
                },
                subButtons: [
                    {
                        labelKey: "general_subButton",
                        hotKey: "ctrl+b",
                        hotKeyWhenHidden: true,
                        handler: function() {
                            // do magic here
                        }
                    }
                ]
            };
        }

        angular.module("umbraco").controller("My.Controller", Controller);

    })();
</pre>

<h3>Button model description</h3>
<ul>
    <li>
        <strong>labekKey</strong>
        <small>(string)</small> -
        Set a localization key to make a multi lingual button ("general_buttonText").
    </li>
    <li>
        <strong>hotKey</strong>
        <small>(array)</small> -
        Set a keyboard shortcut for the button ("ctrl+c").
    </li>
    <li>
        <strong>hotKeyWhenHidden</strong>
        <small>(boolean)</small> -
        As a default the hotkeys only works on elements visible in the UI. Set to <code>true</code> to set a hotkey on the hidden sub buttons.
    </li>
    <li>
        <strong>handler</strong>
        <small>(callback)</small> -
        Set a callback to handle button click events.
    </li>
</ul>

@param {object} defaultButton The model of the default button.
@param {array} subButtons Array of sub buttons.
@param {string=} state Set a progress state on the button ("init", "busy", "success", "error").
@param {string=} direction Set the direction of the dropdown ("up", "down").
@param {string=} float Set the float of the dropdown. ("left", "right").
**/
    (function () {
        'use strict';
        function ButtonGroupDirective() {
            function link(scope) {
                scope.dropdown = { isOpen: false };
                scope.toggleDropdown = function () {
                    scope.dropdown.isOpen = !scope.dropdown.isOpen;
                };
                scope.closeDropdown = function () {
                    scope.dropdown.isOpen = false;
                };
                scope.executeMenuItem = function (subButton) {
                    subButton.handler();
                    scope.closeDropdown();
                };
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="btn-group umb-button-group" ng-class="{\'dropup\': direction === \'up\'}"><umb-button ng-if="defaultButton" alias="{{defaultButton.alias ? defaultButton.alias : \'groupPrimary\' }}" type="button" action="defaultButton.handler()" button-style="{{buttonStyle}}" state="state" label="{{defaultButton.labelKey}}" label-key="{{defaultButton.labelKey}}" shortcut="{{defaultButton.hotKey}}" shortcut-when-hidden="{{defaultButton.hotKeyWhenHidden}}" size="{{size}}" icon="{{icon}}" add-ellipsis="{{defaultButton.addEllipsis}}"></umb-button><a data-element="button-group-toggle" href="#" prevent-default class="btn btn-{{buttonStyle}} dropdown-toggle umb-button-group__toggle umb-button--{{size}}" ng-if="subButtons.length > 0" ng-click="toggleDropdown()"><span class="caret"></span></a><umb-dropdown ng-show="subButtons.length > 0 && dropdown.isOpen" class="umb-button-group__sub-buttons" on-close="closeDropdown()" ng-class="{\'-align-right\': float === \'right\'}"><umb-dropdown-item ng-repeat="subButton in subButtons"><a data-element="{{subButton.alias ? \'button-\' + subButton.alias : \'button-group-secondary-\' + $index }}" href="#" ng-click="executeMenuItem(subButton)" hotkey="{{subButton.hotKey}}" hotkey-when-hidden="{{subButton.hotKeyWhenHidden}}" prevent-default><localize key="{{subButton.labelKey}}">{{subButton.labelKey}}</localize><span ng-if="subButton.addEllipsis === \'true\'">...</span></a></umb-dropdown-item></umb-dropdown></div>',
                scope: {
                    defaultButton: '=',
                    subButtons: '=',
                    state: '=?',
                    direction: '@?',
                    float: '@?',
                    buttonStyle: '@?',
                    size: '@?',
                    icon: '@?'
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbButtonGroup', ButtonGroupDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbToggle
@restrict E
@scope

@description
<b>Added in Umbraco version 7.7.0</b> Use this directive to render an umbraco toggle.

<h3>Markup example</h3>
<pre>
    <div ng-controller="My.Controller as vm">

        <umb-toggle
            checked="vm.checked"
            on-click="vm.toggle()">
        </umb-toggle>

        <umb-toggle
            checked="vm.checked"
            disabled="vm.disabled"
            on-click="vm.toggle()"
            show-labels="true"
            label-on="Start"
            label-off="Stop"
            label-position="right"
            hide-icons="true">
        </umb-toggle>

    </div>
</pre>

<h3>Controller example</h3>
<pre>
    (function () {
        "use strict";

        function Controller() {

            var vm = this;
            vm.checked = false;
            vm.disabled = false;

            vm.toggle = toggle;

            function toggle() {
                vm.checked = !vm.checked;
            }
        }

        angular.module("umbraco").controller("My.Controller", Controller);

    })();
</pre>

@param {boolean} checked Set to <code>true</code> or <code>false</code> to toggle the switch.
@param {callback} onClick The function which should be called when the toggle is clicked.
@param {string=} showLabels Set to <code>true</code> or <code>false</code> to show a "On" or "Off" label next to the switch.
@param {string=} labelOn Set a custom label for when the switched is turned on. It will default to "On".
@param {string=} labelOff Set a custom label for when the switched is turned off. It will default to "Off".
@param {string=} labelPosition Sets the label position to the left or right of the switch. It will default to "left" ("left", "right").
@param {string=} hideIcons Set to <code>true</code> or <code>false</code> to hide the icons on the switch.

**/
    (function () {
        'use strict';
        function ToggleDirective(localizationService, eventsService, $timeout) {
            function link(scope, el, attr, ctrl) {
                scope.displayLabelOn = '';
                scope.displayLabelOff = '';
                function onInit() {
                    setLabelText();
                    // must wait until the current digest cycle is finished before we emit this event on init, 
                    // otherwise other property editors might not yet be ready to receive the event
                    $timeout(function () {
                        eventsService.emit('toggleValue', { value: scope.checked });
                    }, 100);
                }
                function setLabelText() {
                    // set default label for "on"
                    if (scope.labelOn) {
                        scope.displayLabelOn = scope.labelOn;
                    } else {
                        localizationService.localize('general_on').then(function (value) {
                            scope.displayLabelOn = value;
                        });
                    }
                    // set default label for "Off"
                    if (scope.labelOff) {
                        scope.displayLabelOff = scope.labelOff;
                    } else {
                        localizationService.localize('general_off').then(function (value) {
                            scope.displayLabelOff = value;
                        });
                    }
                }
                scope.click = function () {
                    if (scope.onClick) {
                        eventsService.emit('toggleValue', { value: !scope.checked });
                        scope.onClick();
                    }
                };
                onInit();
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<button ng-click="click()" type="button" class="umb-toggle" ng-disabled="disabled" ng-class="{\'umb-toggle--checked\': checked, \'umb-toggle--disabled\': disabled}"><span ng-if="!labelPosition && showLabels === \'true\' || labelPosition === \'left\' && showLabels === \'true\'"><span ng-if="!checked" class="umb-toggle__label umb-toggle__label--left">{{ displayLabelOff }}</span> <span ng-if="checked" class="umb-toggle__label umb-toggle__label--left">{{ displayLabelOn }}</span></span><div class="umb-toggle__toggle"><i ng-show="hideIcons !== \'true\'" class="umb-toggle__icon umb-toggle__icon--left icon-check"></i> <i ng-show="hideIcons !== \'true\'" class="umb-toggle__icon umb-toggle__icon--right icon-wrong"></i><div class="umb-toggle__handler"></div></div><span ng-if="labelPosition === \'right\' && showLabels === \'true\'"><span ng-if="!checked" class="umb-toggle__label umb-toggle__label--right">{{ displayLabelOff }}</span> <span ng-if="checked" class="umb-toggle__label umb-toggle__label--right">{{ displayLabelOn }}</span></span></button>',
                scope: {
                    checked: '=',
                    disabled: '=',
                    onClick: '&',
                    labelOn: '@?',
                    labelOff: '@?',
                    labelPosition: '@?',
                    showLabels: '@?',
                    hideIcons: '@?'
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbToggle', ToggleDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbToggleGroup
@restrict E
@scope

@description
Use this directive to render a group of toggle buttons.

<h3>Markup example</h3>
<pre>
    <div ng-controller="My.Controller as vm">

        <umb-toggle-group
            items="vm.items"
            on-click="vm.toggle(item)">
        </umb-toggle-group>

    </div>
</pre>

<h3>Controller example</h3>
<pre>
    (function () {
        "use strict";

        function Controller() {

            var vm = this;
            vm.toggle = toggle;

            function toggle(item) {
                if(item.checked) {
                    // do something if item is checked
                }
                else {
                    // do something else if item is unchecked
                }
            }

            function init() {
                vm.items = [{
                    name: "Item 1",
                    description: "Item 1 description",
                    checked: false,
                    disabled: false
                }, {
                    name: "Item 2",
                    description: "Item 2 description",
                    checked: true,
                    disabled: true
                }];
            }

            init();
        }

        angular.module("umbraco").controller("My.Controller", Controller);

    })();
</pre>

@param {Array} items The items to list in the toggle group
@param {callback} onClick The function which should be called when the toggle is clicked for one of the items.

**/
    (function () {
        'use strict';
        function ToggleGroupDirective() {
            function link(scope, el, attr, ctrl) {
                scope.change = function (item) {
                    if (item.disabled) {
                        return;
                    }
                    item.checked = !item.checked;
                    if (scope.onClick) {
                        scope.onClick({ 'item': item });
                    }
                };
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-toggle-group"><div class="umb-toggle-group-item" ng-repeat="item in items" ng-class="{\'umb-toggle-group-item--disabled\': item.disabled}"><umb-toggle class="umb-toggle-group-item__toggle" checked="item.checked" disabled="item.disabled" on-click="change(item)"></umb-toggle><div class="umb-toggle-group-item__content" ng-click="change(item)"><div>{{ item.name }}</div><div class="umb-toggle-group-item__description">{{ item.description }}</div></div></div></div>',
                scope: {
                    items: '=',
                    onClick: '&'
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbToggleGroup', ToggleGroupDirective);
    }());
    'use strict';
    (function () {
        'use strict';
        function ContentEditController($rootScope, $scope, $routeParams, $q, $window, appState, contentResource, entityResource, navigationService, notificationsService, serverValidationManager, contentEditingHelper, localizationService, formHelper, umbRequestHelper, editorState, $http, eventsService, overlayService, $location) {
            var evts = [];
            var infiniteMode = $scope.infiniteModel && $scope.infiniteModel.infiniteMode;
            var watchingCulture = false;
            //setup scope vars
            $scope.defaultButton = null;
            $scope.subButtons = [];
            $scope.page = {};
            $scope.page.loading = false;
            $scope.page.menu = {};
            $scope.page.menu.currentNode = null;
            $scope.page.menu.currentSection = appState.getSectionState('currentSection');
            $scope.page.listViewPath = null;
            $scope.page.isNew = $scope.isNew ? true : false;
            $scope.page.buttonGroupState = 'init';
            $scope.page.hideActionsMenu = infiniteMode ? true : false;
            $scope.page.hideChangeVariant = false;
            $scope.allowOpen = true;
            $scope.app = null;
            //initializes any watches
            function startWatches(content) {
                //watch for changes to isNew & the content.id, set the page.isNew accordingly and load the breadcrumb if we can
                $scope.$watchGroup([
                    'isNew',
                    'content.id'
                ], function (newVal, oldVal) {
                    var contentId = newVal[1];
                    $scope.page.isNew = Object.toBoolean(newVal[0]);
                    //We fetch all ancestors of the node to generate the footer breadcrumb navigation
                    if (!$scope.page.isNew && contentId && content.parentId && content.parentId !== -1) {
                        loadBreadcrumb();
                        if (!watchingCulture) {
                            $scope.$watch('culture', function (value, oldValue) {
                                if (value !== oldValue) {
                                    loadBreadcrumb();
                                }
                            });
                        }
                    }
                });
            }
            //this initializes the editor with the data which will be called more than once if the data is re-loaded
            function init() {
                var content = $scope.content;
                if (content.id && content.isChildOfListView && content.trashed === false) {
                    $scope.page.listViewPath = $routeParams.page ? '/content/content/edit/' + content.parentId + '?page=' + $routeParams.page : '/content/content/edit/' + content.parentId;
                }
                // we need to check wether an app is present in the current data, if not we will present the default app.
                var isAppPresent = false;
                // on first init, we dont have any apps. but if we are re-initializing, we do, but ...
                if ($scope.app) {
                    // lets check if it still exists as part of our apps array. (if not we have made a change to our docType, even just a re-save of the docType it will turn into new Apps.)
                    _.forEach(content.apps, function (app) {
                        if (app === $scope.app) {
                            isAppPresent = true;
                        }
                    });
                    // if we did reload our DocType, but still have the same app we will try to find it by the alias.
                    if (isAppPresent === false) {
                        _.forEach(content.apps, function (app) {
                            if (app.alias === $scope.app.alias) {
                                isAppPresent = true;
                                app.active = true;
                                $scope.appChanged(app);
                            }
                        });
                    }
                }
                // if we still dont have a app, lets show the first one:
                if (isAppPresent === false && content.apps.length) {
                    content.apps[0].active = true;
                    $scope.appChanged(content.apps[0]);
                }
                editorState.set(content);
                bindEvents();
                resetVariantFlags();
            }
            function loadBreadcrumb() {
                entityResource.getAncestors($scope.content.id, 'document', $scope.culture).then(function (anc) {
                    $scope.ancestors = anc;
                });
            }
            /**
     * This will reset isDirty flags if save is true.
     * When working with multiple variants, this will set the save/publish flags of each one to false.
     * When working with a single variant, this will set the publish flag to false and the save flag to true.
     */
            function resetVariantFlags() {
                if ($scope.content.variants.length > 1) {
                    for (var i = 0; i < $scope.content.variants.length; i++) {
                        var v = $scope.content.variants[i];
                        if (v.save) {
                            v.isDirty = false;
                        }
                        v.save = false;
                        v.publish = false;
                    }
                } else {
                    if ($scope.content.variants[0].save) {
                        $scope.content.variants[0].isDirty = false;
                    }
                    $scope.content.variants[0].save = true;
                    $scope.content.variants[0].publish = false;
                }
            }
            /** Returns true if the content item varies by culture */
            function isContentCultureVariant() {
                return $scope.content.variants.length > 1;
            }
            function reload() {
                $scope.page.loading = true;
                loadContent().then(function () {
                    $scope.page.loading = false;
                });
            }
            function bindEvents() {
                //bindEvents can be called more than once and we don't want to have multiple bound events
                for (var e in evts) {
                    eventsService.unsubscribe(evts[e]);
                }
                evts.push(eventsService.on('editors.documentType.saved', function (name, args) {
                    // if this content item uses the updated doc type we need to reload the content item
                    if (args && args.documentType && $scope.content.documentType.id === args.documentType.id) {
                        reload();
                    }
                }));
            }
            /**
     *  This does the content loading and initializes everything, called on first load
     */
            function loadContent() {
                //we are editing so get the content item from the server
                return $scope.getMethod()($scope.contentId).then(function (data) {
                    $scope.content = data;
                    init();
                    syncTreeNode($scope.content, $scope.content.path, true);
                    resetLastListPageNumber($scope.content);
                    eventsService.emit('content.loaded', { content: $scope.content });
                    return $q.resolve($scope.content);
                });
            }
            /**
     * Create the save/publish/preview buttons for the view
     * @param {any} content the content node
     * @param {any} app the active content app
     */
            function createButtons(content) {
                // for trashed and element type items, the save button is the primary action - otherwise it's a secondary action
                $scope.page.saveButtonStyle = content.trashed || content.isElement ? 'primary' : 'info';
                // only create the save/publish/preview buttons if the
                // content app is "Conent"
                if ($scope.app && $scope.app.alias !== 'umbContent' && $scope.app.alias !== 'umbInfo') {
                    $scope.defaultButton = null;
                    $scope.subButtons = null;
                    $scope.page.showSaveButton = false;
                    $scope.page.showPreviewButton = false;
                    return;
                }
                // create the save button
                if (_.contains($scope.content.allowedActions, 'A')) {
                    $scope.page.showSaveButton = true;
                    // add ellipsis to the save button if it opens the variant overlay
                    $scope.page.saveButtonEllipsis = content.variants && content.variants.length > 1 ? 'true' : 'false';
                }
                // create the pubish combo button
                $scope.page.buttonGroupState = 'init';
                var buttons = contentEditingHelper.configureContentEditorButtons({
                    create: $scope.page.isNew,
                    content: content,
                    methods: {
                        saveAndPublish: $scope.saveAndPublish,
                        sendToPublish: $scope.sendToPublish,
                        unpublish: $scope.unpublish,
                        schedulePublish: $scope.schedule,
                        publishDescendants: $scope.publishDescendants
                    }
                });
                $scope.defaultButton = buttons.defaultButton;
                $scope.subButtons = buttons.subButtons;
                $scope.page.showPreviewButton = true;
            }
            /** Syncs the content item to it's tree node - this occurs on first load and after saving */
            function syncTreeNode(content, path, initialLoad) {
                if (infiniteMode || !path) {
                    return;
                }
                if (!$scope.content.isChildOfListView) {
                    navigationService.syncTree({
                        tree: $scope.treeAlias,
                        path: path.split(','),
                        forceReload: initialLoad !== true
                    }).then(function (syncArgs) {
                        $scope.page.menu.currentNode = syncArgs.node;
                    }, function () {
                        //handle the rejection
                        console.log('A problem occurred syncing the tree! A path is probably incorrect.');
                    });
                } else if (initialLoad === true) {
                    //it's a child item, just sync the ui node to the parent
                    navigationService.syncTree({
                        tree: $scope.treeAlias,
                        path: path.substring(0, path.lastIndexOf(',')).split(','),
                        forceReload: initialLoad !== true
                    });
                    //if this is a child of a list view and it's the initial load of the editor, we need to get the tree node
                    // from the server so that we can load in the actions menu.
                    umbRequestHelper.resourcePromise($http.get(content.treeNodeUrl), 'Failed to retrieve data for child node ' + content.id).then(function (node) {
                        $scope.page.menu.currentNode = node;
                    });
                }
            }
            function checkValidility() {
                //Get all controls from the 'contentForm'
                var allControls = $scope.contentForm.$getControls();
                //An array to store items in when we find child form fields (no matter how many deep nested forms)
                var childFieldsToMarkAsValid = [];
                //Exclude known formControls 'contentHeaderForm' and 'tabbedContentForm'
                //Check property - $name === "contentHeaderForm"
                allControls = _.filter(allControls, function (obj) {
                    return obj.$name !== 'contentHeaderForm' && obj.$name !== 'tabbedContentForm' && obj.hasOwnProperty('$submitted');
                });
                for (var i = 0; i < allControls.length; i++) {
                    var nestedForm = allControls[i];
                    //Get Nested Controls of this form in the loop
                    var nestedFormControls = nestedForm.$getControls();
                    //Need to recurse through controls (could be more nested forms)
                    childFieldsToMarkAsValid = recurseFormControls(nestedFormControls, childFieldsToMarkAsValid);
                }
                return childFieldsToMarkAsValid;
            }
            //Controls is the
            function recurseFormControls(controls, array) {
                //Loop over the controls
                for (var i = 0; i < controls.length; i++) {
                    var controlItem = controls[i];
                    //Check if the controlItem has a property ''
                    if (controlItem.hasOwnProperty('$submitted')) {
                        //This item is a form - so lets get the child controls of it & recurse again
                        var childFormControls = controlItem.$getControls();
                        recurseFormControls(childFormControls, array);
                    } else {
                        //We can assume its a field on a form
                        if (controlItem.hasOwnProperty('$error')) {
                            //Set the validlity of the error/s to be valid
                            //String of keys of error invalid messages
                            var errorKeys = [];
                            for (var key in controlItem.$error) {
                                errorKeys.push(key);
                                controlItem.$setValidity(key, true);
                            }
                            //Create a basic obj - storing the control item & the error keys
                            var obj = {
                                'control': controlItem,
                                'errorKeys': errorKeys
                            };
                            //Push the updated control into the array - so we can set them back
                            array.push(obj);
                        }
                    }
                }
                return array;
            }
            function resetNestedFieldValiation(array) {
                for (var i = 0; i < array.length; i++) {
                    var item = array[i];
                    //Item is an object containing two props
                    //'control' (obj) & 'errorKeys' (string array)
                    var fieldControl = item.control;
                    var fieldErrorKeys = item.errorKeys;
                    for (var j = 0; j < fieldErrorKeys.length; j++) {
                        fieldControl.$setValidity(fieldErrorKeys[j], false);
                    }
                }
            }
            function ensureDirtyIsSetIfAnyVariantIsDirty() {
                $scope.contentForm.$dirty = false;
                for (var i = 0; i < $scope.content.variants.length; i++) {
                    if ($scope.content.variants[i].isDirty) {
                        $scope.contentForm.$dirty = true;
                        return;
                    }
                }
            }
            // This is a helper method to reduce the amount of code repitition for actions: Save, Publish, SendToPublish
            function performSave(args) {
                //Used to check validility of nested form - coming from Content Apps mostly
                //Set them all to be invalid
                var fieldsToRollback = checkValidility();
                eventsService.emit('content.saving', {
                    content: $scope.content,
                    action: args.action
                });
                return contentEditingHelper.contentEditorPerformSave({
                    saveMethod: args.saveMethod,
                    scope: $scope,
                    content: $scope.content,
                    action: args.action,
                    showNotifications: args.showNotifications,
                    softRedirect: true
                }).then(function (data) {
                    //success
                    init();
                    syncTreeNode($scope.content, data.path);
                    eventsService.emit('content.saved', {
                        content: $scope.content,
                        action: args.action
                    });
                    resetNestedFieldValiation(fieldsToRollback);
                    ensureDirtyIsSetIfAnyVariantIsDirty();
                    return $q.when(data);
                }, function (err) {
                    syncTreeNode($scope.content, $scope.content.path);
                    resetNestedFieldValiation(fieldsToRollback);
                    return $q.reject(err);
                });
            }
            function clearNotifications(content) {
                if (content.notifications) {
                    content.notifications = [];
                }
                if (content.variants) {
                    for (var i = 0; i < content.variants.length; i++) {
                        if (content.variants[i].notifications) {
                            content.variants[i].notifications = [];
                        }
                    }
                }
            }
            function resetLastListPageNumber(content) {
                // We're using rootScope to store the page number for list views, so if returning to the list
                // we can restore the page.  If we've moved on to edit a piece of content that's not the list or it's children
                // we should remove this so as not to confuse if navigating to a different list
                if (!content.isChildOfListView && !content.isContainer) {
                    $rootScope.lastListViewPageViewed = null;
                }
            }
            /**
     * Used to clear the dirty state for successfully saved variants when not all variant saving was successful
     * @param {any} variants
     */
            function clearDirtyState(variants) {
                for (var i = 0; i < variants.length; i++) {
                    var v = variants[i];
                    if (v.notifications) {
                        var isSuccess = _.find(v.notifications, function (n) {
                            return n.type === 3;    //this is a success notification
                        });
                        if (isSuccess) {
                            v.isDirty = false;
                        }
                    }
                }
            }
            /** Just shows a simple notification that there are client side validation issues to be fixed */
            function showValidationNotification() {
                //TODO: We need to make the validation UI much better, there's a lot of inconsistencies in v8 including colors, issues with the property groups and validation errors between variants
                //need to show a notification else it's not clear there was an error.
                localizationService.localizeMany([
                    'speechBubbles_validationFailedHeader',
                    'speechBubbles_validationFailedMessage'
                ]).then(function (data) {
                    notificationsService.error(data[0], data[1]);
                });
            }
            if ($scope.page.isNew) {
                $scope.page.loading = true;
                //we are creating so get an empty content item
                $scope.getScaffoldMethod()().then(function (data) {
                    $scope.content = data;
                    init();
                    startWatches($scope.content);
                    resetLastListPageNumber($scope.content);
                    eventsService.emit('content.newReady', { content: $scope.content });
                    $scope.page.loading = false;
                });
            } else {
                $scope.page.loading = true;
                loadContent().then(function () {
                    startWatches($scope.content);
                    $scope.page.loading = false;
                });
            }
            $scope.unpublish = function () {
                clearNotifications($scope.content);
                if (formHelper.submitForm({
                        scope: $scope,
                        action: 'unpublish',
                        skipValidation: true
                    })) {
                    var dialog = {
                        parentScope: $scope,
                        view: 'views/content/overlays/unpublish.html',
                        variants: $scope.content.variants,
                        //set a model property for the dialog
                        skipFormValidation: true,
                        //when submitting the overlay form, skip any client side validation
                        submitButtonLabelKey: 'content_unpublish',
                        submitButtonStyle: 'warning',
                        submit: function submit(model) {
                            model.submitButtonState = 'busy';
                            var selectedVariants = _.filter(model.variants, function (v) {
                                return v.save && v.language;
                            });
                            //ignore invariant
                            var culturesForUnpublishing = _.map(selectedVariants, function (v) {
                                return v.language.culture;
                            });
                            contentResource.unpublish($scope.content.id, culturesForUnpublishing).then(function (data) {
                                formHelper.resetForm({ scope: $scope });
                                contentEditingHelper.reBindChangedProperties($scope.content, data);
                                init();
                                syncTreeNode($scope.content, data.path);
                                $scope.page.buttonGroupState = 'success';
                                eventsService.emit('content.unpublished', { content: $scope.content });
                                overlayService.close();
                            }, function (err) {
                                $scope.page.buttonGroupState = 'error';
                            });
                        },
                        close: function close() {
                            overlayService.close();
                        }
                    };
                    overlayService.open(dialog);
                }
            };
            $scope.sendToPublish = function () {
                clearNotifications($scope.content);
                if (isContentCultureVariant()) {
                    //before we launch the dialog we want to execute all client side validations first
                    if (formHelper.submitForm({
                            scope: $scope,
                            action: 'publish'
                        })) {
                        var dialog = {
                            parentScope: $scope,
                            view: 'views/content/overlays/sendtopublish.html',
                            variants: $scope.content.variants,
                            //set a model property for the dialog
                            skipFormValidation: true,
                            //when submitting the overlay form, skip any client side validation
                            submitButtonLabelKey: 'buttons_saveToPublish',
                            submit: function submit(model) {
                                model.submitButtonState = 'busy';
                                clearNotifications($scope.content);
                                //we need to return this promise so that the dialog can handle the result and wire up the validation response
                                return performSave({
                                    saveMethod: contentResource.sendToPublish,
                                    action: 'sendToPublish',
                                    showNotifications: false
                                }).then(function (data) {
                                    //show all notifications manually here since we disabled showing them automatically in the save method
                                    formHelper.showNotifications(data);
                                    clearNotifications($scope.content);
                                    overlayService.close();
                                    return $q.when(data);
                                }, function (err) {
                                    clearDirtyState($scope.content.variants);
                                    model.submitButtonState = 'error';
                                    //re-map the dialog model since we've re-bound the properties
                                    dialog.variants = $scope.content.variants;
                                    //don't reject, we've handled the error
                                    return $q.when(err);
                                });
                            },
                            close: function close() {
                                overlayService.close();
                            }
                        };
                        overlayService.open(dialog);
                    } else {
                        showValidationNotification();
                    }
                } else {
                    $scope.page.buttonGroupState = 'busy';
                    return performSave({
                        saveMethod: contentResource.sendToPublish,
                        action: 'sendToPublish'
                    }).then(function () {
                        $scope.page.buttonGroupState = 'success';
                    }, function () {
                        $scope.page.buttonGroupState = 'error';
                    });
                    ;
                }
            };
            $scope.saveAndPublish = function () {
                clearNotifications($scope.content);
                if (isContentCultureVariant()) {
                    //before we launch the dialog we want to execute all client side validations first
                    if (formHelper.submitForm({
                            scope: $scope,
                            action: 'publish'
                        })) {
                        var dialog = {
                            parentScope: $scope,
                            view: 'views/content/overlays/publish.html',
                            variants: $scope.content.variants,
                            //set a model property for the dialog
                            skipFormValidation: true,
                            //when submitting the overlay form, skip any client side validation
                            submitButtonLabelKey: 'buttons_saveAndPublish',
                            submit: function submit(model) {
                                model.submitButtonState = 'busy';
                                clearNotifications($scope.content);
                                //we need to return this promise so that the dialog can handle the result and wire up the validation response
                                return performSave({
                                    saveMethod: contentResource.publish,
                                    action: 'publish',
                                    showNotifications: false
                                }).then(function (data) {
                                    //show all notifications manually here since we disabled showing them automatically in the save method
                                    formHelper.showNotifications(data);
                                    clearNotifications($scope.content);
                                    overlayService.close();
                                    return $q.when(data);
                                }, function (err) {
                                    clearDirtyState($scope.content.variants);
                                    model.submitButtonState = 'error';
                                    //re-map the dialog model since we've re-bound the properties
                                    dialog.variants = $scope.content.variants;
                                    //don't reject, we've handled the error
                                    return $q.when(err);
                                });
                            },
                            close: function close() {
                                overlayService.close();
                            }
                        };
                        overlayService.open(dialog);
                    } else {
                        showValidationNotification();
                    }
                } else {
                    //ensure the flags are set
                    $scope.content.variants[0].save = true;
                    $scope.content.variants[0].publish = true;
                    $scope.page.buttonGroupState = 'busy';
                    return performSave({
                        saveMethod: contentResource.publish,
                        action: 'publish'
                    }).then(function () {
                        $scope.page.buttonGroupState = 'success';
                    }, function () {
                        $scope.page.buttonGroupState = 'error';
                    });
                }
            };
            $scope.save = function () {
                clearNotifications($scope.content);
                // TODO: Add "..." to save button label if there are more than one variant to publish - currently it just adds the elipses if there's more than 1 variant
                if (isContentCultureVariant()) {
                    //before we launch the dialog we want to execute all client side validations first
                    if (formHelper.submitForm({
                            scope: $scope,
                            action: 'openSaveDialog'
                        })) {
                        var dialog = {
                            parentScope: $scope,
                            view: 'views/content/overlays/save.html',
                            variants: $scope.content.variants,
                            //set a model property for the dialog
                            skipFormValidation: true,
                            //when submitting the overlay form, skip any client side validation
                            submitButtonLabelKey: 'buttons_save',
                            submit: function submit(model) {
                                model.submitButtonState = 'busy';
                                clearNotifications($scope.content);
                                //we need to return this promise so that the dialog can handle the result and wire up the validation response
                                return performSave({
                                    saveMethod: $scope.saveMethod(),
                                    action: 'save',
                                    showNotifications: false
                                }).then(function (data) {
                                    //show all notifications manually here since we disabled showing them automatically in the save method
                                    formHelper.showNotifications(data);
                                    clearNotifications($scope.content);
                                    overlayService.close();
                                    return $q.when(data);
                                }, function (err) {
                                    clearDirtyState($scope.content.variants);
                                    model.submitButtonState = 'error';
                                    //re-map the dialog model since we've re-bound the properties
                                    dialog.variants = $scope.content.variants;
                                    //don't reject, we've handled the error
                                    return $q.when(err);
                                });
                            },
                            close: function close(oldModel) {
                                overlayService.close();
                            }
                        };
                        overlayService.open(dialog);
                    } else {
                        showValidationNotification();
                    }
                } else {
                    //ensure the flags are set
                    $scope.content.variants[0].save = true;
                    $scope.page.saveButtonState = 'busy';
                    return performSave({
                        saveMethod: $scope.saveMethod(),
                        action: 'save'
                    }).then(function () {
                        $scope.page.saveButtonState = 'success';
                    }, function () {
                        $scope.page.saveButtonState = 'error';
                    });
                }
            };
            $scope.schedule = function () {
                clearNotifications($scope.content);
                //before we launch the dialog we want to execute all client side validations first
                if (formHelper.submitForm({
                        scope: $scope,
                        action: 'schedule'
                    })) {
                    //used to track the original values so if the user doesn't save the schedule and they close the dialog we reset the dates back to what they were.
                    var origDates = [];
                    for (var i = 0; i < $scope.content.variants.length; i++) {
                        origDates.push({
                            releaseDate: $scope.content.variants[i].releaseDate,
                            expireDate: $scope.content.variants[i].expireDate
                        });
                    }
                    if (!isContentCultureVariant()) {
                        //ensure the flags are set
                        $scope.content.variants[0].save = true;
                    }
                    var dialog = {
                        parentScope: $scope,
                        view: 'views/content/overlays/schedule.html',
                        variants: $scope.content.variants,
                        //set a model property for the dialog
                        skipFormValidation: true,
                        //when submitting the overlay form, skip any client side validation
                        submitButtonLabelKey: 'buttons_schedulePublish',
                        submit: function submit(model) {
                            model.submitButtonState = 'busy';
                            clearNotifications($scope.content);
                            //we need to return this promise so that the dialog can handle the result and wire up the validation response
                            return performSave({
                                saveMethod: contentResource.saveSchedule,
                                action: 'schedule',
                                showNotifications: false
                            }).then(function (data) {
                                //show all notifications manually here since we disabled showing them automatically in the save method
                                formHelper.showNotifications(data);
                                clearNotifications($scope.content);
                                overlayService.close();
                                return $q.when(data);
                            }, function (err) {
                                clearDirtyState($scope.content.variants);
                                //if this is invariant, show the notification errors, else they'll be shown inline with the variant
                                if (!isContentCultureVariant()) {
                                    formHelper.showNotifications(err.data);
                                }
                                model.submitButtonState = 'error';
                                //re-map the dialog model since we've re-bound the properties
                                dialog.variants = $scope.content.variants;
                                //don't reject, we've handled the error
                                return $q.when(err);
                            });
                        },
                        close: function close() {
                            overlayService.close();
                            //restore the dates
                            for (var _i = 0; _i < $scope.content.variants.length; _i++) {
                                $scope.content.variants[_i].releaseDate = origDates[_i].releaseDate;
                                $scope.content.variants[_i].expireDate = origDates[_i].expireDate;
                            }
                        }
                    };
                    overlayService.open(dialog);
                } else {
                    showValidationNotification();
                }
            };
            $scope.publishDescendants = function () {
                clearNotifications($scope.content);
                //before we launch the dialog we want to execute all client side validations first
                if (formHelper.submitForm({
                        scope: $scope,
                        action: 'publishDescendants'
                    })) {
                    if (!isContentCultureVariant()) {
                        //ensure the flags are set
                        $scope.content.variants[0].save = true;
                        $scope.content.variants[0].publish = true;
                    }
                    var dialog = {
                        parentScope: $scope,
                        view: 'views/content/overlays/publishdescendants.html',
                        variants: $scope.content.variants,
                        //set a model property for the dialog
                        skipFormValidation: true,
                        //when submitting the overlay form, skip any client side validation
                        submitButtonLabelKey: 'buttons_publishDescendants',
                        submit: function submit(model) {
                            model.submitButtonState = 'busy';
                            clearNotifications($scope.content);
                            //we need to return this promise so that the dialog can handle the result and wire up the validation response
                            return performSave({
                                saveMethod: function saveMethod(content, create, files, showNotifications) {
                                    return contentResource.publishWithDescendants(content, create, model.includeUnpublished, files, showNotifications);
                                },
                                action: 'publishDescendants',
                                showNotifications: false
                            }).then(function (data) {
                                //show all notifications manually here since we disabled showing them automatically in the save method
                                formHelper.showNotifications(data);
                                clearNotifications($scope.content);
                                overlayService.close();
                                return $q.when(data);
                            }, function (err) {
                                clearDirtyState($scope.content.variants);
                                //if this is invariant, show the notification errors, else they'll be shown inline with the variant
                                if (!isContentCultureVariant()) {
                                    formHelper.showNotifications(err.data);
                                }
                                model.submitButtonState = 'error';
                                //re-map the dialog model since we've re-bound the properties
                                dialog.variants = $scope.content.variants;
                                //don't reject, we've handled the error
                                return $q.when(err);
                            });
                        },
                        close: function close() {
                            overlayService.close();
                        }
                    };
                    overlayService.open(dialog);
                } else {
                    showValidationNotification();
                }
            };
            $scope.preview = function (content) {
                // Chromes popup blocker will kick in if a window is opened
                // without the initial scoped request. This trick will fix that.
                //
                var previewWindow = $window.open('preview/?init=true', 'umbpreview');
                // Build the correct path so both /#/ and #/ work.
                var query = 'id=' + content.id;
                if ($scope.culture) {
                    query += '#?culture=' + $scope.culture;
                }
                var redirect = Umbraco.Sys.ServerVariables.umbracoSettings.umbracoPath + '/preview/?' + query;
                //The user cannot save if they don't have access to do that, in which case we just want to preview
                //and that's it otherwise they'll get an unauthorized access message
                if (!_.contains(content.allowedActions, 'A')) {
                    previewWindow.location.href = redirect;
                } else {
                    var selectedVariant = $scope.content.variants[0];
                    if ($scope.culture) {
                        var found = _.find($scope.content.variants, function (v) {
                            return v.language && v.language.culture === $scope.culture;
                        });
                        if (found) {
                            selectedVariant = found;
                        }
                    }
                    //ensure the save flag is set
                    selectedVariant.save = true;
                    performSave({
                        saveMethod: $scope.saveMethod(),
                        action: 'save'
                    }).then(function (data) {
                        previewWindow.location.href = redirect;
                    }, function (err) {
                    });
                }
            };
            /* publish method used in infinite editing */
            $scope.publishAndClose = function (content) {
                $scope.publishAndCloseButtonState = 'busy';
                performSave({
                    saveMethod: contentResource.publish,
                    action: 'publish'
                }).then(function () {
                    if ($scope.infiniteModel.submit) {
                        $scope.infiniteModel.contentNode = content;
                        $scope.infiniteModel.submit($scope.infiniteModel);
                    }
                    $scope.publishAndCloseButtonState = 'success';
                });
            };
            /* save method used in infinite editing */
            $scope.saveAndClose = function (content) {
                $scope.saveAndCloseButtonState = 'busy';
                performSave({
                    saveMethod: $scope.saveMethod(),
                    action: 'save'
                }).then(function () {
                    if ($scope.infiniteModel.submit) {
                        $scope.infiniteModel.contentNode = content;
                        $scope.infiniteModel.submit($scope.infiniteModel);
                    }
                    $scope.saveAndCloseButtonState = 'success';
                });
            };
            /**
     * Call back when a content app changes
     * @param {any} app
     */
            $scope.appChanged = function (app) {
                $scope.app = app;
                $scope.$broadcast('editors.apps.appChanged', { app: app });
                createButtons($scope.content);
            };
            /**
     * Call back when a content app changes
     * @param {any} app
     */
            $scope.appAnchorChanged = function (app, anchor) {
                //send an event downwards
                $scope.$broadcast('editors.apps.appAnchorChanged', {
                    app: app,
                    anchor: anchor
                });
            };
            // methods for infinite editing
            $scope.close = function () {
                if ($scope.infiniteModel.close) {
                    $scope.infiniteModel.close($scope.infiniteModel);
                }
            };
            /**
     * Call back when user click the back-icon
     */
            $scope.onBack = function () {
                if ($scope.infiniteModel && $scope.infiniteModel.close) {
                    $scope.infiniteModel.close($scope.infiniteModel);
                } else {
                    // navigate backwards if content has a parent.
                    $location.path('/' + $routeParams.section + '/' + $routeParams.tree + '/' + $routeParams.method + '/' + $scope.content.parentId);
                }
            };
            //ensure to unregister from all events!
            $scope.$on('$destroy', function () {
                for (var e in evts) {
                    eventsService.unsubscribe(evts[e]);
                }
                //since we are not notifying and clearing server validation messages when they are received due to how the variant
                //switching works, we need to ensure they are cleared when this editor is destroyed
                serverValidationManager.clear();
            });
        }
        function createDirective() {
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div><umb-load-indicator ng-if="page.loading"></umb-load-indicator><form name="contentForm" ng-submit="save()" novalidate val-form-manager><umb-editor-view ng-if="!page.loading"><umb-variant-content-editors page="page" content="content" culture="culture" on-select-app="appChanged(app)" on-select-app-anchor="appAnchorChanged(app, anchor)" on-back="onBack()" show-back="!(infiniteModel && infiniteModel.infiniteMode)"></umb-variant-content-editors><umb-editor-footer><umb-editor-footer-content-left><umb-breadcrumbs ng-if="ancestors && ancestors.length > 0" ancestors="ancestors" entity-type="content"></umb-breadcrumbs></umb-editor-footer-content-left><umb-editor-footer-content-right><umb-button ng-if="infiniteModel.infiniteMode" action="close()" button-style="link" label-key="general_close" type="button"></umb-button><umb-button alias="preview" ng-if="!page.isNew && content.allowPreview && page.showPreviewButton" type="button" button-style="info" action="preview(content)" label-key="buttons_showPage"></umb-button><umb-button ng-if="page.showSaveButton" alias="save" type="button" button-style="{{page.saveButtonStyle}}" state="page.saveButtonState" action="save(content)" label-key="buttons_save" shortcut="ctrl+s" add-ellipsis="{{page.saveButtonEllipsis}}"></umb-button><umb-button-group ng-if="defaultButton && !content.trashed && !content.isElement" button-style="success" default-button="defaultButton" sub-buttons="subButtons" state="page.buttonGroupState" direction="up" float="right"></umb-button-group><umb-button ng-if="infiniteModel.infiniteMode && page.allowInfiniteSaveAndClose" action="saveAndClose(content)" button-style="primary" state="saveAndCloseButtonState" label-key="buttons_saveAndClose" type="button"></umb-button><umb-button ng-if="infiniteModel.infiniteMode && page.allowInfinitePublishAndClose" action="publishAndClose(content)" button-style="primary" state="publishAndCloseButtonState" label-key="buttons_publishAndClose" type="button"></umb-button></umb-editor-footer-content-right></umb-editor-footer></umb-editor-view></form></div>',
                controller: 'Umbraco.Editors.Content.EditorDirectiveController',
                scope: {
                    contentId: '=',
                    isNew: '=?',
                    treeAlias: '@',
                    page: '=?',
                    saveMethod: '&',
                    getMethod: '&',
                    getScaffoldMethod: '&?',
                    culture: '=?',
                    infiniteModel: '=?'
                }
            };
            return directive;
        }
        angular.module('umbraco.directives').controller('Umbraco.Editors.Content.EditorDirectiveController', ContentEditController);
        angular.module('umbraco.directives').directive('contentEditor', createDirective);
    }());
    'use strict';
    (function () {
        'use strict';
        function ContentNodeInfoDirective($timeout, logResource, eventsService, userService, localizationService, dateHelper, editorService, redirectUrlsResource, overlayService) {
            function link(scope) {
                var evts = [];
                var isInfoTab = false;
                var auditTrailLoaded = false;
                var labels = {};
                scope.publishStatus = [];
                scope.currentVariant = null;
                scope.currentUrls = [];
                scope.disableTemplates = Umbraco.Sys.ServerVariables.features.disabledFeatures.disableTemplates;
                scope.allowChangeDocumentType = false;
                scope.allowChangeTemplate = false;
                function onInit() {
                    // set currentVariant
                    scope.currentVariant = _.find(scope.node.variants, function (v) {
                        return v.active;
                    });
                    updateCurrentUrls();
                    // if there are any infinite editors open we are in infinite editing
                    scope.isInfiniteMode = editorService.getNumberOfEditors() > 0 ? true : false;
                    userService.getCurrentUser().then(function (user) {
                        // only allow change of media type if user has access to the settings sections
                        var hasAccessToSettings = user.allowedSections.indexOf('settings') !== -1 ? true : false;
                        scope.allowChangeDocumentType = hasAccessToSettings;
                        scope.allowChangeTemplate = hasAccessToSettings;
                    });
                    var keys = [
                        'general_deleted',
                        'content_unpublished',
                        'content_published',
                        'content_publishedPendingChanges',
                        'content_notCreated',
                        'prompt_unsavedChanges',
                        'prompt_doctypeChangeWarning',
                        'general_history',
                        'auditTrails_historyIncludingVariants',
                        'content_itemNotPublished',
                        'general_choose'
                    ];
                    localizationService.localizeMany(keys).then(function (data) {
                        labels.deleted = data[0];
                        labels.unpublished = data[1];
                        //aka draft
                        labels.published = data[2];
                        labels.publishedPendingChanges = data[3];
                        labels.notCreated = data[4];
                        labels.unsavedChanges = data[5];
                        labels.doctypeChangeWarning = data[6];
                        labels.notPublished = data[9];
                        scope.historyLabel = scope.node.variants && scope.node.variants.length === 1 ? data[7] : data[8];
                        scope.chooseLabel = data[10];
                        setNodePublishStatus();
                        if (scope.currentUrls && scope.currentUrls.length === 0) {
                            if (scope.node.id > 0) {
                                //it's created but not published
                                scope.currentUrls.push({
                                    text: labels.notPublished,
                                    isUrl: false
                                });
                            } else {
                                //it's new
                                scope.currentUrls.push({
                                    text: labels.notCreated,
                                    isUrl: false
                                });
                            }
                        }
                    });
                    scope.auditTrailOptions = { 'id': scope.node.id };
                    // make sure dates are formatted to the user's locale
                    formatDatesToLocal();
                    // get available templates
                    scope.availableTemplates = scope.node.allowedTemplates;
                    // get document type details
                    scope.documentType = scope.node.documentType;
                    //default setting for redirect url management
                    scope.urlTrackerDisabled = false;
                    // Declare a fallback URL for the <umb-node-preview/> directive
                    if (scope.documentType !== null) {
                        scope.previewOpenUrl = '#/settings/documenttypes/edit/' + scope.documentType.id;
                    }
                    var activeApp = _.find(scope.node.apps, function (a) {
                        return a.active;
                    });
                    if (activeApp.alias === 'umbInfo') {
                        loadRedirectUrls();
                        loadAuditTrail();
                    }
                    // never show templates for element types (if they happen to have been created in the content tree)
                    scope.disableTemplates = scope.disableTemplates || scope.node.isElement;
                }
                scope.auditTrailPageChange = function (pageNumber) {
                    scope.auditTrailOptions.pageNumber = pageNumber;
                    loadAuditTrail(true);
                };
                scope.openDocumentType = function (documentType) {
                    var variantIsDirty = _.some(scope.node.variants, function (variant) {
                        return variant.isDirty;
                    });
                    // add confirmation dialog before opening the doc type editor
                    if (variantIsDirty) {
                        var confirm = {
                            title: labels.unsavedChanges,
                            view: 'default',
                            content: labels.doctypeChangeWarning,
                            submitButtonLabelKey: 'general_continue',
                            closeButtonLabelKey: 'general_cancel',
                            submit: function submit() {
                                openDocTypeEditor(documentType);
                                overlayService.close();
                            },
                            close: function close() {
                                overlayService.close();
                            }
                        };
                        overlayService.open(confirm);
                    } else {
                        openDocTypeEditor(documentType);
                    }
                };
                function openDocTypeEditor(documentType) {
                    var editor = {
                        id: documentType.id,
                        submit: function submit(model) {
                            var args = { node: scope.node };
                            eventsService.emit('editors.content.reload', args);
                            editorService.close();
                        },
                        close: function close() {
                            editorService.close();
                        }
                    };
                    editorService.documentTypeEditor(editor);
                }
                scope.openTemplate = function () {
                    var templateEditor = {
                        id: scope.node.templateId,
                        submit: function submit(model) {
                            editorService.close();
                        },
                        close: function close() {
                            editorService.close();
                        }
                    };
                    editorService.templateEditor(templateEditor);
                };
                scope.updateTemplate = function (templateAlias) {
                    // update template value
                    scope.node.template = templateAlias;
                };
                scope.openRollback = function () {
                    var rollback = {
                        node: scope.node,
                        submit: function submit(model) {
                            var args = { node: scope.node };
                            eventsService.emit('editors.content.reload', args);
                            editorService.close();
                        },
                        close: function close() {
                            editorService.close();
                        }
                    };
                    editorService.rollback(rollback);
                };
                function loadAuditTrail(forceReload) {
                    //don't load this if it's already done
                    if (auditTrailLoaded && !forceReload) {
                        return;
                    }
                    scope.loadingAuditTrail = true;
                    logResource.getPagedEntityLog(scope.auditTrailOptions).then(function (data) {
                        // get current backoffice user and format dates
                        userService.getCurrentUser().then(function (currentUser) {
                            angular.forEach(data.items, function (item) {
                                item.timestampFormatted = dateHelper.getLocalDate(item.timestamp, currentUser.locale, 'LLL');
                            });
                        });
                        scope.auditTrail = data.items;
                        scope.auditTrailOptions.pageNumber = data.pageNumber;
                        scope.auditTrailOptions.pageSize = data.pageSize;
                        scope.auditTrailOptions.totalItems = data.totalItems;
                        scope.auditTrailOptions.totalPages = data.totalPages;
                        setAuditTrailLogTypeColor(scope.auditTrail);
                        scope.loadingAuditTrail = false;
                        auditTrailLoaded = true;
                    });
                }
                function loadRedirectUrls() {
                    scope.loadingRedirectUrls = true;
                    //check if Redirect Url Management is enabled
                    redirectUrlsResource.getEnableState().then(function (response) {
                        scope.urlTrackerDisabled = response.enabled !== true;
                        if (scope.urlTrackerDisabled === false) {
                            redirectUrlsResource.getRedirectsForContentItem(scope.node.udi).then(function (data) {
                                scope.redirectUrls = data.searchResults;
                                scope.hasRedirects = typeof data.searchResults !== 'undefined' && data.searchResults.length > 0;
                                scope.loadingRedirectUrls = false;
                            });
                        } else {
                            scope.loadingRedirectUrls = false;
                        }
                    });
                }
                function setAuditTrailLogTypeColor(auditTrail) {
                    angular.forEach(auditTrail, function (item) {
                        switch (item.logType) {
                        case 'Save':
                            item.logTypeColor = 'primary';
                            break;
                        case 'Publish':
                        case 'PublishVariant':
                            item.logTypeColor = 'success';
                            break;
                        case 'Unpublish':
                        case 'UnpublishVariant':
                            item.logTypeColor = 'warning';
                            break;
                        case 'Delete':
                            item.logTypeColor = 'danger';
                            break;
                        default:
                            item.logTypeColor = 'gray';
                        }
                    });
                }
                function setNodePublishStatus() {
                    scope.status = {};
                    // deleted node
                    if (scope.node.trashed === true) {
                        scope.status.color = 'danger';
                        return;
                    }
                    // variant status
                    if (scope.currentVariant.state === 'NotCreated') {
                        // not created
                        scope.status.color = 'gray';
                    } else if (scope.currentVariant.state === 'Draft') {
                        // draft node
                        scope.status.color = 'gray';
                    } else if (scope.currentVariant.state === 'Published') {
                        // published node
                        scope.status.color = 'success';
                    } else if (scope.currentVariant.state === 'PublishedPendingChanges') {
                        // published node with pending changes
                        scope.status.color = 'success';
                    }
                }
                function formatDatesToLocal() {
                    // get current backoffice user and format dates
                    userService.getCurrentUser().then(function (currentUser) {
                        scope.currentVariant.createDateFormatted = dateHelper.getLocalDate(scope.currentVariant.createDate, currentUser.locale, 'LLL');
                    });
                }
                function updateCurrentUrls() {
                    // never show urls for element types (if they happen to have been created in the content tree)
                    if (scope.node.isElement) {
                        scope.currentUrls = null;
                        return;
                    }
                    // find the urls for the currently selected language
                    if (scope.node.variants.length > 1) {
                        // nodes with variants
                        scope.currentUrls = _.filter(scope.node.urls, function (url) {
                            return scope.currentVariant.language.culture === url.culture;
                        });
                    } else {
                        // invariant nodes
                        scope.currentUrls = scope.node.urls;
                    }
                }
                // load audit trail and redirects when on the info tab
                evts.push(eventsService.on('app.tabChange', function (event, args) {
                    $timeout(function () {
                        if (args.alias === 'umbInfo') {
                            isInfoTab = true;
                            loadAuditTrail();
                            loadRedirectUrls();
                            setNodePublishStatus();
                            formatDatesToLocal();
                        } else {
                            isInfoTab = false;
                        }
                    });
                }));
                // watch for content state updates
                scope.$watch('node.updateDate', function (newValue, oldValue) {
                    if (!newValue) {
                        return;
                    }
                    if (newValue === oldValue) {
                        return;
                    }
                    if (isInfoTab) {
                        loadAuditTrail(true);
                        loadRedirectUrls();
                        setNodePublishStatus();
                        formatDatesToLocal();
                    }
                    updateCurrentUrls();
                });
                //ensure to unregister from all events!
                scope.$on('$destroy', function () {
                    for (var e in evts) {
                        eventsService.unsubscribe(evts[e]);
                    }
                });
                onInit();
            }
            var directive = {
                require: '^^umbVariantContent',
                restrict: 'E',
                replace: true,
                template: '<div class="umb-package-details"><div class="umb-package-details__main-content"><umb-box ng-if="currentUrls" data-element="node-info-urls"><umb-box-header title-key="general_links"></umb-box-header><umb-box-content class="block-form"><ul class="nav nav-stacked" style="margin-bottom: 0;"><li ng-repeat="url in currentUrls"><a href="{{url.text}}" target="_blank" ng-if="url.isUrl"><span ng-if="node.variants.length === 1 && url.culture" style="font-size: 13px; color: #cccccc; width: 50px;display: inline-block">{{url.culture}}</span> <i class="icon icon-out"></i> <span>{{url.text}}</span></a><div ng-if="!url.isUrl" style="margin-top: 4px;"><span ng-if="node.variants.length === 1 && url.culture" style="font-size: 13px; color: #cccccc; width: 50px;display: inline-block">{{url.culture}}</span> <em>{{url.text}}</em></div></li></ul></umb-box-content></umb-box><umb-box data-element="node-info-redirects" style="display:none;" ng-cloak ng-show="!urlTrackerDisabled && hasRedirects"><umb-box-header title-key="redirectUrls_redirectUrlManagement"></umb-box-header><umb-box-content class="block-form"><div style="position: relative;"><div ng-if="loadingRedirectUrls" style="background: rgba(255, 255, 255, 0.8); position: absolute; top: 0; left: 0; right: 0; bottom: 0;"></div><umb-load-indicator ng-if="loadingRedirectUrls"></umb-load-indicator><div ng-show="hasRedirects"><p><localize key="redirectUrls_panelInformation" class="ng-isolate-scope ng-scope">The following URLs redirect to this content item:</localize></p><ul class="nav nav-stacked" style="margin-bottom: 0;"><li ng-repeat="redirectUrl in redirectUrls"><a href="{{redirectUrl.originalUrl}}" target="_blank"><i ng-class="value.icon" class="icon-out"></i> {{redirectUrl.originalUrl}}</a></li></ul></div></div></umb-box-content></umb-box><umb-box data-element="node-info-history"><umb-box-header title="{{historyLabel}}"><umb-button type="button" button-style="outline" action="openRollback()" label-key="actions_rollback" size="xs" add-ellipsis="true"></umb-button></umb-box-header><umb-box-content class="block-form"><div style="position: relative;"><div ng-show="loadingAuditTrail" style="background: rgba(255, 255, 255, 0.8); position: absolute; top: 0; left: 0; right: 0; bottom: 0;"></div><umb-load-indicator ng-show="loadingAuditTrail"></umb-load-indicator><div ng-show="auditTrail.length === 0" style="padding: 10px;"><umb-empty-state position="center" size="small"><localize key="content_noChanges"></localize></umb-empty-state></div><div class="history"><div ng-show="auditTrail.length > 1" class="history-line"></div><div class="history-item" ng-repeat="item in auditTrail"><div class="history-item__break"><div class="history-item__avatar"><umb-avatar color="secondary" size="xs" name="{{item.userName}}" img-src="{{item.userAvatars[3]}}" img-srcset="{{item.userAvatars[4]}} 2x, {{item.userAvatars[4]}} 3x"></umb-avatar></div><div><div>{{ item.userName }}</div><div class="history-item__date">{{item.timestampFormatted}}</div></div></div><div class="history-item__break"><umb-badge class="history-item__badge" size="xs" color="{{item.logTypeColor}}"><localize key="auditTrails_small{{ item.logType }}">{{ item.logType }}</localize></umb-badge><span><localize key="auditTrails_{{ item.logType | lowercase }}" tokens="[item.parameters]">{{ item.comment }}</localize></span></div></div></div></div><div class="flex justify-center"><umb-pagination ng-if="auditTrailOptions.totalPages > 1" page-number="auditTrailOptions.pageNumber" total-pages="auditTrailOptions.totalPages" on-change="auditTrailPageChange(pageNumber)"></umb-pagination></div></umb-box-content></umb-box></div><div class="umb-package-details__sidebar"><umb-box data-element="node-info-general"><umb-box-header title-key="general_general"></umb-box-header><umb-box-content class="block-form"><umb-control-group data-element="node-info-status" label="@general_status"><umb-badge size="xs" color="{{status.color}}"><umb-variant-state variant="currentVariant"></umb-variant-state></umb-badge></umb-control-group><umb-control-group ng-show="node.id !== 0" data-element="node-info-create-date" label="@template_createdDate">{{currentVariant.createDateFormatted}}</umb-control-group><umb-control-group data-element="node-info-document-type" label="@content_documentType"><umb-node-preview style="min-width: 100%; margin-bottom: 0;" icon="node.icon" name="node.contentTypeName" alias="documentType.alias" allow-open="allowChangeDocumentType" on-open="openDocumentType(documentType)"></umb-node-preview></umb-control-group><umb-control-group ng-if="disableTemplates == false" data-element="node-info-template" label="@template_template"><div class="flex items-center"><select class="input-block-level" ng-model="node.template" ng-options="key as value for (key, value) in availableTemplates" ng-change="updateTemplate(node.template)"><option>{{chooseLabel}}...</option></select><a ng-show="allowChangeTemplate && node.template !== null" class="umb-node-preview__action" style="margin-left:15px;" ng-click="openTemplate()"><localize key="general_open">Open</localize></a></div></umb-control-group><umb-control-group ng-show="node.id !== 0" data-element="node-info-id" label="Id"><div>{{ node.id }}</div><small>{{ node.key }}</small></umb-control-group></umb-box-content></umb-box></div></div>',
                scope: { node: '=' },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbContentNodeInfo', ContentNodeInfoDirective);
    }());
    'use strict';
    (function () {
        'use strict';
        /** This directive is used to render out the current variant tabs and properties and exposes an API for other directives to consume  */
        function tabbedContentDirective($timeout) {
            function link($scope, $element, $attrs) {
                var appRootNode = $element[0];
                // Directive for cached property groups.
                var propertyGroupNodesDictionary = {};
                var scrollableNode = appRootNode.closest('.umb-scrollable');
                scrollableNode.addEventListener('scroll', onScroll);
                scrollableNode.addEventListener('mousewheel', cancelScrollTween);
                function onScroll(event) {
                    var viewFocusY = scrollableNode.scrollTop + scrollableNode.clientHeight * 0.5;
                    for (var i in $scope.content.tabs) {
                        var group = $scope.content.tabs[i];
                        var node = propertyGroupNodesDictionary[group.id];
                        if (viewFocusY >= node.offsetTop && viewFocusY <= node.offsetTop + node.clientHeight) {
                            setActiveAnchor(group);
                            return;
                        }
                    }
                }
                function setActiveAnchor(tab) {
                    if (tab.active !== true) {
                        var i = $scope.content.tabs.length;
                        while (i--) {
                            $scope.content.tabs[i].active = false;
                        }
                        tab.active = true;
                    }
                }
                function getActiveAnchor() {
                    var i = $scope.content.tabs.length;
                    while (i--) {
                        if ($scope.content.tabs[i].active === true)
                            return $scope.content.tabs[i];
                    }
                    return false;
                }
                function getScrollPositionFor(id) {
                    if (propertyGroupNodesDictionary[id]) {
                        return propertyGroupNodesDictionary[id].offsetTop - 20;    // currently only relative to closest relatively positioned parent 
                    }
                    return null;
                }
                function scrollTo(id) {
                    var y = getScrollPositionFor(id);
                    if (getScrollPositionFor !== null) {
                        var viewportHeight = scrollableNode.clientHeight;
                        var from = scrollableNode.scrollTop;
                        var to = Math.min(y, scrollableNode.scrollHeight - viewportHeight);
                        var animeObject = { _y: from };
                        $scope.scrollTween = anime({
                            targets: animeObject,
                            _y: to,
                            easing: 'easeOutExpo',
                            duration: 200 + Math.min(Math.abs(to - from) / viewportHeight * 100, 400),
                            update: function update() {
                                scrollableNode.scrollTo(0, animeObject._y);
                            }
                        });
                    }
                }
                function jumpTo(id) {
                    var y = getScrollPositionFor(id);
                    if (getScrollPositionFor !== null) {
                        cancelScrollTween();
                        scrollableNode.scrollTo(0, y);
                    }
                }
                function cancelScrollTween() {
                    if ($scope.scrollTween) {
                        $scope.scrollTween.pause();
                    }
                }
                $scope.registerPropertyGroup = function (element, appAnchor) {
                    propertyGroupNodesDictionary[appAnchor] = element;
                };
                $scope.$on('editors.apps.appChanged', function ($event, $args) {
                    // if app changed to this app, then we want to scroll to the current anchor
                    if ($args.app.alias === 'umbContent') {
                        var activeAnchor = getActiveAnchor();
                        $timeout(jumpTo.bind(null, [activeAnchor.id]));
                    }
                });
                $scope.$on('editors.apps.appAnchorChanged', function ($event, $args) {
                    if ($args.app.alias === 'umbContent') {
                        setActiveAnchor($args.anchor);
                        scrollTo($args.anchor.id);
                    }
                });
                //ensure to unregister from all dom-events
                $scope.$on('$destroy', function () {
                    cancelScrollTween();
                    scrollableNode.removeEventListener('scroll', onScroll);
                    scrollableNode.removeEventListener('mousewheel', cancelScrollTween);
                });
            }
            function controller($scope, $element, $attrs) {
                //expose the property/methods for other directives to use
                this.content = $scope.content;
                this.activeVariant = _.find(this.content.variants, function (variant) {
                    return variant.active;
                });
                $scope.activeVariant = this.activeVariant;
                $scope.defaultVariant = _.find(this.content.variants, function (variant) {
                    return variant.language.isDefault;
                });
                $scope.unlockInvariantValue = function (property) {
                    property.unlockInvariantValue = !property.unlockInvariantValue;
                };
                $scope.$watch('tabbedContentForm.$dirty', function (newValue, oldValue) {
                    if (newValue === true) {
                        $scope.content.isDirty = true;
                    }
                });
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div><ng-form name="tabbedContentForm"><div class="umb-group-panel" retrive-dom-element="registerPropertyGroup(element[0], attributes.appAnchor)" data-app-anchor="{{group.id}}" data-element="group-{{group.alias}}" ng-repeat="group in content.tabs track by group.label"><div class="umb-group-panel__header"><div>{{ group.label }}</div></div><div class="umb-group-panel__content"><umb-property data-element="property-{{property.alias}}" ng-repeat="property in group.properties track by property.alias" property="property" show-inherit="content.variants.length > 1 && !property.culture && !activeVariant.language.isDefault" inherits-from="defaultVariant.language.name"><div ng-class="{\'o-40 cursor-not-allowed\': content.variants.length > 1 && !activeVariant.language.isDefault && !property.culture && !property.unlockInvariantValue}"><umb-property-editor model="property" preview="content.variants.length > 1 && !activeVariant.language.isDefault && !property.culture && !property.unlockInvariantValue"></umb-property-editor></div></umb-property></div></div><umb-empty-state ng-if="content.tabs.length === 0" position="center"><localize key="content_noProperties"></localize></umb-empty-state></ng-form></div>',
                controller: controller,
                link: link,
                scope: { content: '=' }
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbTabbedContent', tabbedContentDirective);
    }());
    'use strict';
    (function () {
        'use strict';
        /**
   * A component to encapsulate each variant editor which includes the name header and all content apps for a given variant
   */
        var umbVariantContent = {
            template: '<div><umb-load-indicator ng-if="vm.editor.loading"></umb-load-indicator><div class="umb-split-view__content" ng-show="!vm.editor.loading"><ng-form name="contentHeaderForm" ng-if="vm.editor.content.apps.length > 0"><umb-editor-content-header menu="vm.page.menu" hide-menu="vm.page.hideActionsMenu" name="vm.editor.content.name" name-disabled="vm.nameDisabled" content="vm.editor.content" on-select-navigation-item="vm.selectApp(item)" on-select-anchor-item="vm.selectAppAnchor(item, anchor)" open-variants="vm.openVariants" hide-change-variant="vm.page.hideChangeVariant" show-back-button="vm.showBackButton()" on-back="vm.onBack()" split-view-open="vm.editorCount > 1" on-open-in-split-view="vm.openSplitView(variant)" on-close-split-view="vm.onCloseSplitView()" on-select-variant="vm.selectVariant(variant)" server-validation-name-field="{{\'Variants[\' + vm.editorIndex + \'].Name\'}}"></umb-editor-content-header></ng-form><umb-editor-container ng-if="vm.editor.content.apps.length > 0"><div class="umb-editor-sub-views"><div ng-repeat="app in vm.editor.content.apps track by app.alias"><umb-editor-sub-view model="app" content="vm.content"></umb-editor-sub-view></div></div></umb-editor-container><umb-empty-state ng-if="vm.editor.content.apps.length === 0" position="center"><localize key="content_noProperties"></localize></umb-empty-state></div></div>',
            bindings: {
                content: '<',
                page: '<',
                editor: '<',
                editorIndex: '<',
                editorCount: '<',
                openVariants: '<',
                onCloseSplitView: '&',
                onSelectVariant: '&',
                onOpenSplitView: '&',
                onSelectApp: '&',
                onSelectAppAnchor: '&',
                onBack: '&?',
                showBack: '<?'
            },
            controllerAs: 'vm',
            controller: umbVariantContentController
        };
        function umbVariantContentController($scope, $element, $location) {
            var unsubscribe = [];
            var vm = this;
            vm.$onInit = onInit;
            vm.$postLink = postLink;
            vm.$onDestroy = onDestroy;
            vm.selectVariant = selectVariant;
            vm.openSplitView = openSplitView;
            vm.selectApp = selectApp;
            vm.selectAppAnchor = selectAppAnchor;
            vm.showBackButton = showBackButton;
            function onInit() {
                // disable the name field if the active content app is not "Content"
                vm.nameDisabled = false;
                angular.forEach(vm.editor.content.apps, function (app) {
                    if (app.active && app.alias !== 'umbContent' && app.alias !== 'umbInfo') {
                        vm.nameDisabled = true;
                    }
                });
            }
            function showBackButton() {
                return vm.page.listViewPath !== null && vm.showBack;
            }
            /** Called when the component has linked all elements, this is when the form controller is available */
            function postLink() {
                //set the content to dirty if the header changes
                unsubscribe.push($scope.$watch('contentHeaderForm.$dirty', function (newValue, oldValue) {
                    if (newValue === true) {
                        vm.editor.content.isDirty = true;
                    }
                }));
            }
            function onDestroy() {
                for (var i = 0; i < unsubscribe.length; i++) {
                    unsubscribe[i]();
                }
            }
            /**
     * Used to proxy a callback
     * @param {any} variant
     */
            function selectVariant(variant) {
                if (vm.onSelectVariant) {
                    vm.onSelectVariant({ 'variant': variant });
                }
            }
            /**
     * Used to proxy a callback
     * @param {any} item
     */
            function selectApp(item) {
                // call the callback if any is registered
                if (vm.onSelectApp) {
                    vm.onSelectApp({ 'app': item });
                }
            }
            $scope.$on('editors.apps.appChanged', function ($event, $args) {
                var app = $args.app;
                // disable the name field if the active content app is not "Content" or "Info"
                vm.nameDisabled = false;
                if (app && app.alias !== 'umbContent' && app.alias !== 'umbInfo') {
                    vm.nameDisabled = true;
                }
            });
            /**
     * Used to proxy a callback
     * @param {any} item
     */
            function selectAppAnchor(item, anchor) {
                // call the callback if any is registered
                if (vm.onSelectAppAnchor) {
                    vm.onSelectAppAnchor({
                        'app': item,
                        'anchor': anchor
                    });
                }
            }
            /**
     * Used to proxy a callback
     * @param {any} variant
     */
            function openSplitView(variant) {
                if (vm.onOpenSplitView) {
                    vm.onOpenSplitView({ 'variant': variant });
                }
            }
        }
        angular.module('umbraco.directives').component('umbVariantContent', umbVariantContent);
    }());
    'use strict';
    (function () {
        'use strict';
        /**
   * A component for split view content editing
   */
        var umbVariantContentEditors = {
            template: '<div class="umb-split-views"><div class="umb-split-view" ng-repeat="editor in vm.editors track by editor.culture" ng-class="{\'umb-split-view--collapsed\': editor.collapsed}"><umb-variant-content page="vm.page" content="vm.content" editor="editor" editor-index="$index" editor-count="vm.editors.length" open-variants="vm.openVariants" on-open-split-view="vm.openSplitView(variant)" on-close-split-view="vm.closeSplitView($index)" on-select-variant="vm.selectVariant(variant, $index)" on-select-app="vm.selectApp(app)" on-select-app-anchor="vm.selectAppAnchor(app, anchor)" on-back="vm.onBack()" show-back="vm.showBack"></umb-variant-content></div></div>',
            bindings: {
                page: '<',
                content: '<',
                // TODO: Not sure if this should be = since we are changing the 'active' property of a variant
                culture: '<',
                onSelectApp: '&?',
                onSelectAppAnchor: '&?',
                onBack: '&?',
                showBack: '<?'
            },
            controllerAs: 'vm',
            controller: umbVariantContentEditorsController
        };
        function umbVariantContentEditorsController($scope, $location, $timeout) {
            var prevContentDateUpdated = null;
            var vm = this;
            var activeAppAlias = null;
            vm.$onInit = onInit;
            vm.$onChanges = onChanges;
            vm.$doCheck = doCheck;
            vm.$postLink = postLink;
            vm.openSplitView = openSplitView;
            vm.closeSplitView = closeSplitView;
            vm.selectVariant = selectVariant;
            vm.selectApp = selectApp;
            vm.selectAppAnchor = selectAppAnchor;
            //Used to track how many content views there are (for split view there will be 2, it could support more in theory)
            vm.editors = [];
            //Used to track the open variants across the split views
            vm.openVariants = [];
            /** Called when the component initializes */
            function onInit() {
                prevContentDateUpdated = angular.copy(vm.content.updateDate);
                setActiveCulture();
            }
            /** Called when the component has linked all elements, this is when the form controller is available */
            function postLink() {
            }
            /**
     * Watch for model changes
     * @param {any} changes
     */
            function onChanges(changes) {
                if (changes.culture && !changes.culture.isFirstChange() && changes.culture.currentValue !== changes.culture.previousValue) {
                    setActiveCulture();
                }
            }
            /** Allows us to deep watch whatever we want - executes on every digest cycle */
            function doCheck() {
                if (!angular.equals(vm.content.updateDate, prevContentDateUpdated)) {
                    setActiveCulture();
                    prevContentDateUpdated = angular.copy(vm.content.updateDate);
                }
            }
            /** This is called when the split view changes based on the umb-variant-content */
            function splitViewChanged() {
                //send an event downwards
                $scope.$broadcast('editors.content.splitViewChanged', { editors: vm.editors });
            }
            /**
     * Set the active variant based on the current culture (query string)
     */
            function setActiveCulture() {
                // set the active variant
                var activeVariant = null;
                _.each(vm.content.variants, function (v) {
                    if (v.language && v.language.culture === vm.culture) {
                        v.active = true;
                        activeVariant = v;
                    } else {
                        v.active = false;
                    }
                });
                if (!activeVariant) {
                    // Set the first variant to active if we can't find it.
                    // If the content item is invariant, then only one item exists in the array.
                    vm.content.variants[0].active = true;
                    activeVariant = vm.content.variants[0];
                }
                insertVariantEditor(0, initVariant(activeVariant, 0));
                if (vm.editors.length > 1) {
                    //now re-sync any other editor content (i.e. if split view is open)
                    for (var s = 1; s < vm.editors.length; s++) {
                        //get the variant from the scope model
                        var variant = _.find(vm.content.variants, function (v) {
                            return v.language.culture === vm.editors[s].content.language.culture;
                        });
                        vm.editors[s].content = initVariant(variant, s);
                    }
                }
            }
            /**
     * Updates the editors collection for a given index for the specified variant
     * @param {any} index
     * @param {any} variant
     */
            function insertVariantEditor(index, variant) {
                var variantCulture = variant.language ? variant.language.culture : 'invariant';
                //check if the culture at the index is the same, if it's null an editor will be added
                var currentCulture = vm.editors.length === 0 || vm.editors.length <= index ? null : vm.editors[index].culture;
                if (currentCulture !== variantCulture) {
                    //Not the current culture which means we need to modify the array.
                    //NOTE: It is not good enough to just replace the `content` object at a given index in the array
                    // since that would mean that directives are not re-initialized.
                    vm.editors.splice(index, 1, {
                        content: variant,
                        //used for "track-by" ng-repeat
                        culture: variantCulture
                    });
                } else {
                    //replace the editor for the same culture
                    vm.editors[index].content = variant;
                }
            }
            function initVariant(variant, editorIndex) {
                //The model that is assigned to the editor contains the current content variant along
                //with a copy of the contentApps. This is required because each editor renders it's own
                //header and content apps section and the content apps contains the view for editing content itself
                //and we need to assign a view model to the subView so that it is scoped to the current
                //editor so that split views work.
                //copy the apps from the main model if not assigned yet to the variant
                if (!variant.apps) {
                    variant.apps = angular.copy(vm.content.apps);
                }
                //if this is a variant has a culture/language than we need to assign the language drop down info 
                if (variant.language) {
                    //if the variant list that defines the header drop down isn't assigned to the variant then assign it now
                    if (!variant.variants) {
                        variant.variants = _.map(vm.content.variants, function (v) {
                            return _.pick(v, 'active', 'language', 'state');
                        });
                    } else {
                        //merge the scope variants on top of the header variants collection (handy when needing to refresh)
                        angular.extend(variant.variants, _.map(vm.content.variants, function (v) {
                            return _.pick(v, 'active', 'language', 'state');
                        }));
                    }
                    //ensure the current culture is set as the active one
                    for (var i = 0; i < variant.variants.length; i++) {
                        if (variant.variants[i].language.culture === variant.language.culture) {
                            variant.variants[i].active = true;
                        } else {
                            variant.variants[i].active = false;
                        }
                    }
                    // keep track of the open variants across the different split views
                    // push the first variant then update the variant index based on the editor index
                    if (vm.openVariants && vm.openVariants.length === 0) {
                        vm.openVariants.push(variant.language.culture);
                    } else {
                        vm.openVariants[editorIndex] = variant.language.culture;
                    }
                }
                //then assign the variant to a view model to the content app
                var contentApp = _.find(variant.apps, function (a) {
                    return a.alias === 'umbContent';
                });
                if (contentApp) {
                    //The view model for the content app is simply the index of the variant being edited
                    var variantIndex = vm.content.variants.indexOf(variant);
                    contentApp.viewModel = variantIndex;
                }
                // make sure the same app it set to active in the new variant
                if (activeAppAlias) {
                    angular.forEach(variant.apps, function (app) {
                        app.active = false;
                        if (app.alias === activeAppAlias) {
                            app.active = true;
                        }
                    });
                }
                return variant;
            }
            /**
     * Adds a new editor to the editors array to show content in a split view
     * @param {any} selectedVariant
     */
            function openSplitView(selectedVariant) {
                var selectedCulture = selectedVariant.language.culture;
                //Find the whole variant model based on the culture that was chosen
                var variant = _.find(vm.content.variants, function (v) {
                    return v.language.culture === selectedCulture;
                });
                insertVariantEditor(vm.editors.length, initVariant(variant, vm.editors.length));
                //only the content app can be selected since no other apps are shown, and because we copy all of these apps
                //to the "editors" we need to update this across all editors
                for (var e = 0; e < vm.editors.length; e++) {
                    var editor = vm.editors[e];
                    for (var i = 0; i < editor.content.apps.length; i++) {
                        var app = editor.content.apps[i];
                        if (app.alias === 'umbContent') {
                            app.active = true;
                            // tell the world that the app has changed (but do it only once)
                            if (e === 0) {
                                selectApp(app);
                            }
                        } else {
                            app.active = false;
                        }
                    }
                }
                // TODO: hacking animation states - these should hopefully be easier to do when we upgrade angular
                editor.collapsed = true;
                editor.loading = true;
                $timeout(function () {
                    editor.collapsed = false;
                    editor.loading = false;
                    splitViewChanged();
                }, 100);
            }
            /** Closes the split view */
            function closeSplitView(editorIndex) {
                // TODO: hacking animation states - these should hopefully be easier to do when we upgrade angular
                var editor = vm.editors[editorIndex];
                editor.loading = true;
                editor.collapsed = true;
                $timeout(function () {
                    vm.editors.splice(editorIndex, 1);
                    //remove variant from open variants
                    vm.openVariants.splice(editorIndex, 1);
                    //update the current culture to reflect the last open variant (closing the split view corresponds to selecting the other variant)
                    $location.search('cculture', vm.openVariants[0]);
                    splitViewChanged();
                }, 400);
            }
            /**
     * Changes the currently selected variant
     * @param {any} variant This is the model of the variant/language drop down item in the editor header
     * @param {any} editorIndex The index of the editor being changed
     */
            function selectVariant(variant, editorIndex) {
                // prevent variants already open in a split view to be opened
                if (vm.openVariants.indexOf(variant.language.culture) !== -1) {
                    return;
                }
                //if the editor index is zero, then update the query string to track the lang selection, otherwise if it's part
                //of a 2nd split view editor then update the model directly.
                if (editorIndex === 0) {
                    //If we've made it this far, then update the query string.
                    //The editor will respond to this query string changing.
                    $location.search('cculture', variant.language.culture);
                } else {
                    //Update the 'active' variant for this editor
                    var editor = vm.editors[editorIndex];
                    //set all variant drop down items as inactive for this editor and then set the selected one as active
                    for (var i = 0; i < editor.content.variants.length; i++) {
                        editor.content.variants[i].active = false;
                    }
                    variant.active = true;
                    //get the variant content model and initialize the editor with that
                    var contentVariant = _.find(vm.content.variants, function (v) {
                        return v.language.culture === variant.language.culture;
                    });
                    editor.content = initVariant(contentVariant, editorIndex);
                    //update the editors collection
                    insertVariantEditor(editorIndex, contentVariant);
                }
            }
            /**
     * Stores the active app in a variable so we can remember it when changing language
     * @param {any} app This is the model of the selected app
     */
            function selectApp(app) {
                if (vm.onSelectApp) {
                    vm.onSelectApp({ 'app': app });
                }
            }
            function selectAppAnchor(app, anchor) {
                if (vm.onSelectAppAnchor) {
                    vm.onSelectAppAnchor({
                        'app': app,
                        'anchor': anchor
                    });
                }
            }
            $scope.$on('editors.apps.appChanged', function ($event, $args) {
                var app = $args.app;
                if (app && app.alias) {
                    activeAppAlias = app.alias;
                }
            });
        }
        angular.module('umbraco.directives').component('umbVariantContentEditors', umbVariantContentEditors);
    }());
    'use strict';
    (function () {
        'use strict';
        function umbNotificationList() {
            var vm = this;
        }
        var umbNotificationListComponent = {
            template: '<span class="db" ng-repeat="notification in vm.notifications"><span class="db umb-list-item__description" ng-class="{\'text-success\': notification.type === 3, \'text-error\': notification.type === 2 || notification.type === 4}">{{notification.message}}</span></span>',
            bindings: { notifications: '<' },
            controllerAs: 'vm',
            controller: umbNotificationList
        };
        angular.module('umbraco.directives').component('umbVariantNotificationList', umbNotificationListComponent);
    }());
    'use strict';
    (function () {
        'use strict';
        function umbVariantStateController($scope, $element) {
            var vm = this;
        }
        var umbVariantStateComponent = {
            template: '<span ng-switch="vm.variant.state"><span ng-switch-when="NotCreated"><localize key="content_notCreated"></localize></span> <span ng-switch-when="Draft"><localize key="content_unpublished"></localize></span> <span ng-switch-when="PublishedPendingChanges"><localize key="content_publishedPendingChanges"></localize></span> <span ng-switch-when="Published"><localize key="content_published"></localize></span></span>',
            bindings: { variant: '<' },
            controllerAs: 'vm',
            controller: umbVariantStateController
        };
        angular.module('umbraco.directives').component('umbVariantState', umbVariantStateComponent);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbEditorSubHeader
@restrict E

@description
Use this directive to construct a sub header in the main editor window.
The sub header is sticky and will follow along down the page when scrolling.

<h3>Markup example</h3>
<pre>
    <div ng-controller="MySection.Controller as vm">

        <form name="mySectionForm" novalidate>

            <umb-editor-view>

                <umb-editor-container>

                    <umb-editor-sub-header>
                        // sub header content here
                    </umb-editor-sub-header>

                </umb-editor-container>

            </umb-editor-view>

        </form>

    </div>
</pre>

<h3>Use in combination with</h3>
<ul>
    <li>{@link umbraco.directives.directive:umbEditorSubHeaderContentLeft umbEditorSubHeaderContentLeft}</li>
    <li>{@link umbraco.directives.directive:umbEditorSubHeaderContentRight umbEditorSubHeaderContentRight}</li>
    <li>{@link umbraco.directives.directive:umbEditorSubHeaderSection umbEditorSubHeaderSection}</li>
</ul>
**/
    (function () {
        'use strict';
        function EditorSubHeaderDirective() {
            var directive = {
                transclude: true,
                restrict: 'E',
                replace: true,
                scope: { 'appearance': '@?' },
                template: '<div class="umb-editor-sub-header umb-editor-sub-header--{{appearance}}" umb-sticky-bar scrollable-container=".umb-editor-container" ng-transclude></div>'
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbEditorSubHeader', EditorSubHeaderDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbEditorSubHeaderContentLeft
@restrict E

@description
Use this directive to left align content in a sub header in the main editor window.

<h3>Markup example</h3>
<pre>
    <div ng-controller="MySection.Controller as vm">

        <form name="mySectionForm" novalidate>

            <umb-editor-view>

                <umb-editor-container>

                    <umb-editor-sub-header>

                        <umb-editor-sub-header-content-left>
                            // left content here
                        </umb-editor-sub-header-content-left>

                        <umb-editor-sub-header-content-right>
                            // right content here
                        </umb-editor-sub-header-content-right>

                    </umb-editor-sub-header>

                </umb-editor-container>

            </umb-editor-view>

        </form>

    </div>
</pre>

<h3>Use in combination with</h3>
<ul>
    <li>{@link umbraco.directives.directive:umbEditorSubHeader umbEditorSubHeader}</li>
    <li>{@link umbraco.directives.directive:umbEditorSubHeaderContentRight umbEditorSubHeaderContentRight}</li>
    <li>{@link umbraco.directives.directive:umbEditorSubHeaderSection umbEditorSubHeaderSection}</li>
</ul>
**/
    (function () {
        'use strict';
        function EditorSubHeaderContentLeftDirective() {
            var directive = {
                transclude: true,
                restrict: 'E',
                replace: true,
                template: '<div class="umb-editor-sub-header__content-left" ng-transclude></div>'
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbEditorSubHeaderContentLeft', EditorSubHeaderContentLeftDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbEditorSubHeaderContentRight
@restrict E

@description
Use this directive to rigt align content in a sub header in the main editor window.

<h3>Markup example</h3>
<pre>
    <div ng-controller="MySection.Controller as vm">

        <form name="mySectionForm" novalidate>

            <umb-editor-view>

                <umb-editor-container>

                    <umb-editor-sub-header>

                        <umb-editor-sub-header-content-left>
                            // left content here
                        </umb-editor-sub-header-content-left>

                        <umb-editor-sub-header-content-right>
                            // right content here
                        </umb-editor-sub-header-content-right>

                    </umb-editor-sub-header>

                </umb-editor-container>

            </umb-editor-view>

        </form>

    </div>
</pre>

<h3>Use in combination with</h3>
<ul>
    <li>{@link umbraco.directives.directive:umbEditorSubHeader umbEditorSubHeader}</li>
    <li>{@link umbraco.directives.directive:umbEditorSubHeaderContentLeft umbEditorSubHeaderContentLeft}</li>
    <li>{@link umbraco.directives.directive:umbEditorSubHeaderSection umbEditorSubHeaderSection}</li>
</ul>
**/
    (function () {
        'use strict';
        function EditorSubHeaderContentRightDirective() {
            var directive = {
                transclude: true,
                restrict: 'E',
                replace: true,
                template: '<div class="umb-editor-sub-header__content-right" ng-transclude></div>'
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbEditorSubHeaderContentRight', EditorSubHeaderContentRightDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbEditorSubHeaderSection
@restrict E

@description
Use this directive to create sections, divided by borders, in a sub header in the main editor window.

<h3>Markup example</h3>
<pre>
    <div ng-controller="MySection.Controller as vm">

        <form name="mySectionForm" novalidate>

            <umb-editor-view>

                <umb-editor-container>

                    <umb-editor-sub-header>

                        <umb-editor-sub-header-content-right>

                            <umb-editor-sub-header-section>
                                // section content here
                            </umb-editor-sub-header-section>

                            <umb-editor-sub-header-section>
                                // section content here
                            </umb-editor-sub-header-section>

                            <umb-editor-sub-header-section>
                                // section content here
                            </umb-editor-sub-header-section>

                        </umb-editor-sub-header-content-right>

                    </umb-editor-sub-header>

                </umb-editor-container>

            </umb-editor-view>

        </form>

    </div>
</pre>

<h3>Use in combination with</h3>
<ul>
    <li>{@link umbraco.directives.directive:umbEditorSubHeader umbEditorSubHeader}</li>
    <li>{@link umbraco.directives.directive:umbEditorSubHeaderContentLeft umbEditorSubHeaderContentLeft}</li>
    <li>{@link umbraco.directives.directive:umbEditorSubHeaderContentRight umbEditorSubHeaderContentRight}</li>
</ul>
**/
    (function () {
        'use strict';
        function EditorSubHeaderSectionDirective() {
            var directive = {
                transclude: true,
                restrict: 'E',
                replace: true,
                template: '<div class="umb-editor-sub-header__section" ng-transclude></div>'
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbEditorSubHeaderSection', EditorSubHeaderSectionDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbBreadcrumbs
@restrict E
@scope

@description
Use this directive to generate a list of breadcrumbs.

<h3>Markup example</h3>
<pre>
    <div ng-controller="My.Controller as vm">
        <umb-breadcrumbs
            ng-if="vm.ancestors && vm.ancestors.length > 0"
            ancestors="vm.ancestors"
            entity-type="content">
        </umb-breadcrumbs>
    </div>
</pre>

<h3>Controller example</h3>
<pre>
    (function () {
        "use strict";

        function Controller(myService) {

            var vm = this;
            vm.ancestors = [];

            myService.getAncestors().then(function(ancestors){
                vm.ancestors = ancestors;
            });

        }

        angular.module("umbraco").controller("My.Controller", Controller);
    })();
</pre>

@param {array} ancestors Array of ancestors
@param {string} entityType The content entity type (member, media, content).
@param {callback} Callback when an ancestor is clicked. It will override the default link behaviour.
**/
    (function () {
        'use strict';
        function BreadcrumbsDirective($location, navigationService) {
            function link(scope, el, attr, ctrl) {
                scope.allowOnOpen = false;
                scope.open = function (ancestor) {
                    if (scope.onOpen && scope.allowOnOpen) {
                        scope.onOpen({ 'ancestor': ancestor });
                    }
                };
                scope.openPath = function (ancestor, event) {
                    // targeting a new tab/window?
                    if (event.ctrlKey || event.shiftKey || event.metaKey || // apple
                        event.button && event.button === 1    // middle click, >IE9 + everyone else
) {
                        // yes, let the link open itself
                        return;
                    }
                    event.stopPropagation();
                    event.preventDefault();
                    var path = scope.pathTo(ancestor);
                    $location.path(path);
                    navigationService.clearSearch(['cculture']);
                };
                scope.pathTo = function (ancestor) {
                    return '/' + scope.entityType + '/' + scope.entityType + '/edit/' + ancestor.id;
                };
                function onInit() {
                    if ('onOpen' in attr) {
                        scope.allowOnOpen = true;
                    }
                }
                onInit();
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<ul class="umb-breadcrumbs"><li class="umb-breadcrumbs__ancestor" ng-repeat="ancestor in ancestors"><a ng-if="!$last && !allowOnOpen" ng-href="#{{::pathTo(ancestor)}}" ng-click="openPath(ancestor, $event)" class="umb-breadcrumbs__ancestor-link" title="{{ancestor.name}}">{{ancestor.name}}</a><a ng-if="!$last && allowOnOpen" href="#" ng-click="open(ancestor)" class="umb-breadcrumbs__ancestor-link" title="{{ancestor.name}}" prevent-default>{{ancestor.name}}</a> <span ng-if="!$last" class="umb-breadcrumbs__separator">&#47;</span> <span class="umb-breadcrumbs__ancestor-text" ng-if="$last" title="{{ancestor.name}}">{{ancestor.name}}</span></li></ul>',
                scope: {
                    ancestors: '=',
                    entityType: '@',
                    onOpen: '&'
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbBreadcrumbs', BreadcrumbsDirective);
    }());
    'use strict';
    (function () {
        'use strict';
        function EditorDirective() {
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-editor" ng-style="model.style" ng-class="{\'umb-editor--small\': model.size === \'small\', \'umb-editor--animating\': model.animating}"><div ng-if="!model.view && !model.animating" ng-transclude></div><div ng-if="model.view && !model.animating" ng-include="model.view"></div><div ng-if="model.showOverlay" class="umb-editor__overlay"></div></div>',
                scope: { model: '=' }
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbEditor', EditorDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbEditorContainer
@restrict E

@description
Use this directive to construct a main content area inside the main editor window.

<h3>Markup example</h3>
<pre>
    <div ng-controller="Umbraco.Controller as vm">

        <umb-editor-view>

            <umb-editor-header
                // header configuration>
            </umb-editor-header>

            <umb-editor-container>
                // main content here
            </umb-editor-container>

            <umb-editor-footer>
                // footer content here
            </umb-editor-footer>

        </umb-editor-view>

    </div>
</pre>

<h3>Use in combination with</h3>
<ul>
    <li>{@link umbraco.directives.directive:umbEditorView umbEditorView}</li>
    <li>{@link umbraco.directives.directive:umbEditorHeader umbEditorHeader}</li>
    <li>{@link umbraco.directives.directive:umbEditorFooter umbEditorFooter}</li>
</ul>
**/
    (function () {
        'use strict';
        function EditorContainerDirective(overlayHelper) {
            function link(scope, el, attr, ctrl) {
                scope.numberOfOverlays = 0;
                // TODO: this shouldn't be a watch, this should be based on an event handler
                scope.$watch(function () {
                    return overlayHelper.getNumberOfOverlays();
                }, function (newValue) {
                    scope.numberOfOverlays = newValue;
                });
            }
            var directive = {
                transclude: true,
                restrict: 'E',
                replace: true,
                template: '<div data-element="editor-container" class="umb-editor-container umb-panel-body umb-scrollable row-fluid" ng-class="{\'-stop-scrolling\': numberOfOverlays > 0}"><div><umb-overlay-backdrop></umb-overlay-backdrop></div><div class="umb-pane"><div ng-transclude></div></div></div>',
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbEditorContainer', EditorContainerDirective);
    }());
    'use strict';
    (function () {
        'use strict';
        function EditorContentHeader(serverValidationManager) {
            function link(scope, el, attr, ctrl) {
                var unsubscribe = [];
                if (!scope.serverValidationNameField) {
                    scope.serverValidationNameField = 'Name';
                }
                if (!scope.serverValidationAliasField) {
                    scope.serverValidationAliasField = 'Alias';
                }
                scope.vm = {};
                scope.vm.dropdownOpen = false;
                scope.vm.currentVariant = '';
                scope.vm.variantsWithError = [];
                scope.vm.defaultVariant = null;
                scope.vm.errorsOnOtherVariants = false;
                // indicating wether to show that other variants, than the current, have errors.
                function checkErrorsOnOtherVariants() {
                    var check = false;
                    angular.forEach(scope.content.variants, function (variant) {
                        if (scope.openVariants.indexOf(variant.language.culture) === -1 && scope.variantHasError(variant.language.culture)) {
                            check = true;
                        }
                    });
                    scope.vm.errorsOnOtherVariants = check;
                }
                function onCultureValidation(valid, errors, allErrors, culture) {
                    var index = scope.vm.variantsWithError.indexOf(culture);
                    if (valid === true) {
                        if (index !== -1) {
                            scope.vm.variantsWithError.splice(index, 1);
                        }
                    } else {
                        if (index === -1) {
                            scope.vm.variantsWithError.push(culture);
                        }
                    }
                    checkErrorsOnOtherVariants();
                }
                function onInit() {
                    // find default.
                    angular.forEach(scope.content.variants, function (variant) {
                        if (variant.language.isDefault) {
                            scope.vm.defaultVariant = variant;
                        }
                    });
                    setCurrentVariant();
                    angular.forEach(scope.content.apps, function (app) {
                        if (app.alias === 'umbContent') {
                            app.anchors = scope.content.tabs;
                        }
                    });
                    angular.forEach(scope.content.variants, function (variant) {
                        unsubscribe.push(serverValidationManager.subscribe(null, variant.language.culture, null, onCultureValidation));
                    });
                    unsubscribe.push(serverValidationManager.subscribe(null, null, null, onCultureValidation));
                }
                function setCurrentVariant() {
                    angular.forEach(scope.content.variants, function (variant) {
                        if (variant.active) {
                            scope.vm.currentVariant = variant;
                            checkErrorsOnOtherVariants();
                        }
                    });
                }
                scope.goBack = function () {
                    if (scope.onBack) {
                        scope.onBack();
                    }
                };
                scope.selectVariant = function (event, variant) {
                    if (scope.onSelectVariant) {
                        scope.vm.dropdownOpen = false;
                        scope.onSelectVariant({ 'variant': variant });
                    }
                };
                scope.selectNavigationItem = function (item) {
                    if (scope.onSelectNavigationItem) {
                        scope.onSelectNavigationItem({ 'item': item });
                    }
                };
                scope.selectAnchorItem = function (item, anchor) {
                    if (scope.onSelectAnchorItem) {
                        scope.onSelectAnchorItem({
                            'item': item,
                            'anchor': anchor
                        });
                    }
                };
                scope.closeSplitView = function () {
                    if (scope.onCloseSplitView) {
                        scope.onCloseSplitView();
                    }
                };
                scope.openInSplitView = function (event, variant) {
                    if (scope.onOpenInSplitView) {
                        scope.vm.dropdownOpen = false;
                        scope.onOpenInSplitView({ 'variant': variant });
                    }
                };
                /**
       * keep track of open variants - this is used to prevent the same variant to be open in more than one split view
       * @param {any} culture
       */
                scope.variantIsOpen = function (culture) {
                    return scope.openVariants.indexOf(culture) !== -1;
                };
                /**
       * Check whether a variant has a error, used to display errors in variant switcher.
       * @param {any} culture
       */
                scope.variantHasError = function (culture) {
                    // if we are looking for the default language we also want to check for invariant.
                    if (culture === scope.vm.defaultVariant.language.culture) {
                        if (scope.vm.variantsWithError.indexOf('invariant') !== -1) {
                            return true;
                        }
                    }
                    if (scope.vm.variantsWithError.indexOf(culture) !== -1) {
                        return true;
                    }
                    return false;
                };
                onInit();
                //watch for the active culture changing, if it changes, update the current variant
                if (scope.content.variants) {
                    scope.$watch(function () {
                        for (var i = 0; i < scope.content.variants.length; i++) {
                            var v = scope.content.variants[i];
                            if (v.active) {
                                return v.language.culture;
                            }
                        }
                        return scope.vm.currentVariant.language.culture;    //should never get here
                    }, function (newValue, oldValue) {
                        if (newValue !== scope.vm.currentVariant.language.culture) {
                            setCurrentVariant();
                        }
                    });
                }
                scope.$on('$destroy', function () {
                    for (var u in unsubscribe) {
                        unsubscribe[u]();
                    }
                });
            }
            var directive = {
                transclude: true,
                restrict: 'E',
                replace: true,
                template: '<div data-element="editor-header" class="umb-editor-header" ng-class="{\'-split-view-active\': splitViewOpen === true}"><div class="flex items-center" style="height: 100%;"><div ng-if="showBackButton === true && splitViewOpen !== true" style="margin-right: 15px;"><a class="umb-editor-header__back" href="#" ng-click="goBack()" prevent-default><i class="fa fa-arrow-left" aria-hidden="true"></i></a></div><div class="flex items-center" style="flex: 1;"><div id="nameField" class="umb-editor-header__name-and-description" style="flex: 1 1 auto;"><div class="umb-editor-header__name-wrapper"><ng-form name="headerNameForm"><input data-element="editor-name-field" type="text" class="umb-editor-header__name-input" localize="placeholder" placeholder="@placeholders_entername" name="headerName" ng-model="name" ng-class="{\'name-is-empty\': $parent.name===null || $parent.name===\'\'}" ng-disabled="nameDisabled" umb-auto-focus val-server-field="{{serverValidationNameField}}" required aria-required="true" aria-invalid="{{contentForm.headerNameForm.headerName.$invalid ? true : false}}" autocomplete="off" maxlength="255"></ng-form><a ng-if="content.variants.length > 0 && hideChangeVariant !== true" class="umb-variant-switcher__toggle" ng-click="vm.dropdownOpen = !vm.dropdownOpen" ng-class="{\'--error\': vm.errorsOnOtherVariants}"><span>{{vm.currentVariant.language.name}}</span><ins class="umb-variant-switcher__expand" ng-class="{\'icon-navigation-down\': !vm.dropdownOpen, \'icon-navigation-up\': vm.dropdownOpen}">&nbsp;</ins></a> <span ng-if="hideChangeVariant" class="umb-variant-switcher__toggle"><span>{{vm.currentVariant.language.name}}</span></span><umb-dropdown ng-if="vm.dropdownOpen" style="min-width: 100%; max-height: 250px; overflow-y: auto; margin-top: 5px;" on-close="vm.dropdownOpen = false" umb-keyboard-list><umb-dropdown-item class="umb-variant-switcher__item" ng-class="{\'--current\': variant.active, \'--not-allowed\': variantIsOpen(variant.language.culture), \'--error\': variantHasError(variant.language.culture)}" ng-repeat="variant in content.variants"><a class="umb-variant-switcher__name-wrapper" ng-click="selectVariant($event, variant)" prevent-default><span class="umb-variant-switcher__name">{{variant.language.name}}</span><umb-variant-state variant="variant" class="umb-variant-switcher__state"></umb-variant-state></a><div ng-if="splitViewOpen !== true && !variant.active" class="umb-variant-switcher__split-view" ng-click="openInSplitView($event, variant)">Open in split view</div></umb-dropdown-item></umb-dropdown></div></div></div><div ng-if="splitViewOpen"><a class="umb-editor-header__close-split-view" ng-click="closeSplitView()"><i class="icon-delete"></i></a></div><div ng-if="content.apps && splitViewOpen !== true"><umb-editor-navigation data-element="editor-sub-views" navigation="content.apps" on-select="selectNavigationItem(item)" on-anchor-select="selectAnchorItem(item, anchor)"></umb-editor-navigation></div><div ng-if="menu.currentNode && splitViewOpen !== true && hideActionsMenu !== true"><umb-editor-menu data-element="editor-actions" current-node="menu.currentNode" current-section="{{menu.currentSection}}"></umb-editor-menu></div></div></div>',
                scope: {
                    name: '=',
                    nameDisabled: '<?',
                    menu: '=',
                    hideActionsMenu: '<?',
                    content: '=',
                    openVariants: '<',
                    hideChangeVariant: '<?',
                    onSelectNavigationItem: '&?',
                    onSelectAnchorItem: '&?',
                    showBackButton: '<?',
                    onBack: '&?',
                    splitViewOpen: '=?',
                    onOpenInSplitView: '&?',
                    onCloseSplitView: '&?',
                    onSelectVariant: '&?',
                    serverValidationNameField: '@?',
                    serverValidationAliasField: '@?'
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbEditorContentHeader', EditorContentHeader);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbEditorFooter
@restrict E

@description
Use this directive to construct a footer inside the main editor window.

<h3>Markup example</h3>
<pre>
    <div ng-controller="MySection.Controller as vm">

        <form name="mySectionForm" novalidate>

            <umb-editor-view>

                <umb-editor-header
                    // header configuration>
                </umb-editor-header>

                <umb-editor-container>
                    // main content here
                </umb-editor-container>

                <umb-editor-footer>
                    // footer content here
                </umb-editor-footer>

            </umb-editor-view>

        </form>

    </div>
</pre>

<h3>Use in combination with</h3>
<ul>
    <li>{@link umbraco.directives.directive:umbEditorView umbEditorView}</li>
    <li>{@link umbraco.directives.directive:umbEditorHeader umbEditorHeader}</li>
    <li>{@link umbraco.directives.directive:umbEditorContainer umbEditorContainer}</li>
    <li>{@link umbraco.directives.directive:umbEditorFooterContentLeft umbEditorFooterContentLeft}</li>
    <li>{@link umbraco.directives.directive:umbEditorFooterContentRight umbEditorFooterContentRight}</li>
</ul>
**/
    (function () {
        'use strict';
        function EditorFooterDirective() {
            var directive = {
                transclude: true,
                restrict: 'E',
                replace: true,
                template: '<div data-element="editor-footer" class="umb-editor-footer"><div class="umb-editor-footer-content" ng-transclude></div></div>'
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbEditorFooter', EditorFooterDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbEditorFooterContentLeft
@restrict E

@description
Use this directive to align content left inside the main editor footer.

<h3>Markup example</h3>
<pre>
    <div ng-controller="MySection.Controller as vm">

        <form name="mySectionForm" novalidate>

            <umb-editor-view>

                <umb-editor-footer>

                    <umb-editor-footer-content-left>
                        // align content left
                    </umb-editor-footer-content-left>

                    <umb-editor-footer-content-right>
                        // align content right
                    </umb-editor-footer-content-right>

                </umb-editor-footer>

            </umb-editor-view>

        </form>

    </div>
</pre>

<h3>Use in combination with</h3>
<ul>
    <li>{@link umbraco.directives.directive:umbEditorView umbEditorView}</li>
    <li>{@link umbraco.directives.directive:umbEditorHeader umbEditorHeader}</li>
    <li>{@link umbraco.directives.directive:umbEditorContainer umbEditorContainer}</li>
    <li>{@link umbraco.directives.directive:umbEditorFooter umbEditorFooter}</li>
    <li>{@link umbraco.directives.directive:umbEditorFooterContentRight umbEditorFooterContentRight}</li>
</ul>
**/
    (function () {
        'use strict';
        function EditorFooterContentLeftDirective() {
            var directive = {
                transclude: true,
                restrict: 'E',
                replace: true,
                template: '<div class="umb-editor-footer-content__left-side" ng-transclude></div>'
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbEditorFooterContentLeft', EditorFooterContentLeftDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbEditorFooterContentRight
@restrict E

@description
Use this directive to align content right inside the main editor footer.

<h3>Markup example</h3>
<pre>
    <div ng-controller="MySection.Controller as vm">

        <form name="mySectionForm" novalidate>

            <umb-editor-view>

                <umb-editor-footer>

                    <umb-editor-footer-content-left>
                        // align content left
                    </umb-editor-footer-content-left>

                    <umb-editor-footer-content-right>
                        // align content right
                    </umb-editor-footer-content-right>

                </umb-editor-footer>

            </umb-editor-view>

        </form>

    </div>
</pre>

<h3>Use in combination with</h3>
<ul>
    <li>{@link umbraco.directives.directive:umbEditorView umbEditorView}</li>
    <li>{@link umbraco.directives.directive:umbEditorHeader umbEditorHeader}</li>
    <li>{@link umbraco.directives.directive:umbEditorContainer umbEditorContainer}</li>
    <li>{@link umbraco.directives.directive:umbEditorFooter umbEditorFooter}</li>
    <li>{@link umbraco.directives.directive:umbEditorFooterContentLeft umbEditorFooterContentLeft}</li>
</ul>
**/
    (function () {
        'use strict';
        function EditorFooterContentRightDirective() {
            var directive = {
                transclude: true,
                restrict: 'E',
                replace: true,
                template: '<div class="umb-editor-footer-content__right-side" ng-transclude></div>'
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbEditorFooterContentRight', EditorFooterContentRightDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbEditorHeader
@restrict E
@scope

@description
Use this directive to construct a header inside the main editor window.

<h3>Markup example</h3>
<pre>
    <div ng-controller="MySection.Controller as vm">

        <form name="mySectionForm" novalidate>

            <umb-editor-view>

                <umb-editor-header
                    name="vm.content.name"
                    hide-alias="true"
                    hide-description="true"
                    hide-icon="true">
                </umb-editor-header>

                <umb-editor-container>
                    // main content here
                </umb-editor-container>

                <umb-editor-footer>
                    // footer content here
                </umb-editor-footer>

            </umb-editor-view>

        </form>

    </div>
</pre>

<h3>Markup example - with tabs</h3>
<pre>
    <div ng-controller="MySection.Controller as vm">

        <form name="mySectionForm" val-form-manager novalidate>

            <umb-editor-view umb-tabs>

                <umb-editor-header
                    name="vm.content.name"
                    tabs="vm.content.tabs"
                    hide-alias="true"
                    hide-description="true"
                    hide-icon="true">
                </umb-editor-header>

                <umb-editor-container>
                    <umb-tabs-content class="form-horizontal" view="true">
                        <umb-tab id="tab{{tab.id}}" ng-repeat="tab in vm.content.tabs" rel="{{tab.id}}">

                            <div ng-show="tab.alias==='tab1'">
                                // tab 1 content
                            </div>

                            <div ng-show="tab.alias==='tab2'">
                                // tab 2 content
                            </div>

                        </umb-tab>
                    </umb-tabs-content>
                </umb-editor-container>

                <umb-editor-footer>
                    // footer content here
                </umb-editor-footer>

            </umb-editor-view>

        </form>

    </div>
</pre>

<h3>Controller example - with tabs</h3>
<pre>
    (function () {
        "use strict";

        function Controller() {

            var vm = this;
            vm.content = {
                name: "",
                tabs: [
                    {
                        id: 1,
                        label: "Tab 1",
                        alias: "tab1",
                        active: true
                    },
                    {
                        id: 2,
                        label: "Tab 2",
                        alias: "tab2",
                        active: false
                    }
                ]
            };

        }

        angular.module("umbraco").controller("MySection.Controller", Controller);
    })();
</pre>

<h3>Markup example - with sub views</h3>
<pre>
    <div ng-controller="MySection.Controller as vm">

        <form name="mySectionForm" val-form-manager novalidate>

            <umb-editor-view>

                <umb-editor-header
                    name="vm.content.name"
                    navigation="vm.content.navigation"
                    hide-alias="true"
                    hide-description="true"
                    hide-icon="true">
                </umb-editor-header>

                <umb-editor-container>

                    <umb-editor-sub-views
                        sub-views="vm.content.navigation"
                        model="vm.content">
                    </umb-editor-sub-views>

                </umb-editor-container>

                <umb-editor-footer>
                    // footer content here
                </umb-editor-footer>

            </umb-editor-view>

        </form>

    </div>
</pre>

<h3>Controller example - with sub views</h3>
<pre>
    (function () {

        "use strict";

        function Controller() {

            var vm = this;
            vm.content = {
                name: "",
                navigation: [
                    {
                        "name": "Section 1",
                        "icon": "icon-document-dashed-line",
                        "view": "/App_Plugins/path/to/html.html",
                        "active": true
                    },
                    {
                        "name": "Section 2",
                        "icon": "icon-list",
                        "view": "/App_Plugins/path/to/html.html",
                    }
                ]
            };

        }

        angular.module("umbraco").controller("MySection.Controller", Controller);
    })();
</pre>

<h3>Use in combination with</h3>
<ul>
    <li>{@link umbraco.directives.directive:umbEditorView umbEditorView}</li>
    <li>{@link umbraco.directives.directive:umbEditorContainer umbEditorContainer}</li>
    <li>{@link umbraco.directives.directive:umbEditorFooter umbEditorFooter}</li>
</ul>

@param {string} name The content name.
@param {array=} tabs Array of tabs. See example above.
@param {array=} navigation Array of sub views. See example above.
@param {boolean=} nameLocked Set to <code>true</code> to lock the name.
@param {object=} menu Add a context menu to the editor.
@param {string=} icon Show and edit the content icon. Opens an overlay to change the icon.
@param {boolean=} hideIcon Set to <code>true</code> to hide icon.
@param {string=} alias show and edit the content alias.
@param {boolean=} hideAlias Set to <code>true</code> to hide alias.
@param {string=} description Add a description to the content.
@param {boolean=} hideDescription Set to <code>true</code> to hide description.

**/
    (function () {
        'use strict';
        function EditorHeaderDirective(editorService) {
            function link(scope) {
                scope.vm = {};
                scope.vm.dropdownOpen = false;
                scope.vm.currentVariant = '';
                scope.goBack = function () {
                    if (scope.onBack) {
                        scope.onBack();
                    }
                };
                scope.selectNavigationItem = function (item) {
                    if (scope.onSelectNavigationItem) {
                        scope.onSelectNavigationItem({ 'item': item });
                    }
                };
                scope.openIconPicker = function () {
                    var iconPicker = {
                        icon: scope.icon.split(' ')[0],
                        color: scope.icon.split(' ')[1],
                        submit: function submit(model) {
                            if (model.icon) {
                                if (model.color) {
                                    scope.icon = model.icon + ' ' + model.color;
                                } else {
                                    scope.icon = model.icon;
                                }
                                // set the icon form to dirty
                                scope.iconForm.$setDirty();
                            }
                            editorService.close();
                        },
                        close: function close() {
                            editorService.close();
                        }
                    };
                    editorService.iconPicker(iconPicker);
                };
            }
            var directive = {
                transclude: true,
                restrict: 'E',
                replace: true,
                template: '<div data-element="editor-header" class="umb-editor-header" ng-class="{\'-split-view-active\': splitViewOpen === true}"><div class="flex items-center" style="height: 100%;"><div ng-if="showBackButton === true && splitViewOpen !== true" style="margin-right: 15px;"><a class="umb-editor-header__back" href="#" ng-click="goBack()" prevent-default><i class="fa fa-arrow-left" aria-hidden="true"></i></a></div><div class="flex items-center" style="flex: 1;"><ng-form data-element="editor-icon" name="iconForm"><div class="umb-panel-header-icon" ng-if="!hideIcon" ng-click="openIconPicker()" ng-class="{\'-placeholder\': $parent.icon===\'\' || $parent.icon===null}" title="{{$parent.icon}}"><i class="icon {{$parent.icon}}" ng-if="$parent.icon!==\'\' && $parent.icon!==null"></i><div class="umb-panel-header-icon-text" ng-if="$parent.icon===\'\' || $parent.icon===null"><localize key="settings_addIcon"></localize></div></div></ng-form><div id="nameField" class="umb-editor-header__name-and-description" style="flex: 1 1 auto;"><div class="umb-editor-header__name-wrapper" ng-show="!nameLocked || !hideAlias"><ng-form name="headerNameForm"><input data-element="editor-name-field" no-password-manager title="{{key}}" type="text" class="umb-editor-header__name-input" localize="placeholder" placeholder="@placeholders_entername" name="headerName" ng-show="!nameLocked" ng-model="name" ng-class="{\'name-is-empty\': $parent.name===null || $parent.name===\'\'}" umb-auto-focus val-server-field="Name" required autocomplete="off"></ng-form><umb-generate-alias data-element="editor-alias" class="umb-panel-header-alias" ng-if="!hideAlias" alias="$parent.alias" alias-from="$parent.name" enable-lock="true" validation-position="\'right\'" server-validation-field="Alias"></umb-generate-alias></div><div class="umb-panel-header-name" ng-if="nameLocked" title="{{key}}">{{ name }}</div><input data-element="editor-description" no-password-manager type="text" class="umb-panel-header-description" localize="placeholder" placeholder="@placeholders_enterDescription" ng-if="!hideDescription && !descriptionLocked" ng-model="$parent.description"><div class="umb-panel-header-locked-description" ng-if="descriptionLocked">{{ description }}</div></div></div><div ng-if="navigation && splitViewOpen !== true"><umb-editor-navigation data-element="editor-sub-views" navigation="navigation" on-select="selectNavigationItem(item)"></umb-editor-navigation></div><div ng-if="menu.currentNode && splitViewOpen !== true && hideActionsMenu !== true"><umb-editor-menu data-element="editor-actions" current-node="menu.currentNode" current-section="{{menu.currentSection}}"></umb-editor-menu></div></div></div>',
                scope: {
                    name: '=',
                    nameLocked: '=',
                    menu: '=',
                    hideActionsMenu: '<?',
                    icon: '=',
                    hideIcon: '@',
                    alias: '=',
                    hideAlias: '=',
                    description: '=',
                    hideDescription: '@',
                    descriptionLocked: '@',
                    navigation: '=',
                    onSelectNavigationItem: '&?',
                    key: '=',
                    onBack: '&?',
                    showBackButton: '<?'
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbEditorHeader', EditorHeaderDirective);
    }());
    'use strict';
    (function () {
        'use strict';
        function EditorMenuDirective($injector, treeService, navigationService, umbModelMapper, appState) {
            function link(scope, el, attr, ctrl) {
                scope.dropdown = { isOpen: false };
                function onInit() {
                    getOptions();
                }
                //adds a handler to the context menu item click, we need to handle this differently
                //depending on what the menu item is supposed to do.
                scope.executeMenuItem = function (action) {
                    //the action is called as it would be by the tree. to ensure that the action targets the correct node, 
                    //we need to set the current node in appState before calling the action. otherwise we break all actions
                    //that use the current node (and that's pretty much all of them)
                    appState.setMenuState('currentNode', scope.currentNode);
                    navigationService.executeMenuAction(action, scope.currentNode, scope.currentSection);
                    scope.dropdown.isOpen = false;
                };
                //callback method to go and get the options async
                function getOptions() {
                    if (!scope.currentNode) {
                        return;
                    }
                    if (!scope.actions) {
                        treeService.getMenu({ treeNode: scope.currentNode }).then(function (data) {
                            scope.actions = data.menuItems;
                        });
                    }
                }
                ;
                onInit();
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="pull-right" style="position: relative;"><umb-button type="button" button-style="white" action="dropdown.isOpen = !dropdown.isOpen" label-key="general_actions" show-caret="true"></umb-button><umb-dropdown ng-if="dropdown.isOpen" class="umb-actions" on-close="dropdown.isOpen = false"><umb-dropdown-item class="umb-action" ng-class="{\'sep\':action.separatorm, \'-opens-dialog\': action.opensDialog}" ng-repeat="action in actions"><a ng-click="executeMenuItem(action)" prevent-default><i class="icon icon-{{action.cssclass}}"></i> <span class="menu-label">{{action.name}}</span></a></umb-dropdown-item></umb-dropdown></div>',
                link: link,
                scope: {
                    currentNode: '=',
                    currentSection: '@'
                }
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbEditorMenu', EditorMenuDirective);
    }());
    'use strict';
    (function () {
        'use strict';
        function EditorNavigationDirective($window, $timeout, eventsService, windowResizeListener) {
            function link(scope) {
                scope.showNavigation = true;
                scope.showMoreButton = false;
                scope.showDropdown = false;
                scope.overflowingItems = 0;
                scope.itemsLimit = 6;
                scope.moreButton = {
                    alias: 'more',
                    active: false,
                    name: 'More'
                };
                scope.openNavigationItem = function (item) {
                    scope.showDropdown = false;
                    runItemAction(item);
                    setItemToActive(item);
                    if (scope.onSelect) {
                        scope.onSelect({ 'item': item });
                    }
                    eventsService.emit('app.tabChange', item);
                };
                scope.openAnchorItem = function (item, anchor) {
                    if (scope.onAnchorSelect) {
                        scope.onAnchorSelect({
                            'item': item,
                            'anchor': anchor
                        });
                    }
                    if (item.active !== true) {
                        scope.openNavigationItem(item);
                    }
                };
                scope.toggleDropdown = function () {
                    scope.showDropdown = !scope.showDropdown;
                };
                scope.hideDropdown = function () {
                    scope.showDropdown = false;
                };
                function onInit() {
                    var firstRun = true;
                    scope.$watch('navigation.length', function (newVal, oldVal) {
                        if (firstRun || newVal !== undefined && newVal !== oldVal) {
                            firstRun = false;
                            scope.showNavigation = newVal > 1;
                            calculateVisibleItems($window.innerWidth);
                        }
                    });
                }
                function calculateVisibleItems(windowWidth) {
                    // if we don't get a windowWidth stick with the default item limit
                    if (!windowWidth) {
                        return;
                    }
                    scope.itemsLimit = 0;
                    // set visible items based on browser width
                    if (windowWidth > 1500) {
                        scope.itemsLimit = 6;
                    } else if (windowWidth > 700) {
                        scope.itemsLimit = 4;
                    }
                    // toggle more button
                    if (scope.navigation.length > scope.itemsLimit) {
                        scope.showMoreButton = true;
                        scope.overflowingItems = scope.itemsLimit - scope.navigation.length;
                    } else {
                        scope.showMoreButton = false;
                        scope.overflowingItems = 0;
                    }
                }
                function runItemAction(selectedItem) {
                    if (selectedItem.action) {
                        selectedItem.action(selectedItem);
                    }
                }
                function setItemToActive(selectedItem) {
                    if (selectedItem.view) {
                        // deselect all items
                        angular.forEach(scope.navigation, function (item, index) {
                            item.active = false;
                        });
                        // set clicked item to active
                        selectedItem.active = true;
                        // set more button to active if item in dropdown is clicked
                        var selectedItemIndex = scope.navigation.indexOf(selectedItem);
                        if (selectedItemIndex + 1 > scope.itemsLimit) {
                            scope.moreButton.active = true;
                        } else {
                            scope.moreButton.active = false;
                        }
                    }
                }
                var resizeCallback = function resizeCallback(size) {
                    if (size && size.width) {
                        calculateVisibleItems(size.width);
                    }
                };
                windowResizeListener.register(resizeCallback);
                //ensure to unregister from all events and kill jquery plugins
                scope.$on('$destroy', function () {
                    windowResizeListener.unregister(resizeCallback);
                });
                onInit();
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<ul class="umb-sub-views-nav" ng-show="showNavigation"><li ng-repeat="navItem in navigation | limitTo: itemsLimit"><div ng-show="navItem.alias !== \'more\'" ng-class="navItem.errorClass"><umb-editor-navigation-item item="navItem" on-open="openNavigationItem(item)" on-open-anchor="openAnchorItem(item, anchor)" hotkey="$index + 1"></umb-editor-navigation-item></div></li><li ng-show="showMoreButton" style="position: relative;"><div class="umb-sub-views-nav-item umb-sub-views-nav-item-more"><a data-element="sub-view-{{moreButton.alias}}" ng-click="toggleDropdown()" ng-class="{\'is-active\': moreButton.active}"><div class="umb-sub-views-nav-item-more__icon"><i></i><i></i><i></i></div><span class="umb-sub-views-nav-item-text">{{ moreButton.name }}</span></a><umb-dropdown ng-show="showDropdown" on-close="hideDropdown()" class="umb-sub-views-nav-item-more__dropdown"><umb-dropdown-item ng-repeat="navItem in navigation | limitTo: overflowingItems"><umb-editor-navigation-item item="navItem" on-open="openNavigationItem(item)" on-open-anchor="openAnchorItem(item, anchor)" index="{{$index}}"></umb-editor-navigation-item></umb-dropdown-item></umb-dropdown></div></li></ul>',
                scope: {
                    navigation: '=',
                    onSelect: '&',
                    onAnchorSelect: '&'
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives.html').directive('umbEditorNavigation', EditorNavigationDirective);
    }());
    'use strict';
    (function () {
        'use strict';
        function UmbEditorNavigationItemController($scope, $element, $attrs) {
            var vm = this;
            vm.clicked = function () {
                vm.onOpen({ item: vm.item });
            };
            vm.anchorClicked = function (anchor, $event) {
                vm.onOpenAnchor({
                    item: vm.item,
                    anchor: anchor
                });
                $event.stopPropagation();
                $event.preventDefault();
            };
            // needed to make sure that we update what anchors are active.
            vm.mouseOver = function () {
                $scope.$digest();
            };
            var componentNode = $element[0];
            componentNode.classList.add('umb-sub-views-nav-item');
            componentNode.addEventListener('mouseover', vm.mouseOver);
            //ensure to unregister from all dom-events
            $scope.$on('$destroy', function () {
                componentNode.removeEventListener('mouseover', vm.mouseOver);
            });
        }
        angular.module('umbraco.directives.html').component('umbEditorNavigationItem', {
            template: '<a data-element="sub-view-{{vm.item.alias}}" tabindex="-1" ng-href ng-click="vm.clicked()" hotkey="{{::vm.hotkey}}" hotkey-when-hidden="true" ng-class="{\'is-active\': vm.item.active, \'-has-error\': vm.item.hasError}"><i class="icon {{ vm.item.icon }}"></i> <span class="umb-sub-views-nav-item-text">{{ vm.item.name }}</span><div ng-show="vm.item.badge" class="badge -type-{{vm.item.badge.type}}">{{vm.item.badge.count}}</div></a><ul class="dropdown-menu umb-sub-views-nav-item__anchor_dropdown" ng-if="vm.item.anchors && vm.item.anchors.length > 1"><li ng-repeat="anchor in vm.item.anchors" ng-class="{\'is-active\': vm.item.active && anchor.active}"><a ng-click="vm.anchorClicked(anchor, $event)">{{anchor.label}}</a></li></ul>',
            controller: UmbEditorNavigationItemController,
            controllerAs: 'vm',
            bindings: {
                item: '=',
                onOpen: '&',
                onOpenAnchor: '&',
                hotkey: '<'
            }
        });
    }());
    'use strict';
    (function () {
        'use strict';
        function EditorsDirective($timeout, eventsService) {
            function link(scope, el, attr, ctrl) {
                var evts = [];
                var allowedNumberOfVisibleEditors = 3;
                scope.editors = [];
                function addEditor(editor) {
                    editor.inFront = true;
                    editor.moveRight = true;
                    editor.level = 0;
                    editor.styleIndex = 0;
                    editor.infinityMode = true;
                    // push the new editor to the dom
                    scope.editors.push(editor);
                    $timeout(function () {
                        editor.moveRight = false;
                    });
                    editor.animating = true;
                    setTimeout(revealEditorContent.bind(this, editor), 400);
                    updateEditors();
                }
                function removeEditor(editor) {
                    editor.moveRight = true;
                    editor.animating = true;
                    setTimeout(removeEditorFromDOM.bind(this, editor), 400);
                    updateEditors(-1);
                }
                function revealEditorContent(editor) {
                    editor.animating = false;
                    scope.$digest();
                }
                function removeEditorFromDOM(editor) {
                    // push the new editor to the dom
                    var index = scope.editors.indexOf(editor);
                    if (index !== -1) {
                        scope.editors.splice(index, 1);
                    }
                    updateEditors();
                    scope.$digest();
                }
                /** update layer positions. With ability to offset positions, needed for when an item is moving out, then we dont want it to influence positions */
                function updateEditors(offset) {
                    offset = offset || 0;
                    // fallback value.
                    var len = scope.editors.length;
                    var calcLen = len + offset;
                    var ceiling = Math.min(calcLen, allowedNumberOfVisibleEditors);
                    var origin = Math.max(calcLen - 1, 0) - ceiling;
                    var i = 0;
                    while (i < len) {
                        var iEditor = scope.editors[i];
                        iEditor.styleIndex = Math.min(i + 1, allowedNumberOfVisibleEditors);
                        iEditor.level = Math.max(i - origin, -1);
                        iEditor.inFront = iEditor.level >= ceiling;
                        i++;
                    }
                }
                evts.push(eventsService.on('appState.editors.open', function (name, args) {
                    addEditor(args.editor);
                }));
                evts.push(eventsService.on('appState.editors.close', function (name, args) {
                    // remove the closed editor
                    if (args && args.editor) {
                        removeEditor(args.editor);
                    }
                    // close all editors
                    if (args && !args.editor && args.editors.length === 0) {
                        scope.editors = [];
                    }
                }));
                //ensure to unregister from all events!
                scope.$on('$destroy', function () {
                    for (var e in evts) {
                        eventsService.unsubscribe(evts[e]);
                    }
                });
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-editors"><div class="umb-editor" ng-repeat="model in editors" ng-class="{\'umb-editor--small\': model.size === \'small\', \'umb-editor--animating\': model.animating, \'--notInFront\': model.inFront !== true, \'umb-editor--infinityMode\': model.infinityMode, \'moveRight\': model.moveRight, \'umb-editor--n0\': model.styleIndex === 0, \'umb-editor--n1\': model.styleIndex === 1, \'umb-editor--n2\': model.styleIndex === 2, \'umb-editor--n3\': model.styleIndex === 3, \'umb-editor--outOfRange\': model.level === -1, \'umb-editor--level0\': model.level === 0, \'umb-editor--level1\': model.level === 1, \'umb-editor--level2\': model.level === 2, \'umb-editor--level3\': model.level === 3}"><div ng-if="!model.view && !model.animating" ng-transclude></div><div ng-if="model.view && !model.animating" ng-include="model.view"></div><div class="umb-editor__overlay"></div></div></div>',
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbEditors', EditorsDirective);
    }());
    'use strict';
    (function () {
        'use strict';
        /**
   * A directive that renders a defined view with a view model and a the whole content model.
   **/
        function EditorSubViewDirective() {
            function link(scope, el, attr, ctrl) {
                //The model can contain: view, viewModel, name, alias, icon
                if (!scope.model.view) {
                    throw 'No view defined for the content app';
                }
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-editor-sub-view" ng-class="\'sub-view-\' + model.name" val-sub-view><div class="umb-editor-sub-view__content" ng-show="model.active === true" ng-include="model.view"></div></div>',
                scope: {
                    model: '=',
                    content: '='
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbEditorSubView', EditorSubViewDirective);
    }());
    'use strict';
    (function () {
        'use strict';
        /**
   * A directive that just repeats over a list of defined views which are all able to access the same common model.
   * This is only used in simple cases, whereas media and content use umbEditorSubView (singular) which allows
   * passing in a view model specific to the view and the entire content model for support if required.
   **/
        function EditorSubViewsDirective() {
            function link(scope, el, attr, ctrl) {
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-editor-sub-views"><div id="sub-view-{{$index}}" class="umb-editor-sub-view" ng-repeat="subView in subViews track by subView.alias" ng-class="\'sub-view-\' + subView.name" val-sub-view><div class="umb-editor-sub-view__content" ng-show="subView.active === true" ng-include="subView.view"></div></div></div>',
                scope: {
                    subViews: '=',
                    model: '='
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbEditorSubViews', EditorSubViewsDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbEditorView
@restrict E
@scope

@description
Use this directive to construct the main editor window.

<h3>Markup example</h3>
<pre>
    <div ng-controller="MySection.Controller as vm">

        <form name="mySectionForm" novalidate>

            <umb-editor-view>

                <umb-editor-header
                    name="vm.content.name"
                    hide-alias="true"
                    hide-description="true"
                    hide-icon="true">
                </umb-editor-header>

                <umb-editor-container>
                    // main content here
                </umb-editor-container>

                <umb-editor-footer>
                    // footer content here
                </umb-editor-footer>

            </umb-editor-view>

        </form>

    </div>
</pre>
<h3>Controller example</h3>
<pre>
    (function () {

        "use strict";

        function Controller() {

            var vm = this;

        }

        angular.module("umbraco").controller("MySection.Controller", Controller);
    })();
</pre>


<h3>Use in combination with</h3>
<ul>
    <li>{@link umbraco.directives.directive:umbEditorHeader umbEditorHeader}</li>
    <li>{@link umbraco.directives.directive:umbEditorContainer umbEditorContainer}</li>
    <li>{@link umbraco.directives.directive:umbEditorFooter umbEditorFooter}</li>
</ul>
**/
    (function () {
        'use strict';
        function EditorViewDirective() {
            function link(scope, el, attr) {
                if (attr.footer) {
                    scope.footer = attr.footer;
                }
            }
            var directive = {
                transclude: true,
                restrict: 'E',
                replace: true,
                template: '<div class="umb-panel umb-editor-wrapper" ng-class="{ \'-no-footer\': footer === \'false\' }" ng-transclude></div>',
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbEditorView', EditorViewDirective);
    }());
    'use strict';
    /**
* @description Utillity directives for key and field events
**/
    angular.module('umbraco.directives').directive('onDragEnter', function () {
        return {
            link: function link(scope, elm, attrs) {
                var f = function f() {
                    scope.$apply(attrs.onDragEnter);
                };
                elm.on('dragenter', f);
                scope.$on('$destroy', function () {
                    elm.off('dragenter', f);
                });
            }
        };
    }).directive('onDragLeave', function () {
        return function (scope, elm, attrs) {
            var f = function f(event) {
                var rect = this.getBoundingClientRect();
                var getXY = function getCursorPosition(event) {
                    var x, y;
                    if (typeof event.clientX === 'undefined') {
                        // try touch screen
                        x = event.pageX + document.documentElement.scrollLeft;
                        y = event.pageY + document.documentElement.scrollTop;
                    } else {
                        x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
                        y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
                    }
                    return {
                        x: x,
                        y: y
                    };
                };
                var e = getXY(event.originalEvent);
                // Check the mouseEvent coordinates are outside of the rectangle
                if (e.x > rect.left + rect.width - 1 || e.x < rect.left || e.y > rect.top + rect.height - 1 || e.y < rect.top) {
                    scope.$apply(attrs.onDragLeave);
                }
            };
            elm.on('dragleave', f);
            scope.$on('$destroy', function () {
                elm.off('dragleave', f);
            });
        };
    }).directive('onDragOver', function () {
        return {
            link: function link(scope, elm, attrs) {
                var f = function f() {
                    scope.$apply(attrs.onDragOver);
                };
                elm.on('dragover', f);
                scope.$on('$destroy', function () {
                    elm.off('dragover', f);
                });
            }
        };
    }).directive('onDragStart', function () {
        return {
            link: function link(scope, elm, attrs) {
                var f = function f() {
                    scope.$apply(attrs.onDragStart);
                };
                elm.on('dragstart', f);
                scope.$on('$destroy', function () {
                    elm.off('dragstart', f);
                });
            }
        };
    }).directive('onDragEnd', function () {
        return {
            link: function link(scope, elm, attrs) {
                var f = function f() {
                    scope.$apply(attrs.onDragEnd);
                };
                elm.on('dragend', f);
                scope.$on('$destroy', function () {
                    elm.off('dragend', f);
                });
            }
        };
    }).directive('onDrop', function () {
        return {
            link: function link(scope, elm, attrs) {
                var f = function f() {
                    scope.$apply(attrs.onDrop);
                };
                elm.on('drop', f);
                scope.$on('$destroy', function () {
                    elm.off('drop', f);
                });
            }
        };
    }).directive('onOutsideClick', function ($timeout, angularHelper) {
        return function (scope, element, attrs) {
            var eventBindings = [];
            function oneTimeClick(event) {
                // ignore clicks on button groups toggles (i.e. the save and publish button)
                var parents = $(event.target).closest('[data-element=\'button-group-toggle\']');
                if (parents.length > 0) {
                    return;
                }
                // ignore clicks on new overlay
                parents = $(event.target).parents('.umb-overlay,.umb-tour');
                if (parents.length > 0) {
                    return;
                }
                // ignore clicks on dialog from old dialog service
                var oldDialog = $(event.target).parents('#old-dialog-service');
                if (oldDialog.length === 1) {
                    return;
                }
                // ignore clicks in tinyMCE dropdown(floatpanel)
                var floatpanel = $(event.target).closest('.mce-floatpanel');
                if (floatpanel.length === 1) {
                    return;
                }
                // ignore clicks in flatpickr datepicker
                var flatpickr = $(event.target).closest('.flatpickr-calendar');
                if (flatpickr.length === 1) {
                    return;
                }
                // ignore clicks on dialog actions
                var actions = $(event.target).parents('.umb-action');
                if (actions.length === 1) {
                    return;
                }
                //ignore clicks inside this element
                if ($(element).has($(event.target)).length > 0) {
                    return;
                }
                // please to not use angularHelper.safeApply here, it won't work
                scope.$apply(attrs.onOutsideClick);
            }
            $timeout(function () {
                if ('bindClickOn' in attrs) {
                    eventBindings.push(scope.$watch(function () {
                        return attrs.bindClickOn;
                    }, function (newValue) {
                        if (newValue === 'true') {
                            $(document).on('click', oneTimeClick);
                        } else {
                            $(document).off('click', oneTimeClick);
                        }
                    }));
                } else {
                    $(document).on('click', oneTimeClick);
                }
                scope.$on('$destroy', function () {
                    $(document).off('click', oneTimeClick);
                    // unbind watchers
                    for (var e in eventBindings) {
                        eventBindings[e]();
                    }
                });
            });    // Temp removal of 1 sec timeout to prevent bug where overlay does not open. We need to find a better solution.
        };
    }).directive('onRightClick', function ($parse) {
        document.oncontextmenu = function (e) {
            if (e.target.hasAttribute('on-right-click')) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        };
        return function (scope, el, attrs) {
            el.on('contextmenu', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var fn = $parse(attrs.onRightClick);
                scope.$apply(function () {
                    fn(scope, { $event: e });
                });
                return false;
            });
        };
    }).directive('onDelayedMouseleave', function ($timeout, $parse) {
        return {
            restrict: 'A',
            link: function link(scope, element, attrs, ctrl) {
                var active = false;
                var fn = $parse(attrs.onDelayedMouseleave);
                var leave_f = function leave_f(event) {
                    var callback = function callback() {
                        fn(scope, { $event: event });
                    };
                    active = false;
                    $timeout(function () {
                        if (active === false) {
                            scope.$apply(callback);
                        }
                    }, 650);
                };
                var enter_f = function enter_f(event, args) {
                    active = true;
                };
                element.on('mouseleave', leave_f);
                element.on('mouseenter', enter_f);
                //unsub events
                scope.$on('$destroy', function () {
                    element.off('mouseleave', leave_f);
                    element.off('mouseenter', enter_f);
                });
            }
        };
    });
    'use strict';
    /*
  
  https://vitalets.github.io/checklist-model/
  <label ng-repeat="role in roles">
    <input type="checkbox" checklist-model="user.roles" checklist-value="role.id"> {{role.text}}
  </label>
*/
    angular.module('umbraco.directives').directive('checklistModel', [
        '$parse',
        '$compile',
        function ($parse, $compile) {
            // contains
            function contains(arr, item) {
                if (angular.isArray(arr)) {
                    for (var i = 0; i < arr.length; i++) {
                        if (angular.equals(arr[i], item)) {
                            return true;
                        }
                    }
                }
                return false;
            }
            // add 
            function add(arr, item) {
                arr = angular.isArray(arr) ? arr : [];
                for (var i = 0; i < arr.length; i++) {
                    if (angular.equals(arr[i], item)) {
                        return arr;
                    }
                }
                arr.push(item);
                return arr;
            }
            // remove
            function remove(arr, item) {
                if (angular.isArray(arr)) {
                    for (var i = 0; i < arr.length; i++) {
                        if (angular.equals(arr[i], item)) {
                            arr.splice(i, 1);
                            break;
                        }
                    }
                }
                return arr;
            }
            // https://stackoverflow.com/a/19228302/1458162
            function postLinkFn(scope, elem, attrs) {
                // compile with `ng-model` pointing to `checked`
                $compile(elem)(scope);
                // getter / setter for original model
                var getter = $parse(attrs.checklistModel);
                var setter = getter.assign;
                // value added to list
                var value = $parse(attrs.checklistValue)(scope.$parent);
                // watch UI checked change
                scope.$watch('checked', function (newValue, oldValue) {
                    if (newValue === oldValue) {
                        return;
                    }
                    var current = getter(scope.$parent);
                    if (newValue === true) {
                        setter(scope.$parent, add(current, value));
                    } else {
                        setter(scope.$parent, remove(current, value));
                    }
                });
                // watch original model change
                scope.$parent.$watch(attrs.checklistModel, function (newArr, oldArr) {
                    scope.checked = contains(newArr, value);
                }, true);
            }
            return {
                restrict: 'A',
                priority: 1000,
                terminal: true,
                scope: true,
                compile: function compile(tElement, tAttrs) {
                    if (tElement[0].tagName !== 'INPUT' || !tElement.attr('type', 'checkbox')) {
                        throw 'checklist-model should be applied to `input[type="checkbox"]`.';
                    }
                    if (!tAttrs.checklistValue) {
                        throw 'You should provide `checklist-value`.';
                    }
                    // exclude recursion
                    tElement.removeAttr('checklist-model');
                    // local scope var storing individual checkbox model
                    tElement.attr('ng-model', 'checked');
                    return postLinkFn;
                }
            };
        }
    ]);
    'use strict';
    angular.module('umbraco.directives').directive('contenteditable', function () {
        return {
            require: 'ngModel',
            link: function link(scope, element, attrs, ngModel) {
                function read() {
                    ngModel.$setViewValue(element.html());
                }
                ngModel.$render = function () {
                    element.html(ngModel.$viewValue || '');
                };
                element.on('focus', function () {
                    var range = document.createRange();
                    range.selectNodeContents(element[0]);
                    var sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                });
                element.on('blur keyup change', function () {
                    scope.$apply(read);
                });
            }
        };
    });
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:fixNumber
* @restrict A
* @description Used in conjunction with type='number' input fields to ensure that the bound value is converted to a number when using ng-model
*  because normally it thinks it's a string and also validation doesn't work correctly due to an angular bug.
**/
    function fixNumber($parse) {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function link(scope, elem, attrs, ctrl) {
                //parse ngModel onload
                var modelVal = scope.$eval(attrs.ngModel);
                if (modelVal) {
                    var asNum = parseFloat(modelVal, 10);
                    if (!isNaN(asNum)) {
                        $parse(attrs.ngModel).assign(scope, asNum);
                    }
                }
                //always return an int to the model
                ctrl.$parsers.push(function (value) {
                    if (value === 0) {
                        return 0;
                    }
                    return parseFloat(value || '', 10);
                });
                //always try to format the model value as an int
                ctrl.$formatters.push(function (value) {
                    if (angular.isString(value)) {
                        return parseFloat(value, 10);
                    }
                    return value;
                });
                //This fixes this angular issue: 
                //https://github.com/angular/angular.js/issues/2144
                // which doesn't actually validate the number input properly since the model only changes when a real number is entered
                // but the input box still allows non-numbers to be entered which do not validate (only via html5)
                if (typeof elem.prop('validity') === 'undefined') {
                    return;
                }
                elem.on('input', function (e) {
                    var validity = elem.prop('validity');
                    scope.$apply(function () {
                        ctrl.$setValidity('number', !validity.badInput);
                    });
                });
            }
        };
    }
    angular.module('umbraco.directives').directive('fixNumber', fixNumber);
    'use strict';
    angular.module('umbraco.directives').directive('focusWhen', function ($timeout) {
        return {
            restrict: 'A',
            link: function link(scope, elm, attrs, ctrl) {
                attrs.$observe('focusWhen', function (newValue) {
                    if (newValue === 'true') {
                        $timeout(function () {
                            elm.trigger('focus');
                        });
                    }
                });
            }
        };
    });
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:hexBgColor
* @restrict A
* @description Used to set a hex background color on an element, this will detect valid hex and when it is valid it will set the color, otherwise
* a color will not be set.
**/
    function hexBgColor() {
        return {
            restrict: 'A',
            link: function link(scope, element, attr, formCtrl) {
                // Only add inline hex background color if defined and not "true".
                if (attr.hexBgInline === undefined || attr.hexBgInline !== undefined && attr.hexBgInline === 'true') {
                    var origColor = null;
                    if (attr.hexBgOrig) {
                        // Set the orig based on the attribute if there is one.
                        origColor = attr.hexBgOrig;
                    }
                    attr.$observe('hexBgColor', function (newVal) {
                        if (newVal) {
                            if (!origColor) {
                                // Get the orig color before changing it.
                                origColor = element.css('border-color');
                            }
                            // Validate it - test with and without the leading hash.
                            if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(newVal)) {
                                element.css('background-color', '#' + newVal);
                                return;
                            }
                            if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(newVal)) {
                                element.css('background-color', newVal);
                                return;
                            }
                        }
                        element.css('background-color', origColor);
                    });
                }
            }
        };
    }
    angular.module('umbraco.directives').directive('hexBgColor', hexBgColor);
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:hotkey
**/
    angular.module('umbraco.directives').directive('hotkey', function ($window, keyboardService, $log, focusService) {
        return function (scope, el, attrs) {
            var options = {};
            var keyCombo = attrs.hotkey;
            if (!keyCombo) {
                //support data binding
                keyCombo = scope.$eval(attrs['hotkey']);
            }
            function activate() {
                if (keyCombo) {
                    // disable shortcuts in input fields if keycombo is 1 character
                    if (keyCombo.length === 1) {
                        options = { inputDisabled: true };
                    }
                    keyboardService.bind(keyCombo, function () {
                        focusService.rememberFocus();
                        var element = $(el);
                        var activeElementType = document.activeElement.tagName;
                        var clickableElements = [
                            'A',
                            'BUTTON'
                        ];
                        if (element.is('a,div,button,input[type=\'button\'],input[type=\'submit\'],input[type=\'checkbox\']') && !element.is(':disabled')) {
                            if (element.is(':visible') || attrs.hotkeyWhenHidden) {
                                if (attrs.hotkeyWhen && attrs.hotkeyWhen === 'false') {
                                    return;
                                }
                                // when keycombo is enter and a link or button has focus - click the link or button instead of using the hotkey
                                if (keyCombo === 'enter' && clickableElements.indexOf(activeElementType) === 0) {
                                    document.activeElement.trigger('click');
                                } else {
                                    element.trigger('click');
                                }
                            }
                        } else {
                            element.trigger('focus');
                        }
                    }, options);
                    el.on('$destroy', function () {
                        keyboardService.unbind(keyCombo);
                    });
                }
            }
            activate();
        };
    });
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:preventDefault

@description
Use this directive to prevent default action of an element. Effectively implementing <a href="https://api.jquery.com/event.preventdefault/">jQuery's preventdefault</a>

<h3>Markup example</h3>

<pre>
    <a href="https://umbraco.com" prevent-default>Don't go to Umbraco.com</a>
</pre>

**/
    angular.module('umbraco.directives').directive('preventDefault', function () {
        return function (scope, element, attrs) {
            var enabled = true;
            //check if there's a value for the attribute, if there is and it's false then we conditionally don't
            //prevent default.
            if (attrs.preventDefault) {
                attrs.$observe('preventDefault', function (newVal) {
                    enabled = newVal === 'false' || newVal === 0 || newVal === false ? false : true;
                });
            }
            $(element).on('click', function (event) {
                if (event.metaKey || event.ctrlKey) {
                    return;
                } else {
                    if (enabled === true) {
                        event.preventDefault();
                    }
                }
            });
        };
    });
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:preventEnterSubmit
* @description prevents a form from submitting when the enter key is pressed on an input field
**/
    angular.module('umbraco.directives').directive('preventEnterSubmit', function () {
        return function (scope, element, attrs) {
            var enabled = true;
            //check if there's a value for the attribute, if there is and it's false then we conditionally don't 
            //prevent default.
            if (attrs.preventEnterSubmit) {
                attrs.$observe('preventEnterSubmit', function (newVal) {
                    enabled = newVal === 'false' || newVal === 0 || newVal === false ? false : true;
                });
            }
            $(element).on('keypress', function (event) {
                if (event.which === 13) {
                    event.preventDefault();
                }
            });
        };
    });
    'use strict';
    /**
 * @ngdoc directive
 * @name umbraco.directives.directive:resizeToContent
 * @element div
 * @function
 *
 * @description
 * Resize iframe's automatically to fit to the content they contain
 *
 * @example
   <example module="umbraco.directives">
     <file name="index.html">
         <iframe resize-to-content src="meh.html"></iframe>
     </file>
   </example>
 */
    angular.module('umbraco.directives').directive('resizeToContent', function ($window, $timeout) {
        return function (scope, el, attrs) {
            var iframe = el[0];
            var iframeWin = iframe.contentWindow || iframe.contentDocument.parentWindow;
            if (iframeWin.document.body) {
                $timeout(function () {
                    var height = iframeWin.document.documentElement.scrollHeight || iframeWin.document.body.scrollHeight;
                    el.height(height);
                }, 3000);
            }
        };
    });
    'use strict';
    angular.module('umbraco.directives').directive('selectOnFocus', function () {
        return function (scope, el, attrs) {
            $(el).on('click', function () {
                var editmode = $(el).data('editmode');
                //If editmode is true a click is handled like a normal click
                if (!editmode) {
                    //Initial click, select entire text
                    this.select();
                    //Set the edit mode so subsequent clicks work normally
                    $(el).data('editmode', true);
                }
            }).on('blur', function () {
                //Reset on focus lost
                $(el).data('editmode', false);
            });
        };
    });
    'use strict';
    angular.module('umbraco.directives').directive('umbAutoFocus', function ($timeout) {
        return function (scope, element, attr) {
            var update = function update() {
                //if it uses its default naming
                if (element.val() === '' || attr.focusOnFilled) {
                    element.trigger('focus');
                }
            };
            if (attr.umbAutoFocus !== 'false') {
                $timeout(function () {
                    update();
                });
            }
        };
    });
    'use strict';
    angular.module('umbraco.directives').directive('umbAutoResize', function ($timeout) {
        return {
            require: [
                '^?umbTabs',
                'ngModel'
            ],
            link: function link(scope, element, attr, controllersArr) {
                var domEl = element[0];
                var domElType = domEl.type;
                var umbTabsController = controllersArr[0];
                var ngModelController = controllersArr[1];
                // IE elements
                var isIEFlag = false;
                var wrapper = angular.element('#umb-ie-resize-input-wrapper');
                var mirror = angular.element('<span style="white-space:pre;"></span>');
                function isIE() {
                    var ua = window.navigator.userAgent;
                    var msie = ua.indexOf('MSIE ');
                    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./) || navigator.userAgent.match(/Edge\/\d+/)) {
                        return true;
                    } else {
                        return false;
                    }
                }
                function activate() {
                    // check if browser is Internet Explorere
                    isIEFlag = isIE();
                    // scrollWidth on element does not work in IE on inputs
                    // we have to do some dirty dom element copying.
                    if (isIEFlag === true && domElType === 'text') {
                        setupInternetExplorerElements();
                    }
                }
                function setupInternetExplorerElements() {
                    if (!wrapper.length) {
                        wrapper = angular.element('<div id="umb-ie-resize-input-wrapper" style="position:fixed; top:-999px; left:0;"></div>');
                        angular.element('body').append(wrapper);
                    }
                    angular.forEach([
                        'fontFamily',
                        'fontSize',
                        'fontWeight',
                        'fontStyle',
                        'letterSpacing',
                        'textTransform',
                        'wordSpacing',
                        'textIndent',
                        'boxSizing',
                        'borderRightWidth',
                        'borderLeftWidth',
                        'borderLeftStyle',
                        'borderRightStyle',
                        'paddingLeft',
                        'paddingRight',
                        'marginLeft',
                        'marginRight'
                    ], function (value) {
                        mirror.css(value, element.css(value));
                    });
                    wrapper.append(mirror);
                }
                function resizeInternetExplorerInput() {
                    mirror.text(element.val() || attr.placeholder);
                    element.css('width', mirror.outerWidth() + 1);
                }
                function resizeInput() {
                    if (domEl.scrollWidth !== domEl.clientWidth) {
                        if (ngModelController.$modelValue) {
                            element.width(domEl.scrollWidth);
                        }
                    }
                    if (!ngModelController.$modelValue && attr.placeholder) {
                        attr.$set('size', attr.placeholder.length);
                        element.width('auto');
                    }
                }
                function resizeTextarea() {
                    if (domEl.scrollHeight !== domEl.clientHeight) {
                        element.height(domEl.scrollHeight);
                    }
                }
                var update = function update(force) {
                    if (force === true) {
                        if (domElType === 'textarea') {
                            element.height(0);
                        } else if (domElType === 'text') {
                            element.width(0);
                        }
                    }
                    if (isIEFlag === true && domElType === 'text') {
                        resizeInternetExplorerInput();
                    } else {
                        if (domElType === 'textarea') {
                            resizeTextarea();
                        } else if (domElType === 'text') {
                            resizeInput();
                        }
                    }
                };
                activate();
                //listen for tab changes
                if (umbTabsController != null) {
                    umbTabsController.onTabShown(function (args) {
                        update();
                    });
                }
                // listen for ng-model changes
                var unbindModelWatcher = scope.$watch(function () {
                    return ngModelController.$modelValue;
                }, function (newValue) {
                    update(true);
                });
                scope.$on('$destroy', function () {
                    element.off('keyup keydown keypress change', update);
                    element.off('blur', update(true));
                    unbindModelWatcher();
                    // clean up IE dom element
                    if (isIEFlag === true && domElType === 'text') {
                        mirror.remove();
                    }
                });
            }
        };
    });
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbCheckbox
@restrict E
@scope

@description
<b>Added in Umbraco version 7.14.0</b> Use this directive to render an umbraco checkbox.

<h3>Markup example</h3>
<pre>
    <div ng-controller="My.Controller as vm">

        <umb-checkbox
            name="checkboxlist"
            value="{{key}}"
            model="true"
            text="{{text}}">
        </umb-checkbox>

    </div>
</pre>

@param {boolean} model Set to <code>true</code> or <code>false</code> to set the checkbox to checked or unchecked.
@param {string} input-id Set the <code>id</code> of the checkbox.
@param {string} value Set the value of the checkbox.
@param {string} name Set the name of the checkbox.
@param {string} text Set the text for the checkbox label.
@param {string} server-validation-field Set the <code>val-server-field</code> of the checkbox.
@param {boolean} disabled Set the checkbox to be disabled.
@param {boolean} required Set the checkbox to be required.
@param {string} on-change Callback when the value of the checkbox changed by interaction.

**/
    (function () {
        'use strict';
        function UmbCheckboxController($timeout) {
            var vm = this;
            vm.callOnChange = function () {
                $timeout(function () {
                    vm.onChange({
                        model: vm.model,
                        value: vm.value
                    });
                }, 0);
            };
        }
        var component = {
            template: '<label class="checkbox umb-form-check umb-form-check--checkbox" ng-class="{ \'umb-form-check--disabled\': disabled }"><input type="checkbox" id="{{vm.inputId}}" name="{{vm.name}}" value="{{vm.value}}" class="umb-form-check__input" val-server-field="{{vm.serverValidationField}}" ng-model="vm.model" ng-disabled="vm.disabled" ng-required="vm.required" ng-change="vm.callOnChange()"> <span class="umb-form-check__state" aria-hidden="true"><span class="umb-form-check__check"><i class="umb-form-check__icon icon-check"></i></span></span> <span class="umb-form-check__text">{{vm.text}}</span></label>',
            controller: UmbCheckboxController,
            controllerAs: 'vm',
            bindings: {
                model: '=',
                inputId: '@',
                value: '@',
                name: '@',
                text: '@',
                serverValidationField: '@',
                disabled: '<',
                required: '<',
                onChange: '&'
            }
        };
        angular.module('umbraco.directives').component('umbCheckbox', component);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbRadiobutton
@restrict E
@scope

@description
<b>Added in Umbraco version 7.14.0</b> Use this directive to render an umbraco radio button.

<h3>Markup example</h3>
<pre>
    <div ng-controller="My.Controller as vm">

        <umb-radiobutton
            name="radiobuttonlist"
            value="{{key}}"
            model="true"
            text="{{text}}">
        </umb-radiobutton>

    </div>
</pre>

@param {boolean} model Set to <code>true</code> or <code>false</code> to set the radiobutton to checked or unchecked.
@param {string} value Set the value of the radiobutton.
@param {string} name Set the name of the radiobutton.
@param {string} text Set the text for the radiobutton label.
@param {boolean} disabled Set the radiobutton to be disabled.
@param {boolean} required Set the radiobutton to be required.

**/
    (function () {
        'use strict';
        function RadiobuttonDirective() {
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<label class="radio umb-form-check umb-form-check--radiobutton" ng-class="{ \'umb-form-check--disabled\': disabled }"><input type="radio" name="{{name}}" value="{{value}}" class="umb-form-check__input" ng-model="model" ng-disabled="disabled" ng-required="required"> <span class="umb-form-check__state" aria-hidden="true"><span class="umb-form-check__check"></span></span> <span class="umb-form-check__text">{{text}}</span></label>',
                scope: {
                    model: '=',
                    value: '@',
                    name: '@',
                    text: '@',
                    disabled: '=',
                    required: '='
                }
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbRadiobutton', RadiobuttonDirective);
    }());
    'use strict';
    /*
example usage: <textarea json-edit="myObject" rows="8" class="form-control"></textarea>

jsonEditing is a string which we edit in a textarea. we try parsing to JSON with each change. when it is valid, propagate model changes via ngModelCtrl

use isolate scope to prevent model propagation when invalid - will update manually. cannot replace with template, or will override ngModelCtrl, and not hide behind facade

will override element type to textarea and add own attribute ngModel tied to jsonEditing
 */
    angular.module('umbraco.directives').directive('umbRawModel', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            template: '<textarea ng-model="jsonEditing"></textarea>',
            replace: true,
            scope: {
                model: '=umbRawModel',
                validateOn: '='
            },
            link: function link(scope, element, attrs, ngModelCtrl) {
                function setEditing(value) {
                    scope.jsonEditing = angular.copy(jsonToString(value));
                }
                function updateModel(value) {
                    scope.model = stringToJson(value);
                }
                function setValid() {
                    ngModelCtrl.$setValidity('json', true);
                }
                function setInvalid() {
                    ngModelCtrl.$setValidity('json', false);
                }
                function stringToJson(text) {
                    try {
                        return angular.fromJson(text);
                    } catch (err) {
                        setInvalid();
                        return text;
                    }
                }
                function jsonToString(object) {
                    // better than JSON.stringify(), because it formats + filters $$hashKey etc.
                    // NOTE that this will remove all $-prefixed values
                    return angular.toJson(object, true);
                }
                function isValidJson(model) {
                    var flag = true;
                    try {
                        angular.fromJson(model);
                    } catch (err) {
                        flag = false;
                    }
                    return flag;
                }
                //init
                setEditing(scope.model);
                var onInputChange = function onInputChange(newval, oldval) {
                    if (newval !== oldval) {
                        if (isValidJson(newval)) {
                            setValid();
                            updateModel(newval);
                        } else {
                            setInvalid();
                        }
                    }
                };
                if (scope.validateOn) {
                    element.on(scope.validateOn, function () {
                        scope.$apply(function () {
                            onInputChange(scope.jsonEditing);
                        });
                    });
                } else {
                    //check for changes going out
                    scope.$watch('jsonEditing', onInputChange, true);
                }
                //check for changes coming in
                scope.$watch('model', function (newval, oldval) {
                    if (newval !== oldval) {
                        setEditing(newval);
                    }
                }, true);
            }
        };
    });
    'use strict';
    (function () {
        'use strict';
        function SelectWhen($timeout) {
            function link(scope, el, attr, ctrl) {
                attr.$observe('umbSelectWhen', function (newValue) {
                    if (newValue === 'true') {
                        $timeout(function () {
                            el.select();
                        });
                    }
                });
            }
            var directive = {
                restrict: 'A',
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbSelectWhen', SelectWhen);
    }());
    'use strict';
    angular.module('umbraco.directives').directive('gridRte', function (tinyMceService, angularHelper, assetsService, $q, $timeout, eventsService) {
        return {
            scope: {
                uniqueId: '=',
                value: '=',
                configuration: '=',
                //this is the RTE configuration
                datatypeKey: '@',
                ignoreUserStartNodes: '@'
            },
            template: '<div class="umb-rte" id="{{textAreaHtmlId}}"></div>',
            replace: true,
            link: function link(scope, element, attrs) {
                // TODO: A lot of the code below should be shared between the grid rte and the normal rte
                var promises = [];
                //To id the html textarea we need to use the datetime ticks because we can have multiple rte's per a single property alias
                // because now we have to support having 2x (maybe more at some stage) content editors being displayed at once. This is because
                // we have this mini content editor panel that can be launched with MNTP.
                scope.textAreaHtmlId = scope.uniqueId + '_' + String.CreateGuid();
                //queue file loading
                if (typeof tinymce === 'undefined') {
                    promises.push(assetsService.loadJs('lib/tinymce/tinymce.min.js', scope));
                }
                var editorConfig = scope.configuration ? scope.configuration : null;
                if (!editorConfig || angular.isString(editorConfig)) {
                    editorConfig = tinyMceService.defaultPrevalues();
                    //for the grid by default, we don't want to include the macro toolbar
                    editorConfig.toolbar = _.without(editorConfig, 'umbmacro');
                }
                //make sure there's a max image size
                if (!scope.configuration.maxImageSize && scope.configuration.maxImageSize !== 0) {
                    editorConfig.maxImageSize = tinyMceService.defaultPrevalues().maxImageSize;
                }
                //ensure the grid's global config is being passed up to the RTE, these 2 properties need to be in this format
                //since below we are just passing up `scope` as the actual model and for 2 way binding to work with `value` that
                //is the way it needs to be unless we start adding watchers. We'll just go with this for now but it's super ugly.
                scope.config = { ignoreUserStartNodes: scope.ignoreUserStartNodes === 'true' };
                scope.dataTypeKey = scope.datatypeKey;
                //Yes - this casing is rediculous, but it's because the var starts with `data` so it can't be `data-type-id` :/
                //stores a reference to the editor
                var tinyMceEditor = null;
                promises.push(tinyMceService.getTinyMceEditorConfig({
                    htmlId: scope.textAreaHtmlId,
                    stylesheets: editorConfig.stylesheets,
                    toolbar: editorConfig.toolbar,
                    mode: editorConfig.mode
                }));
                // pin toolbar to top of screen if we have focus and it scrolls off the screen
                function pinToolbar() {
                    tinyMceService.pinToolbar(tinyMceEditor);
                }
                // unpin toolbar to top of screen
                function unpinToolbar() {
                    tinyMceService.unpinToolbar(tinyMceEditor);
                }
                $q.all(promises).then(function (result) {
                    var standardConfig = result[promises.length - 1];
                    //create a baseline Config to extend upon
                    var baseLineConfigObj = { maxImageSize: editorConfig.maxImageSize };
                    angular.extend(baseLineConfigObj, standardConfig);
                    baseLineConfigObj.setup = function (editor) {
                        //set the reference
                        tinyMceEditor = editor;
                        //initialize the standard editor functionality for Umbraco
                        tinyMceService.initializeEditor({
                            editor: editor,
                            model: scope,
                            currentForm: angularHelper.getCurrentForm(scope)
                        });
                        //custom initialization for this editor within the grid
                        editor.on('init', function (e) {
                            //force overflow to hidden to prevent no needed scroll
                            editor.getBody().style.overflow = 'hidden';
                            $timeout(function () {
                                if (scope.value === null) {
                                    editor.focus();
                                }
                            }, 400);
                        });
                        // TODO: Perhaps we should pin the toolbar for the rte always, regardless of if it's in the grid or not?
                        // this would mean moving this code into the tinyMceService.initializeEditor
                        //when we leave the editor (maybe)
                        editor.on('blur', function (e) {
                            angularHelper.safeApply(scope, function () {
                                unpinToolbar();
                                $('.umb-panel-body').off('scroll', pinToolbar);
                            });
                        });
                        // Focus on editor
                        editor.on('focus', function (e) {
                            angularHelper.safeApply(scope, function () {
                                pinToolbar();
                                $('.umb-panel-body').on('scroll', pinToolbar);
                            });
                        });
                        // Click on editor
                        editor.on('click', function (e) {
                            angularHelper.safeApply(scope, function () {
                                pinToolbar();
                                $('.umb-panel-body').on('scroll', pinToolbar);
                            });
                        });
                    };
                    /** Loads in the editor */
                    function loadTinyMce() {
                        //we need to add a timeout here, to force a redraw so TinyMCE can find
                        //the elements needed
                        $timeout(function () {
                            tinymce.DOM.events.domLoaded = true;
                            tinymce.init(baseLineConfigObj);
                        }, 150, false);
                    }
                    loadTinyMce();
                    // TODO: This should probably be in place for all RTE, not just for the grid, which means
                    // this code can live in tinyMceService.initializeEditor
                    var tabShownListener = eventsService.on('app.tabChange', function (e, args) {
                        var tabId = args.id;
                        var myTabId = element.closest('.umb-tab-pane').attr('rel');
                        if (String(tabId) === myTabId) {
                            //the tab has been shown, trigger the mceAutoResize (as it could have timed out before the tab was shown)
                            if (tinyMceEditor !== undefined && tinyMceEditor != null) {
                                tinyMceEditor.execCommand('mceAutoResize', false, null, null);
                            }
                        }
                    });
                    //when the element is disposed we need to unsubscribe!
                    // NOTE: this is very important otherwise if this is part of a modal, the listener still exists because the dom
                    // element might still be there even after the modal has been hidden.
                    scope.$on('$destroy', function () {
                        eventsService.unsubscribe(tabShownListener);
                        //ensure we unbind this in case the blur doesn't fire above
                        $('.umb-panel-body').off('scroll', pinToolbar);
                        if (tinyMceEditor !== undefined && tinyMceEditor != null) {
                            tinyMceEditor.destroy();
                        }
                    });
                });
            }
        };
    });
    'use strict';
    /** 
@ngdoc directive
@name umbraco.directives.directive:umbBox
@restrict E

@description
Use this directive to render an already styled empty div tag.

<h3>Markup example</h3>
<pre>
    <umb-box>
        <umb-box-header title="this is a title"></umb-box-header>
        <umb-box-content>
            // Content here
        </umb-box-content>
    </umb-box>
</pre>

<h3>Use in combination with:</h3>
<ul>
    <li>{@link umbraco.directives.directive:umbBoxHeader umbBoxHeader}</li>
    <li>{@link umbraco.directives.directive:umbBoxContent umbBoxContent}</li>
</ul>
**/
    (function () {
        'use strict';
        function BoxDirective() {
            var directive = {
                restrict: 'E',
                replace: true,
                transclude: true,
                template: '<div class="umb-box" ng-transclude></div>'
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbBox', BoxDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbBoxContent
@restrict E

@description
Use this directive to render an empty container. Recommended to use it inside an {@link umbraco.directives.directive:umbBox umbBox} directive. See documentation for {@link umbraco.directives.directive:umbBox umbBox}.

<h3>Markup example</h3>
<pre>
    <umb-box>
        <umb-box-header title="this is a title"></umb-box-header>
        <umb-box-content>
            // Content here
        </umb-box-content>
    </umb-box>
</pre>

<h3>Use in combination with:</h3>
<ul>
    <li>{@link umbraco.directives.directive:umbBox umbBox}</li>
    <li>{@link umbraco.directives.directive:umbBoxHeader umbBoxHeader}</li>
</ul>
**/
    (function () {
        'use strict';
        function BoxContentDirective() {
            var directive = {
                restrict: 'E',
                replace: true,
                transclude: true,
                template: '<div class="umb-box-content" ng-transclude></div>'
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbBoxContent', BoxContentDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbBoxHeader
@restrict E
@scope

@description
Use this directive to construct a title. Recommended to use it inside an {@link umbraco.directives.directive:umbBox umbBox} directive. See documentation for {@link umbraco.directives.directive:umbBox umbBox}.

<h3>Markup example</h3>
<pre>
    <umb-box>
        <umb-box-header title="This is a title" description="I can enter a description right here"></umb-box-header>
        <umb-box-content>
            // Content here
        </umb-box-content>
    </umb-box>
</pre>

<h3>Markup example with using titleKey</h3>
<pre>
    <umb-box>
        // the title-key property needs an areaAlias_keyAlias from the language files
        <umb-box-header title-key="areaAlias_keyAlias" description-key="areaAlias_keyAlias"></umb-box-header>
        <umb-box-content>
            // Content here
        </umb-box-content>
    </umb-box>
</pre>
{@link https://our.umbraco.com/documentation/extending/language-files/ Here you can see more about the language files}

<h3>Use in combination with:</h3>
<ul>
    <li>{@link umbraco.directives.directive:umbBox umbBox}</li>
    <li>{@link umbraco.directives.directive:umbBoxContent umbBoxContent}</li>
</ul>

@param {string=} title (<code>attrbute</code>): Custom title text.
@param {string=} titleKey (<code>attrbute</code>): The translation key from the language xml files.
@param {string=} description (<code>attrbute</code>): Custom description text.
@param {string=} descriptionKey (<code>attrbute</code>): The translation key from the language xml files.
**/
    (function () {
        'use strict';
        function BoxHeaderDirective() {
            var directive = {
                restrict: 'E',
                replace: true,
                transclude: true,
                template: '<div class="umb-box-header"><div><div class="umb-box-header-title" ng-if="title || titleKey"><localize ng-if="titleKey" key="{{titleKey}}"></localize><span ng-if="title">{{title}}</span></div><div class="umb-box-header-description" ng-if="description || descriptionKey"><localize ng-if="descriptionKey" key="{{descriptionKey}}"></localize><span ng-if="description">{{description}}</span></div></div><ng-transclude></ng-transclude></div>',
                scope: {
                    titleKey: '@?',
                    title: '@?',
                    descriptionKey: '@?',
                    description: '@?'
                }
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbBoxHeader', BoxHeaderDirective);
    }());
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:umbControlGroup
* @restrict E
**/
    angular.module('umbraco.directives.html').directive('umbControlGroup', function (localizationService) {
        return {
            scope: {
                label: '@label',
                description: '@',
                hideLabel: '@',
                alias: '@',
                labelFor: '@',
                required: '@?'
            },
            require: '?^^form',
            transclude: true,
            restrict: 'E',
            replace: true,
            template: '<div class="umb-property"><div class="control-group umb-control-group" ng-class="{error: !formValid(), hidelabel:hideLabel==\'true\'}"><div class="umb-el-wrap"><label ng-if="hideLabel!==\'true\'" class="control-label" for="{{alias}}"><span ng-bind-html="labelstring"></span> <span ng-if="required"><strong class="umb-control-required">*</strong></span> <small ng-if="descriptionstring">{{descriptionstring}}</small></label><div class="controls controls-row" ng-transclude></div></div></div></div>',
            link: function link(scope, element, attr, formCtrl) {
                scope.formValid = function () {
                    if (formCtrl && scope.labelFor) {
                        //if a label-for has been set, use that for the validation
                        return formCtrl[scope.labelFor].$valid;
                    }
                    //there is no form.
                    return true;
                };
                if (scope.label && scope.label[0] === '@') {
                    localizationService.localize(scope.label.substring(1)).then(function (data) {
                        scope.labelstring = data;
                    });
                } else {
                    scope.labelstring = scope.label;
                }
                if (scope.description && scope.description[0] === '@') {
                    localizationService.localize(scope.description.substring(1)).then(function (data) {
                        scope.descriptionstring = data;
                    });
                } else {
                    scope.descriptionstring = scope.description;
                }
            }
        };
    });
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:umbPane
* @restrict E
**/
    angular.module('umbraco.directives.html').directive('umbPane', function () {
        return {
            transclude: true,
            restrict: 'E',
            replace: true,
            template: '<div class="umb-pane" ng-transclude></div>'
        };
    });
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:umbPanel
* @restrict E
**/
    angular.module('umbraco.directives.html').directive('umbPanel', function ($timeout, $log) {
        return {
            restrict: 'E',
            replace: true,
            transclude: 'true',
            template: '<div class="umb-panel tabbable" ng-transclude></div>'
        };
    });
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:umbImageCrop
* @restrict E
* @function
**/
    angular.module('umbraco.directives').directive('umbImageCrop', function ($timeout, cropperHelper) {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="umb-cropper umb-property-editor" ng-show="src"><div class="crop-container"><div class="viewport" ng-style="style()"><img ng-src="{{src}}" ng-style="dimensions.image"><div class="overlay" ng-style="dimensions.image"></div></div></div><div class="crop-slider-wrapper" ng-if="loaded"><i class="icon-picture"></i><div class="crop-slider"><umb-range-slider ng-model="sliderValue" options="sliderOptions" on-setup="setup(slider)" on-slide="slide(values)" on-change="change(values)"></umb-range-slider></div><i class="icon-picture" style="font-size: 22px"></i></div></div>',
            scope: {
                src: '=',
                width: '@',
                height: '@',
                crop: '=',
                center: '=',
                maxSize: '@'
            },
            link: function link(scope, element, attrs) {
                var sliderRef = null;
                scope.width = 400;
                scope.height = 320;
                scope.dimensions = {
                    image: {},
                    cropper: {},
                    viewport: {},
                    margin: 20,
                    scale: {
                        min: 0,
                        max: 3,
                        current: 1
                    }
                };
                scope.sliderOptions = {
                    'start': scope.dimensions.scale.current,
                    'step': 0.001,
                    'tooltips': [false],
                    'format': {
                        to: function to(value) {
                            return parseFloat(parseFloat(value).toFixed(3));    //Math.round(value);
                        },
                        from: function from(value) {
                            return parseFloat(parseFloat(value).toFixed(3));    //Math.round(value);
                        }
                    },
                    'range': {
                        'min': scope.dimensions.scale.min,
                        'max': scope.dimensions.scale.max
                    }
                };
                scope.setup = function (slider) {
                    sliderRef = slider;
                    // Set slider handle position
                    sliderRef.noUiSlider.set(scope.dimensions.scale.current);
                    // Update slider range min/max
                    sliderRef.noUiSlider.updateOptions({
                        'range': {
                            'min': scope.dimensions.scale.min,
                            'max': scope.dimensions.scale.max
                        }
                    });
                };
                scope.slide = function (values) {
                    if (values) {
                        scope.dimensions.scale.current = parseFloat(values);
                    }
                };
                scope.change = function (values) {
                    if (values) {
                        scope.dimensions.scale.current = parseFloat(values);
                    }
                };
                //live rendering of viewport and image styles
                scope.style = function () {
                    return {
                        'height': parseInt(scope.dimensions.viewport.height, 10) + 'px',
                        'width': parseInt(scope.dimensions.viewport.width, 10) + 'px'
                    };
                };
                //elements
                var $viewport = element.find('.viewport');
                var $image = element.find('img');
                var $overlay = element.find('.overlay');
                var $container = element.find('.crop-container');
                //default constraints for drag n drop
                var constraints = {
                    left: {
                        max: scope.dimensions.margin,
                        min: scope.dimensions.margin
                    },
                    top: {
                        max: scope.dimensions.margin,
                        min: scope.dimensions.margin
                    }
                };
                scope.constraints = constraints;
                //set constaints for cropping drag and drop
                var setConstraints = function setConstraints() {
                    constraints.left.min = scope.dimensions.margin + scope.dimensions.cropper.width - scope.dimensions.image.width;
                    constraints.top.min = scope.dimensions.margin + scope.dimensions.cropper.height - scope.dimensions.image.height;
                };
                var setDimensions = function setDimensions(originalImage) {
                    originalImage.width('auto');
                    originalImage.height('auto');
                    var image = {};
                    image.originalWidth = originalImage.width();
                    image.originalHeight = originalImage.height();
                    image.width = image.originalWidth;
                    image.height = image.originalHeight;
                    image.left = originalImage[0].offsetLeft;
                    image.top = originalImage[0].offsetTop;
                    scope.dimensions.image = image;
                    //unscaled editor size
                    //var viewPortW =  $viewport.width();
                    //var viewPortH =  $viewport.height();
                    var _viewPortW = parseInt(scope.width, 10);
                    var _viewPortH = parseInt(scope.height, 10);
                    //if we set a constraint we will scale it down if needed
                    if (scope.maxSize) {
                        var ratioCalculation = cropperHelper.scaleToMaxSize(_viewPortW, _viewPortH, scope.maxSize);
                        //so if we have a max size, override the thumb sizes
                        _viewPortW = ratioCalculation.width;
                        _viewPortH = ratioCalculation.height;
                    }
                    scope.dimensions.viewport.width = _viewPortW + 2 * scope.dimensions.margin;
                    scope.dimensions.viewport.height = _viewPortH + 2 * scope.dimensions.margin;
                    scope.dimensions.cropper.width = _viewPortW;
                    // scope.dimensions.viewport.width - 2 * scope.dimensions.margin;
                    scope.dimensions.cropper.height = _viewPortH;    //  scope.dimensions.viewport.height - 2 * scope.dimensions.margin;
                };
                //resize to a given ratio
                var resizeImageToScale = function resizeImageToScale(ratio) {
                    //do stuff
                    var size = cropperHelper.calculateSizeToRatio(scope.dimensions.image.originalWidth, scope.dimensions.image.originalHeight, ratio);
                    scope.dimensions.image.width = size.width;
                    scope.dimensions.image.height = size.height;
                    setConstraints();
                    validatePosition(scope.dimensions.image.left, scope.dimensions.image.top);
                };
                //resize the image to a predefined crop coordinate
                var resizeImageToCrop = function resizeImageToCrop() {
                    scope.dimensions.image = cropperHelper.convertToStyle(scope.crop, {
                        width: scope.dimensions.image.originalWidth,
                        height: scope.dimensions.image.originalHeight
                    }, scope.dimensions.cropper, scope.dimensions.margin);
                    var ratioCalculation = cropperHelper.calculateAspectRatioFit(scope.dimensions.image.originalWidth, scope.dimensions.image.originalHeight, scope.dimensions.cropper.width, scope.dimensions.cropper.height, true);
                    scope.dimensions.scale.current = scope.dimensions.image.ratio;
                    // Update min and max based on original width/height
                    scope.dimensions.scale.min = ratioCalculation.ratio;
                    scope.dimensions.scale.max = 2;
                };
                var validatePosition = function validatePosition(left, top) {
                    if (left > constraints.left.max) {
                        left = constraints.left.max;
                    }
                    if (left <= constraints.left.min) {
                        left = constraints.left.min;
                    }
                    if (top > constraints.top.max) {
                        top = constraints.top.max;
                    }
                    if (top <= constraints.top.min) {
                        top = constraints.top.min;
                    }
                    if (scope.dimensions.image.left !== left) {
                        scope.dimensions.image.left = left;
                    }
                    if (scope.dimensions.image.top !== top) {
                        scope.dimensions.image.top = top;
                    }
                };
                //sets scope.crop to the recalculated % based crop
                var calculateCropBox = function calculateCropBox() {
                    scope.crop = cropperHelper.pixelsToCoordinates(scope.dimensions.image, scope.dimensions.cropper.width, scope.dimensions.cropper.height, scope.dimensions.margin);
                };
                //Drag and drop positioning, using jquery ui draggable
                var onStartDragPosition, top, left;
                $overlay.draggable({
                    drag: function drag(event, ui) {
                        scope.$apply(function () {
                            validatePosition(ui.position.left, ui.position.top);
                        });
                    },
                    stop: function stop(event, ui) {
                        scope.$apply(function () {
                            //make sure that every validates one more time...
                            validatePosition(ui.position.left, ui.position.top);
                            calculateCropBox();
                            scope.dimensions.image.rnd = Math.random();
                        });
                    }
                });
                var init = function init(image) {
                    scope.loaded = false;
                    //set dimensions on image, viewport, cropper etc
                    setDimensions(image);
                    //create a default crop if we haven't got one already
                    var createDefaultCrop = !scope.crop;
                    if (createDefaultCrop) {
                        calculateCropBox();
                    }
                    resizeImageToCrop();
                    //if we're creating a new crop, make sure to zoom out fully
                    if (createDefaultCrop) {
                        scope.dimensions.scale.current = scope.dimensions.scale.min;
                        resizeImageToScale(scope.dimensions.scale.min);
                    }
                    //sets constaints for the cropper
                    setConstraints();
                    scope.loaded = true;
                };
                // Watchers
                scope.$watchCollection('[width, height]', function (newValues, oldValues) {
                    // We have to reinit the whole thing if
                    // one of the external params changes
                    if (newValues !== oldValues) {
                        setDimensions($image);
                        setConstraints();
                    }
                });
                var throttledResizing = _.throttle(function () {
                    resizeImageToScale(scope.dimensions.scale.current);
                    calculateCropBox();
                }, 15);
                // Happens when we change the scale
                scope.$watch('dimensions.scale.current', function (newValue, oldValue) {
                    if (scope.loaded) {
                        throttledResizing();
                    }
                });
                // Init
                $image.on('load', function () {
                    $timeout(function () {
                        init($image);
                    });
                });
            }
        };
    });
    'use strict';
    (function () {
        'use strict';
        function umbImageGravityController($scope, $element, $timeout) {
            var vm = this;
            //Internal values for keeping track of the dot and the size of the editor
            vm.dimensions = {
                width: 0,
                height: 0,
                left: 0,
                top: 0
            };
            var htmlImage = null;
            //DOM element reference
            var htmlOverlay = null;
            //DOM element reference
            var draggable = null;
            vm.loaded = false;
            vm.$onInit = onInit;
            vm.$onChanges = onChanges;
            vm.$postLink = postLink;
            vm.$onDestroy = onDestroy;
            vm.style = style;
            vm.setFocalPoint = setFocalPoint;
            /** Sets the css style for the Dot */
            function style() {
                if (vm.dimensions.width <= 0 || vm.dimensions.height <= 0) {
                    //this initializes the dimensions since when the image element first loads
                    //there will be zero dimensions
                    setDimensions();
                }
                return {
                    'top': vm.dimensions.top + 'px',
                    'left': vm.dimensions.left + 'px'
                };
            }
            ;
            function setFocalPoint(event) {
                $scope.$emit('imageFocalPointStart');
                var offsetX = event.offsetX - 10;
                var offsetY = event.offsetY - 10;
                calculateGravity(offsetX, offsetY);
                lazyEndEvent();
            }
            ;
            /** Initializes the component */
            function onInit() {
                if (!vm.center) {
                    vm.center = {
                        left: 0.5,
                        top: 0.5
                    };
                }
            }
            /** Called when the component has linked everything and the DOM is available */
            function postLink() {
                //elements
                htmlImage = $element.find('img');
                htmlOverlay = $element.find('.overlay');
                //Drag and drop positioning, using jquery ui draggable
                draggable = htmlOverlay.draggable({
                    containment: 'parent',
                    start: function start() {
                        $scope.$apply(function () {
                            $scope.$emit('imageFocalPointStart');
                        });
                    },
                    stop: function stop() {
                        $scope.$apply(function () {
                            var offsetX = htmlOverlay[0].offsetLeft;
                            var offsetY = htmlOverlay[0].offsetTop;
                            calculateGravity(offsetX, offsetY);
                        });
                        lazyEndEvent();
                    }
                });
                $(window).on('resize.umbImageGravity', function () {
                    $scope.$apply(function () {
                        resized();
                    });
                });
                //if any ancestor directive emits this event, we need to resize
                $scope.$on('editors.content.splitViewChanged', function () {
                    $timeout(resized, 200);
                });
                //listen for the image DOM element loading
                htmlImage.on('load', function () {
                    $timeout(function () {
                        vm.isCroppable = true;
                        vm.hasDimensions = true;
                        if (vm.src) {
                            if (vm.src.endsWith('.svg')) {
                                vm.isCroppable = false;
                                vm.hasDimensions = false;
                            } else {
                                // From: https://stackoverflow.com/a/51789597/5018
                                var type = vm.src.substring(vm.src.indexOf('/') + 1, vm.src.indexOf(';base64'));
                                if (type.startsWith('svg')) {
                                    vm.isCroppable = false;
                                    vm.hasDimensions = false;
                                }
                            }
                        }
                        setDimensions();
                        vm.loaded = true;
                        if (vm.onImageLoaded) {
                            vm.onImageLoaded({
                                'isCroppable': vm.isCroppable,
                                'hasDimensions': vm.hasDimensions
                            });
                        }
                    }, 100);
                });
            }
            function onDestroy() {
                $(window).off('resize.umbImageGravity');
                if (htmlOverlay) {
                }
                if (htmlImage) {
                    htmlImage.off('load');
                }
            }
            /** Called when we need to resize based on window or DOM dimensions to re-center the focal point */
            function resized() {
                $timeout(function () {
                    setDimensions();
                });
                // Make sure we can find the offset values for the overlay(dot) before calculating
                // fixes issue with resize event when printing the page (ex. hitting ctrl+p inside the rte)
                if (htmlOverlay.is(':visible')) {
                    var offsetX = htmlOverlay[0].offsetLeft;
                    var offsetY = htmlOverlay[0].offsetTop;
                    calculateGravity(offsetX, offsetY);
                }
            }
            /** Watches the one way binding changes */
            function onChanges(changes) {
                if (changes.center && !changes.center.isFirstChange() && changes.center.currentValue && !angular.equals(changes.center.currentValue, changes.center.previousValue)) {
                    //when center changes update the dimensions
                    setDimensions();
                }
            }
            /** Sets the width/height/left/top dimentions based on the image size and the "center" value */
            function setDimensions() {
                if (vm.isCroppable && htmlImage && vm.center) {
                    vm.dimensions.width = htmlImage.width();
                    vm.dimensions.height = htmlImage.height();
                    vm.dimensions.left = vm.center.left * vm.dimensions.width - 10;
                    vm.dimensions.top = vm.center.top * vm.dimensions.height - 10;
                }
                return vm.dimensions.width;
            }
            ;
            /**
     * based on the offset selected calculates the "center" value and calls the callback
     * @param {any} offsetX
     * @param {any} offsetY
     */
            function calculateGravity(offsetX, offsetY) {
                vm.onValueChanged({
                    left: (offsetX + 10) / vm.dimensions.width,
                    top: (offsetY + 10) / vm.dimensions.height
                });    //vm.center.left = (offsetX + 10) / scope.dimensions.width;
                       //vm.center.top = (offsetY + 10) / scope.dimensions.height;
            }
            ;
            var lazyEndEvent = _.debounce(function () {
                $scope.$apply(function () {
                    $scope.$emit('imageFocalPointStop');
                });
            }, 2000);
        }
        var umbImageGravityComponent = {
            template: '<div class="umb-cropper-gravity"><div class="gravity-container" ng-show="vm.loaded"><div class="viewport"><img ng-show="vm.isCroppable" ng-src="{{vm.src}}" style="max-width: 100%; max-height: 100%" ng-click="vm.setFocalPoint($event)" draggable="false"> <img ng-show="!vm.isCroppable && !vm.hasDimensions" ng-src="{{vm.src}}" width="200" height="200" draggable="false" style="cursor: default;"><div ng-show="vm.isCroppable" class="overlay" ng-style="vm.style()"></div></div></div></div>',
            bindings: {
                src: '<',
                center: '<',
                onImageLoaded: '&?',
                onValueChanged: '&'
            },
            controllerAs: 'vm',
            controller: umbImageGravityController
        };
        angular.module('umbraco.directives').component('umbImageGravity', umbImageGravityComponent);
    }());
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:umbImageThumbnail
* @restrict E
* @function
* @description
**/
    angular.module('umbraco.directives').directive('umbImageThumbnail', function ($timeout, localizationService, cropperHelper, $log) {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="umb-crop-thumbnail-container" ng-style="{height: height, width: width, overflow: \'hidden\', position: \'relative\'}" ng-show="loaded"><img ng-src="{{src}}" alt="{{}}" ng-style="preview" class="noScale"></div>',
            scope: {
                src: '=',
                width: '@',
                height: '@',
                center: '=',
                crop: '=',
                maxSize: '@'
            },
            link: function link(scope, element, attrs) {
                //// INIT /////
                var $image = element.find('img');
                scope.loaded = false;
                $image.on('load', function () {
                    $timeout(function () {
                        $image.width('auto');
                        $image.height('auto');
                        scope.image = {};
                        scope.image.width = $image[0].width;
                        scope.image.height = $image[0].height;
                        //we force a lower thumbnail size to fit the max size
                        //we do not compare to the image dimensions, but the thumbs
                        if (scope.maxSize) {
                            var ratioCalculation = cropperHelper.calculateAspectRatioFit(scope.width, scope.height, scope.maxSize, scope.maxSize, false);
                            //so if we have a max size, override the thumb sizes
                            scope.width = ratioCalculation.width;
                            scope.height = ratioCalculation.height;
                        }
                        setPreviewStyle();
                        scope.loaded = true;
                    });
                });
                /// WATCHERS ////
                scope.$watchCollection('[crop, center]', function (newValues, oldValues) {
                    //we have to reinit the whole thing if
                    //one of the external params changes
                    setPreviewStyle();
                });
                scope.$watch('center', function () {
                    setPreviewStyle();
                }, true);
                function setPreviewStyle() {
                    if (scope.crop && scope.image) {
                        scope.preview = cropperHelper.convertToStyle(scope.crop, scope.image, {
                            width: scope.width,
                            height: scope.height
                        }, 0);
                    } else if (scope.image) {
                        //returns size fitting the cropper
                        var p = cropperHelper.calculateAspectRatioFit(scope.image.width, scope.image.height, scope.width, scope.height, true);
                        if (scope.center) {
                            var xy = cropperHelper.alignToCoordinates(p, scope.center, {
                                width: scope.width,
                                height: scope.height
                            });
                            p.top = xy.top;
                            p.left = xy.left;
                        } else {
                        }
                        p.position = 'absolute';
                        scope.preview = p;
                    }
                }
            }
        };
    });
    'use strict';
    angular.module('umbraco.directives')    /**
* @ngdoc directive
* @name umbraco.directives.directive:localize
* @restrict EA
* @function
* @description
* <div>
*   <strong>Component</strong><br />
*   Localize a specific token to put into the HTML as an item
* </div>
* <div>
*   <strong>Attribute</strong><br />
*   Add a HTML attribute to an element containing the HTML attribute name you wish to localise
*   Using the format of '@section_key' or 'section_key'
* </div>
* ##Usage
* <pre>
* <!-- Component -->
* <localize key="general_close">Close</localize>
* <localize key="section_key">Fallback value</localize>
*
* <!-- Attribute -->
* <input type="text" localize="placeholder" placeholder="@placeholders_entername" />
* <input type="text" localize="placeholder,title" title="@section_key" placeholder="@placeholders_entername" />
* <div localize="title" title="@section_key"></div>
* </pre>
**/.directive('localize', function ($log, localizationService) {
        return {
            restrict: 'E',
            scope: {
                key: '@',
                tokens: '=',
                watchTokens: '@'
            },
            replace: true,
            link: function link(scope, element, attrs) {
                var key = scope.key;
                scope.text = '';
                // A render function to be able to update tokens as values update.
                function render() {
                    element.html(localizationService.tokenReplace(scope.text, scope.tokens || null));
                }
                localizationService.localize(key).then(function (value) {
                    scope.text = value;
                    render();
                });
                if (scope.watchTokens === 'true') {
                    scope.$watch('tokens', render, true);
                }
            }
        };
    }).directive('localize', function ($log, localizationService) {
        return {
            restrict: 'A',
            link: function link(scope, element, attrs) {
                //Support one or more attribute properties to update
                var keys = attrs.localize.split(',');
                angular.forEach(keys, function (value, key) {
                    var attr = element.attr(value);
                    if (attr) {
                        if (attr[0] === '@') {
                            //If the translation key starts with @ then remove it
                            attr = attr.substring(1);
                        }
                        var t = localizationService.tokenize(attr, scope);
                        localizationService.localize(t.key, t.tokens).then(function (val) {
                            element.attr(value, val);
                        });
                    }
                });
            }
        };
    });
    'use strict';
    (function () {
        'use strict';
        function MediaNodeInfoDirective($timeout, $location, eventsService, userService, dateHelper, editorService) {
            function link(scope, element, attrs, ctrl) {
                var evts = [];
                scope.allowChangeMediaType = false;
                function onInit() {
                    userService.getCurrentUser().then(function (user) {
                        // only allow change of media type if user has access to the settings sections
                        angular.forEach(user.sections, function (section) {
                            if (section.alias === 'settings') {
                                scope.allowChangeMediaType = true;
                            }
                        });
                    });
                    // get document type details
                    scope.mediaType = scope.node.contentType;
                    // set the media link initially
                    setMediaLink();
                    // make sure dates are formatted to the user's locale
                    formatDatesToLocal();
                }
                function formatDatesToLocal() {
                    // get current backoffice user and format dates
                    userService.getCurrentUser().then(function (currentUser) {
                        scope.node.createDateFormatted = dateHelper.getLocalDate(scope.node.createDate, currentUser.locale, 'LLL');
                        scope.node.updateDateFormatted = dateHelper.getLocalDate(scope.node.updateDate, currentUser.locale, 'LLL');
                    });
                }
                function setMediaLink() {
                    scope.nodeUrl = scope.node.mediaLink;
                    // grab the file name from the URL and use it as the display name in the file link
                    var match = /.*\/(.*)/.exec(scope.nodeUrl);
                    if (match) {
                        scope.nodeFileName = match[1];
                    } else {
                        scope.nodeFileName = scope.nodeUrl;
                    }
                }
                scope.openMediaType = function (mediaType) {
                    var editor = {
                        id: mediaType.id,
                        submit: function submit(model) {
                            editorService.close();
                        },
                        close: function close() {
                            editorService.close();
                        }
                    };
                    editorService.mediaTypeEditor(editor);
                };
                // watch for content updates - reload content when node is saved, published etc.
                scope.$watch('node.updateDate', function (newValue, oldValue) {
                    if (!newValue) {
                        return;
                    }
                    if (newValue === oldValue) {
                        return;
                    }
                    // Update the media link
                    setMediaLink();
                    // Update the create and update dates
                    formatDatesToLocal();
                });
                //ensure to unregister from all events!
                scope.$on('$destroy', function () {
                    for (var e in evts) {
                        eventsService.unsubscribe(evts[e]);
                    }
                });
                onInit();
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-package-details"><div class="umb-package-details__main-content"><umb-box data-element="node-info-urls"><umb-box-header title-key="general_links"></umb-box-header><umb-box-content class="block-form"><umb-empty-state ng-if="!nodeUrl" size="small"><localize key="content_noMediaLink"></localize></umb-empty-state><ul ng-if="nodeUrl" class="nav nav-stacked" style="margin-bottom: 0;"><li><a href="{{nodeUrl}}" target="_blank"><i class="icon icon-out"></i> <span>{{nodeFileName}}</span></a></li></ul></umb-box-content></umb-box></div><div class="umb-package-details__sidebar"><umb-box data-element="node-info-general"><umb-box-header title-key="general_general"></umb-box-header><umb-box-content class="block-form"><umb-control-group ng-if="node.id !== 0" data-element="node-info-create-date" label="@content_createDate">{{node.createDateFormatted}} by {{ node.owner.name }}</umb-control-group><umb-control-group ng-if="node.id !== 0" data-element="node-info-update-date" label="@content_updateDate">{{node.updateDateFormatted}}</umb-control-group><umb-control-group data-element="node-info-media-type" label="@content_mediatype"><umb-node-preview style="max-width: 100%; margin-bottom: 0px;" icon="node.icon" name="node.contentTypeName" allow-open="allowChangeMediaType" on-open="openMediaType(mediaType)"></umb-node-preview></umb-control-group><umb-control-group ng-if="node.id !== 0" data-element="node-info-id" label="Id"><div>{{ node.id }}</div><small>{{ node.key }}</small></umb-control-group></umb-box-content></umb-box></div></div>',
                scope: { node: '=' },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbMediaNodeInfo', MediaNodeInfoDirective);
    }());
    'use strict';
    (function () {
        'use strict';
        function MemberGroupNodeInfoDirective(eventsService, userService, dateHelper) {
            function link(scope, element, attrs, ctrl) {
                var evts = [];
                function onInit() {
                    // make sure dates are formatted to the user's locale
                    formatDatesToLocal();
                }
                function formatDatesToLocal() {
                    // get current backoffice user and format dates
                    userService.getCurrentUser().then(function (currentUser) {
                        scope.node.createDateFormatted = dateHelper.getLocalDate(scope.node.createDate, currentUser.locale, 'LLL');
                        scope.node.updateDateFormatted = dateHelper.getLocalDate(scope.node.updateDate, currentUser.locale, 'LLL');
                    });
                }
                // watch for content updates - reload content when node is saved, published etc.
                scope.$watch('node.updateDate', function (newValue, oldValue) {
                    if (!newValue) {
                        return;
                    }
                    if (newValue === oldValue) {
                        return;
                    }
                    // Update the create and update dates
                    formatDatesToLocal();
                });
                //ensure to unregister from all events!
                scope.$on('$destroy', function () {
                    for (var e in evts) {
                        eventsService.unsubscribe(evts[e]);
                    }
                });
                onInit();
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-package-details"><div class="umb-package-details__main-content"><umb-box><umb-box-header title-key="content_membergroup"></umb-box-header><umb-box-content class="block-form"><umb-empty-state size="small"><localize key="member_memberGroupNoProperties">Member groups have no additional properties for editing.</localize></umb-empty-state></umb-box-content></umb-box></div><div class="umb-package-details__sidebar"><umb-box data-element="node-info-general"><umb-box-header title-key="general_general"></umb-box-header><umb-box-content class="block-form"><umb-control-group ng-if="node.id !== 0" data-element="node-info-id" label="Id"><div>{{ node.id }}</div><small>{{ node.key }}</small></umb-control-group></umb-box-content></umb-box></div></div>',
                scope: { node: '=' },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbMembergroupNodeInfo', MemberGroupNodeInfoDirective);
    }());
    'use strict';
    /**
 * @ngdoc directive
 * @name umbraco.directives.directive:umbNotifications
 */
    (function () {
        'use strict';
        function NotificationDirective(notificationsService) {
            function link(scope, el, attr, ctrl) {
                //subscribes to notifications in the notification service
                scope.notifications = notificationsService.current;
                scope.$watch('notificationsService.current', function (newVal, oldVal, scope) {
                    if (newVal) {
                        scope.notifications = newVal;
                    }
                });
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-notifications" id="umb-notifications-wrapper" ng-cloak><ul class="umb-notifications__notifications"><li ng-repeat="notification in notifications" class="alert alert-block alert-{{notification.type}} umb-notifications__notification animated -half-second fadeIn" ng-class="{\'-no-border -extra-padding\': notification.type === \'form\'}"><a class="close -align-right" ng-click="removeNotification($index)" prevent-default>&times;</a><div ng-if="notification.view"><div ng-include="notification.view"></div></div><div ng-if="notification.headline" ng-switch on="{{notification}}"><a ng-href="{{notification.url}}" ng-switch-when="{{notification.url && notification.url.trim() != \'\'}}" target="_blank"><strong>{{notification.headline}}</strong> <span ng-bind-html="notification.message"></span></a><div ng-switch-default><strong>{{notification.headline}}</strong> <span ng-bind-html="notification.message"></span></div></div></li></ul></div>',
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbNotifications', NotificationDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbOverlay
@restrict E
@scope

@description

<h3>Markup example</h3>
<pre>
    <div ng-controller="My.Controller as vm">

        <button type="button" ng-click="vm.openOverlay()"></button>

        <umb-overlay
            ng-if="vm.overlay.show"
            model="vm.overlay"
            view="vm.overlay.view"
            position="right">
        </umb-overlay>

    </div>
</pre>

<h3>Controller example</h3>
<pre>
    (function () {

        "use strict";

        function Controller() {

            var vm = this;

            vm.openOverlay = openOverlay;

            function openOverlay() {

                vm.overlay = {
                    view: "mediapicker",
                    show: true,
                    submit: function(model) {

                        vm.overlay.show = false;
                        vm.overlay = null;
                    },
                    close: function(oldModel) {
                        vm.overlay.show = false;
                        vm.overlay = null;
                    }
                }

            };

        }

        angular.module("umbraco").controller("My.Controller", Controller);
    })();
</pre>

<h1>General Options</h1>
<table>
    <thead>
        <tr>
            <th>Param</th>
            <th>Type</th>
            <th>Details</th>
        </tr>
    </thead>
    <tr>
        <td>model.title</td>
        <td>String</td>
        <td>Set the title of the overlay.</td>
    </tr>
    <tr>
        <td>model.subtitle</td>
        <td>String</td>
        <td>Set the subtitle of the overlay.</td>
    </tr>
    <tr>
        <td>model.submitButtonLabel</td>
        <td>String</td>
        <td>Set an alternate submit button text</td>
    </tr>
    <tr>
        <td>model.submitButtonLabelKey</td>
        <td>String</td>
        <td>Set an alternate submit button label key for localized texts</td>
    </tr>
    <tr>
        <td>model.submitButtonState</td>
        <td>String</td>
        <td>Set the state for the submit button</td>
    </tr>
    <tr>
        <td>model.hideSubmitButton</td>
        <td>Boolean</td>
        <td>Hides the submit button</td>
    </tr>
    <tr>
        <td>model.closeButtonLabel</td>
        <td>String</td>
        <td>Set an alternate close button text</td>
    </tr>
    <tr>
        <td>model.closeButtonLabelKey</td>
        <td>String</td>
        <td>Set an alternate close button label key for localized texts</td>
    </tr>
    <tr>
        <td>model.show</td>
        <td>Boolean</td>
        <td>Show/hide the overlay</td>
    </tr>
    <tr>
        <td>model.submit</td>
        <td>Function</td>
        <td>Callback function when the overlay submits. Returns the overlay model object</td>
    </tr>
    <tr>
        <td>model.close</td>
        <td>Function</td>
        <td>Callback function when the overlay closes. Returns a copy of the overlay model object before being modified</td>
    </tr>
</table>

<h1>Item Picker</h1>
Opens an item picker.</br>
<strong>view: </strong>itempicker
<table>
    <thead>
        <tr>
            <th>Param</th>
            <th>Type</th>
            <th>Details</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>model.availableItems</td>
            <td>Array</td>
            <td>Array of available items</td>
        </tr>
        <tr>
            <td>model.selectedItems</td>
            <td>Array</td>
            <td>Array of selected items. When passed in the selected items will be filtered from the available items.</td>
        </tr>
        <tr>
            <td>model.filter</td>
            <td>Boolean</td>
            <td>Set to false to hide the filter</td>
        </tr>
    </tbody>
</table>
<table>
    <thead>
        <tr>
            <th>Returns</th>
            <th>Type</th>
            <th>Details</th>
        </tr>
    </thead>
    <tr>
        <td>model.selectedItem</td>
        <td>Object</td>
        <td>The selected item</td>
    </tr>
</table>

<h1>YSOD</h1>
Opens an overlay to show a custom YSOD. </br>
<strong>view: </strong>ysod
<table>
    <thead>
        <tr>
            <th>Param</th>
            <th>Type</th>
            <th>Details</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>model.error</td>
            <td>Object</td>
            <td>Error object</td>
        </tr>
    </tbody>
</table>

@param {object} model Overlay options.
@param {string} view Path to view or one of the default view names.
@param {string} position The overlay position ("left", "right", "center": "target").
**/
    (function () {
        'use strict';
        function OverlayDirective($timeout, formHelper, overlayHelper, localizationService, $q, $templateCache, $http, $compile) {
            function link(scope, el, attr, ctrl) {
                scope.directive = { enableConfirmButton: false };
                var overlayNumber = 0;
                var numberOfOverlays = 0;
                var isRegistered = false;
                var modelCopy = {};
                var unsubscribe = [];
                function activate() {
                    setView();
                    setButtonText();
                    modelCopy = makeModelCopy(scope.model);
                    $timeout(function () {
                        if (scope.position === 'target') {
                            setTargetPosition();
                        }
                        // this has to be done inside a timeout to ensure the destroy
                        // event on other overlays is run before registering a new one
                        registerOverlay();
                        setOverlayIndent();
                    });
                }
                function setView() {
                    if (scope.view) {
                        if (scope.view.indexOf('.html') === -1) {
                            var viewAlias = scope.view.toLowerCase();
                            scope.view = 'views/common/overlays/' + viewAlias + '/' + viewAlias + '.html';
                        }
                        //if a custom parent scope is defined then we need to manually compile the view
                        if (scope.parentScope) {
                            var element = el.find('.scoped-view');
                            $http.get(scope.view, { cache: $templateCache }).then(function (response) {
                                var templateScope = scope.parentScope.$new();
                                unsubscribe.push(function () {
                                    templateScope.$destroy();
                                });
                                templateScope.model = scope.model;
                                element.html(response.data);
                                element.show();
                                $compile(element.contents())(templateScope);
                            });
                        }
                    }
                }
                function setButtonText() {
                    var labelKeys = [
                        'general_close',
                        'general_submit'
                    ];
                    localizationService.localizeMany(labelKeys).then(function (values) {
                        if (!scope.model.closeButtonLabelKey && !scope.model.closeButtonLabel) {
                            scope.model.closeButtonLabel = values[0];
                        }
                        if (!scope.model.submitButtonLabelKey && !scope.model.submitButtonLabel) {
                            scope.model.submitButtonLabel = values[1];
                        }
                    });
                }
                function registerOverlay() {
                    overlayNumber = overlayHelper.registerOverlay();
                    $(document).on('keydown.overlay-' + overlayNumber, function (event) {
                        if (event.which === 27) {
                            numberOfOverlays = overlayHelper.getNumberOfOverlays();
                            if (numberOfOverlays === overlayNumber && !scope.model.disableEscKey) {
                                scope.$apply(function () {
                                    scope.closeOverLay();
                                });
                            }
                            event.stopPropagation();
                            event.preventDefault();
                        }
                        if (event.which === 13) {
                            numberOfOverlays = overlayHelper.getNumberOfOverlays();
                            if (numberOfOverlays === overlayNumber) {
                                var activeElementType = document.activeElement.tagName;
                                var clickableElements = [
                                    'A',
                                    'BUTTON'
                                ];
                                var submitOnEnter = document.activeElement.hasAttribute('overlay-submit-on-enter');
                                var submitOnEnterValue = submitOnEnter ? document.activeElement.getAttribute('overlay-submit-on-enter') : '';
                                if (clickableElements.indexOf(activeElementType) >= 0) {
                                } else if (activeElementType === 'TEXTAREA' && !submitOnEnter) {
                                } else if (submitOnEnter && submitOnEnterValue === 'false') {
                                } else {
                                    scope.$apply(function () {
                                        scope.submitForm(scope.model);
                                    });
                                    event.preventDefault();
                                }
                            }
                        }
                    });
                    isRegistered = true;
                }
                function unregisterOverlay() {
                    if (isRegistered) {
                        overlayHelper.unregisterOverlay();
                        $(document).off('keydown.overlay-' + overlayNumber);
                        isRegistered = false;
                    }
                }
                function makeModelCopy(object) {
                    var newObject = {};
                    for (var key in object) {
                        if (key !== 'event' && key !== 'parentScope') {
                            newObject[key] = angular.copy(object[key]);
                        }
                    }
                    return newObject;
                }
                function setOverlayIndent() {
                    var overlayIndex = overlayNumber - 1;
                    var indentSize = overlayIndex * 20;
                    var overlayWidth = el[0].clientWidth;
                    el.css('width', overlayWidth - indentSize);
                    if (scope.position === 'center' && overlayIndex > 0 || scope.position === 'target' && overlayIndex > 0) {
                        var overlayTopPosition = el[0].offsetTop;
                        el.css('top', overlayTopPosition + indentSize);
                    }
                }
                function setTargetPosition() {
                    var container = $('#contentwrapper');
                    var containerLeft = container[0].offsetLeft;
                    var containerRight = containerLeft + container[0].offsetWidth;
                    var containerTop = container[0].offsetTop;
                    var containerBottom = containerTop + container[0].offsetHeight;
                    var mousePositionClickX = null;
                    var mousePositionClickY = null;
                    var elementHeight = null;
                    var elementWidth = null;
                    var position = {
                        right: 'inherit',
                        left: 'inherit',
                        top: 'inherit',
                        bottom: 'inherit'
                    };
                    // if mouse click position is know place element with mouse in center
                    if (scope.model.event && scope.model.event) {
                        // click position
                        mousePositionClickX = scope.model.event.pageX;
                        mousePositionClickY = scope.model.event.pageY;
                        // element size
                        elementHeight = el[0].clientHeight;
                        elementWidth = el[0].clientWidth;
                        // move element to this position
                        position.left = mousePositionClickX - elementWidth / 2;
                        position.top = mousePositionClickY - elementHeight / 2;
                        // check to see if element is outside screen
                        // outside right
                        if (position.left + elementWidth > containerRight) {
                            position.right = 10;
                            position.left = 'inherit';
                        }
                        // outside bottom
                        if (position.top + elementHeight > containerBottom) {
                            position.bottom = 10;
                            position.top = 'inherit';
                        }
                        // outside left
                        if (position.left < containerLeft) {
                            position.left = containerLeft + 10;
                            position.right = 'inherit';
                        }
                        // outside top
                        if (position.top < containerTop) {
                            position.top = 10;
                            position.bottom = 'inherit';
                        }
                        el.css(position);
                    }
                }
                scope.submitForm = function (model) {
                    if (scope.model.submit) {
                        if (formHelper.submitForm({
                                scope: scope,
                                skipValidation: scope.model.skipFormValidation
                            })) {
                            if (scope.model.confirmSubmit && scope.model.confirmSubmit.enable && !scope.directive.enableConfirmButton) {
                                //wrap in a when since we don't know if this is a promise or not
                                $q.when(scope.model.submit(model, modelCopy, scope.directive.enableConfirmButton)).then(function () {
                                    formHelper.resetForm({ scope: scope });
                                });
                            } else {
                                unregisterOverlay();
                                //wrap in a when since we don't know if this is a promise or not
                                $q.when(scope.model.submit(model, modelCopy, scope.directive.enableConfirmButton)).then(function () {
                                    formHelper.resetForm({ scope: scope });
                                });
                            }
                        }
                    }
                };
                scope.cancelConfirmSubmit = function () {
                    scope.model.confirmSubmit.show = false;
                };
                scope.closeOverLay = function () {
                    unregisterOverlay();
                    if (scope.model && scope.model.close) {
                        scope.model = modelCopy;
                        scope.model.close(scope.model);
                    } else {
                        scope.model.show = false;
                        scope.model = null;
                    }
                };
                scope.outSideClick = function () {
                    if (!scope.model.disableBackdropClick) {
                        scope.closeOverLay();
                    }
                };
                unsubscribe.push(unregisterOverlay);
                scope.$on('$destroy', function () {
                    for (var i = 0; i < unsubscribe.length; i++) {
                        unsubscribe[i]();
                    }
                });
                activate();
            }
            var directive = {
                transclude: true,
                restrict: 'E',
                replace: true,
                template: '<div data-element="overlay" class="umb-overlay umb-overlay-{{position}} umb-overlay--{{size}}" on-outside-click="outSideClick()"><ng-form class="umb-overlay__form" name="overlayForm" novalidate val-form-manager><div data-element="overlay-header" class="umb-overlay-header"><h4 class="umb-overlay__title">{{model.title}}</h4><p class="umb-overlay__subtitle">{{model.subtitle}}</p></div><div data-element="overlay-content" class="umb-overlay-container form-horizontal"><ng-transclude></ng-transclude><div ng-if="view && !parentScope" ng-include="view"></div><div class="scoped-view" style="display: none;"></div></div><div class="umb-overlay__item-details" ng-if="model.itemDetails"><div class="umb-overlay__item-details-title-wrapper" ng-if="model.itemDetails.icon || model.itemDetails.title"><i class="{{ model.itemDetails.icon }} umb-overlay__item-details-icon" ng-if="model.itemDetails.icon"></i><h5 class="umb-overlay__item-details-title" ng-if="model.itemDetails.title">{{ model.itemDetails.title }}</h5></div><div class="umb-overlay__item-details-description" ng-if="model.itemDetails.description">{{ model.itemDetails.description }}</div></div><div data-element="overlay-footer" class="umb-overlay-drawer" ng-class="{\'-auto-height\': model.confirmSubmit.show}"><div ng-if="model.confirmSubmit.show"><h5 class="red" ng-if="model.confirmSubmit.title"><i class="icon-alert"></i> {{ model.confirmSubmit.title }}</h5><p ng-if="model.confirmSubmit.description">{{ model.confirmSubmit.description }}</p><label class="checkbox no-indent"><input type="checkbox" ng-model="directive.enableConfirmButton"> <strong>{{model.confirmSubmit.checkboxLabel}}</strong></label><div class="umb-overlay-drawer__align-right"><umb-button alias="overlayCancelSubmit" action="cancelConfirmSubmit()" button-style="link" label="Cancel" type="button"></umb-button><umb-button data-element="overlay-confirm-submit" button-style="success" label="Confirm" type="button" disabled="!directive.enableConfirmButton" action="submitForm(model)" auto-focus="true"></umb-button></div></div><div class="umb-overlay-drawer__align-right" ng-if="!model.confirmSubmit.show"><umb-button alias="overlayClose" action="closeOverLay()" button-style="link" label-key="{{model.closeButtonLabelKey}}" label="{{model.closeButtonLabel}}" type="button"></umb-button><umb-button alias="overlaySubmit" button-style="{{model.submitButtonStyle || \'success\'}}" label-key="{{model.submitButtonLabelKey}}" label="{{model.submitButtonLabel}}" ng-if="model.submit && model.hideSubmitButton !== true" type="button" disabled="model.disableSubmitButton" action="submitForm(model)" state="model.submitButtonState" auto-focus="true"></umb-button></div></div></ng-form></div>',
                scope: {
                    ngShow: '=',
                    model: '=',
                    view: '=',
                    position: '@',
                    size: '=?',
                    parentScope: '=?'
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbOverlay', OverlayDirective);
    }());
    'use strict';
    (function () {
        'use strict';
        function OverlayBackdropDirective(overlayHelper) {
            function link(scope, el, attr, ctrl) {
                scope.numberOfOverlays = 0;
                // TODO: this shouldn't be a watch, this should be based on an event handler
                scope.$watch(function () {
                    return overlayHelper.getNumberOfOverlays();
                }, function (newValue) {
                    scope.numberOfOverlays = newValue;
                });
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-overlay-backdrop animate umb-animated" ng-if="numberOfOverlays > 0"></div>',
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbOverlayBackdrop', OverlayBackdropDirective);
    }());
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:umbProperty
* @restrict E
**/
    angular.module('umbraco.directives').directive('umbProperty', function (umbPropEditorHelper, userService) {
        return {
            scope: {
                property: '=',
                showInherit: '<',
                inheritsFrom: '<'
            },
            transclude: true,
            restrict: 'E',
            replace: true,
            template: '<div class="umb-property"><ng-form name="propertyForm"><div class="control-group umb-control-group" ng-class="{hidelabel:property.hideLabel}"><val-property-msg></val-property-msg><div class="umb-el-wrap"><label class="control-label" ng-hide="property.hideLabel" for="{{property.alias}}" ng-attr-title="{{propertyAlias}}"><small ng-if="showInherit" class="db" style="padding-top: 0; margin-bottom: 5px;"><localize key="contentTypeEditor_inheritedFrom"></localize>{{inheritsFrom}}</small> {{property.label}} <span ng-if="property.validation.mandatory"><strong class="umb-control-required">*</strong></span> <small ng-bind-html="property.description | preserveNewLineInHtml"></small></label><div class="controls" ng-transclude></div></div></div></ng-form></div>',
            link: function link(scope) {
                userService.getCurrentUser().then(function (u) {
                    var isAdmin = u.userGroups.indexOf('admin') !== -1;
                    scope.propertyAlias = Umbraco.Sys.ServerVariables.isDebuggingEnabled === true || isAdmin ? scope.property.alias : null;
                });
            },
            //Define a controller for this directive to expose APIs to other directives
            controller: function controller($scope, $timeout) {
                var self = this;
                //set the API properties/methods
                self.property = $scope.property;
                self.setPropertyError = function (errorMsg) {
                    $scope.property.propertyErrorMessage = errorMsg;
                };
            }
        };
    });
    'use strict';
    /**
* @ngdoc directive
* @function
* @name umbraco.directives.directive:umbPropertyEditor 
* @requires formController
* @restrict E
**/
    //share property editor directive function
    function umbPropEditor(umbPropEditorHelper) {
        return {
            scope: {
                model: '=',
                isPreValue: '@',
                preview: '<'
            },
            require: '^^form',
            restrict: 'E',
            replace: true,
            template: '<div class="umb-property-editor db" ng-class="{\'umb-property-editor--preview\': preview}"><div disable-tabindex="preview"><div ng-include="propertyEditorView"></div></div></div>',
            link: function link(scope, element, attrs, ctrl) {
                //we need to copy the form controller val to our isolated scope so that
                //it get's carried down to the child scopes of this!
                //we'll also maintain the current form name.
                scope[ctrl.$name] = ctrl;
                if (!scope.model.alias) {
                    scope.model.alias = Math.random().toString(36).slice(2);
                }
                scope.propertyEditorView = umbPropEditorHelper.getViewPath(scope.model.view, scope.isPreValue);
            }
        };
    }
    ;
    angular.module('umbraco.directives').directive('umbPropertyEditor', umbPropEditor);
    'use strict';
    angular.module('umbraco.directives.html').directive('umbPropertyGroup', function () {
        return {
            transclude: true,
            restrict: 'E',
            replace: true,
            template: ''
        };
    });
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbTabContent
@restrict E
@scope

@description
Use this directive to render tab content. For an example see: {@link umbraco.directives.directive:umbTabContent umbTabContent}

@param {string=} tab The tab.

**/
    (function () {
        'use strict';
        angular.module('umbraco.directives').component('umbTabContent', {
            transclude: true,
            template: '<div data-element="tab-content-{{vm.tab.alias}}"><ng-transclude></ng-transclude></div>',
            controllerAs: 'vm',
            bindings: { tab: '<' }
        });
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbTabsNav
@restrict E
@scope

@description
Use this directive to render a tabs navigation.

<h3>Markup example</h3>
<pre>
    <div ng-controller="My.Controller as vm">

        <umb-tabs-nav
            tabs="vm.tabs"
            on-tab-change="vm.changeTab(tab)">
        </umb-tabs-nav>

        <umb-tab-content
            ng-repeat="tab in vm.tabs"
            ng-show="tab.active"
            tab="tab">
            <div ng-if="tab.alias === 'tabOne'">
                <div>Content of tab 1</div>
            </div>
            <div ng-if="tab.alias === 'tabTwo'">
                <div>Content of tab 2</div>
            </div>
        </umb-tab-content>


    </div>
</pre>

<h3>Controller example</h3>
<pre>
    (function () {
        "use strict";

        function Controller() {

            var vm = this;

            vm.changeTab = changeTab;

            vm.tabs = [
                {
                    "alias": "tabOne",
                    "label": "Tab 1",
                    "active": true
                },
                {
                    "alias": "tabTwo",
                    "label": "Tab 2"
                }
            ];

            function changeTab(selectedTab) {
                vm.tabs.forEach(function(tab) {
                    tab.active = false;
                });
                selectedTab.active = true;
            };

            eventsService.on("tab.tabChange", function(name, args){
                console.log("args", args);
            });

        }

        angular.module("umbraco").controller("My.Controller", Controller);

    })();
</pre>

<h3>Use in combination with</h3>
<ul>
    <li>{@link umbraco.directives.directive:umbTabContent umbTabContent}</li>
</ul>

@param {string=} tabs A collection of tabs.
@param {callback=} onTabChange Callback when a tab is called. It Returns the selected tab.


**/
    (function () {
        'use strict';
        function TabsNavDirective($timeout, $window) {
            function link(scope, element, attrs, ctrl) {
                var tabNavItemsWidths = [];
                // the parent is the component itself so we need to go one level higher
                var container = element.parent().parent();
                $timeout(function () {
                    element.find('li:not(umb-tab--expand)').each(function () {
                        tabNavItemsWidths.push($(this).outerWidth());
                    });
                    calculateWidth();
                });
                function calculateWidth() {
                    $timeout(function () {
                        // 70 is the width of the expand menu (three dots)
                        var containerWidth = container.width() - 70;
                        var tabsWidth = 0;
                        ctrl.overflowingSections = 0;
                        ctrl.needTray = false;
                        ctrl.maxTabs = 7;
                        // detect how many tabs we can show on the screen
                        for (var i = 0; i < tabNavItemsWidths.length; i++) {
                            var tabWidth = tabNavItemsWidths[i];
                            tabsWidth += tabWidth;
                            if (tabsWidth >= containerWidth) {
                                ctrl.needTray = true;
                                ctrl.maxTabs = i;
                                ctrl.overflowingTabs = ctrl.maxTabs - ctrl.tabs.length;
                                break;
                            }
                        }
                    });
                }
                $(window).on('resize.tabsNav', function () {
                    calculateWidth();
                });
                scope.$on('$destroy', function () {
                    $(window).off('resize.tabsNav');
                });
            }
            function UmbTabsNavController(eventsService) {
                var vm = this;
                vm.needTray = false;
                vm.showTray = false;
                vm.overflowingSections = 0;
                vm.maxTabs = 7;
                vm.clickTab = clickTab;
                vm.toggleTray = toggleTray;
                vm.hideTray = hideTray;
                function clickTab($event, tab) {
                    if (vm.onTabChange) {
                        hideTray();
                        var args = {
                            'tab': tab,
                            'tabs': vm.tabs
                        };
                        eventsService.emit('app.tabChange', args);
                        vm.onTabChange({
                            'event': $event,
                            'tab': tab
                        });
                    }
                }
                function toggleTray() {
                    vm.showTray = !vm.showTray;
                }
                function hideTray() {
                    vm.showTray = false;
                }
            }
            var directive = {
                restrict: 'E',
                transclude: true,
                template: '<ul role="tablist" class="umb-tabs-nav"><li class="umb-tab" role="tab" aria-selected="true" tabindex="0" ng-repeat="tab in vm.tabs | limitTo: vm.maxTabs" data-element="tab-{{tab.alias}}" ng-class="{\'umb-tab--active\': tab.active, \'umb-tab--error\': tabHasError}" val-tab><a ng-href ng-click="vm.clickTab($event, tab)">{{ tab.label }}</a></li><li data-element="tab-expand" class="umb-tab umb-tab--expand" ng-class="{ \'open\': vm.showTray }" ng-show="vm.needTray"><a ng-href ng-click="vm.toggleTray()"><i></i><i></i><i></i></a><umb-dropdown class="umb-tabs-tray" ng-if="vm.showTray" on-close="vm.hideTray()"><umb-dropdown-item ng-repeat="tab in vm.tabs | limitTo: vm.overflowingTabs" ng-class="{\'umb-tabs-tray-item--active\': tab.active}"><a ng-href ng-click="vm.clickTab($event, tab)">{{ tab.label }}</a></umb-dropdown-item></umb-dropdown></li></ul>',
                link: link,
                bindToController: true,
                controller: UmbTabsNavController,
                controllerAs: 'vm',
                scope: {
                    tabs: '<',
                    onTabChange: '&'
                }
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbTabsNav', TabsNavDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbTagsEditor
**/
    (function () {
        'use strict';
        angular.module('umbraco.directives').component('umbTagsEditor', {
            transclude: true,
            template: '<div><ng-form name="vm.tagEditorForm"><div ng-if="vm.isLoading"><localize key="loading">Loading</localize>...</div><div ng-if="!isLoading"><input type="hidden" name="tagCount" ng-model="vm.viewModel.length" val-property-validator="vm.validateMandatory"> <span ng-repeat="tag in vm.viewModel track by $index" class="label label-primary tag" ng-keyup="vm.onKeyUpOnTag(tag, $event)" tabindex="0"><span ng-bind-html="tag"></span> <i class="icon-trash" ng-click="vm.showPrompt($index, tag)" localize="title" title="@buttons_deleteTag"></i><umb-confirm-action ng-if="vm.promptIsVisible === $index" direction="left" on-confirm="vm.removeTag(tag)" on-cancel="vm.hidePrompt()"></umb-confirm-action></span> <input type="text" id="{{vm.htmlId}}" class="typeahead tags-{{vm.htmlId}}" ng-model="vm.tagToAdd" ng-keydown="vm.addTagOnEnter($event)" ng-blur="vm.addTag()" localize="placeholder" placeholder="@placeholders_enterTags"></div></ng-form></div>',
            controller: umbTagsEditorController,
            controllerAs: 'vm',
            bindings: {
                value: '<',
                config: '<',
                validation: '<',
                culture: '<?',
                onValueChanged: '&'
            }
        });
        function umbTagsEditorController($rootScope, assetsService, umbRequestHelper, angularHelper, $timeout, $element) {
            var vm = this;
            var typeahead;
            var tagsHound;
            var initLoad = true;
            vm.$onInit = onInit;
            vm.$onChanges = onChanges;
            vm.$onDestroy = onDestroy;
            vm.validateMandatory = validateMandatory;
            vm.addTagOnEnter = addTagOnEnter;
            vm.addTag = addTag;
            vm.removeTag = removeTag;
            vm.showPrompt = showPrompt;
            vm.hidePrompt = hidePrompt;
            vm.onKeyUpOnTag = onKeyUpOnTag;
            vm.htmlId = 't' + String.CreateGuid();
            vm.isLoading = true;
            vm.tagToAdd = '';
            vm.promptIsVisible = '-1';
            vm.viewModel = [];
            function onInit() {
                assetsService.loadJs('lib/typeahead.js/typeahead.bundle.min.js').then(function () {
                    vm.isLoading = false;
                    //ensure that the models are formatted correctly
                    configureViewModel(true);
                    // Set the visible prompt to -1 to ensure it will not be visible
                    vm.promptIsVisible = '-1';
                    tagsHound = new Bloodhound({
                        initialize: false,
                        identify: function identify(obj) {
                            return obj.id;
                        },
                        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('text'),
                        queryTokenizer: Bloodhound.tokenizers.whitespace,
                        //pre-fetch the tags for this category
                        prefetch: {
                            url: umbRequestHelper.getApiUrl('tagsDataBaseUrl', 'GetTags', {
                                tagGroup: vm.config.group,
                                culture: vm.culture
                            }),
                            //TTL = 5 minutes
                            ttl: 300000
                        },
                        //dynamically get the tags for this category (they may have changed on the server)
                        remote: {
                            url: umbRequestHelper.getApiUrl('tagsDataBaseUrl', 'GetTags', {
                                tagGroup: vm.config.group,
                                culture: vm.culture,
                                query: '%QUERY'
                            }),
                            wildcard: '%QUERY'
                        }
                    });
                    tagsHound.initialize().then(function () {
                        //configure the type ahead
                        var sources = {
                            //see: https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md#options
                            // name = the data set name, we'll make this the tag group name + culture
                            name: vm.config.group + (vm.culture ? vm.culture : ''),
                            display: 'text',
                            //source: tagsHound
                            source: function source(query, syncCallback, asyncCallback) {
                                tagsHound.search(query, function (suggestions) {
                                    syncCallback(removeCurrentTagsFromSuggestions(suggestions));
                                }, function (suggestions) {
                                    asyncCallback(removeCurrentTagsFromSuggestions(suggestions));
                                });
                            }
                        };
                        var opts = {
                            hint: true,
                            highlight: true,
                            cacheKey: new Date(),
                            // Force a cache refresh each time the control is initialized
                            minLength: 1
                        };
                        typeahead = $element.find('.tags-' + vm.htmlId).typeahead(opts, sources).bind('typeahead:selected', function (obj, datum, name) {
                            angularHelper.safeApply($rootScope, function () {
                                addTagInternal(datum['text']);
                                vm.tagToAdd = '';
                                // clear the typed text
                                typeahead.typeahead('val', '');
                            });
                        }).bind('typeahead:autocompleted', function (obj, datum, name) {
                            angularHelper.safeApply($rootScope, function () {
                                addTagInternal(datum['text']);
                                vm.tagToAdd = '';
                                // clear the typed text
                                typeahead.typeahead('val', '');
                            });
                        }).bind('typeahead:opened', function (obj) {
                        });
                    });
                });
            }
            /**
     * Watch for value changes
     * @param {any} changes
     */
            function onChanges(changes) {
                //when the model 'value' changes, sync the viewModel object
                if (changes.value) {
                    if (!changes.value.isFirstChange() && changes.value.currentValue !== changes.value.previousValue) {
                        configureViewModel();
                        reValidate();
                    }
                }
            }
            function onDestroy() {
                if (tagsHound) {
                    tagsHound.clearPrefetchCache();
                    tagsHound.clearRemoteCache();
                    tagsHound = null;
                }
                $element.find('.tags-' + vm.htmlId).typeahead('destroy');
            }
            function configureViewModel(isInitLoad) {
                if (vm.value) {
                    if (angular.isString(vm.value) && vm.value.length > 0) {
                        if (vm.config.storageType === 'Json') {
                            //json storage
                            vm.viewModel = JSON.parse(vm.value);
                            //if this is the first load, we are just re-formatting the underlying model to be consistent
                            //we don't want to notify the component parent of any changes, that will occur if the user actually
                            //changes a value. If we notify at this point it will signal a form dirty change which we don't want.
                            if (!isInitLoad) {
                                updateModelValue(vm.viewModel);
                            }
                        } else {
                            //csv storage
                            // split the csv string, and remove any duplicate values
                            var tempArray = vm.value.split(',').map(function (v) {
                                return v.trim();
                            });
                            vm.viewModel = tempArray.filter(function (v, i, self) {
                                return self.indexOf(v) === i;
                            });
                            //if this is the first load, we are just re-formatting the underlying model to be consistent
                            //we don't want to notify the component parent of any changes, that will occur if the user actually
                            //changes a value. If we notify at this point it will signal a form dirty change which we don't want.
                            if (!isInitLoad) {
                                updateModelValue(vm.viewModel);
                            }
                        }
                    } else if (angular.isArray(vm.value)) {
                        vm.viewModel = vm.value;
                    }
                }
            }
            function updateModelValue(val) {
                val = val ? val : [];
                vm.onValueChanged({ value: val });
                reValidate();
            }
            /**
     * Method required by the valPropertyValidator directive (returns true if the property editor has at least one tag selected)
     */
            function validateMandatory() {
                return {
                    isValid: !vm.validation.mandatory || vm.viewModel != null && vm.viewModel.length > 0 || vm.value != null && vm.value.length > 0,
                    errorMsg: 'Value cannot be empty',
                    errorKey: 'required'
                };
            }
            function addTagInternal(tagToAdd) {
                if (tagToAdd != null && tagToAdd.length > 0) {
                    if (vm.viewModel.indexOf(tagToAdd) < 0) {
                        vm.viewModel.push(tagToAdd);
                        updateModelValue(vm.viewModel);
                    }
                }
            }
            function addTagOnEnter(e) {
                var code = e.keyCode || e.which;
                if (code == 13) {
                    //Enter keycode
                    if ($element.find('.tags-' + vm.htmlId).parent().find('.tt-menu .tt-cursor').length === 0) {
                        //this is required, otherwise the html form will attempt to submit.
                        e.preventDefault();
                        addTag();
                    }
                }
            }
            function addTag() {
                //ensure that we're not pressing the enter key whilst selecting a typeahead value from the drop down
                //we need to use jquery because typeahead duplicates the text box
                addTagInternal(vm.tagToAdd);
                vm.tagToAdd = '';
                //this clears the value stored in typeahead so it doesn't try to add the text again
                // https://issues.umbraco.org/issue/U4-4947
                typeahead.typeahead('val', '');
            }
            function removeTag(tag) {
                var i = vm.viewModel.indexOf(tag);
                if (i >= 0) {
                    // Make sure to hide the prompt so it does not stay open because another item gets a new number in the array index
                    vm.promptIsVisible = '-1';
                    // Remove the tag from the index
                    vm.viewModel.splice(i, 1);
                    updateModelValue(vm.viewModel);
                }
            }
            function showPrompt(idx, tag) {
                var i = vm.viewModel.indexOf(tag);
                // Make the prompt visible for the clicked tag only
                if (i === idx) {
                    vm.promptIsVisible = i;
                }
            }
            function hidePrompt() {
                vm.promptIsVisible = '-1';
            }
            function onKeyUpOnTag(tag, $event) {
                if ($event.keyCode === 8 || $event.keyCode === 46) {
                    removeTag(tag);
                }
            }
            // helper method to remove current tags
            function removeCurrentTagsFromSuggestions(suggestions) {
                return $.grep(suggestions, function (suggestion) {
                    return $.inArray(suggestion.text, vm.viewModel) === -1;
                });
            }
            function reValidate() {
                //this is required to re-validate for the mandatory validation
                if (vm.tagEditorForm && vm.tagEditorForm.tagCount) {
                    vm.tagEditorForm.tagCount.$setViewValue(vm.viewModel.length);
                }
            }
        }
    }());
    'use strict';
    (function () {
        'use strict';
        function UmbContextDialog(navigationService, keyboardService, localizationService, overlayService) {
            function link($scope) {
                $scope.dialog = { confirmDiscardChanges: false };
                $scope.outSideClick = function () {
                    hide();
                };
                keyboardService.bind('esc', function () {
                    hide();
                });
                //ensure to unregister from all events!
                $scope.$on('$destroy', function () {
                    keyboardService.unbind('esc');
                });
                function hide() {
                    if ($scope.dialog.confirmDiscardChanges) {
                        localizationService.localizeMany([
                            'prompt_unsavedChanges',
                            'prompt_unsavedChangesWarning',
                            'prompt_discardChanges',
                            'prompt_stay'
                        ]).then(function (values) {
                            var overlay = {
                                'view': 'default',
                                'title': values[0],
                                'content': values[1],
                                'disableBackdropClick': true,
                                'disableEscKey': true,
                                'submitButtonLabel': values[2],
                                'closeButtonLabel': values[3],
                                submit: function submit() {
                                    overlayService.close();
                                    navigationService.hideDialog();
                                },
                                close: function close() {
                                    overlayService.close();
                                }
                            };
                            overlayService.open(overlay);
                        });
                    } else {
                        navigationService.hideDialog();
                    }
                }
            }
            var directive = {
                restrict: 'E',
                transclude: true,
                template: '<div id="dialog" class="umb-modalcolumn fill shadow" on-outside-click="outSideClick()"><div class="umb-modalcolumn-header"><h1>{{dialogTitle}}</h1></div><div class="umb-modalcolumn-body" ng-include="view"></div></div>',
                scope: {
                    dialogTitle: '<',
                    currentNode: '<',
                    view: '<'
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbContextDialog', UmbContextDialog);
    }());
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:umbTree
* @restrict E
**/
    function umbTreeDirective($q, $rootScope, treeService, notificationsService, userService) {
        return {
            restrict: 'E',
            replace: true,
            terminal: false,
            template: '<ul class="umb-tree" ng-class="{\'hide-options\': hideoptions === \'true\'}"><li ng-if="!tree.root.containsGroups"><div class="umb-tree-root" data-element="tree-root" ng-class="getNodeCssClass(tree.root)" ng-hide="hideheader === \'true\'" on-right-click="altSelect(tree.root, $event)"><h5><a ng-href="#/{{section}}" ng-click="select(tree.root, $event)" class="umb-tree-root-link umb-outline" data-element="tree-root-link"><i ng-if="enablecheckboxes === \'true\'" ng-class="selectEnabledNodeClass(tree.root)"></i> {{tree.name}}</a></h5><button data-element="tree-item-options" class="umb-options btn-reset sr-only sr-only--focusable sr-only--hoverable" ng-hide="tree.root.isContainer || !tree.root.menuUrl" ng-click="options(tree.root, $event)" ng-swipe-right="options(tree.root, $event)"><i></i><i></i><i></i></button></div><umb-tree-item class="umb-animated" ng-repeat="child in tree.root.children" enablelistviewexpand="{{enablelistviewexpand}}" node="child" current-node="currentNode" tree="this" is-dialog="isdialog" section="{{section}}"></umb-tree-item></li><li ng-if="tree.root.containsGroups" ng-repeat="group in tree.root.children"><div class="umb-tree-root" data-element="tree-root" ng-class="getNodeCssClass(group)" ng-hide="hideheader === \'true\'" on-right-click="altSelect(group, $event)"><h5><a ng-href="#/{{section}}" ng-click="select(group, $event)" class="umb-tree-root-link umb-outline" data-element="tree-root-link"><i ng-if="enablecheckboxes === \'true\'" ng-class="selectEnabledNodeClass(group)"></i> {{group.name}}</a></h5><button data-element="tree-item-options" class="umb-options umb-outline btn-reset sr-only sr-only--focusable sr-only--hoverable" ng-hide="group.isContainer || !group.menuUrl" ng-click="options(group, $event)" ng-swipe-right="options(group, $event)"><i></i><i></i><i></i></button></div><umb-tree-item class="umb-animated" ng-repeat="child in group.children" enablelistviewexpand="{{enablelistviewexpand}}" node="child" current-node="currentNode" tree="this" is-dialog="isdialog" section="{{section}}"></umb-tree-item></li></ul>',
            scope: {
                section: '@',
                treealias: '@',
                hideoptions: '@',
                hideheader: '@',
                cachekey: '@',
                isdialog: '@',
                onlyInitialized: '@',
                //Custom query string arguments to pass in to the tree as a string, example: "startnodeid=123&something=value"
                customtreeparams: '@',
                enablecheckboxes: '@',
                enablelistviewsearch: '@',
                enablelistviewexpand: '@',
                api: '=?',
                onInit: '&?'
            },
            controller: function controller($scope, $element) {
                var vm = this;
                var registeredCallbacks = {
                    treeNodeExpanded: [],
                    treeNodeSelect: [],
                    treeLoaded: [],
                    treeSynced: [],
                    treeOptionsClick: [],
                    treeNodeAltSelect: []
                };
                //this is the API exposed by this directive, for either hosting controllers or for other directives
                vm.callbacks = {
                    treeNodeExpanded: function treeNodeExpanded(f) {
                        registeredCallbacks.treeNodeExpanded.push(f);
                    },
                    treeNodeSelect: function treeNodeSelect(f) {
                        registeredCallbacks.treeNodeSelect.push(f);
                    },
                    treeLoaded: function treeLoaded(f) {
                        registeredCallbacks.treeLoaded.push(f);
                    },
                    treeSynced: function treeSynced(f) {
                        registeredCallbacks.treeSynced.push(f);
                    },
                    treeOptionsClick: function treeOptionsClick(f) {
                        registeredCallbacks.treeOptionsClick.push(f);
                    },
                    treeNodeAltSelect: function treeNodeAltSelect(f) {
                        registeredCallbacks.treeNodeAltSelect.push(f);
                    }
                };
                vm.emitEvent = emitEvent;
                vm.load = load;
                vm.reloadNode = reloadNode;
                vm.syncTree = syncTree;
                vm.loadChildren = loadChildren;
                //wire up the exposed api object for hosting controllers
                if ($scope.api) {
                    $scope.api.callbacks = vm.callbacks;
                    $scope.api.load = vm.load;
                    $scope.api.reloadNode = vm.reloadNode;
                    $scope.api.syncTree = vm.syncTree;
                }
                //flag to track the last loaded section when the tree 'un-loads'. We use this to determine if we should
                // re-load the tree again. For example, if we hover over 'content' the content tree is shown. Then we hover
                // outside of the tree and the tree 'un-loads'. When we re-hover over 'content', we don't want to re-load the
                // entire tree again since we already still have it in memory. Of course if the section is different we will
                // reload it. This saves a lot on processing if someone is navigating in and out of the same section many times
                // since it saves on data retreival and DOM processing.
                // TODO: This isn't used!?
                var lastSection = '';
                /** Helper function to emit tree events */
                function emitEvent(eventName, args) {
                    if (registeredCallbacks[eventName] && angular.isArray(registeredCallbacks[eventName])) {
                        _.each(registeredCallbacks[eventName], function (c) {
                            c(args);    //call it
                        });
                    }
                }
                /**
       * Re-loads the tree with the updated parameters
       * @param {any} args either a string representing the 'section' or an object containing: 'section', 'treeAlias', 'customTreeParams', 'cacheKey'
       */
                function load(args) {
                    if (angular.isString(args)) {
                        $scope.section = args;
                    } else if (args) {
                        if (args.section) {
                            $scope.section = args.section;
                        }
                        if (args.customTreeParams) {
                            $scope.customtreeparams = args.customTreeParams;
                        }
                        if (args.treeAlias) {
                            $scope.treealias = args.treeAlias;
                        }
                        if (args.cacheKey) {
                            $scope.cachekey = args.cacheKey;
                        }
                    }
                    return loadTree();
                }
                function reloadNode(node) {
                    if (!node) {
                        node = $scope.currentNode;
                    }
                    if (node) {
                        return $scope.loadChildren(node, true);
                    }
                    return $q.reject();
                }
                /**
       * Used to do the tree syncing
       * @param {any} args
       * @returns a promise with an object containing 'node' and 'activate'
       */
                function syncTree(args) {
                    if (!args) {
                        throw 'args cannot be null';
                    }
                    if (!args.path) {
                        throw 'args.path cannot be null';
                    }
                    if (angular.isString(args.path)) {
                        args.path = args.path.replace('"', '').split(',');
                    }
                    //Filter the path for root node ids (we don't want to pass in -1 or 'init')
                    args.path = _.filter(args.path, function (item) {
                        return item !== 'init' && item !== '-1';
                    });
                    var treeNode = loadActiveTree(args.tree);
                    return treeService.syncTree({
                        node: treeNode,
                        path: args.path,
                        forceReload: args.forceReload
                    }).then(function (data) {
                        if (args.activate === undefined || args.activate === true) {
                            $scope.currentNode = data;
                        }
                        emitEvent('treeSynced', {
                            node: data,
                            activate: args.activate
                        });
                        return $q.when({
                            node: data,
                            activate: args.activate
                        });
                    }, function (data) {
                        return $q.reject(data);
                    }, function (data) {
                        //on notification
                        if (data.type === 'treeNodeExpanded') {
                            //raise the event
                            emitEvent('treeNodeExpanded', {
                                tree: $scope.tree,
                                node: data.node,
                                children: data.children
                            });
                        }
                    });
                }
                /** This will check the section tree loaded and return all actual root nodes based on a tree type (non group nodes, non section groups) */
                function getTreeRootNodes() {
                    var roots;
                    if ($scope.tree.root.containsGroups) {
                        //all children in this case are group nodes, so we want the children of these children
                        roots = _.reduce(//get the array of array of children
                        _.map($scope.tree.root.children, function (n) {
                            return n.children;
                        }), function (m, p) {
                            //combine the arrays to one array
                            return m.concat(p);
                        });
                    } else {
                        roots = [$scope.tree.root].concat($scope.tree.root.children);
                    }
                    return _.filter(roots, function (node) {
                        return node && node.metaData && node.metaData.treeAlias;
                    });
                }
                //given a tree alias, this will search the current section tree for the specified tree alias and set the current active tree to it's root node
                function loadActiveTree(treeAlias) {
                    if (!$scope.tree) {
                        throw 'Err in umbtree.directive.loadActiveTree, $scope.tree is null';
                    }
                    //if its not specified, it should have been specified before
                    if (!treeAlias) {
                        if (!$scope.activeTree) {
                            throw 'Err in umbtree.directive.loadActiveTree, $scope.activeTree is null';
                        }
                        return $scope.activeTree;
                    }
                    var treeRoots = getTreeRootNodes();
                    $scope.activeTree = _.find(treeRoots, function (node) {
                        return node.metaData.treeAlias.toUpperCase() === treeAlias.toUpperCase();
                    });
                    if (!$scope.activeTree) {
                        throw 'Could not find the tree ' + treeAlias;
                    }
                    emitEvent('activeTreeLoaded', { tree: $scope.activeTree });
                    return $scope.activeTree;
                }
                /** Method to load in the tree data */
                function loadTree() {
                    if ($scope.section) {
                        //default args
                        var args = {
                            section: $scope.section,
                            tree: $scope.treealias,
                            cacheKey: $scope.cachekey,
                            isDialog: $scope.isdialog ? $scope.isdialog : false
                        };
                        //add the extra query string params if specified
                        if ($scope.customtreeparams) {
                            args['queryString'] = $scope.customtreeparams;
                        }
                        return treeService.getTree(args).then(function (data) {
                            //Only use the tree data, if we are still on the correct section
                            if (data.alias !== $scope.section) {
                                return $q.reject();
                            }
                            //set the data once we have it
                            $scope.tree = data;
                            //set the root as the current active tree
                            $scope.activeTree = $scope.tree.root;
                            emitEvent('treeLoaded', { tree: $scope.tree });
                            emitEvent('treeNodeExpanded', {
                                tree: $scope.tree,
                                node: $scope.tree.root,
                                children: $scope.tree.root.children
                            });
                            return $q.when(data);
                        }, function (reason) {
                            notificationsService.error('Tree Error', reason);
                            return $q.reject(reason);
                        });
                    } else {
                        return $q.reject();
                    }
                }
                function loadChildren(node, forceReload) {
                    //emit treeNodeExpanding event, if a callback object is set on the tree
                    emitEvent('treeNodeExpanding', {
                        tree: $scope.tree,
                        node: node
                    });
                    //standardising
                    if (!node.children) {
                        node.children = [];
                    }
                    if (forceReload || node.hasChildren && node.children.length === 0) {
                        //get the children from the tree service
                        return treeService.loadNodeChildren({
                            node: node,
                            section: $scope.section,
                            isDialog: $scope.isdialog
                        }).then(function (data) {
                            //emit expanded event
                            emitEvent('treeNodeExpanded', {
                                tree: $scope.tree,
                                node: node,
                                children: data
                            });
                            return $q.when(data);
                        });
                    } else {
                        emitEvent('treeNodeExpanded', {
                            tree: $scope.tree,
                            node: node,
                            children: node.children
                        });
                        node.expanded = true;
                        return $q.when(node.children);
                    }
                }
                /** Returns the css classses assigned to the node (div element) */
                $scope.getNodeCssClass = function (node) {
                    if (!node) {
                        return '';
                    }
                    // TODO: This is called constantly because as a method in a template it's re-evaluated pretty much all the time
                    // it would be better if we could cache the processing. The problem is that some of these things are dynamic.
                    var css = [];
                    if (node.cssClasses) {
                        _.each(node.cssClasses, function (c) {
                            css.push(c);
                        });
                    }
                    return css.join(' ');
                };
                $scope.selectEnabledNodeClass = function (node) {
                    return node ? node.selected ? 'icon umb-tree-icon sprTree icon-check green temporary' : '' : '';
                };
                /* helper to force reloading children of a tree node */
                $scope.loadChildren = function (node, forceReload) {
                    return loadChildren(node, forceReload);
                };
                /**
        Method called when the options button next to the root node is called.
        The tree doesnt know about this, so it raises an event to tell the parent controller
        about it.
      */
                $scope.options = function (n, ev) {
                    emitEvent('treeOptionsClick', {
                        element: $element,
                        node: n,
                        event: ev
                    });
                };
                /**
        Method called when an item is clicked in the tree, this passes the
        DOM element, the tree node object and the original click
        and emits it as a treeNodeSelect element if there is a callback object
        defined on the tree
      */
                $scope.select = function (n, ev) {
                    if (n.metaData && n.metaData.noAccess === true) {
                        ev.preventDefault();
                        return;
                    }
                    //on tree select we need to remove the current node -
                    // whoever handles this will need to make sure the correct node is selected
                    //reset current node selection
                    $scope.currentNode = null;
                    emitEvent('treeNodeSelect', {
                        element: $element,
                        node: n,
                        event: ev
                    });
                };
                $scope.altSelect = function (n, ev) {
                    emitEvent('treeNodeAltSelect', {
                        element: $element,
                        tree: $scope.tree,
                        node: n,
                        event: ev
                    });
                };
                //call the onInit method, if the result is a promise then load the tree after that resolves (if it's not a promise this will just resolve automatically).
                //NOTE: The promise cannot be rejected, else the tree won't be loaded and we'll get exceptions if some API calls syncTree or similar.
                $q.when($scope.onInit(), function (args) {
                    //the promise resolution can pass in parameters
                    if (args) {
                        if (args.section) {
                            $scope.section = args.section;
                        }
                        if (args.cacheKey) {
                            $scope.cachekey = args.cacheKey;
                        }
                        if (args.customTreeParams) {
                            $scope.customtreeparams = args.customTreeParams;
                        }
                    }
                    //load the tree
                    loadTree().then(function () {
                        //because angular doesn't return a promise for the resolve method, we need to resort to some hackery, else
                        //like normal JS promises we could do resolve(...).then() 
                        if (args && args.onLoaded && angular.isFunction(args.onLoaded)) {
                            args.onLoaded();
                        }
                    });
                });
            }
        };
    }
    angular.module('umbraco.directives').directive('umbTree', umbTreeDirective);
    'use strict';
    /**
 * @ngdoc directive
 * @name umbraco.directives.directive:umbTreeItem
 * @element li
 * @function
 *
 * @description
 * Renders a list item, representing a single node in the tree.
 * Includes element to toggle children, and a menu toggling button
 *
 * **note:** This directive is only used internally in the umbTree directive
 *
 * @example
   <example module="umbraco">
    <file name="index.html">
         <umb-tree-item ng-repeat="child in tree.children" node="child" callback="callback" section="content"></umb-tree-item>
    </file>
   </example>
 */
    angular.module('umbraco.directives').directive('umbTreeItem', function (treeService, $timeout, localizationService, eventsService, appState) {
        return {
            restrict: 'E',
            replace: true,
            require: '^umbTree',
            template: '<li class="umb-tree-item" data-element="tree-item-{{::node.dataElement}}" ng-class="getNodeCssClass(node)" on-right-click="altSelect(node, $event)"><div class="umb-tree-item__inner" ng-swipe-right="options(node, $event)" ng-dblclick="load(node)"><button data-element="tree-item-expand" class="umb-tree-item__arrow umb-outline btn-reset" ng-class="{\'icon-navigation-right\': !node.expanded || node.metaData.isContainer, \'icon-navigation-down\': node.expanded && !node.metaData.isContainer}" ng-style="{\'visibility\': (scope.enablelistviewexpand === \'true\' || node.hasChildren && (!node.metaData.isContainer || isDialog)) ? \'visible\' : \'hidden\'}" ng-click="load(node)">&nbsp;<span class="sr-only">Expand child items for {{node.name}}</span></button> <i class="icon umb-tree-icon sprTree" ng-class="::node.cssClass" title="{{::node.title}}" ng-click="select(node, $event)" ng-style="::node.style"></i> <span class="umb-tree-item__annotation"></span> <a class="umb-tree-item__label umb-outline" ng-href="#/{{::node.routePath}}" ng-click="select(node, $event)" title="{{::node.title}}">{{node.name}}</a><button data-element="tree-item-options" class="umb-options btn-reset sr-only sr-only--focusable sr-only--hoverable" ng-click="options(node, $event)" ng-if="::node.menuUrl"><i></i><i></i><i></i></button><div ng-show="node.loading" class="l"><div></div></div></div><ul ng-class="{collapsed: !node.expanded}"><umb-tree-item class="umb-animated" ng-repeat="child in node.children track by child.id" enablelistviewexpand="{{enablelistviewexpand}}" tree="tree" current-node="currentNode" node="child" is-dialog="isDialog" section="{{section}}"></umb-tree-item></ul></li>',
            scope: {
                section: '@',
                currentNode: '=',
                enablelistviewexpand: '@',
                node: '=',
                tree: '=',
                isDialog: '='
            },
            link: function link(scope, element, attrs, umbTreeCtrl) {
                localizationService.localize('general_search').then(function (value) {
                    scope.searchAltText = value;
                });
                // updates the node's DOM/styles
                function setupNodeDom(node, tree) {
                    //get the first div element
                    element.children(':first')    //set the padding
.css('padding-left', node.level * 20 + 'px');
                    // add a unique data element to each tree item so it is easy to navigate with code
                    if (!node.metaData.treeAlias) {
                        node.dataElement = node.name;
                    } else {
                        node.dataElement = node.metaData.treeAlias;
                    }
                }
                /** Returns the css classses assigned to the node (div element) */
                scope.getNodeCssClass = function (node) {
                    if (!node) {
                        return '';
                    }
                    // TODO: This is called constantly because as a method in a template it's re-evaluated pretty much all the time
                    // it would be better if we could cache the processing. The problem is that some of these things are dynamic.
                    //is this the current action node (this is not the same as the current selected node!)
                    var actionNode = appState.getMenuState('currentNode');
                    var css = [];
                    if (node.cssClasses) {
                        _.each(node.cssClasses, function (c) {
                            css.push(c);
                        });
                    }
                    if (node.selected) {
                        css.push('umb-tree-node-checked');
                    }
                    if (node == scope.currentNode) {
                        css.push('current');
                        if (actionNode && actionNode.id !== node.id) {
                            css.push('current-not-active');    // when its the current node, but its not the active(current node for the given action)
                        }
                    }
                    if (node.hasChildren) {
                        css.push('has-children');
                    }
                    if (node.deleteAnimations) {
                        css.push('umb-tree-item--deleted');
                    }
                    if (actionNode) {
                        if (actionNode.id === node.id && String(node.id) !== '-1') {
                            css.push('active');
                        }
                        // special handling of root nodes with id -1 
                        // as there can be many nodes with id -1 in a tree we need to check the treeAlias instead
                        if (String(node.id) === '-1' && actionNode.metaData.treeAlias === node.metaData.treeAlias) {
                            css.push('active');
                        }
                    }
                    return css.join(' ');
                };
                //add a method to the node which we can use to call to update the node data if we need to ,
                // this is done by sync tree, we don't want to add a $watch for each node as that would be crazy insane slow
                // so we have to do this
                scope.node.updateNodeData = function (newNode) {
                    _.extend(scope.node, newNode);
                    //now update the styles
                    setupNodeDom(scope.node, scope.tree);
                };
                /**
        Method called when the options button next to a node is called
        In the main tree this opens the menu, but internally the tree doesnt
        know about this, so it simply raises an event to tell the parent controller
        about it.
      */
                scope.options = function (n, ev) {
                    umbTreeCtrl.emitEvent('treeOptionsClick', {
                        element: element,
                        tree: scope.tree,
                        node: n,
                        event: ev
                    });
                };
                /**
        Method called when an item is clicked in the tree, this passes the 
        DOM element, the tree node object and the original click
        and emits it as a treeNodeSelect element if there is a callback object
        defined on the tree
      */
                scope.select = function (n, ev) {
                    if (ev.ctrlKey || ev.shiftKey || ev.metaKey || // apple
                        ev.button && ev.button === 1    // middle click, >IE9 + everyone else
) {
                        return;
                    }
                    if (n.metaData && n.metaData.noAccess === true) {
                        ev.preventDefault();
                        return;
                    }
                    umbTreeCtrl.emitEvent('treeNodeSelect', {
                        element: element,
                        tree: scope.tree,
                        node: n,
                        event: ev
                    });
                    ev.preventDefault();
                };
                /**
        Method called when an item is right-clicked in the tree, this passes the 
        DOM element, the tree node object and the original click
        and emits it as a treeNodeSelect element if there is a callback object
        defined on the tree
      */
                scope.altSelect = function (n, ev) {
                    if (ev.altKey)
                        return false;
                    umbTreeCtrl.emitEvent('treeNodeAltSelect', {
                        element: element,
                        tree: scope.tree,
                        node: n,
                        event: ev
                    });
                };
                /**
        Method called when a node in the tree is expanded, when clicking the arrow
        takes the arrow DOM element and node data as parameters
        emits treeNodeCollapsing event if already expanded and treeNodeExpanding if collapsed
      */
                scope.load = function (node) {
                    if (node.expanded && !node.metaData.isContainer) {
                        umbTreeCtrl.emitEvent('treeNodeCollapsing', {
                            tree: scope.tree,
                            node: node,
                            element: element
                        });
                        node.expanded = false;
                    } else {
                        scope.loadChildren(node, false);
                    }
                };
                /* helper to force reloading children of a tree node */
                scope.loadChildren = function (node, forceReload) {
                    return umbTreeCtrl.loadChildren(node, forceReload);
                };
                //if the current path contains the node id, we will auto-expand the tree item children
                setupNodeDom(scope.node, scope.tree);
                // load the children if the current user don't have access to the node
                // it is used to auto expand the tree to the start nodes the user has access to
                if (scope.node.hasChildren && scope.node.metaData.noAccess) {
                    scope.loadChildren(scope.node);
                }
                var evts = [];
                //listen for section changes
                evts.push(eventsService.on('appState.sectionState.changed', function (e, args) {
                    if (args.key === 'currentSection') {
                        //when the section changes disable all delete animations
                        scope.node.deleteAnimations = false;
                    }
                }));
                /** Depending on if any menu is shown and if the menu is shown for the current node, toggle delete animations */
                function toggleDeleteAnimations() {
                    //if both are false then remove animations
                    var hide = !appState.getMenuState('showMenuDialog') && !appState.getMenuState('showMenu');
                    if (hide) {
                        scope.node.deleteAnimations = false;
                    } else {
                        //enable animations for this node if it is the node currently showing a context menu
                        var currentNode = appState.getMenuState('currentNode');
                        if (currentNode && currentNode.id == scope.node.id) {
                            scope.node.deleteAnimations = true;
                        } else {
                            scope.node.deleteAnimations = false;
                        }
                    }
                }
                //listen for context menu and current node changes
                evts.push(eventsService.on('appState.menuState.changed', function (e, args) {
                    if (args.key === 'showMenuDialog' || args.key == 'showMenu' || args.key == 'currentNode') {
                        toggleDeleteAnimations();
                    }
                }));
                //cleanup events
                scope.$on('$destroy', function () {
                    for (var e in evts) {
                        eventsService.unsubscribe(evts[e]);
                    }
                });
            }
        };
    });
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:umbTreeSearchBox
* @function
* @element ANY
* @restrict E
**/
    function treeSearchBox(localizationService, searchService, $q) {
        return {
            scope: {
                searchFromId: '@',
                searchFromName: '@',
                showSearch: '@',
                section: '@',
                datatypeKey: '@',
                hideSearchCallback: '=',
                searchCallback: '='
            },
            restrict: 'E',
            // restrict to an element
            replace: true,
            // replace the html element with the template
            template: '<div class="form-search"><i class="icon icon-search" ng-if="showSearch == \'false\'"></i> <a class="icon icon-arrow-left" ng-if="showSearch == \'true\'" title="Back" ng-click="hideSearch()"></a> <input type="text" ng-model="term" class="umb-search-field search-query -full-width-input" placeholder="{{searchPlaceholderText}}" focus-when="{{showSearch}}"><h4 ng-if="showSearch && searchFromName"><small><localize key="general_search">Search</localize>:&nbsp;</small> {{searchFromName}}</h4></div>',
            link: function link(scope, element, attrs, ctrl) {
                scope.term = '';
                scope.hideSearch = function () {
                    scope.term = '';
                    scope.hideSearchCallback();
                };
                localizationService.localize('general_typeToSearch').then(function (value) {
                    scope.searchPlaceholderText = value;
                });
                if (!scope.showSearch) {
                    scope.showSearch = 'false';
                }
                //used to cancel any request in progress if another one needs to take it's place
                var canceler = null;
                function performSearch() {
                    if (scope.term) {
                        scope.results = [];
                        //a canceler exists, so perform the cancelation operation and reset
                        if (canceler) {
                            canceler.resolve();
                            canceler = $q.defer();
                        } else {
                            canceler = $q.defer();
                        }
                        var searchArgs = {
                            term: scope.term,
                            canceler: canceler
                        };
                        //append a start node context if there is one
                        if (scope.searchFromId) {
                            searchArgs['searchFrom'] = scope.searchFromId;
                        }
                        //append dataTypeId value if there is one
                        if (scope.datatypeKey) {
                            searchArgs['dataTypeKey'] = scope.datatypeKey;
                        }
                        searcher(searchArgs).then(function (data) {
                            scope.searchCallback(data);
                            //set back to null so it can be re-created
                            canceler = null;
                        });
                    }
                }
                scope.$watch('term', _.debounce(function (newVal, oldVal) {
                    scope.$apply(function () {
                        if (newVal !== null && newVal !== undefined && newVal !== oldVal) {
                            performSearch();
                        }
                    });
                }, 200));
                var searcher = searchService.searchContent;
                //search
                if (scope.section === 'member') {
                    searcher = searchService.searchMembers;
                } else if (scope.section === 'media') {
                    searcher = searchService.searchMedia;
                }
            }
        };
    }
    angular.module('umbraco.directives').directive('umbTreeSearchBox', treeSearchBox);
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:umbTreeSearchResults
* @function
* @element ANY
* @restrict E
**/
    function treeSearchResults() {
        return {
            scope: {
                results: '=',
                selectResultCallback: '='
            },
            restrict: 'E',
            // restrict to an element
            replace: true,
            // replace the html element with the template
            template: '<div><umb-empty-state ng-if="results.length === 0" position="center"><localize key="general_searchNoResult"></localize></umb-empty-state><ul class="umb-tree"><li class="root"><ul class="umb-search-group"><li class="umb-search-group-item" ng-repeat="result in results"><div ng-class="{\'umb-tree-node-checked\' : result.selected}"><a class="umb-search-group-item-link" ng-class="{first:$first}" ng-click="selectResultCallback($event, result)"><div class="umb-search-group-item-name"><i class="icon umb-tree-icon sprTree {{result.icon}}"></i> {{result.name}}</div><small class="search-subtitle" ng-if="result.subTitle">{{result.subTitle}}</small></a></div></li></ul></li></ul></div>',
            link: function link(scope, element, attrs, ctrl) {
            }
        };
    }
    angular.module('umbraco.directives').directive('umbTreeSearchResults', treeSearchResults);
    'use strict';
    (function () {
        'use strict';
        function AceEditorDirective(umbAceEditorConfig, assetsService, angularHelper) {
            /**
     * Sets editor options such as the wrapping mode or the syntax checker.
     *
     * The supported options are:
     *
     *   <ul>
     *     <li>showGutter</li>
     *     <li>useWrapMode</li>
     *     <li>onLoad</li>
     *     <li>theme</li>
     *     <li>mode</li>
     *   </ul>
     *
     * @param acee
     * @param session ACE editor session
     * @param {object} opts Options to be set
     */
            var setOptions = function setOptions(acee, session, opts) {
                // sets the ace worker path, if running from concatenated
                // or minified source
                if (angular.isDefined(opts.workerPath)) {
                    var config = window.ace.require('ace/config');
                    config.set('workerPath', opts.workerPath);
                }
                // ace requires loading
                if (angular.isDefined(opts.require)) {
                    opts.require.forEach(function (n) {
                        window.ace.require(n);
                    });
                }
                // Boolean options
                if (angular.isDefined(opts.showGutter)) {
                    acee.renderer.setShowGutter(opts.showGutter);
                }
                if (angular.isDefined(opts.useWrapMode)) {
                    session.setUseWrapMode(opts.useWrapMode);
                }
                if (angular.isDefined(opts.showInvisibles)) {
                    acee.renderer.setShowInvisibles(opts.showInvisibles);
                }
                if (angular.isDefined(opts.showIndentGuides)) {
                    acee.renderer.setDisplayIndentGuides(opts.showIndentGuides);
                }
                if (angular.isDefined(opts.useSoftTabs)) {
                    session.setUseSoftTabs(opts.useSoftTabs);
                }
                if (angular.isDefined(opts.showPrintMargin)) {
                    acee.setShowPrintMargin(opts.showPrintMargin);
                }
                // commands
                if (angular.isDefined(opts.disableSearch) && opts.disableSearch) {
                    acee.commands.addCommands([{
                            name: 'unfind',
                            bindKey: {
                                win: 'Ctrl-F',
                                mac: 'Command-F'
                            },
                            exec: function exec() {
                                return false;
                            },
                            readOnly: true
                        }]);
                }
                // Basic options
                if (angular.isString(opts.theme)) {
                    acee.setTheme('ace/theme/' + opts.theme);
                }
                if (angular.isString(opts.mode)) {
                    session.setMode('ace/mode/' + opts.mode);
                }
                // Advanced options
                if (angular.isDefined(opts.firstLineNumber)) {
                    if (angular.isNumber(opts.firstLineNumber)) {
                        session.setOption('firstLineNumber', opts.firstLineNumber);
                    } else if (angular.isFunction(opts.firstLineNumber)) {
                        session.setOption('firstLineNumber', opts.firstLineNumber());
                    }
                }
                // advanced options
                var key, obj;
                if (angular.isDefined(opts.advanced)) {
                    for (key in opts.advanced) {
                        // create a javascript object with the key and value
                        obj = {
                            name: key,
                            value: opts.advanced[key]
                        };
                        // try to assign the option to the ace editor
                        acee.setOption(obj.name, obj.value);
                    }
                }
                // advanced options for the renderer
                if (angular.isDefined(opts.rendererOptions)) {
                    for (key in opts.rendererOptions) {
                        // create a javascript object with the key and value
                        obj = {
                            name: key,
                            value: opts.rendererOptions[key]
                        };
                        // try to assign the option to the ace editor
                        acee.renderer.setOption(obj.name, obj.value);
                    }
                }
                // onLoad callbacks
                angular.forEach(opts.callbacks, function (cb) {
                    if (angular.isFunction(cb)) {
                        cb(acee);
                    }
                });
            };
            function link(scope, el, attr, ngModel) {
                // Load in ace library
                assetsService.load([
                    'lib/ace-builds/src-min-noconflict/ace.js',
                    'lib/ace-builds/src-min-noconflict/ext-language_tools.js'
                ], scope).then(function () {
                    if (angular.isUndefined(window.ace)) {
                        throw new Error('ui-ace need ace to work... (o rly?)');
                    } else {
                        // init editor
                        init();
                    }
                });
                function init() {
                    /**
         * Corresponds the umbAceEditorConfig ACE configuration.
         * @type object
         */
                    var options = umbAceEditorConfig.ace || {};
                    /**
         * umbAceEditorConfig merged with user options via json in attribute or data binding
         * @type object
         */
                    var opts = angular.extend({}, options, scope.umbAceEditor);
                    //load ace libraries here... 
                    /**
         * ACE editor
         * @type object
         */
                    var acee = window.ace.edit(el[0]);
                    acee.$blockScrolling = Infinity;
                    /**
         * ACE editor session.
         * @type object
         * @see [EditSession]{@link https://ace.c9.io/#nav=api&api=edit_session}
         */
                    var session = acee.getSession();
                    /**
         * Reference to a change listener created by the listener factory.
         * @function
         * @see listenerFactory.onChange
         */
                    var onChangeListener;
                    /**
         * Reference to a blur listener created by the listener factory.
         * @function
         * @see listenerFactory.onBlur
         */
                    var onBlurListener;
                    /**
         * Calls a callback by checking its existing. The argument list
         * is variable and thus this function is relying on the arguments
         * object.
         * @throws {Error} If the callback isn't a function
         */
                    var executeUserCallback = function executeUserCallback() {
                        /**
           * The callback function grabbed from the array-like arguments
           * object. The first argument should always be the callback.
           *
           * @see [arguments]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions_and_function_scope/arguments}
           * @type {*}
           */
                        var callback = arguments[0];
                        /**
           * Arguments to be passed to the callback. These are taken
           * from the array-like arguments object. The first argument
           * is stripped because that should be the callback function.
           *
           * @see [arguments]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions_and_function_scope/arguments}
           * @type {Array}
           */
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (angular.isDefined(callback)) {
                            scope.$evalAsync(function () {
                                if (angular.isFunction(callback)) {
                                    callback(args);
                                } else {
                                    throw new Error('ui-ace use a function as callback.');
                                }
                            });
                        }
                    };
                    /**
         * Listener factory. Until now only change listeners can be created.
         * @type object
         */
                    var listenerFactory = {
                        /**
           * Creates a change listener which propagates the change event
           * and the editor session to the callback from the user option
           * onChange. It might be exchanged during runtime, if this
           * happens the old listener will be unbound.
           *
           * @param callback callback function defined in the user options
           * @see onChangeListener
           */
                        onChange: function onChange(callback) {
                            return function (e) {
                                var newValue = session.getValue();
                                angularHelper.safeApply(scope, function () {
                                    scope.model = newValue;
                                });
                                executeUserCallback(callback, e, acee);
                            };
                        },
                        /**
           * Creates a blur listener which propagates the editor session
           * to the callback from the user option onBlur. It might be
           * exchanged during runtime, if this happens the old listener
           * will be unbound.
           *
           * @param callback callback function defined in the user options
           * @see onBlurListener
           */
                        onBlur: function onBlur(callback) {
                            return function () {
                                executeUserCallback(callback, acee);
                            };
                        }
                    };
                    attr.$observe('readonly', function (value) {
                        acee.setReadOnly(!!value || value === '');
                    });
                    // Value Blind
                    if (scope.model) {
                        session.setValue(scope.model);
                    }
                    // Listen for option updates
                    var updateOptions = function updateOptions(current, previous) {
                        if (current === previous) {
                            return;
                        }
                        opts = angular.extend({}, options, scope.umbAceEditor);
                        opts.callbacks = [opts.onLoad];
                        if (opts.onLoad !== options.onLoad) {
                            // also call the global onLoad handler
                            opts.callbacks.unshift(options.onLoad);
                        }
                        if (opts.autoFocus === true) {
                            acee.focus();
                        }
                        // EVENTS
                        // unbind old change listener
                        session.removeListener('change', onChangeListener);
                        // bind new change listener
                        onChangeListener = listenerFactory.onChange(opts.onChange);
                        session.on('change', onChangeListener);
                        // unbind old blur listener
                        //session.removeListener('blur', onBlurListener);
                        acee.removeListener('blur', onBlurListener);
                        // bind new blur listener
                        onBlurListener = listenerFactory.onBlur(opts.onBlur);
                        acee.on('blur', onBlurListener);
                        setOptions(acee, session, opts);
                    };
                    scope.$watch(scope.umbAceEditor, updateOptions, /* deep watch */
                    true);
                    // set the options here, even if we try to watch later, if this
                    // line is missing things go wrong (and the tests will also fail)
                    updateOptions(options);
                    el.on('$destroy', function () {
                        acee.session.$stopWorker();
                        acee.destroy();
                    });
                    scope.$watch(function () {
                        return [
                            el[0].offsetWidth,
                            el[0].offsetHeight
                        ];
                    }, function () {
                        acee.resize();
                        acee.renderer.updateFull();
                    }, true);
                }
            }
            var directive = {
                restrict: 'EA',
                scope: {
                    'umbAceEditor': '=',
                    'model': '='
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').constant('umbAceEditorConfig', {}).directive('umbAceEditor', AceEditorDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbAvatar
@restrict E
@scope

@description
Use this directive to render an avatar.

<h3>Markup example</h3>
<pre>
	<div ng-controller="My.Controller as vm">

        <umb-avatar
            size="xs"
            img-src="{{vm.avatar[0].value}}"
            img-srcset="{{vm.avatar[1].value}} 2x, {{vm.avatar[2].value}} 3x">
        </umb-avatar>

	</div>
</pre>

<h3>Controller example</h3>
<pre>
	(function () {
		"use strict";

		function Controller() {

            var vm = this;

            vm.avatar = [
                { value: "assets/logo.png" },
                { value: "assets/logo@2x.png" },
                { value: "assets/logo@3x.png" }
            ];

        }

		angular.module("umbraco").controller("My.Controller", Controller);

	})();
</pre>

@param {string} size (<code>attribute</code>): The size of the avatar (xs, s, m, l, xl).
@param {string} img-src (<code>attribute</code>): The image source to the avatar.
@param {string} img-srcset (<code>atribute</code>): Reponsive support for the image source.
**/
    (function () {
        'use strict';
        function AvatarDirective() {
            function link(scope, element, attrs, ctrl) {
                var eventBindings = [];
                scope.initials = '';
                function onInit() {
                    if (!scope.unknownChar) {
                        scope.unknownChar = '?';
                    }
                    scope.initials = getNameInitials(scope.name);
                }
                function getNameInitials(name) {
                    if (name) {
                        var names = name.split(' '), initials = names[0].substring(0, 1);
                        if (names.length > 1) {
                            initials += names[names.length - 1].substring(0, 1);
                        }
                        return initials.toUpperCase();
                    }
                    return null;
                }
                eventBindings.push(scope.$watch('name', function (newValue, oldValue) {
                    if (newValue === oldValue) {
                        return;
                    }
                    if (oldValue === undefined || newValue === undefined) {
                        return;
                    }
                    scope.initials = getNameInitials(newValue);
                }));
                onInit();
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div><img class="umb-avatar umb-avatar--{{size}}" ng-if="imgSrc" ng-src="{{imgSrc}}" ng-srcset="{{imgSrcset}}"><div class="umb-avatar umb-avatar--{{size}} umb-avatar--{{color}}" ng-if="!imgSrc"><span ng-if="name">{{ initials }}</span> <span ng-if="!name">{{unknownChar}}</span></div></div>',
                scope: {
                    size: '@',
                    name: '@',
                    color: '@',
                    imgSrc: '@',
                    imgSrcset: '@',
                    unknownChar: '@'
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbAvatar', AvatarDirective);
    }());
    'use strict';
    (function () {
        'use strict';
        function BadgeDirective() {
            var directive = {
                restrict: 'E',
                replace: true,
                transclude: true,
                template: '<span class="umb-badge umb-badge--{{color}} umb-badge--{{size}}" ng-transclude></span>',
                scope: {
                    size: '@?',
                    color: '@?'
                }
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbBadge', BadgeDirective);
    }());
    'use strict';
    (function () {
        'use strict';
        function CheckmarkDirective() {
            var directive = {
                restrict: 'E',
                replace: true,
                transclude: true,
                template: '<i class="icon-check umb-checkmark umb-checkmark--{{size}}" ng-class="{\'umb-checkmark--checked\': checked}"></i>',
                scope: {
                    size: '@?',
                    checked: '='
                }
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbCheckmark', CheckmarkDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbChildSelector
@restrict E
@scope

@description
Use this directive to render a ui component for selecting child items to a parent node.

<h3>Markup example</h3>
<pre>
	<div ng-controller="My.Controller as vm">

        <umb-child-selector
                selected-children="vm.selectedChildren"
                available-children="vm.availableChildren"
                parent-name="vm.name"
                parent-icon="vm.icon"
                parent-id="vm.id"
                on-add="vm.addChild"
                on-remove="vm.removeChild">
        </umb-child-selector>

        <!-- use overlay to select children from -->
        <umb-overlay
           ng-if="vm.overlay.show"
           model="vm.overlay"
           position="target"
           view="vm.overlay.view">
        </umb-overlay>

	</div>
</pre>

<h3>Controller example</h3>
<pre>
	(function () {
		"use strict";

		function Controller() {

            var vm = this;

            vm.id = 1;
            vm.name = "My Parent element";
            vm.icon = "icon-document";
            vm.selectedChildren = [];
            vm.availableChildren = [
                {
                    id: 1,
                    alias: "item1",
                    name: "Item 1",
                    icon: "icon-document"
                },
                {
                    id: 2,
                    alias: "item2",
                    name: "Item 2",
                    icon: "icon-document"
                }
            ];

            vm.addChild = addChild;
            vm.removeChild = removeChild;

            function addChild($event) {
                vm.overlay = {
                    view: "itempicker",
                    title: "Choose child",
                    availableItems: vm.availableChildren,
                    selectedItems: vm.selectedChildren,
                    event: $event,
                    show: true,
                    submit: function(model) {

                        // add selected child
                        vm.selectedChildren.push(model.selectedItem);

                        // close overlay
                        vm.overlay.show = false;
                        vm.overlay = null;
                    }
                };
            }

            function removeChild($index) {
                vm.selectedChildren.splice($index, 1);
            }

        }

		angular.module("umbraco").controller("My.Controller", Controller);

	})();
</pre>

@param {array} selectedChildren (<code>binding</code>): Array of selected children.
@param {array} availableChildren (<code>binding</code>: Array of items available for selection.
@param {string} parentName (<code>binding</code>): The parent name.
@param {string} parentIcon (<code>binding</code>): The parent icon.
@param {number} parentId (<code>binding</code>): The parent id.
@param {callback} onRemove (<code>binding</code>): Callback when the remove button is clicked on an item.
    <h3>The callback returns:</h3>
    <ul>
        <li><code>child</code>: The selected item.</li>
        <li><code>$index</code>: The selected item index.</li>
    </ul>
@param {callback} onAdd (<code>binding</code>): Callback when the add button is clicked.
    <h3>The callback returns:</h3>
    <ul>
        <li><code>$event</code>: The select event.</li>
    </ul>
**/
    (function () {
        'use strict';
        function ChildSelectorDirective() {
            function link(scope, el, attr, ctrl) {
                var eventBindings = [];
                scope.dialogModel = {};
                scope.showDialog = false;
                scope.removeChild = function (selectedChild, $index) {
                    if (scope.onRemove) {
                        scope.onRemove(selectedChild, $index);
                    }
                };
                scope.addChild = function ($event) {
                    if (scope.onAdd) {
                        scope.onAdd($event);
                    }
                };
                function syncParentName() {
                    // update name on available item
                    angular.forEach(scope.availableChildren, function (availableChild) {
                        if (availableChild.id === scope.parentId) {
                            availableChild.name = scope.parentName;
                        }
                    });
                    // update name on selected child
                    angular.forEach(scope.selectedChildren, function (selectedChild) {
                        if (selectedChild.id === scope.parentId) {
                            selectedChild.name = scope.parentName;
                        }
                    });
                }
                function syncParentIcon() {
                    // update icon on available item
                    angular.forEach(scope.availableChildren, function (availableChild) {
                        if (availableChild.id === scope.parentId) {
                            availableChild.icon = scope.parentIcon;
                        }
                    });
                    // update icon on selected child
                    angular.forEach(scope.selectedChildren, function (selectedChild) {
                        if (selectedChild.id === scope.parentId) {
                            selectedChild.icon = scope.parentIcon;
                        }
                    });
                }
                eventBindings.push(scope.$watch('parentName', function (newValue, oldValue) {
                    if (newValue === oldValue) {
                        return;
                    }
                    if (oldValue === undefined || newValue === undefined) {
                        return;
                    }
                    syncParentName();
                }));
                eventBindings.push(scope.$watch('parentIcon', function (newValue, oldValue) {
                    if (newValue === oldValue) {
                        return;
                    }
                    if (oldValue === undefined || newValue === undefined) {
                        return;
                    }
                    syncParentIcon();
                }));
                // clean up
                scope.$on('$destroy', function () {
                    // unbind watchers
                    for (var e in eventBindings) {
                        eventBindings[e]();
                    }
                });
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-child-selector"><div class="umb-child-selector__child -parent"><div class="umb-child-selector__child-description"><div class="umb-child-selector__child-icon-holder"><i class="umb-child-selector__child-icon {{ parentIcon }}"></i></div><span class="umb-child-selector__child-name"><strong>{{ parentName }}</strong></span> <small>(<localize key="general_current"></localize>)</small></div></div><div class="umb-child-selector__children-container"><div class="umb-child-selector__child" ng-repeat="selectedChild in selectedChildren"><div class="umb-child-selector__child-description"><div class="umb-child-selector__child-icon-holder"><i class="umb-child-selector__child-icon {{ selectedChild.icon }}"></i></div><span class="umb-child-selector__child-name">{{ selectedChild.name }}</span></div><div class="umb-child-selector__child-actions"><i class="umb-child-selector__child-remove icon-trash" ng-click="removeChild(selectedChild, $index)"></i></div></div><a class="umb-child-selector__child -placeholder" ng-click="addChild($event)" hotkey="alt+shift+c"><div class="umb-child-selector__child-name -blue"><strong><localize key="shortcuts_addChild">Add Child</localize></strong></div></a></div></div>',
                scope: {
                    selectedChildren: '=',
                    availableChildren: '=',
                    parentName: '=',
                    parentIcon: '=',
                    parentId: '=',
                    onRemove: '=',
                    onAdd: '='
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbChildSelector', ChildSelectorDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbClipboard
@restrict E
@scope

@description
<strong>Added in Umbraco v. 7.7:</strong> Use this directive to copy content to the clipboard

<h3>Markup example</h3>
<pre>
    <div ng-controller="My.ClipBoardController as vm">
        
        <!-- Copy text from an element -->
        <div id="copy-text">Copy me!</div>
        
        <umb-button
            umb-clipboard
            umb-clipboard-success="vm.copySuccess()"
            umb-clipboard-error="vm.copyError()"
            umb-clipboard-target="#copy-text"
            state="vm.clipboardButtonState"
            type="button"
            label="Copy">
        </umb-button>

        <!-- Cut text from a textarea -->
        <textarea id="cut-text" ng-model="vm.cutText"></textarea>

        <umb-button
            umb-clipboard
            umb-clipboard-success="vm.copySuccess()"
            umb-clipboard-error="vm.copyError()"
            umb-clipboard-target="#cut-text"
            umb-clipboard-action="cut"
            state="vm.clipboardButtonState"
            type="button"
            label="Copy">
        </umb-button>

        <!-- Copy text without an element -->
        <umb-button
            ng-if="vm.copyText"
            umb-clipboard
            umb-clipboard-success="vm.copySuccess()"
            umb-clipboard-error="vm.copyError()"
            umb-clipboard-text="vm.copyText"
            state="vm.clipboardButtonState"
            type="button"
            label="Copy">
        </umb-button>
    
    </div>
</pre>

<h3>Controller example</h3>
<pre>
    (function () {
        "use strict";

        function Controller() {

            var vm = this;

            vm.copyText = "Copy text without element";
            vm.cutText = "Text to cut";

            vm.copySuccess = copySuccess;
            vm.copyError = copyError;

            function copySuccess() {
                vm.clipboardButtonState = "success";
            }
            
            function copyError() {
                vm.clipboardButtonState = "error";
            }

        }

        angular.module("umbraco").controller("My.ClipBoardController", Controller);

    })();
</pre>

@param {callback} umbClipboardSuccess (<code>expression</code>): Callback function when the content is copied.
@param {callback} umbClipboardError (<code>expression</code>): Callback function if the copy fails.
@param {string} umbClipboardTarget (<code>attribute</code>): The target element to copy.
@param {string} umbClipboardAction (<code>attribute</code>): Specify if you want to copy or cut content ("copy", "cut"). Cut only works on <code>input</code> and <code>textarea</code> elements.
@param {string} umbClipboardText (<code>attribute</code>): Use this attribute if you don't have an element to copy from.

**/
    (function () {
        'use strict';
        function umbClipboardDirective($timeout, assetsService, $parse) {
            function link(scope, element, attrs, ctrl) {
                var clipboard;
                var target = element[0];
                assetsService.loadJs('lib/clipboard/clipboard.min.js', scope).then(function () {
                    if (attrs.umbClipboardTarget) {
                        target.setAttribute('data-clipboard-target', attrs.umbClipboardTarget);
                    }
                    if (attrs.umbClipboardAction) {
                        target.setAttribute('data-clipboard-action', attrs.umbClipboardAction);
                    }
                    if (attrs.umbClipboardText) {
                        target.setAttribute('data-clipboard-text', attrs.umbClipboardText);
                    }
                    clipboard = new ClipboardJS(target);
                    var expressionHandlerSuccess = $parse(attrs.umbClipboardSuccess);
                    clipboard.on('success', function (e) {
                        e.clearSelection();
                        if (attrs.umbClipboardSuccess) {
                            expressionHandlerSuccess(scope, { msg: 'success' });
                        }
                    });
                    var expressionHandlerError = $parse(attrs.umbClipboardError);
                    clipboard.on('error', function (e) {
                        if (attrs.umbClipboardError) {
                            expressionHandlerError(scope, { msg: 'error' });
                        }
                    });
                });
                // clean up
                scope.$on('$destroy', function () {
                    clipboard.destroy();
                });
            }
            ////////////
            var directive = {
                restrict: 'A',
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbClipboard', umbClipboardDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbColorSwatches
@restrict E
@scope
@description
Use this directive to generate color swatches to pick from.
<h3>Markup example</h3>
<pre>
    <umb-color-swatches
        colors="colors"
        selected-color="color"
        size="s">
    </umb-color-swatches>
</pre>
@param {array} colors (<code>attribute</code>): The array of colors.
@param {string} selectedColor (<code>attribute</code>): The selected color.
@param {string} size (<code>attribute</code>): The size (s, m).
@param {string} useLabel (<code>attribute</code>): Specify if labels should be used.
@param {string} useColorClass (<code>attribute</code>): Specify if color values are css classes.
@param {function} onSelect (<code>expression</code>): Callback function when the item is selected.
**/
    (function () {
        'use strict';
        function ColorSwatchesDirective() {
            function link(scope, el, attr, ctrl) {
                // Set default to true if not defined
                if (angular.isUndefined(scope.useColorClass)) {
                    scope.useColorClass = false;
                }
                scope.setColor = function (color, $index, $event) {
                    if (scope.onSelect) {
                        // did the value change?
                        if (scope.selectedColor != null && scope.selectedColor.value === color.value) {
                            // User clicked the currently selected color
                            // to remove the selection, they don't want
                            // to select any color after all.
                            // Unselect the color
                            color = null;
                        }
                        scope.selectedColor = color;
                        scope.onSelect({
                            color: color,
                            $index: $index,
                            $event: $event
                        });
                        $event.stopPropagation();
                    }
                };
                scope.isSelectedColor = function (color) {
                    return scope.selectedColor && color.value === scope.selectedColor.value;
                };
            }
            var directive = {
                restrict: 'E',
                replace: true,
                transclude: true,
                template: '<div class="umb-color-swatches" ng-class="{ \'with-labels\': useLabel }"><button type="button" class="umb-color-box umb-color-box--{{size}} btn-{{color.value}}" ng-repeat="color in colors" title="{{useLabel || useColorClass ? (color.label || color.value) : (\'#\' + color.value)}}" hex-bg-inline="{{useColorClass === false}}" hex-bg-color="{{color.value}}" ng-class="{ \'active\': isSelectedColor(color) }" ng-click="setColor(color, $index, $event)"><div class="umb-color-box-inner"><div class="check_circle"><i class="icon icon-check small" ng-show="isSelectedColor(color)"></i></div><div class="umb-color-box__label" ng-if="useLabel"><div class="umb-color-box__name truncate">{{ color.label || color.value }}</div><div class="umb-color-box__description">#{{ color.value }}</div></div></div></button></div>',
                scope: {
                    colors: '=?',
                    size: '@',
                    selectedColor: '=',
                    onSelect: '&',
                    useLabel: '=',
                    useColorClass: '=?'
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbColorSwatches', ColorSwatchesDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbConfirm
@restrict E
@scope

@description
A confirmation dialog


<h3>Markup example</h3>
<pre>
	<div ng-controller="My.Controller as vm">

       <umb-confirm caption="Title" on-confirm="vm.onConfirm()" on-cancel="vm.onCancel()"></umb-confirm>

	</div>
</pre>

<h3>Controller example</h3>
<pre>
	(function () {
		"use strict";

		function Controller() {

            var vm = this;

            vm.onConfirm = function() {
                alert('Confirm clicked');
            };

            vm.onCancel = function() {
                alert('Cancel clicked');
            }


        }

		angular.module("umbraco").controller("My.Controller", Controller);

	})();
</pre>

@param {string} caption (<code>attribute</code>): The caption shown above the buttons
@param {callback} on-confirm (<code>attribute</code>): The call back when the "OK" button is clicked. If not set the button will not be shown
@param {callback} on-cancel (<code>atribute</code>): The call back when the "Cancel" button is clicked. If not set the button will not be shown
**/
    function confirmDirective() {
        return {
            restrict: 'E',
            // restrict to an element
            replace: true,
            // replace the html element with the template
            template: '<div><p ng-hide="!caption" class="umb-abstract">{{caption}}</p><div class="umb-pane btn-toolbar umb-btn-toolbar"><div class="control-group umb-control-group"><umb-button ng-if="showCancel" type="button" action="onCancel()" button-style="link" disabled="confirmButtonState === \'busy\'" label-key="general_cancel"></umb-button><umb-button ng-if="showConfirm" type="button" action="confirm()" button-style="{{confirmButtonStyle || \'primary\'}}" state="confirmButtonState" label-key="general_ok"></umb-button></div></div></div>',
            scope: {
                onConfirm: '=',
                onCancel: '=',
                caption: '@',
                confirmButtonStyle: '@'
            },
            link: function link(scope, element, attr, ctrl) {
                scope.showCancel = false;
                scope.showConfirm = false;
                scope.confirmButtonState = 'init';
                if (scope.onConfirm) {
                    scope.showConfirm = true;
                }
                if (scope.onCancel) {
                    scope.showCancel = true;
                }
                scope.confirm = function () {
                    if (!scope.onConfirm) {
                        return;
                    }
                    scope.confirmButtonState = 'busy';
                    scope.onConfirm();
                };
            }
        };
    }
    angular.module('umbraco.directives').directive('umbConfirm', confirmDirective);
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbConfirmAction
@restrict E
@scope

@description
<p>Use this directive to toggle a confirmation prompt for an action.
The prompt consists of a checkmark and a cross to confirm or cancel the action.
The prompt can be opened in four direction up, down, left or right.</p>

<h3>Markup example</h3>
<pre>
    <div ng-controller="My.Controller as vm">

        <div class="my-action" style="position:relative;">
            <i class="icon-trash" ng-click="vm.showPrompt()"></i>
            <umb-confirm-action
                ng-if="vm.promptIsVisible"
                direction="left"
                on-confirm="vm.confirmAction()"
                on-cancel="vm.hidePrompt()">
            </umb-confirm-action>
        </div>

    </div>
</pre>

<h3>Controller example</h3>
<pre>
    (function () {

        "use strict";

        function Controller() {

            var vm = this;
            vm.promptIsVisible = false;

            vm.confirmAction = confirmAction;
            vm.showPrompt = showPrompt;
            vm.hidePrompt = hidePrompt;

            function confirmAction() {
                // confirm logic here
            }

            function showPrompt() {
                vm.promptIsVisible = true;
            }

            function hidePrompt() {
                vm.promptIsVisible = false;
            }

        }

        angular.module("umbraco").controller("My.Controller", Controller);
    })();
</pre>

@param {string} direction The direction the prompt opens ("up", "down", "left", "right").
@param {callback} onConfirm Callback when the checkmark is clicked.
@param {callback} onCancel Callback when the cross is clicked.
**/
    (function () {
        'use strict';
        function ConfirmAction() {
            function link(scope, el, attr, ctrl) {
                scope.clickConfirm = function () {
                    if (scope.onConfirm) {
                        scope.onConfirm();
                    }
                };
                scope.clickCancel = function () {
                    if (scope.onCancel) {
                        scope.onCancel();
                    }
                };
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb_confirm-action__overlay" ng-class="{ \'-top\': direction === \'top\', \'-right\': direction === \'right\', \'-bottom\': direction === \'bottom\', \'-left\': direction === \'left\'}" on-outside-click="clickCancel()"><a class="umb_confirm-action__overlay-action -confirm" ng-click="clickConfirm()" localize="title" title="@buttons_confirmActionConfirm"><i class="icon-check"></i></a> <a class="umb_confirm-action__overlay-action -cancel" ng-click="clickCancel()" localize="title" title="@buttons_confirmActionCancel"><i class="icon-delete"></i></a></div>',
                scope: {
                    direction: '@',
                    onConfirm: '&',
                    onCancel: '&'
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbConfirmAction', ConfirmAction);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbContentGrid
@restrict E
@scope

@description
Use this directive to generate a list of content items presented as a flexbox grid.

<h3>Markup example</h3>
<pre>
    <div ng-controller="My.Controller as vm">

        <umb-content-grid
            content="vm.contentItems"
            content-properties="vm.includeProperties"
            on-click="vm.selectItem"
            on-click-name="vm.clickItem">
        </umb-content-grid>

    </div>
</pre>

<h3>Controller example</h3>
<pre>
    (function () {
        "use strict";

        function Controller() {

            var vm = this;
            vm.contentItems = [
                {
                    "name": "Cape",
                    "published": true,
                    "icon": "icon-document",
                    "updateDate": "15-02-2016",
                    "owner": "Mr. Batman",
                    "selected": false
                },
                {
                    "name": "Utility Belt",
                    "published": true,
                    "icon": "icon-document",
                    "updateDate": "15-02-2016",
                    "owner": "Mr. Batman",
                    "selected": false
                },
                {
                    "name": "Cave",
                    "published": true,
                    "icon": "icon-document",
                    "updateDate": "15-02-2016",
                    "owner": "Mr. Batman",
                    "selected": false
                }
            ];
            vm.includeProperties = [
                {
                  "alias": "updateDate",
                  "header": "Last edited"
                },
                {
                  "alias": "owner",
                  "header": "Created by"
                }
            ];

            vm.clickItem = clickItem;
            vm.selectItem = selectItem;


            function clickItem(item, $event, $index){
                // do magic here
            }

            function selectItem(item, $event, $index) {
                // set item.selected = true; to select the item
                // do magic here
            }

        }

        angular.module("umbraco").controller("My.Controller", Controller);
    })();
</pre>

@param {array} content (<code>binding</code>): Array of content items.
@param {array=} contentProperties (<code>binding</code>): Array of content item properties to include in the item. If left empty the item will only show the item icon and name.
@param {callback=} onClick (<code>binding</code>): Callback method to handle click events on the content item.
    <h3>The callback returns:</h3>
    <ul>
        <li><code>item</code>: The clicked item</li>
        <li><code>$event</code>: The select event</li>
        <li><code>$index</code>: The item index</li>
    </ul>
@param {callback=} onClickName (<code>binding</code>): Callback method to handle click events on the checkmark icon.
    <h3>The callback returns:</h3>
    <ul>
        <li><code>item</code>: The selected item</li>
        <li><code>$event</code>: The select event</li>
        <li><code>$index</code>: The item index</li>
    </ul>
**/
    (function () {
        'use strict';
        function ContentGridDirective() {
            function link(scope, el, attr, ctrl) {
                scope.clickItem = function (item, $event, $index) {
                    if (scope.onClick) {
                        scope.onClick(item, $event, $index);
                    }
                };
                scope.clickItemName = function (item, $event, $index) {
                    if (scope.onClickName && !($event.metaKey || $event.ctrlKey)) {
                        scope.onClickName(item, $event, $index);
                        $event.preventDefault();
                    }
                    $event.stopPropagation();
                };
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-content-grid"><div class="umb-content-grid__item" ng-repeat="item in content" ng-class="{\'-selected\': item.selected}" ng-click="clickItem(item, $event, $index)"><div class="umb-content-grid__content"><a class="umb-content-grid__item-name" ng-href="{{\'#\' + item.editPath}}" ng-click="clickItemName(item, $event, $index)" ng-class="{\'-light\': !item.published && item.updater != null}"><i class="umb-content-grid__icon {{ item.icon }}"></i> <span>{{ item.name }}</span></a><ul class="umb-content-grid__details-list" ng-class="{\'-light\': !item.published && item.updater != null}"><li class="umb-content-grid__details-item" ng-if="item.state"><div class="umb-content-grid__details-label"><localize key="general_status"></localize>:</div><div class="umb-content-grid__details-value"><umb-variant-state variant="item"></umb-variant-state></div></li><li class="umb-content-grid__details-item" ng-repeat="property in contentProperties"><div class="umb-content-grid__details-label">{{ property.header }}:</div><div class="umb-content-grid__details-value">{{ item[property.alias] }}</div></li></ul></div></div><umb-empty-state ng-if="!content" position="center"><localize key="content_noItemsToShow">There are no items to show</localize></umb-empty-state></div>',
                scope: {
                    content: '=',
                    contentProperties: '=',
                    onClick: '=',
                    onClickName: '='
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbContentGrid', ContentGridDirective);
    }());
    'use strict';
    (function () {
        'use strict';
        function UmbDisableFormValidation() {
            var directive = {
                restrict: 'A',
                require: '?form',
                link: function link(scope, elm, attrs, ctrl) {
                    //override the $setValidity function of the form to disable validation
                    ctrl.$setValidity = function () {
                    };
                }
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbDisableFormValidation', UmbDisableFormValidation);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbDropdown
@restrict E
@scope

@description
<b>Added in versions 7.7.0</b>: Use this component to render a dropdown menu.

<h3>Markup example</h3>
<pre>
    <div ng-controller="MyDropdown.Controller as vm">

        <div style="position: relative;">

            <umb-button
                type="button"
                label="Toggle dropdown"
                action="vm.toggle()">
            </umb-button>

            <umb-dropdown ng-if="vm.dropdownOpen" on-close="vm.close()" umb-keyboard-list>
                <umb-dropdown-item
                    ng-repeat="item in vm.items">
                    <a href="" ng-click="vm.select(item)">{{ item.name }}</a>
                </umb-dropdown-item>
            </umb-dropdown>

        </div>

    </div>
</pre>

<h3>Controller example</h3>
<pre>
    (function () {
        "use strict";

        function Controller() {

            var vm = this;

            vm.dropdownOpen = false;
            vm.items = [
                { "name": "Item 1" },
                { "name": "Item 2" },
                { "name": "Item 3" }
            ];

            vm.toggle = toggle;
            vm.close = close;
            vm.select = select;

            function toggle() {
                vm.dropdownOpen = true;
            }

            function close() {
                vm.dropdownOpen = false;
            }

            function select(item) {
                // Do your magic here
            }

        }

        angular.module("umbraco").controller("MyDropdown.Controller", Controller);
    })();
</pre>

<h3>Use in combination with</h3>
<ul>
    <li>{@link umbraco.directives.directive:umbDropdownItem umbDropdownItem}</li>
    <li>{@link umbraco.directives.directive:umbKeyboardList umbKeyboardList}</li>
</ul>

@param {callback} onClose Callback when the dropdown menu closes. When you click outside or press esc.

**/
    (function () {
        'use strict';
        function umbDropdown($document) {
            function link(scope, element, attr, ctrl) {
                scope.close = function () {
                    if (scope.onClose) {
                        scope.onClose();
                    }
                };
                // Handle keydown events
                function keydown(event) {
                    // press escape
                    if (event.keyCode === 27) {
                        scope.onClose();
                    }
                }
                // Stop to listen typing.
                function stopListening() {
                    $document.off('keydown', keydown);
                }
                // Start listening to key typing.
                $document.on('keydown', keydown);
                // Stop listening when scope is destroyed.
                scope.$on('$destroy', stopListening);
            }
            var directive = {
                restrict: 'E',
                replace: true,
                transclude: true,
                template: '<ul class="dropdown-menu" on-outside-click="close()" ng-transclude></ul>',
                scope: { onClose: '&' },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbDropdown', umbDropdown);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbDropdownItem
@restrict E

@description
<b>Added in versions 7.7.0</b>: Use this directive to construct a dropdown item. See documentation for {@link umbraco.directives.directive:umbDropdown umbDropdown}.

**/
    (function () {
        'use strict';
        function umbDropdownItem() {
            var directive = {
                restrict: 'E',
                replace: true,
                transclude: true,
                template: '<li ng-transclude></li>'
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbDropdownItem', umbDropdownItem);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbEmptyState
@restrict E
@scope

@description
Use this directive to show an empty state message.

<h3>Markup example</h3>
<pre>
    <div ng-controller="My.Controller as vm">

        <umb-empty-state
            ng-if="!vm.items"
            position="center">
            // Empty state content
        </umb-empty-state>

    </div>
</pre>

@param {string=} size Set the size of the text ("small", "large").
@param {string=} position Set the position of the text ("center").
**/
    (function () {
        'use strict';
        function EmptyStateDirective() {
            var directive = {
                restrict: 'E',
                replace: true,
                transclude: true,
                template: '<div class="umb-empty-state" ng-class="{ \'-small\': size === \'small\', \'-large\': size === \'large\', \'-center\': position === \'center\' }" ng-transclude></div>',
                scope: {
                    size: '@',
                    position: '@'
                }
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbEmptyState', EmptyStateDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbFlatpickr
@restrict E
@scope

@description
<b>Added in Umbraco version 8.0</b>
This directive is a wrapper of the flatpickr library. Use it to render a date time picker.
For extra details about options and events take a look here: https://flatpickr.js.org/

Use this directive to render a date time picker

<h3>Markup example</h3>
<pre>
	<div ng-controller="My.Controller as vm">

		<umb-flatpickr
			ng-model="vm.date"
            options="vm.config"
            on-change="vm.datePickerChange(selectedDates, dateStr, instance)">
        </umb-flatpickr>

	</div>
</pre>

<h3>Controller example</h3>
<pre>
	(function () {
		"use strict";

		function Controller() {

            var vm = this;

            vm.date = "2018-10-10 10:00";

            vm.config = {
				enableTime: true,
				dateFormat: "Y-m-d H:i",
				time_24hr: true
            };

            vm.datePickerChange = datePickerChange;

            function datePickerChange(selectedDates, dateStr, instance) {
            	// handle change
            }

        }

		angular.module("umbraco").controller("My.Controller", Controller);

	})();
</pre>

@param {object} ngModel (<code>binding</code>): Config object for the date picker.
@param {object} options (<code>binding</code>): Config object for the date picker.
@param {callback} onSetup (<code>callback</code>): onSetup gets triggered when the date picker is initialized
@param {callback} onChange (<code>callback</code>): onChange gets triggered when the user selects a date, or changes the time on a selected date.
@param {callback} onOpen (<code>callback</code>): onOpen gets triggered when the calendar is opened.
@param {callback} onClose (<code>callback</code>): onClose gets triggered when the calendar is closed.
@param {callback} onMonthChange (<code>callback</code>): onMonthChange gets triggered when the month is changed, either by the user or programmatically.
@param {callback} onYearChange (<code>callback</code>): onMonthChange gets triggered when the year is changed, either by the user or programmatically.
@param {callback} onReady (<code>callback</code>): onReady gets triggered once the calendar is in a ready state.
@param {callback} onValueUpdate (<code>callback</code>): onValueUpdate gets triggered when the input value is updated with a new date string.
@param {callback} onDayCreate (<code>callback</code>): Take full control of every date cell with theonDayCreate()hook.
**/
    (function () {
        'use strict';
        var umbFlatpickr = {
            template: '<ng-transclude>' + '<input type="text" ng-if="!$ctrl.options.inline" ng-model="$ctrl.ngModel" placeholder="Select Date.."></input>' + '<div ng-if="$ctrl.options.inline"></div>' + '</ng-transclude>',
            controller: umbFlatpickrCtrl,
            transclude: true,
            bindings: {
                ngModel: '<',
                options: '<',
                onSetup: '&?',
                onChange: '&?',
                onOpen: '&?',
                onClose: '&?',
                onMonthChange: '&?',
                onYearChange: '&?',
                onReady: '&?',
                onValueUpdate: '&?',
                onDayCreate: '&?'
            }
        };
        function umbFlatpickrCtrl($element, $timeout, $scope, assetsService, userService) {
            var ctrl = this;
            var loaded = false;
            var userLocale = null;
            ctrl.$onInit = function () {
                // load css file for the date picker
                assetsService.loadCss('lib/flatpickr/flatpickr.css', $scope).then(function () {
                    userService.getCurrentUser().then(function (user) {
                        // init date picker
                        userLocale = user.locale;
                        if (userLocale.indexOf('-') > -1) {
                            userLocale = userLocale.split('-')[0];
                        }
                        loaded = true;
                        grabElementAndRunFlatpickr();
                    });
                });
            };
            function grabElementAndRunFlatpickr() {
                $timeout(function () {
                    var transcludeEl = $element.find('ng-transclude')[0];
                    var element = transcludeEl.children[0];
                    setDatepicker(element);
                }, 0, true);
            }
            function setDatepicker(element) {
                var fpLib = flatpickr ? flatpickr : FlatpickrInstance;
                if (!fpLib) {
                    return console.warn('Unable to find any flatpickr installation');
                }
                setUpCallbacks();
                if (!ctrl.options.locale) {
                    ctrl.options.locale = userLocale;
                }
                var fpInstance = new fpLib(element, ctrl.options);
                if (ctrl.onSetup) {
                    ctrl.onSetup({ fpItem: fpInstance });
                }
                // If has ngModel set the date
                if (ctrl.ngModel) {
                    fpInstance.setDate(ctrl.ngModel);
                }
                // destroy the flatpickr instance when the dom element is removed
                angular.element(element).on('$destroy', function () {
                    fpInstance.destroy();
                });
                // Refresh the scope
                $scope.$applyAsync();
            }
            function setUpCallbacks() {
                // bind hook for onChange
                if (ctrl.options && ctrl.onChange) {
                    ctrl.options.onChange = function (selectedDates, dateStr, instance) {
                        $timeout(function () {
                            ctrl.onChange({
                                selectedDates: selectedDates,
                                dateStr: dateStr,
                                instance: instance
                            });
                        });
                    };
                }
                // bind hook for onOpen
                if (ctrl.options && ctrl.onOpen) {
                    ctrl.options.onOpen = function (selectedDates, dateStr, instance) {
                        $timeout(function () {
                            ctrl.onOpen({
                                selectedDates: selectedDates,
                                dateStr: dateStr,
                                instance: instance
                            });
                        });
                    };
                }
                // bind hook for onOpen
                if (ctrl.options && ctrl.onClose) {
                    ctrl.options.onClose = function (selectedDates, dateStr, instance) {
                        $timeout(function () {
                            ctrl.onClose({
                                selectedDates: selectedDates,
                                dateStr: dateStr,
                                instance: instance
                            });
                        });
                    };
                }
                // bind hook for onMonthChange
                if (ctrl.options && ctrl.onMonthChange) {
                    ctrl.options.onMonthChange = function (selectedDates, dateStr, instance) {
                        $timeout(function () {
                            ctrl.onMonthChange({
                                selectedDates: selectedDates,
                                dateStr: dateStr,
                                instance: instance
                            });
                        });
                    };
                }
                // bind hook for onYearChange
                if (ctrl.options && ctrl.onYearChange) {
                    ctrl.options.onYearChange = function (selectedDates, dateStr, instance) {
                        $timeout(function () {
                            ctrl.onYearChange({
                                selectedDates: selectedDates,
                                dateStr: dateStr,
                                instance: instance
                            });
                        });
                    };
                }
                // bind hook for onReady
                if (ctrl.options && ctrl.onReady) {
                    ctrl.options.onReady = function (selectedDates, dateStr, instance) {
                        $timeout(function () {
                            ctrl.onReady({
                                selectedDates: selectedDates,
                                dateStr: dateStr,
                                instance: instance
                            });
                        });
                    };
                }
                // bind hook for onValueUpdate
                if (ctrl.onValueUpdate) {
                    ctrl.options.onValueUpdate = function (selectedDates, dateStr, instance) {
                        $timeout(function () {
                            ctrl.onValueUpdate({
                                selectedDates: selectedDates,
                                dateStr: dateStr,
                                instance: instance
                            });
                        });
                    };
                }
                // bind hook for onDayCreate
                if (ctrl.onDayCreate) {
                    ctrl.options.onDayCreate = function (selectedDates, dateStr, instance) {
                        $timeout(function () {
                            ctrl.onDayCreate({
                                selectedDates: selectedDates,
                                dateStr: dateStr,
                                instance: instance
                            });
                        });
                    };
                }
            }
        }
        angular.module('umbraco.directives').component('umbFlatpickr', umbFlatpickr);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbFolderGrid
@restrict E
@scope

@description
Use this directive to generate a list of folders presented as a flexbox grid.

<h3>Markup example</h3>
<pre>
    <div ng-controller="My.Controller as vm">
        <umb-folder-grid
            ng-if="vm.folders.length > 0"
            folders="vm.folders"
            on-click="vm.clickFolder"
            on-select="vm.selectFolder">
        </umb-folder-grid>
    </div>
</pre>

<h3>Controller example</h3>
<pre>
    (function () {
        "use strict";

        function Controller(myService) {

            var vm = this;
            vm.folders = [
                {
                    "name": "Folder 1",
                    "icon": "icon-folder",
                    "selected": false
                },
                {
                    "name": "Folder 2",
                    "icon": "icon-folder",
                    "selected": false
                }

            ];

            vm.clickFolder = clickFolder;
            vm.selectFolder = selectFolder;

            myService.getFolders().then(function(folders){
                vm.folders = folders;
            });

            function clickFolder(folder){
                // Execute when clicking folder name/link
            }

            function selectFolder(folder, event, index) {
                // Execute when clicking folder
                // set folder.selected = true; to show checkmark icon
            }

        }

        angular.module("umbraco").controller("My.Controller", Controller);
    })();
</pre>

@param {array} folders (<code>binding</code>): Array of folders
@param {callback=} onClick (<code>binding</code>): Callback method to handle click events on the folder.
    <h3>The callback returns:</h3>
    <ul>
        <li><code>folder</code>: The selected folder</li>
    </ul>
@param {callback=} onSelect (<code>binding</code>): Callback method to handle click events on the checkmark icon.
    <h3>The callback returns:</h3>
    <ul>
        <li><code>folder</code>: The selected folder</li>
        <li><code>$event</code>: The select event</li>
        <li><code>$index</code>: The folder index</li>
    </ul>
**/
    (function () {
        'use strict';
        function FolderGridDirective() {
            function link(scope, el, attr, ctrl) {
                scope.clickFolder = function (folder, $event, $index) {
                    if (scope.onClick) {
                        scope.onClick(folder, $event, $index);
                        $event.stopPropagation();
                    }
                };
                scope.clickFolderName = function (folder, $event, $index) {
                    if (scope.onClickName) {
                        scope.onClickName(folder, $event, $index);
                        $event.stopPropagation();
                    }
                };
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-folder-grid"><div class="umb-folder-grid__folder" ng-repeat="folder in folders" ng-class="{\'-selected\': folder.selected}" ng-click="clickFolder(folder, $event, $index)"><div class="umb-folder-grid__folder-description"><i class="umb-folder-grid__folder-icon {{ folder.icon }}"></i><div ng-click="clickFolderName(folder, $event, $index)" class="umb-folder-grid__folder-name">{{ folder.name }}</div></div></div></div>',
                scope: {
                    folders: '=',
                    onClick: '=',
                    onClickName: '='
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbFolderGrid', FolderGridDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbGenerateAlias
@restrict E
@scope

@description
Use this directive to generate a camelCased umbraco alias.
When the aliasFrom value is changed the directive will get a formatted alias from the server and update the alias model. If "enableLock" is set to <code>true</code>
the directive will use {@link umbraco.directives.directive:umbLockedField umbLockedField} to lock and unlock the alias.

<h3>Markup example</h3>
<pre>
    <div ng-controller="My.Controller as vm">

        <input type="text" ng-model="vm.name" />

        <umb-generate-alias
            enable-lock="true"
            alias-from="vm.name"
            alias="vm.alias">
        </umb-generate-alias>

    </div>
</pre>

<h3>Controller example</h3>
<pre>
    (function () {
        "use strict";

        function Controller() {

            var vm = this;

            vm.name = "";
            vm.alias = "";

        }

        angular.module("umbraco").controller("My.Controller", Controller);
    })();
</pre>

@param {string} alias (<code>binding</code>): The model where the alias is bound.
@param {string} aliasFrom (<code>binding</code>): The model to generate the alias from.
@param {string} validationPosition (<code>binding</code>): The position of the validation. Set to <code>'left'</code> or <code>'right'</code>.
@param {boolean=} enableLock (<code>binding</code>): Set to <code>true</code> to add a lock next to the alias from where it can be unlocked and changed.
**/
    angular.module('umbraco.directives').directive('umbGenerateAlias', function ($timeout, entityResource, localizationService) {
        return {
            restrict: 'E',
            template: '<div><span ng-show="!enableLock">{{ alias }}</span><div ng-show="enableLock"><umb-locked-field locked="locked" ng-model="alias" placeholder-text="placeholderText" validation-position="validationPosition" server-validation-field="{{serverValidationField}}"></umb-locked-field></div></div>',
            replace: true,
            scope: {
                alias: '=',
                aliasFrom: '=',
                enableLock: '=?',
                validationPosition: '=?',
                serverValidationField: '@'
            },
            link: function link(scope, element, attrs, ctrl) {
                var eventBindings = [];
                var bindWatcher = true;
                var generateAliasTimeout = '';
                var updateAlias = false;
                scope.locked = true;
                scope.labels = {
                    idle: 'Enter alias...',
                    busy: 'Generating alias...'
                };
                scope.placeholderText = scope.labels.idle;
                localizationService.localize('placeholders_enterAlias').then(function (value) {
                    scope.labels.idle = scope.placeholderText = value;
                });
                localizationService.localize('placeholders_generatingAlias').then(function (value) {
                    scope.labels.busy = value;
                });
                function generateAlias(value) {
                    if (generateAliasTimeout) {
                        $timeout.cancel(generateAliasTimeout);
                    }
                    if (value !== undefined && value !== '' && value !== null) {
                        scope.alias = '';
                        scope.placeholderText = scope.labels.busy;
                        generateAliasTimeout = $timeout(function () {
                            updateAlias = true;
                            entityResource.getSafeAlias(value, true).then(function (safeAlias) {
                                if (updateAlias) {
                                    scope.alias = safeAlias.alias;
                                }
                                scope.placeholderText = scope.labels.idle;
                            });
                        }, 500);
                    } else {
                        updateAlias = true;
                        scope.alias = '';
                        scope.placeholderText = scope.labels.idle;
                    }
                }
                // if alias gets unlocked - stop watching alias
                eventBindings.push(scope.$watch('locked', function (newValue, oldValue) {
                    if (newValue === false) {
                        bindWatcher = false;
                    }
                }));
                // validate custom entered alias
                eventBindings.push(scope.$watch('alias', function (newValue, oldValue) {
                    if (scope.alias === '' || scope.alias === null || scope.alias === undefined) {
                        if (bindWatcher === true) {
                            // add watcher
                            eventBindings.push(scope.$watch('aliasFrom', function (newValue, oldValue) {
                                if (bindWatcher) {
                                    generateAlias(newValue);
                                }
                            }));
                        }
                    }
                }));
                // clean up
                scope.$on('$destroy', function () {
                    // unbind watchers
                    for (var e in eventBindings) {
                        eventBindings[e]();
                    }
                });
            }
        };
    });
    'use strict';
    (function () {
        'use strict';
        function GridSelector($location, overlayService) {
            function link(scope, el, attr, ctrl) {
                var eventBindings = [];
                scope.dialogModel = {};
                scope.showDialog = false;
                scope.itemLabel = '';
                // set default item name
                if (!scope.itemName) {
                    scope.itemLabel = 'item';
                } else {
                    scope.itemLabel = scope.itemName;
                }
                scope.removeItem = function (selectedItem) {
                    var selectedItemIndex = scope.selectedItems.indexOf(selectedItem);
                    scope.selectedItems.splice(selectedItemIndex, 1);
                };
                scope.removeDefaultItem = function () {
                    // it will be the last item so we can clear the array
                    scope.selectedItems = [];
                    // remove as default item
                    scope.defaultItem = null;
                };
                scope.openItemPicker = function ($event) {
                    var dialogModel = {
                        view: 'itempicker',
                        title: 'Choose ' + scope.itemLabel,
                        availableItems: scope.availableItems,
                        selectedItems: scope.selectedItems,
                        position: 'target',
                        event: $event,
                        submit: function submit(model) {
                            scope.selectedItems.push(model.selectedItem);
                            // if no default item - set item as default
                            if (scope.defaultItem === null) {
                                scope.setAsDefaultItem(model.selectedItem);
                            }
                            overlayService.close();
                        },
                        close: function close() {
                            overlayService.close();
                        }
                    };
                    overlayService.open(dialogModel);
                };
                scope.openTemplate = function (selectedItem) {
                    var url = '/settings/templates/edit/' + selectedItem.id;
                    $location.url(url);
                };
                scope.setAsDefaultItem = function (selectedItem) {
                    // clear default item
                    scope.defaultItem = {};
                    // set as default item
                    scope.defaultItem = selectedItem;
                };
                function updatePlaceholders() {
                    // update default item
                    if (scope.defaultItem !== null && scope.defaultItem.placeholder) {
                        scope.defaultItem.name = scope.name;
                        if (scope.alias !== null && scope.alias !== undefined) {
                            scope.defaultItem.alias = scope.alias;
                        }
                    }
                    // update selected items
                    angular.forEach(scope.selectedItems, function (selectedItem) {
                        if (selectedItem.placeholder) {
                            selectedItem.name = scope.name;
                            if (scope.alias !== null && scope.alias !== undefined) {
                                selectedItem.alias = scope.alias;
                            }
                        }
                    });
                    // update availableItems
                    angular.forEach(scope.availableItems, function (availableItem) {
                        if (availableItem.placeholder) {
                            availableItem.name = scope.name;
                            if (scope.alias !== null && scope.alias !== undefined) {
                                availableItem.alias = scope.alias;
                            }
                        }
                    });
                }
                function activate() {
                    // add watchers for updating placeholde name and alias
                    if (scope.updatePlaceholder) {
                        eventBindings.push(scope.$watch('name', function (newValue, oldValue) {
                            updatePlaceholders();
                        }));
                        eventBindings.push(scope.$watch('alias', function (newValue, oldValue) {
                            updatePlaceholders();
                        }));
                    }
                }
                activate();
                // clean up
                scope.$on('$destroy', function () {
                    // clear watchers
                    for (var e in eventBindings) {
                        eventBindings[e]();
                    }
                });
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-grid-selector"><div class="umb-grid-selector__items"><div class="umb-grid-selector__item -default" ng-if="defaultItem !== null"><div class="umb-grid-selector__item-content"><i class="umb-grid-selector__item-icon {{ defaultItem.icon }}"></i><div class="umb-grid-selector__item-label">{{ defaultItem.name }}</div><div ng-show="defaultItem.id"><a class="umb-grid-selector__item-default-label -blue" ng-click="openTemplate(defaultItem)"><localize key="general_open">Open</localize></a></div><span class="umb-grid-selector__item-default-label">(<localize key="general_default">Default</localize>{{itemLabel}})</span></div><i class="umb-grid-selector__item-remove icon-trash" ng-if="selectedItems.length === 1" ng-click="removeDefaultItem()"></i></div><div class="umb-grid-selector__item" ng-repeat="selectedItem in selectedItems | filter: { alias:\'!\'+defaultItem.alias }:true"><div class="umb-grid-selector__item-content"><i class="umb-grid-selector__item-icon {{ selectedItem.icon }}"></i><div class="umb-grid-selector__item-label">{{ selectedItem.name }}</div><div><a class="umb-grid-selector__item-default-label -blue" ng-click="openTemplate(selectedItem)"><localize key="general_open">Open</localize></a></div><div><a class="umb-grid-selector__item-default-label -blue" ng-click="setAsDefaultItem(selectedItem)"><localize key="grid_setAsDefault">Set as default</localize></a></div></div><i class="umb-grid-selector__item-remove icon-trash" ng-click="removeItem(selectedItem)"></i></div><a class="umb-grid-selector__item -placeholder" ng-if="(availableItems | compareArrays:selectedItems:\'alias\').length > 0" ng-click="openItemPicker($event)" hotkey="alt+shift+g"><div class="umb-grid-selector__item-content"><div class="umb-grid-selector__item-label -blue" ng-if="defaultItem !== null"><localize key="grid_chooseExtra">Choose extra</localize>{{ itemLabel }}</div><div class="umb-grid-selector__item-label -blue" ng-if="defaultItem === null"><localize key="grid_chooseDefault">Choose default</localize>{{ itemLabel }}</div></div></a></div><div class="text-center" ng-if="(availableItems | compareArrays:selectedItems:\'alias\').length === 0"><small><localize key="general_all">Akk</localize>{{itemLabel}}s<localize key="grid_areAdded">are added</localize></small></div></div>',
                scope: {
                    name: '=',
                    alias: '=',
                    selectedItems: '=',
                    availableItems: '=',
                    defaultItem: '=',
                    itemName: '@',
                    updatePlaceholder: '='
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbGridSelector', GridSelector);
    }());
    'use strict';
    (function () {
        'use strict';
        function GroupsBuilderDirective(contentTypeHelper, contentTypeResource, mediaTypeResource, dataTypeHelper, dataTypeResource, $filter, iconHelper, $q, $timeout, notificationsService, localizationService, editorService, eventsService, overlayService) {
            function link(scope, el, attr, ctrl) {
                var eventBindings = [];
                var validationTranslated = '';
                var tabNoSortOrderTranslated = '';
                scope.dataTypeHasChanged = false;
                scope.sortingMode = false;
                scope.toolbar = [];
                scope.sortableOptionsGroup = {};
                scope.sortableOptionsProperty = {};
                scope.sortingButtonKey = 'general_reorder';
                function activate() {
                    setSortingOptions();
                    // set placeholder property on each group
                    if (scope.model.groups.length !== 0) {
                        angular.forEach(scope.model.groups, function (group) {
                            addInitProperty(group);
                        });
                    }
                    // add init tab
                    addInitGroup(scope.model.groups);
                    activateFirstGroup(scope.model.groups);
                    // localize texts
                    localizationService.localize('validation_validation').then(function (value) {
                        validationTranslated = value;
                    });
                    localizationService.localize('contentTypeEditor_tabHasNoSortOrder').then(function (value) {
                        tabNoSortOrderTranslated = value;
                    });
                }
                function setSortingOptions() {
                    scope.sortableOptionsGroup = {
                        distance: 10,
                        tolerance: 'pointer',
                        opacity: 0.7,
                        scroll: true,
                        cursor: 'move',
                        placeholder: 'umb-group-builder__group-sortable-placeholder',
                        zIndex: 6000,
                        handle: '.umb-group-builder__group-handle',
                        items: '.umb-group-builder__group-sortable',
                        start: function start(e, ui) {
                            ui.placeholder.height(ui.item.height());
                        },
                        stop: function stop(e, ui) {
                            updateTabsSortOrder();
                        }
                    };
                    scope.sortableOptionsProperty = {
                        distance: 10,
                        tolerance: 'pointer',
                        connectWith: '.umb-group-builder__properties',
                        opacity: 0.7,
                        scroll: true,
                        cursor: 'move',
                        placeholder: 'umb-group-builder__property_sortable-placeholder',
                        zIndex: 6000,
                        handle: '.umb-group-builder__property-handle',
                        items: '.umb-group-builder__property-sortable',
                        start: function start(e, ui) {
                            ui.placeholder.height(ui.item.height());
                        },
                        stop: function stop(e, ui) {
                            updatePropertiesSortOrder();
                        }
                    };
                }
                function updateTabsSortOrder() {
                    var first = true;
                    var prevSortOrder = 0;
                    scope.model.groups.map(function (group) {
                        var index = scope.model.groups.indexOf(group);
                        if (group.tabState !== 'init') {
                            // set the first not inherited tab to sort order 0
                            if (!group.inherited && first) {
                                // set the first tab sort order to 0 if prev is 0
                                if (prevSortOrder === 0) {
                                    group.sortOrder = 0;    // when the first tab is inherited and sort order is not 0
                                } else {
                                    group.sortOrder = prevSortOrder + 1;
                                }
                                first = false;
                            } else if (!group.inherited && !first) {
                                // find next group
                                var nextGroup = scope.model.groups[index + 1];
                                // if a groups is dropped in the middle of to groups with
                                // same sort order. Give it the dropped group same sort order
                                if (prevSortOrder === nextGroup.sortOrder) {
                                    group.sortOrder = prevSortOrder;
                                } else {
                                    group.sortOrder = prevSortOrder + 1;
                                }
                            }
                            // store this tabs sort order as reference for the next
                            prevSortOrder = group.sortOrder;
                        }
                    });
                }
                function filterAvailableCompositions(selectedContentType, selecting) {
                    //selecting = true if the user has check the item, false if the user has unchecked the item
                    var selectedContentTypeAliases = selecting ? //the user has selected the item so add to the current list
                    _.union(scope.compositionsDialogModel.compositeContentTypes, [selectedContentType.alias]) : //the user has unselected the item so remove from the current list
                    _.reject(scope.compositionsDialogModel.compositeContentTypes, function (i) {
                        return i === selectedContentType.alias;
                    });
                    //get the currently assigned property type aliases - ensure we pass these to the server side filer
                    var propAliasesExisting = _.filter(_.flatten(_.map(scope.model.groups, function (g) {
                        return _.map(g.properties, function (p) {
                            return p.alias;
                        });
                    })), function (f) {
                        return f !== null && f !== undefined;
                    });
                    //use a different resource lookup depending on the content type type
                    var resourceLookup = scope.contentType === 'documentType' ? contentTypeResource.getAvailableCompositeContentTypes : mediaTypeResource.getAvailableCompositeContentTypes;
                    return resourceLookup(scope.model.id, selectedContentTypeAliases, propAliasesExisting).then(function (filteredAvailableCompositeTypes) {
                        _.each(scope.compositionsDialogModel.availableCompositeContentTypes, function (current) {
                            //reset first
                            current.allowed = true;
                            //see if this list item is found in the response (allowed) list
                            var found = _.find(filteredAvailableCompositeTypes, function (f) {
                                return current.contentType.alias === f.contentType.alias;
                            });
                            //allow if the item was  found in the response (allowed) list -
                            // and ensure its set to allowed if it is currently checked,
                            // DO not allow if it's a locked content type.
                            current.allowed = scope.model.lockedCompositeContentTypes.indexOf(current.contentType.alias) === -1 && selectedContentTypeAliases.indexOf(current.contentType.alias) !== -1 || (found !== null && found !== undefined ? found.allowed : false);
                        });
                    });
                }
                function updatePropertiesSortOrder() {
                    angular.forEach(scope.model.groups, function (group) {
                        if (group.tabState !== 'init') {
                            group.properties = contentTypeHelper.updatePropertiesSortOrder(group.properties);
                        }
                    });
                }
                function setupAvailableContentTypesModel(result) {
                    scope.compositionsDialogModel.availableCompositeContentTypes = result;
                    //iterate each one and set it up
                    _.each(scope.compositionsDialogModel.availableCompositeContentTypes, function (c) {
                        //enable it if it's part of the selected model
                        if (scope.compositionsDialogModel.compositeContentTypes.indexOf(c.contentType.alias) !== -1) {
                            c.allowed = true;
                        }
                        //set the inherited flags
                        c.inherited = false;
                        if (scope.model.lockedCompositeContentTypes.indexOf(c.contentType.alias) > -1) {
                            c.inherited = true;
                        }
                        // convert icons for composite content types
                        iconHelper.formatContentTypeIcons([c.contentType]);
                    });
                }
                /* ---------- DELETE PROMT ---------- */
                scope.togglePrompt = function (object) {
                    object.deletePrompt = !object.deletePrompt;
                };
                scope.hidePrompt = function (object) {
                    object.deletePrompt = false;
                };
                /* ---------- TOOLBAR ---------- */
                scope.toggleSortingMode = function (tool) {
                    if (scope.sortingMode === true) {
                        var sortOrderMissing = false;
                        for (var i = 0; i < scope.model.groups.length; i++) {
                            var group = scope.model.groups[i];
                            if (group.tabState !== 'init' && group.sortOrder === undefined) {
                                sortOrderMissing = true;
                                group.showSortOrderMissing = true;
                                notificationsService.error(validationTranslated + ': ' + group.name + ' ' + tabNoSortOrderTranslated);
                            }
                        }
                        if (!sortOrderMissing) {
                            scope.sortingMode = false;
                            scope.sortingButtonKey = 'general_reorder';
                        }
                    } else {
                        scope.sortingMode = true;
                        scope.sortingButtonKey = 'general_reorderDone';
                    }
                };
                scope.openCompositionsDialog = function () {
                    scope.compositionsDialogModel = {
                        contentType: scope.model,
                        compositeContentTypes: scope.model.compositeContentTypes,
                        view: 'views/common/infiniteeditors/compositions/compositions.html',
                        size: 'small',
                        submit: function submit() {
                            // make sure that all tabs has an init property
                            if (scope.model.groups.length !== 0) {
                                angular.forEach(scope.model.groups, function (group) {
                                    addInitProperty(group);
                                });
                            }
                            // remove overlay
                            editorService.close();
                        },
                        close: function close(oldModel) {
                            // reset composition changes
                            scope.model.groups = oldModel.contentType.groups;
                            scope.model.compositeContentTypes = oldModel.contentType.compositeContentTypes;
                            // remove overlay
                            editorService.close();
                        },
                        selectCompositeContentType: function selectCompositeContentType(selectedContentType) {
                            //first check if this is a new selection - we need to store this value here before any further digests/async
                            // because after that the scope.model.compositeContentTypes will be populated with the selected value.
                            var newSelection = scope.model.compositeContentTypes.indexOf(selectedContentType.alias) === -1;
                            if (newSelection) {
                                //merge composition with content type
                                //use a different resource lookup depending on the content type type
                                var resourceLookup = scope.contentType === 'documentType' ? contentTypeResource.getById : mediaTypeResource.getById;
                                resourceLookup(selectedContentType.id).then(function (composition) {
                                    //based on the above filtering we shouldn't be able to select an invalid one, but let's be safe and
                                    // double check here.
                                    var overlappingAliases = contentTypeHelper.validateAddingComposition(scope.model, composition);
                                    if (overlappingAliases.length > 0) {
                                        //this will create an invalid composition, need to uncheck it
                                        scope.compositionsDialogModel.compositeContentTypes.splice(scope.compositionsDialogModel.compositeContentTypes.indexOf(composition.alias), 1);
                                        //dissallow this until something else is unchecked
                                        selectedContentType.allowed = false;
                                    } else {
                                        contentTypeHelper.mergeCompositeContentType(scope.model, composition);
                                    }
                                    //based on the selection, we need to filter the available composite types list
                                    filterAvailableCompositions(selectedContentType, newSelection).then(function () {
                                    });
                                });
                            } else {
                                // split composition from content type
                                contentTypeHelper.splitCompositeContentType(scope.model, selectedContentType);
                                //based on the selection, we need to filter the available composite types list
                                filterAvailableCompositions(selectedContentType, newSelection).then(function () {
                                });
                            }
                        }
                    };
                    //select which resource methods to use, eg document Type or Media Type versions
                    var availableContentTypeResource = scope.contentType === 'documentType' ? contentTypeResource.getAvailableCompositeContentTypes : mediaTypeResource.getAvailableCompositeContentTypes;
                    var whereUsedContentTypeResource = scope.contentType === 'documentType' ? contentTypeResource.getWhereCompositionIsUsedInContentTypes : mediaTypeResource.getWhereCompositionIsUsedInContentTypes;
                    var countContentTypeResource = scope.contentType === 'documentType' ? contentTypeResource.getCount : mediaTypeResource.getCount;
                    //get the currently assigned property type aliases - ensure we pass these to the server side filer
                    var propAliasesExisting = _.filter(_.flatten(_.map(scope.model.groups, function (g) {
                        return _.map(g.properties, function (p) {
                            return p.alias;
                        });
                    })), function (f) {
                        return f !== null && f !== undefined;
                    });
                    $q.all([
                        //get available composite types
                        availableContentTypeResource(scope.model.id, [], propAliasesExisting).then(function (result) {
                            setupAvailableContentTypesModel(result);
                        }),
                        //get where used document types
                        whereUsedContentTypeResource(scope.model.id).then(function (whereUsed) {
                            //pass to the dialog model the content type eg documentType or mediaType 
                            scope.compositionsDialogModel.section = scope.contentType;
                            //pass the list of 'where used' document types
                            scope.compositionsDialogModel.whereCompositionUsed = whereUsed;
                        }),
                        //get content type count
                        countContentTypeResource().then(function (result) {
                            scope.compositionsDialogModel.totalContentTypes = parseInt(result, 10);
                        })
                    ]).then(function () {
                        //resolves when both other promises are done, now show it
                        editorService.open(scope.compositionsDialogModel);
                    });
                };
                /* ---------- GROUPS ---------- */
                scope.addGroup = function (group) {
                    // set group sort order
                    var index = scope.model.groups.indexOf(group);
                    var prevGroup = scope.model.groups[index - 1];
                    if (index > 0) {
                        // set index to 1 higher than the previous groups sort order
                        group.sortOrder = prevGroup.sortOrder + 1;
                    } else {
                        // first group - sort order will be 0
                        group.sortOrder = 0;
                    }
                    // activate group
                    scope.activateGroup(group);
                };
                scope.activateGroup = function (selectedGroup) {
                    // set all other groups that are inactive to active
                    angular.forEach(scope.model.groups, function (group) {
                        // skip init tab
                        if (group.tabState !== 'init') {
                            group.tabState = 'inActive';
                        }
                    });
                    selectedGroup.tabState = 'active';
                };
                scope.removeGroup = function (groupIndex) {
                    scope.model.groups.splice(groupIndex, 1);
                    addInitGroup(scope.model.groups);
                };
                scope.updateGroupTitle = function (group) {
                    if (group.properties.length === 0) {
                        addInitProperty(group);
                    }
                };
                scope.changeSortOrderValue = function (group) {
                    if (group.sortOrder !== undefined) {
                        group.showSortOrderMissing = false;
                    }
                    scope.model.groups = $filter('orderBy')(scope.model.groups, 'sortOrder');
                };
                function addInitGroup(groups) {
                    // check i init tab already exists
                    var addGroup = true;
                    angular.forEach(groups, function (group) {
                        if (group.tabState === 'init') {
                            addGroup = false;
                        }
                    });
                    if (addGroup) {
                        groups.push({
                            properties: [],
                            parentTabContentTypes: [],
                            parentTabContentTypeNames: [],
                            name: '',
                            tabState: 'init'
                        });
                    }
                    return groups;
                }
                function activateFirstGroup(groups) {
                    if (groups && groups.length > 0) {
                        var firstGroup = groups[0];
                        if (!firstGroup.tabState || firstGroup.tabState === 'inActive') {
                            firstGroup.tabState = 'active';
                        }
                    }
                }
                /* ---------- PROPERTIES ---------- */
                scope.addProperty = function (property, group) {
                    // set property sort order
                    var index = group.properties.indexOf(property);
                    var prevProperty = group.properties[index - 1];
                    if (index > 0) {
                        // set index to 1 higher than the previous property sort order
                        property.sortOrder = prevProperty.sortOrder + 1;
                    } else {
                        // first property - sort order will be 0
                        property.sortOrder = 0;
                    }
                    // open property settings dialog
                    scope.editPropertyTypeSettings(property, group);
                };
                scope.editPropertyTypeSettings = function (property, group) {
                    if (!property.inherited) {
                        var oldPropertyModel = angular.copy(property);
                        if (oldPropertyModel.allowCultureVariant === undefined) {
                            // this is necessary for comparison when detecting changes to the property
                            oldPropertyModel.allowCultureVariant = scope.model.allowCultureVariant;
                            oldPropertyModel.alias = '';
                        }
                        var propertyModel = angular.copy(property);
                        var propertySettings = {
                            title: 'Property settings',
                            property: propertyModel,
                            contentType: scope.contentType,
                            contentTypeName: scope.model.name,
                            contentTypeAllowCultureVariant: scope.model.allowCultureVariant,
                            view: 'views/common/infiniteeditors/propertysettings/propertysettings.html',
                            size: 'small',
                            submit: function submit(model) {
                                property.inherited = false;
                                property.dialogIsOpen = false;
                                property.propertyState = 'active';
                                // apply all property changes
                                property.label = propertyModel.label;
                                property.alias = propertyModel.alias;
                                property.description = propertyModel.description;
                                property.config = propertyModel.config;
                                property.editor = propertyModel.editor;
                                property.view = propertyModel.view;
                                property.dataTypeId = propertyModel.dataTypeId;
                                property.dataTypeIcon = propertyModel.dataTypeIcon;
                                property.dataTypeName = propertyModel.dataTypeName;
                                property.validation.mandatory = propertyModel.validation.mandatory;
                                property.validation.pattern = propertyModel.validation.pattern;
                                property.showOnMemberProfile = propertyModel.showOnMemberProfile;
                                property.memberCanEdit = propertyModel.memberCanEdit;
                                property.isSensitiveValue = propertyModel.isSensitiveValue;
                                property.allowCultureVariant = propertyModel.allowCultureVariant;
                                // update existing data types
                                if (model.updateSameDataTypes) {
                                    updateSameDataTypes(property);
                                }
                                // close the editor
                                editorService.close();
                                // push new init property to group
                                addInitProperty(group);
                                // set focus on init property
                                var numberOfProperties = group.properties.length;
                                group.properties[numberOfProperties - 1].focus = true;
                                // push new init tab to the scope
                                addInitGroup(scope.model.groups);
                            },
                            close: function close() {
                                if (_.isEqual(oldPropertyModel, propertyModel) === false) {
                                    localizationService.localizeMany([
                                        'general_confirm',
                                        'contentTypeEditor_propertyHasChanges',
                                        'general_cancel',
                                        'general_ok'
                                    ]).then(function (data) {
                                        var overlay = {
                                            title: data[0],
                                            content: data[1],
                                            closeButtonLabel: data[2],
                                            submitButtonLabel: data[3],
                                            submitButtonStyle: 'danger',
                                            close: function close() {
                                                overlayService.close();
                                            },
                                            submit: function submit() {
                                                // close the confirmation
                                                overlayService.close();
                                                // close the editor
                                                editorService.close();
                                            }
                                        };
                                        overlayService.open(overlay);
                                    });
                                } else {
                                    // remove the editor
                                    editorService.close();
                                }
                            }
                        };
                        // open property settings editor
                        editorService.open(propertySettings);
                        // set property states
                        property.dialogIsOpen = true;
                    }
                };
                scope.deleteProperty = function (tab, propertyIndex) {
                    // remove property
                    tab.properties.splice(propertyIndex, 1);
                    // if the last property in group is an placeholder - remove add new tab placeholder
                    if (tab.properties.length === 1 && tab.properties[0].propertyState === 'init') {
                        angular.forEach(scope.model.groups, function (group, index, groups) {
                            if (group.tabState === 'init') {
                                groups.splice(index, 1);
                            }
                        });
                    }
                };
                function addInitProperty(group) {
                    var addInitPropertyBool = true;
                    var initProperty = {
                        label: null,
                        alias: null,
                        propertyState: 'init',
                        validation: {
                            mandatory: false,
                            pattern: null
                        }
                    };
                    // check if there already is an init property
                    angular.forEach(group.properties, function (property) {
                        if (property.propertyState === 'init') {
                            addInitPropertyBool = false;
                        }
                    });
                    if (addInitPropertyBool) {
                        group.properties.push(initProperty);
                    }
                    return group;
                }
                function updateSameDataTypes(newProperty) {
                    // find each property
                    angular.forEach(scope.model.groups, function (group) {
                        angular.forEach(group.properties, function (property) {
                            if (property.dataTypeId === newProperty.dataTypeId) {
                                // update property data
                                property.config = newProperty.config;
                                property.editor = newProperty.editor;
                                property.view = newProperty.view;
                                property.dataTypeId = newProperty.dataTypeId;
                                property.dataTypeIcon = newProperty.dataTypeIcon;
                                property.dataTypeName = newProperty.dataTypeName;
                            }
                        });
                    });
                }
                function hasPropertyOfDataTypeId(dataTypeId) {
                    // look at each property
                    var result = _.filter(scope.model.groups, function (group) {
                        return _.filter(group.properties, function (property) {
                            return property.dataTypeId === dataTypeId;
                        });
                    });
                    return result.length > 0;
                }
                eventBindings.push(scope.$watch('model', function (newValue, oldValue) {
                    if (newValue !== undefined && newValue.groups !== undefined) {
                        activate();
                    }
                }));
                // clean up
                eventBindings.push(eventsService.on('editors.dataTypeSettings.saved', function (name, args) {
                    if (hasPropertyOfDataTypeId(args.dataType.id)) {
                        scope.dataTypeHasChanged = true;
                    }
                }));
                // clean up
                eventBindings.push(scope.$on('$destroy', function () {
                    for (var e in eventBindings) {
                        eventBindings[e]();
                    }
                    // if a dataType has changed, we want to notify which properties that are affected by this dataTypeSettings change
                    if (scope.dataTypeHasChanged === true) {
                        var args = { documentType: scope.model };
                        eventsService.emit('editors.documentType.saved', args);
                    }
                }));
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div data-element="groups-builder" class="clearfix"><umb-editor-sub-header><umb-editor-sub-header-content-right><umb-button style="margin-right: 5px;" alias="compositions" ng-if="compositions !== false" type="button" button-style="action" label-key="contentTypeEditor_compositions" icon="icon-merge" action="openCompositionsDialog()" size="xs" add-ellipsis="true"></umb-button><umb-button alias="reorder" ng-if="sorting !== false" type="button" button-style="action" label-key="{{sortingButtonKey}}" icon="icon-navigation" action="toggleSortingMode();" size="xs"></umb-button></umb-editor-sub-header-content-right></umb-editor-sub-header><div ng-if="sortingMode && model.groups.length <= 1" class="umb-group-builder__no-data-text"><localize key="contentTypeEditor_noGroups"></localize></div><ul class="umb-group-builder__groups" ui-sortable="sortableOptionsGroup" ng-model="model.groups"><li ng-repeat="tab in model.groups" ng-class="{\'umb-group-builder__group-sortable\': sortingMode}" data-element="group-{{tab.name}}"><a class="umb-group-builder__group -placeholder" hotkey="alt+shift+g" ng-click="addGroup(tab)" ng-if="tab.tabState==\'init\' && !sortingMode" data-element="group-add"><localize key="contentTypeEditor_addGroup"></localize></a><div class="umb-group-builder__group" ng-if="tab.tabState !== \'init\'" ng-class="{\'-active\':tab.tabState==\'active\', \'-inherited\': tab.inherited, \'umb-group-builder__group-handle -sortable\': sortingMode && !tab.inherited}" ng-click="activateGroup(tab)"><div class="umb-group-builder__group-title-wrapper"><ng-form name="groupNameForm" data-element="group-name"><div class="umb-group-builder__group-title control-group -no-margin" ng-class="{\'-active\':tab.tabState==\'active\', \'-inherited\': tab.inherited}"><i class="umb-group-builder__group-title-icon icon-navigation" ng-if="sortingMode && !tab.inherited"></i> <input data-element="group-name-field" class="umb-group-builder__group-title-input" type="text" localize="placeholder" placeholder="@placeholders_entername" name="groupName" ng-model="tab.name" ng-class="{\'-placeholder\': tab.name == \'\'}" ng-change="updateGroupTitle(tab)" ng-disabled="tab.inherited" umb-auto-focus umb-auto-resize ng-focus="activateGroup(tab)" required val-server-field="{{\'Groups[\' + $index + \'].Name\'}}"><div ng-messages="groupNameForm.groupName.$error" show-validation-on-submit><div class="umb-validation-label -arrow-left" ng-message="valServerField">{{groupNameForm.groupName.errorMsg}}</div><div class="umb-validation-label -arrow-left" ng-message="required"><localize key="required"></localize></div></div></div></ng-form><div class="umb-group-builder__group-inherited-label" ng-if="tab.inherited"><i class="icon icon-merge"></i><localize key="contentTypeEditor_inheritedFrom"></localize>: {{ tab.inheritedFromName }} <span ng-repeat="contentTypeName in tab.parentTabContentTypeNames"><a href="#/settings/documentTypes/edit/{{tab.parentTabContentTypes[$index]}}">{{ contentTypeName }}</a> <span ng-if="!$last">,</span></span></div><ng-form name="groupSortOrderForm" class="umb-group-builder__group-sort-order"><div ng-if="sortingMode"><input name="groupSortOrder" type="number" class="umb-property-editor-tiny" style="margin-bottom: 0;" ng-model="tab.sortOrder" ng-disabled="tab.inherited" ng-blur="changeSortOrderValue(tab)" required><div class="umb-validation-label -arrow-left" ng-if="groupSortOrderForm.groupSortOrder.$error.required && tab.showSortOrderMissing"><localize key="required"></localize></div><div ng-messages="groupSortOrderForm.groupSortOrder.$error" show-validation-on-submit><div class="umb-validation-label -arrow-left" ng-message="required"><localize key="required"></localize></div></div></div></ng-form><div class="umb-group-builder__group-remove" ng-if="!sortingMode"><i class="icon-trash" ng-click="togglePrompt(tab)"></i><umb-confirm-action ng-if="tab.deletePrompt" direction="left" on-confirm="removeGroup($index)" on-cancel="hidePrompt(tab)"></umb-confirm-action></div></div><ul class="umb-group-builder__properties" ui-sortable="sortableOptionsProperty" ng-model="tab.properties"><li data-element="property-{{property.alias}}" ng-class="{\'umb-group-builder__property-sortable\': sortingMode && !property.inherited}" ng-repeat="property in tab.properties"><a data-element="property-add" class="umb-group-builder__group-add-property" ng-if="property.propertyState==\'init\' && !sortingMode" hotkey="alt+shift+p" hotkey-when="{{tab.tabState === \'active\' && property.propertyState==\'init\'}}" ng-click="addProperty(property, tab)" ng-focus="activateGroup(tab)" focus-when="{{property.focus}}"><localize key="contentTypeEditor_addProperty"></localize></a><div class="umb-group-builder__property" ng-if="property.propertyState!==\'init\'" ng-class="{\'-active\': property.dialogIsOpen, \'-active\': property.propertyState==\'active\', \'-inherited\': property.inherited, \'-locked\': property.locked, \'umb-group-builder__property-handle -sortable\': sortingMode && !property.inherited, \'-sortable-locked\': sortingMode && property.inherited}"><div class="umb-group-builder__property-meta" ng-class="{\'-full-width\': sortingMode}"><ng-form name="propertyTypeForm"><div class="control-group -no-margin" ng-if="!sortingMode"><div class="umb-group-builder__property-meta-alias" ng-if="property.inherited || property.locked">{{ property.alias }}</div><umb-locked-field ng-if="!property.inherited && !property.locked" locked="locked" ng-model="property.alias" placeholder-text="\'Alias...\'" server-validation-field="{{\'Groups[\' + $parent.$parent.$parent.$parent.$index + \'].Properties[\' + $index + \'].Alias\'}}"></umb-locked-field><div class="umb-group-builder__property-meta-label"><textarea localize="placeholder" placeholder="@placeholders_label" ng-model="property.label" ng-disabled="property.inherited || property.locked" name="groupName" umb-auto-resize required val-server-field="{{\'Groups[\' + $parent.$parent.$parent.$parent.$index + \'].Properties[\' + $index + \'].Label\'}}">\r\n                                            </textarea><div ng-messages="propertyTypeForm.groupName.$error" show-validation-on-submit><div class="umb-validation-label" ng-message="valServerField">{{propertyTypeForm.groupName.errorMsg}}</div><div class="umb-validation-label" ng-message="required"><localize key="contentTypeEditor_requiredLabel"></localize></div></div></div><div class="umb-group-builder__property-meta-description"><textarea localize="placeholder" placeholder="@placeholders_enterDescription" ng-model="property.description" ng-disabled="property.inherited || property.locked" umb-auto-resize>\r\n                                            </textarea></div></div></ng-form><div ng-if="sortingMode" class="flex items-center"><i class="icon icon-navigation" ng-if="!property.inherited" style="margin-right: 10px;"></i> <span class="umb-group-builder__property-meta-label">{{ property.label }}</span> <span class="umb-group-builder__property-meta-alias" style="margin-bottom: 0; margin-left: 5px; margin-top: 1px;">({{ property.alias }})</span> <input name="propertySortOrder" type="number" class="umb-group-builder__group-sort-value umb-property-editor-tiny" ng-model="property.sortOrder" ng-disabled="property.inherited"></div></div><div tabindex="-1" class="umb-group-builder__property-preview" ng-if="!sortingMode" ng-class="{\'-not-clickable\': !sortingMode && (property.inherited || property.locked)}"><div class="umb-group-builder__property-tags"><span class="umb-group-builder__property-tag -white"><span ng-if="property.dataTypeName !== undefined">{{property.dataTypeName}}</span> <span ng-if="property.dataTypeName == undefined"><localize key="general_preview"></localize></span></span><div class="umb-group-builder__property-tag -white" ng-if="property.validation.mandatory"><i class="umb-group-builder__property-tag-icon">*</i><localize key="general_mandatory"></localize></div><div class="umb-group-builder__property-tag -white" ng-if="property.showOnMemberProfile"><i class="icon-eye umb-group-builder__property-tag-icon"></i><localize key="contentTypeEditor_showOnMemberProfile"></localize></div><div class="umb-group-builder__property-tag -white" ng-if="property.memberCanEdit"><i class="icon-edit umb-group-builder__property-tag-icon"></i><localize key="contentTypeEditor_memberCanEdit"></localize></div><div class="umb-group-builder__property-tag -white" ng-if="property.isSensitiveData"><i class="icon-lock umb-group-builder__property-tag-icon"></i><localize key="contentTypeEditor_isSensitiveData"></localize></div><div class="umb-group-builder__property-tag -white" ng-if="property.allowCultureVariant"><i class="icon-shuffle umb-group-builder__property-tag-icon"></i><localize key="contentTypeEditor_variantsHeading"></localize></div></div><div class="umb-group-builder__property-tags -right"><div class="umb-group-builder__property-tag" ng-if="property.inherited"><i class="icon icon-merge"></i> <span style="margin-right: 3px"><localize key="contentTypeEditor_inheritedFrom"></localize></span> {{property.contentTypeName}}</div><div class="umb-group-builder__property-tag" ng-if="property.locked"><i class="icon icon-lock"></i><localize key="general_locked"></localize></div></div><ng-form inert class="umb-group-builder__property-preview-form" name="propertyEditorPreviewForm" umb-disable-form-validation ng-click="editPropertyTypeSettings(property, tab)"><umb-property-editor ng-if="property.view !== undefined" model="property" preview="true"></umb-property-editor></ng-form><button class="umb-group-builder__open-settings" ng-if="!property.inherited && !property.locked" ng-click="editPropertyTypeSettings(property, tab)"></button></div><div class="umb-group-builder__property-actions"><div ng-if="!property.inherited"><div class="umb-group-builder__property-action"><button class="icon icon-settings" ng-click="editPropertyTypeSettings(property, tab)"></button></div><div ng-if="!property.locked" class="umb-group-builder__property-action"><button class="icon-trash" ng-click="togglePrompt(property)"></button><umb-confirm-action ng-if="property.deletePrompt" direction="left" on-confirm="deleteProperty(tab, $index)" on-cancel="hidePrompt(property)"></umb-confirm-action></div></div></div></div></li></ul></div><br></li></ul></div>',
                scope: {
                    model: '=',
                    compositions: '=',
                    sorting: '=',
                    contentType: '@'
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbGroupsBuilder', GroupsBuilderDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbkeyboardShortcutsOverview
@restrict E
@scope

@description

<p>Use this directive to show an overview of keyboard shortcuts in an editor.
The directive will render an overview trigger wich shows how the overview is opened.
When this combination is hit an overview is opened with shortcuts based on the model sent to the directive.</p>

<h3>Markup example</h3>
<pre>
    <div ng-controller="My.Controller as vm">

        <umb-keyboard-shortcuts-overview
            model="vm.keyboardShortcutsOverview">
        </umb-keyboard-shortcuts-overview>

    </div>
</pre>

<h3>Controller example</h3>
<pre>
    (function () {

        "use strict";

        function Controller() {

            var vm = this;

            vm.keyboardShortcutsOverview = [
                {
                    "name": "Sections",
                    "shortcuts": [
                        {
                            "description": "Navigate sections",
                            "keys": [
                                {"key": "1"},
                                {"key": "4"}
                            ],
                            "keyRange": true
                        }
                    ]
                },
                {
                    "name": "Design",
                    "shortcuts": [
                        {
                            "description": "Add group",
                            "keys": [
                                {"key": "alt"},
                                {"key": "shift"},
                                {"key": "g"}
                            ]
                        }
                    ]
                }
            ];

        }

        angular.module("umbraco").controller("My.Controller", Controller);
    })();
</pre>

<h3>Model description</h3>
<ul>
    <li>
        <strong>name</strong>
        <small>(string)</small> -
        Sets the shortcut section name.
    </li>
    <li>
        <strong>shortcuts</strong>
        <small>(array)</small> -
        Array of available shortcuts in the section.
    </li>
    <ul>
        <li>
            <strong>description</strong>
            <small>(string)</small> -
            Short description of the shortcut.
        </li>
        <li>
            <strong>keys</strong>
            <small>(array)</small> -
            Array of keys in the shortcut.
        </li>
        <ul>
            <li>
                <strong>key</strong>
                <small>(string)</small> -
                The invidual key in the shortcut.
            </li>
        </ul>
        <li>
            <strong>keyRange</strong>
            <small>(boolean)</small> -
            Set to <code>true</code> to show a key range. It combines the shortcut keys with "-" instead of "+".
        </li>
    </ul>
</ul>

@param {object} model keyboard shortcut model. See description and example above.
**/
    (function () {
        'use strict';
        function KeyboardShortcutsOverviewDirective(platformService, overlayService) {
            function link(scope, el, attr, ctrl) {
                var eventBindings = [];
                var isMac = platformService.isMac();
                var overlay = null;
                scope.toggleShortcutsOverlay = function () {
                    if (overlay) {
                        scope.close();
                    } else {
                        scope.open();
                    }
                    if (scope.onToggle) {
                        scope.onToggle();
                    }
                };
                scope.open = function () {
                    if (!overlay) {
                        overlay = {
                            title: 'Keyboard shortcuts',
                            view: 'keyboardshortcuts',
                            hideSubmitButton: true,
                            shortcuts: scope.model,
                            close: function close() {
                                scope.close();
                            }
                        };
                        overlayService.open(overlay);
                    }
                };
                scope.close = function () {
                    if (overlay) {
                        overlayService.close();
                        overlay = null;
                        if (scope.onClose) {
                            scope.onClose();
                        }
                    }
                };
                function onInit() {
                    angular.forEach(scope.model, function (shortcutGroup) {
                        angular.forEach(shortcutGroup.shortcuts, function (shortcut) {
                            shortcut.platformKeys = [];
                            // get shortcut keys for mac
                            if (isMac && shortcut.keys && shortcut.keys.mac) {
                                shortcut.platformKeys = shortcut.keys.mac;    // get shortcut keys for windows
                            } else if (!isMac && shortcut.keys && shortcut.keys.win) {
                                shortcut.platformKeys = shortcut.keys.win;    // get default shortcut keys
                            } else if (shortcut.keys && shortcut && shortcut.keys.length > 0) {
                                shortcut.platformKeys = shortcut.keys;
                            }
                        });
                    });
                }
                onInit();
                eventBindings.push(scope.$watch('model', function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        onInit();
                    }
                }));
                eventBindings.push(scope.$watch('showOverlay', function (newValue, oldValue) {
                    if (newValue === oldValue) {
                        return;
                    }
                    if (newValue === true) {
                        scope.open();
                    }
                    if (newValue === false) {
                        scope.close();
                    }
                }));
                // clean up
                scope.$on('$destroy', function () {
                    // unbind watchers
                    for (var e in eventBindings) {
                        eventBindings[e]();
                    }
                });
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-keyboard-shortcuts-overview flex items-center" data-hotkey="alt+shift+k" ng-click="toggleShortcutsOverlay()"><div class="umb-keyboard-shortcuts-overview__description"><localize key="shortcuts_showShortcuts">show shortcuts</localize></div><div class="umb-keyboard-keys"><div class="umb-keyboard-key-wrapper"><div class="umb-keyboard-key">alt</div><div>+</div></div><div class="umb-keyboard-key-wrapper"><div class="umb-keyboard-key">shift</div><div>+</div></div><div class="umb-keyboard-key-wrapper"><div class="umb-keyboard-key">k</div></div></div></div>',
                link: link,
                scope: {
                    model: '=',
                    onToggle: '&',
                    showOverlay: '=?',
                    onClose: '&'
                }
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbKeyboardShortcutsOverview', KeyboardShortcutsOverviewDirective);
    }());
    'use strict';
    (function () {
        'use strict';
        angular.module('umbraco.directives').component('umbLayoutSelector', {
            template: '<div class="umb-layout-selector" ng-show="vm.showLayoutSelector"><div class="umb-layout-selector__active-layout" ng-click="vm.toggleLayoutDropdown()"><i class="{{ vm.activeLayout.icon }}"></i></div><div ng-if="vm.layoutDropDownIsOpen" class="umb-layout-selector__dropdown shadow-depth-3 animated -half-second fadeIn" on-outside-click="vm.closeLayoutDropdown()"><div ng-repeat="layout in vm.layouts | filter:{selected:true} track by $id(layout)" class="umb-layout-selector__dropdown-item" ng-click="vm.pickLayout(layout)" ng-class="{\'-active\': layout.active }" ng-attr-title="{{layout.name}}"><i class="{{ layout.icon }} umb-layout-selector__dropdown-item-icon"></i></div></div></div>',
            controller: LayoutSelectorController,
            controllerAs: 'vm',
            bindings: {
                layouts: '<',
                activeLayout: '<',
                onLayoutSelect: '&'
            }
        });
        function LayoutSelectorController($scope, $element) {
            var vm = this;
            vm.$onInit = onInit;
            vm.layoutDropDownIsOpen = false;
            vm.showLayoutSelector = true;
            vm.pickLayout = pickLayout;
            vm.toggleLayoutDropdown = toggleLayoutDropdown;
            vm.closeLayoutDropdown = closeLayoutDropdown;
            function onInit() {
                activate();
            }
            function closeLayoutDropdown() {
                vm.layoutDropDownIsOpen = false;
            }
            function toggleLayoutDropdown() {
                vm.layoutDropDownIsOpen = !vm.layoutDropDownIsOpen;
            }
            function pickLayout(selectedLayout) {
                if (vm.onLayoutSelect) {
                    vm.onLayoutSelect({ layout: selectedLayout });
                    vm.layoutDropDownIsOpen = false;
                }
            }
            function activate() {
                setVisibility();
                setActiveLayout(vm.layouts);
            }
            function setVisibility() {
                var numberOfAllowedLayouts = getNumberOfAllowedLayouts(vm.layouts);
                if (numberOfAllowedLayouts === 1) {
                    vm.showLayoutSelector = false;
                }
            }
            function getNumberOfAllowedLayouts(layouts) {
                var allowedLayouts = 0;
                for (var i = 0; layouts.length > i; i++) {
                    var layout = layouts[i];
                    if (layout.selected === true) {
                        allowedLayouts++;
                    }
                }
                return allowedLayouts;
            }
            function setActiveLayout(layouts) {
                for (var i = 0; layouts.length > i; i++) {
                    var layout = layouts[i];
                    if (layout.path === vm.activeLayout.path) {
                        layout.active = true;
                    }
                }
            }
        }
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbLightbox
@restrict E
@scope

@description
<p>Use this directive to open a gallery in a lightbox overlay.</p>

<h3>Markup example</h3>
<pre>
    <div ng-controller="My.Controller as vm">

        <div class="my-gallery">
            <a href="" ng-repeat="image in images" ng-click="vm.openLightbox($index, images)">
                <img ng-src="image.source" />
            </a>
        </div>

        <umb-lightbox
            ng-if="vm.lightbox.show"
            items="vm.lightbox.items"
            active-item-index="vm.lightbox.activeIndex"
            on-close="vm.closeLightbox">
        </umb-lightbox>

    </div>
</pre>

<h3>Controller example</h3>
<pre>
    (function () {

        "use strict";

        function Controller() {

            var vm = this;

            vm.images = [
                {
                    "source": "linkToImage"
                },
                {
                    "source": "linkToImage"
                }
            ]

            vm.openLightbox = openLightbox;
            vm.closeLightbox = closeLightbox;

            function openLightbox(itemIndex, items) {
                vm.lightbox = {
                    show: true,
                    items: items,
                    activeIndex: itemIndex
                };
            }

            function closeLightbox() {
                vm.lightbox.show = false;
                vm.lightbox = null;
            }

        }

        angular.module("umbraco").controller("My.Controller", Controller);
    })();
</pre>

@param {array} items Array of gallery items.
@param {callback} onClose Callback when the lightbox is closed.
@param {number} activeItemIndex Index of active item.
**/
    (function () {
        'use strict';
        function LightboxDirective() {
            function link(scope, el, attr, ctrl) {
                function activate() {
                    var eventBindings = [];
                    el.appendTo('body');
                    // clean up
                    scope.$on('$destroy', function () {
                        // unbind watchers
                        for (var e in eventBindings) {
                            eventBindings[e]();
                        }
                    });
                }
                scope.next = function () {
                    var nextItemIndex = scope.activeItemIndex + 1;
                    if (nextItemIndex < scope.items.length) {
                        scope.items[scope.activeItemIndex].active = false;
                        scope.items[nextItemIndex].active = true;
                        scope.activeItemIndex = nextItemIndex;
                    }
                };
                scope.prev = function () {
                    var prevItemIndex = scope.activeItemIndex - 1;
                    if (prevItemIndex >= 0) {
                        scope.items[scope.activeItemIndex].active = false;
                        scope.items[prevItemIndex].active = true;
                        scope.activeItemIndex = prevItemIndex;
                    }
                };
                scope.close = function () {
                    if (scope.onClose) {
                        scope.onClose();
                    }
                };
                activate();
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-lightbox"><div class="umb-lightbox__backdrop" ng-click="close()" hotkey="esc"></div><div class="umb-lightbox__close" title="Close" ng-click="close()"><i class="icon-delete umb-lightbox__control"></i></div><div class="umb-lightbox__images"><div class="umb-lightbox__image shadow-depth-2" ng-repeat="item in items" ng-show="$index === activeItemIndex"><img ng-src="{{ item.source }}"></div></div><div class="umb-lightbox__control -prev" title="Previous" ng-if="activeItemIndex > 0" ng-click="prev()" hotkey="left"><i class="icon-previous umb-lightbox__control-icon"></i></div><div class="umb-lightbox__control -next" title="Next" ng-if="activeItemIndex + 1 < items.length" ng-click="next()" hotkey="right"><i class="icon-next umb-lightbox__control-icon"></i></div></div>',
                scope: {
                    items: '=',
                    onClose: '=',
                    activeItemIndex: '='
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbLightbox', LightboxDirective);
    }());
    'use strict';
    (function () {
        'use strict';
        function ListViewLayoutDirective() {
            function link(scope, el, attr, ctrl) {
                scope.getContent = function (contentId) {
                    if (scope.onGetContent) {
                        scope.onGetContent({ contentId: contentId });
                    }
                };
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div><div ng-include="options.layout.activeLayout.path"></div></div>',
                scope: {
                    contentId: '<',
                    folders: '<',
                    items: '<',
                    selection: '<',
                    options: '<',
                    entityType: '@',
                    onGetContent: '&'
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbListViewLayout', ListViewLayoutDirective);
    }());
    'use strict';
    (function () {
        'use strict';
        function ListViewSettingsDirective(dataTypeResource, dataTypeHelper, listViewPrevalueHelper) {
            function link(scope) {
                scope.dataType = {};
                scope.editDataTypeSettings = false;
                scope.customListViewCreated = false;
                /* ---------- INIT ---------- */
                function activate() {
                    if (scope.enableListView) {
                        dataTypeResource.getByName(scope.listViewName).then(function (dataType) {
                            scope.dataType = dataType;
                            listViewPrevalueHelper.setPrevalues(dataType.preValues);
                            scope.customListViewCreated = checkForCustomListView();
                        });
                    } else {
                        scope.dataType = {};
                    }
                }
                /* ----------- LIST VIEW SETTINGS --------- */
                scope.toggleEditListViewDataTypeSettings = function () {
                    scope.editDataTypeSettings = !scope.editDataTypeSettings;
                };
                scope.saveListViewDataType = function () {
                    var preValues = dataTypeHelper.createPreValueProps(scope.dataType.preValues);
                    dataTypeResource.save(scope.dataType, preValues, false).then(function (dataType) {
                        // store data type
                        scope.dataType = dataType;
                        // hide settings panel
                        scope.editDataTypeSettings = false;
                    });
                };
                /* ---------- CUSTOM LIST VIEW ---------- */
                scope.createCustomListViewDataType = function () {
                    dataTypeResource.createCustomListView(scope.modelAlias).then(function (dataType) {
                        // store data type
                        scope.dataType = dataType;
                        // set list view name on scope
                        scope.listViewName = dataType.name;
                        // change state to custom list view
                        scope.customListViewCreated = true;
                        // show settings panel
                        scope.editDataTypeSettings = true;
                    });
                };
                scope.removeCustomListDataType = function () {
                    scope.editDataTypeSettings = false;
                    // delete custom list view data type
                    dataTypeResource.deleteById(scope.dataType.id).then(function (dataType) {
                        // set list view name on scope
                        if (scope.contentType === 'documentType') {
                            scope.listViewName = 'List View - Content';
                        } else if (scope.contentType === 'mediaType') {
                            scope.listViewName = 'List View - Media';
                        }
                        // get default data type
                        dataTypeResource.getByName(scope.listViewName).then(function (dataType) {
                            // store data type
                            scope.dataType = dataType;
                            // change state to default list view
                            scope.customListViewCreated = false;
                        });
                    });
                };
                scope.toggle = function () {
                    if (scope.enableListView) {
                        scope.enableListView = false;
                        return;
                    }
                    scope.enableListView = true;
                };
                /* ----------- SCOPE WATCHERS ----------- */
                var unbindEnableListViewWatcher = scope.$watch('enableListView', function (newValue) {
                    if (newValue !== undefined) {
                        activate();
                    }
                });
                // clean up
                scope.$on('$destroy', function () {
                    unbindEnableListViewWatcher();
                });
                /* ----------- METHODS ---------- */
                function checkForCustomListView() {
                    return scope.dataType.name === 'List View - ' + scope.modelAlias;
                }
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-list-view-settings"><div class="umb-list-view-settings__trigger"><umb-toggle checked="enableListView" on-click="toggle()" hotkey="alt+shift+l"></umb-toggle></div><div ng-if="enableListView"><div class="umb-list-view-settings__box" ng-class="{\'-open\': editDataTypeSettings}"><div class="umb-list-view-settings__content"><i class="umb-list-view-settings__list-view-icon icon-list"></i><div><div><div class="umb-list-view-settings__name">{{ dataType.name }} <em ng-if="!customListViewCreated">(<localize key="general_default">default</localize>)</em></div><a ng-click="toggleEditListViewDataTypeSettings()"><i class="umb-list-view-settings__settings-icon icon-settings"></i></a></div><a class="umb-list-view-settings__create-new" ng-if="!customListViewCreated" ng-click="createCustomListViewDataType()"><localize key="editcontenttype_createListView">Create custom list view</localize></a> <a class="umb-list-view-settings__remove-new" ng-if="customListViewCreated" ng-click="removeCustomListDataType()"><localize key="editcontenttype_removeListView">Remove custom list view</localize></a></div></div></div><div class="umb-list-view-settings__settings form-horizontal" ng-if="editDataTypeSettings" ng-class="{\'-open\': editDataTypeSettings}"><umb-property property="preValue" ng-repeat="preValue in dataType.preValues"><umb-property-editor model="preValue" is-pre-value="true"></umb-property-editor></umb-property><div class="text-right"><button type="button" class="btn btn-link" ng-click="toggleEditListViewDataTypeSettings()"><localize key="general_close">Close</localize></button> <button type="button" class="btn btn-success" ng-click="saveListViewDataType()"><localize key="buttons_saveListView"></localize></button></div></div></div></div>',
                scope: {
                    enableListView: '=',
                    listViewName: '=',
                    modelAlias: '=',
                    contentType: '@'
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbListViewSettings', ListViewSettingsDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbLoadIndicator
@restrict E

@description
Use this directive to generate a loading indicator.

<h3>Markup example</h3>
<pre>
    <div ng-controller="My.Controller as vm">

        <umb-load-indicator
            ng-if="vm.loading">
        </umb-load-indicator>

        <div class="content" ng-if="!vm.loading">
            <p>{{content}}</p>
        </div>

    </div>
</pre>

<h3>Controller example</h3>
<pre>
    (function () {
        "use strict";

        function Controller(myService) {

            var vm = this;

            vm.content = "";
            vm.loading = true;

            myService.getContent().then(function(content){
                vm.content = content;
                vm.loading = false;
            });

        }
½
        angular.module("umbraco").controller("My.Controller", Controller);
    })();
</pre>
**/
    (function () {
        'use strict';
        function UmbLoadIndicatorDirective() {
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<ul class="umb-load-indicator animated -half-second"><li class="umb-load-indicator__bubble"></li><li class="umb-load-indicator__bubble"></li><li class="umb-load-indicator__bubble"></li></ul>'
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbLoadIndicator', UmbLoadIndicatorDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbLockedField
@restrict E
@scope

@description
Use this directive to render a value with a lock next to it. When the lock is clicked the value gets unlocked and can be edited.

<h3>Markup example</h3>
<pre>
	<div ng-controller="My.Controller as vm">

		<umb-locked-field
			ng-model="vm.value"
			placeholder-text="'Click to unlock...'">
		</umb-locked-field>

	</div>
</pre>

<h3>Controller example</h3>
<pre>
	(function () {
		"use strict";

		function Controller() {

			var vm = this;
			vm.value = "My locked text";

        }

		angular.module("umbraco").controller("My.Controller", Controller);

	})();
</pre>

@param {string} ngModel (<code>binding</code>): The locked text.
@param {boolean=} locked (<code>binding</code>): <Code>true</code> by default. Set to <code>false</code> to unlock the text.
@param {string=} placeholderText (<code>binding</code>): If ngModel is empty this text will be shown.
@param {string=} regexValidation (<code>binding</code>): Set a regex expression for validation of the field.
@param {string} validationPosition (<code>binding</code>): The position of the validation. Set to <code>'left'</code> or <code>'right'</code>.
@param {string=} serverValidationField (<code>attribute</code>): Set a server validation field.
**/
    (function () {
        'use strict';
        function LockedFieldDirective($timeout, localizationService) {
            function link(scope, el, attr, ngModelCtrl) {
                function activate() {
                    // if locked state is not defined as an attr set default state
                    if (scope.locked === undefined || scope.locked === null) {
                        scope.locked = true;
                    }
                    // if regex validation is not defined as an attr set default state
                    // if this is set to an empty string then regex validation can be ignored.
                    if (scope.regexValidation === undefined || scope.regexValidation === null) {
                        scope.regexValidation = '^[a-zA-Z]\\w.*$';
                    }
                    if (scope.serverValidationField === undefined || scope.serverValidationField === null) {
                        scope.serverValidationField = '';
                    }
                    // if locked state is not defined as an attr set default state
                    if (scope.placeholderText === undefined || scope.placeholderText === null) {
                        scope.placeholderText = 'Enter value...';
                    }
                    if (scope.validationPosition === undefined || scope.validationPosition === null) {
                        scope.validationPosition = 'left';
                    }
                }
                scope.lock = function () {
                    scope.locked = true;
                };
                scope.unlock = function () {
                    scope.locked = false;
                };
                activate();
            }
            var directive = {
                require: 'ngModel',
                restrict: 'E',
                replace: true,
                template: '<ng-form name="lockedFieldForm" class="umb-locked-field"><div class="umb-locked-field__wrapper"><a ng-if="locked" ng-click="unlock()" class="umb-locked-field__toggle"><i class="umb-locked-field__lock-icon icon-lock"></i></a> <a ng-if="!locked" ng-click="lock()" class="umb-locked-field__toggle"><i class="umb-locked-field__lock-icon icon-unlocked -unlocked"></i></a> <input type="text" no-password-manager class="umb-locked-field__input" name="lockedField" ng-model="ngModel" ng-disabled="locked" ng-class="{\'-unlocked\': !locked}" placeholder="{{placeholderText}}" val-regex="{{regexValidation}}" umb-auto-resize required val-server-field="{{serverValidationField}}" title="{{ngModel}}" focus-when="{{!locked}}" umb-select-when="{{!locked}}" ng-blur="lock()"></div><div ng-messages="lockedFieldForm.lockedField.$error" show-validation-on-submit><div class="umb-validation-label" ng-class="{ \'-left\': validationPosition === \'left\', \'-right\': validationPosition === \'right\' }" ng-message="required"><localize key="general_required">Required</localize><localize key="content_alias">alias</localize></div><div class="umb-validation-label" ng-class="{ \'-left\': validationPosition === \'left\', \'-right\': validationPosition === \'right\' }" ng-if="regexValidation.length > 0" ng-message="valRegex"><localize key="general_invalid">Invalid</localize><localize key="content_alias">alias</localize></div><div class="umb-validation-label" ng-class="{ \'-left\': validationPosition === \'left\', \'-right\': validationPosition === \'right\' }" ng-if="serverValidationField.length > 0" ng-message="valServerField">{{lockedFieldForm.lockedField.errorMsg}}</div></div></ng-form>',
                scope: {
                    ngModel: '=',
                    locked: '=?',
                    placeholderText: '=?',
                    regexValidation: '=?',
                    validationPosition: '=?',
                    serverValidationField: '@'
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbLockedField', LockedFieldDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbMediaGrid
@restrict E
@scope

@description
Use this directive to generate a thumbnail grid of media items.

<h3>Markup example</h3>
<pre>
    <div ng-controller="My.Controller as vm">

        <umb-media-grid
           items="vm.mediaItems"
           on-click="vm.clickItem"
           on-click-name="vm.clickItemName">
        </umb-media-grid>

    </div>
</pre>

<h3>Controller example</h3>
<pre>
    (function () {
        "use strict";

        function Controller() {

            var vm = this;
            vm.mediaItems = [];

            vm.clickItem = clickItem;
            vm.clickItemName = clickItemName;

            myService.getMediaItems().then(function (mediaItems) {
                vm.mediaItems = mediaItems;
            });

            function clickItem(item, $event, $index){
                // do magic here
            }

            function clickItemName(item, $event, $index) {
                // set item.selected = true; to select the item
                // do magic here
            }

        }

        angular.module("umbraco").controller("My.Controller", Controller);
    })();
</pre>

@param {array} items (<code>binding</code>): Array of media items.
@param {callback=} onDetailsHover (<code>binding</code>): Callback method when the details icon is hovered.
    <h3>The callback returns:</h3>
    <ul>
        <li><code>item</code>: The hovered item</li>
        <li><code>$event</code>: The hover event</li>
        <li><code>hover</code>: Boolean to tell if the item is hovered or not</li>
    </ul>
@param {callback=} onClick (<code>binding</code>): Callback method to handle click events on the media item.
    <h3>The callback returns:</h3>
    <ul>
        <li><code>item</code>: The clicked item</li>
        <li><code>$event</code>: The click event</li>
        <li><code>$index</code>: The item index</li>
    </ul>
@param {callback=} onClickName (<code>binding</code>): Callback method to handle click events on the media item name.
    <h3>The callback returns:</h3>
    <ul>
        <li><code>item</code>: The clicked item</li>
        <li><code>$event</code>: The click event</li>
        <li><code>$index</code>: The item index</li>
    </ul>
@param {string=} filterBy (<code>binding</code>): String to filter media items by
@param {string=} itemMaxWidth (<code>attribute</code>): Sets a max width on the media item thumbnails.
@param {string=} itemMaxHeight (<code>attribute</code>): Sets a max height on the media item thumbnails.
@param {string=} itemMinWidth (<code>attribute</code>): Sets a min width on the media item thumbnails.
@param {string=} itemMinHeight (<code>attribute</code>): Sets a min height on the media item thumbnails.

**/
    (function () {
        'use strict';
        function MediaGridDirective($filter, mediaHelper) {
            function link(scope, el, attr, ctrl) {
                var itemDefaultHeight = 200;
                var itemDefaultWidth = 200;
                var itemMaxWidth = 200;
                var itemMaxHeight = 200;
                var itemMinWidth = 125;
                var itemMinHeight = 125;
                function activate() {
                    if (scope.itemMaxWidth) {
                        itemMaxWidth = scope.itemMaxWidth;
                    }
                    if (scope.itemMaxHeight) {
                        itemMaxHeight = scope.itemMaxHeight;
                    }
                    if (scope.itemMinWidth) {
                        itemMinWidth = scope.itemMinWidth;
                    }
                    if (scope.itemMinHeight) {
                        itemMinHeight = scope.itemMinHeight;
                    }
                    for (var i = 0; scope.items.length > i; i++) {
                        var item = scope.items[i];
                        setItemData(item);
                        setOriginalSize(item, itemMaxHeight);
                        // remove non images when onlyImages is set to true
                        if (scope.onlyImages === 'true' && !item.isFolder && !item.thumbnail) {
                            scope.items.splice(i, 1);
                            i--;
                        }
                        // If subfolder search is not enabled remove the media items that's not needed
                        // Make sure that includeSubFolder is not undefined since the directive is used
                        // in contexts where it should not be used. Currently only used when we trigger
                        // a media picker
                        if (scope.includeSubFolders !== undefined) {
                            if (scope.includeSubFolders !== 'true') {
                                if (item.parentId !== parseInt(scope.currentFolderId)) {
                                    scope.items.splice(i, 1);
                                    i--;
                                }
                            }
                        }
                    }
                    if (scope.items.length > 0) {
                        setFlexValues(scope.items);
                    }
                }
                function setItemData(item) {
                    // check if item is a folder
                    if (item.image) {
                        // if is has an image path, it is not a folder
                        item.isFolder = false;
                    } else {
                        item.isFolder = !mediaHelper.hasFilePropertyType(item);
                    }
                    // if it's not a folder, get the thumbnail, extension etc. if we haven't already
                    if (!item.isFolder && !item.thumbnail) {
                        // handle entity
                        if (item.image) {
                            item.thumbnail = mediaHelper.resolveFileFromEntity(item, true);
                            item.extension = mediaHelper.getFileExtension(item.image);    // handle full media object
                        } else {
                            item.thumbnail = mediaHelper.resolveFile(item, true);
                            item.image = mediaHelper.resolveFile(item, false);
                            var fileProp = _.find(item.properties, function (v) {
                                return v.alias === 'umbracoFile';
                            });
                            if (fileProp && fileProp.value) {
                                item.file = fileProp.value;
                            }
                            var extensionProp = _.find(item.properties, function (v) {
                                return v.alias === 'umbracoExtension';
                            });
                            if (extensionProp && extensionProp.value) {
                                item.extension = extensionProp.value;
                            }
                        }
                    }
                }
                function setOriginalSize(item, maxHeight) {
                    //set to a square by default
                    item.width = itemDefaultWidth;
                    item.height = itemDefaultHeight;
                    item.aspectRatio = 1;
                    var widthProp = _.find(item.properties, function (v) {
                        return v.alias === 'umbracoWidth';
                    });
                    if (widthProp && widthProp.value) {
                        item.width = parseInt(widthProp.value, 10);
                        if (isNaN(item.width)) {
                            item.width = itemDefaultWidth;
                        }
                    }
                    var heightProp = _.find(item.properties, function (v) {
                        return v.alias === 'umbracoHeight';
                    });
                    if (heightProp && heightProp.value) {
                        item.height = parseInt(heightProp.value, 10);
                        if (isNaN(item.height)) {
                            item.height = itemDefaultWidth;
                        }
                    }
                    item.aspectRatio = item.width / item.height;
                    // set max width and height
                    // landscape
                    if (item.aspectRatio >= 1) {
                        if (item.width > itemMaxWidth) {
                            item.width = itemMaxWidth;
                            item.height = itemMaxWidth / item.aspectRatio;
                        }    // portrait
                    } else {
                        if (item.height > itemMaxHeight) {
                            item.height = itemMaxHeight;
                            item.width = itemMaxHeight * item.aspectRatio;
                        }
                    }
                }
                function setFlexValues(mediaItems) {
                    var flexSortArray = mediaItems;
                    var smallestImageWidth = null;
                    var widestImageAspectRatio = null;
                    // sort array after image width with the widest image first
                    flexSortArray = $filter('orderBy')(flexSortArray, 'width', true);
                    // find widest image aspect ratio
                    widestImageAspectRatio = flexSortArray[0].aspectRatio;
                    // find smallest image width
                    smallestImageWidth = flexSortArray[flexSortArray.length - 1].width;
                    for (var i = 0; flexSortArray.length > i; i++) {
                        var mediaItem = flexSortArray[i];
                        var flex = 1 / (widestImageAspectRatio / mediaItem.aspectRatio);
                        if (flex === 0) {
                            flex = 1;
                        }
                        var imageMinFlexWidth = smallestImageWidth * flex;
                        var flexStyle = {
                            'flex': flex + ' 1 ' + imageMinFlexWidth + 'px',
                            'max-width': mediaItem.width + 'px',
                            'min-width': itemMinWidth + 'px',
                            'min-height': itemMinHeight + 'px'
                        };
                        mediaItem.flexStyle = flexStyle;
                    }
                }
                scope.clickItem = function (item, $event, $index) {
                    if (scope.onClick) {
                        scope.onClick(item, $event, $index);
                        $event.stopPropagation();
                    }
                };
                scope.clickItemName = function (item, $event, $index) {
                    if (scope.onClickName) {
                        scope.onClickName(item, $event, $index);
                        $event.stopPropagation();
                    }
                };
                scope.hoverItemDetails = function (item, $event, hover) {
                    if (scope.onDetailsHover) {
                        scope.onDetailsHover(item, $event, hover);
                    }
                };
                scope.clickEdit = function (item, $event) {
                    if (scope.onClickEdit) {
                        scope.onClickEdit({ 'item': item });
                        $event.stopPropagation();
                    }
                };
                var unbindItemsWatcher = scope.$watch('items', function (newValue, oldValue) {
                    if (angular.isArray(newValue)) {
                        activate();
                    }
                });
                scope.$on('$destroy', function () {
                    unbindItemsWatcher();
                });
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div data-element="media-grid" class="umb-media-grid"><div data-element="media-grid-item-{{$index}}" class="umb-media-grid__item" title="{{item.name}}" ng-click="clickItem(item, $event, $index)" ng-repeat="item in items | filter:filterBy" ng-style="item.flexStyle" ng-class="{\'-selected\': item.selected, \'-file\': !item.thumbnail, \'-svg\': item.extension == \'svg\'}"><div><a ng-if="allowOnClickEdit === \'true\'" ng-click="clickEdit(item, $event)" ng-href class="icon-edit umb-media-grid__edit"></a><div data-element="media-grid-item-edit" class="umb-media-grid__item-overlay" ng-class="{\'-locked\': item.selected || !item.file || !item.thumbnail}" ng-click="clickItemName(item, $event, $index)"><i ng-if="onDetailsHover" class="icon-info umb-media-grid__info" ng-mouseover="hoverItemDetails(item, $event, true)" ng-mouseleave="hoverItemDetails(item, $event, false)"></i><div class="umb-media-grid__item-name">{{item.name}}</div></div><div class="umb-media-grid__image-background" ng-if="item.thumbnail || item.extension == \'svg\'"></div><img class="umb-media-grid__item-image" width="{{item.width}}" height="{{item.height}}" ng-if="item.thumbnail" ng-src="{{item.thumbnail}}" alt="{{item.name}}" draggable="false"><img class="umb-media-grid__item-image" width="{{item.width}}" height="{{item.height}}" ng-if="!item.thumbnail && item.extension == \'svg\'" ng-src="{{item.image}}" alt="{{item.name}}" draggable="false"><img class="umb-media-grid__item-image-placeholder" ng-if="!item.thumbnail && item.extension != \'svg\'" src="assets/img/transparent.png" alt="{{item.name}}" draggable="false"><span class="umb-media-grid__item-file-icon" ng-if="!item.thumbnail && item.extension != \'svg\'"><i class="umb-media-grid__item-icon {{item.icon}}"></i> <span ng-if="item.extension">.{{item.extension}}</span></span></div></div></div>',
                scope: {
                    items: '=',
                    onDetailsHover: '=',
                    onClick: '=',
                    onClickName: '=',
                    onClickEdit: '&?',
                    allowOnClickEdit: '@?',
                    filterBy: '=',
                    itemMaxWidth: '@',
                    itemMaxHeight: '@',
                    itemMinWidth: '@',
                    itemMinHeight: '@',
                    onlyImages: '@',
                    includeSubFolders: '@',
                    currentFolderId: '@'
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbMediaGrid', MediaGridDirective);
    }());
    'use strict';
    (function () {
        'use strict';
        function MiniListViewDirective(entityResource, iconHelper) {
            function link(scope, el, attr, ctrl) {
                scope.search = '';
                scope.miniListViews = [];
                scope.breadcrumb = [];
                scope.listViewAnimation = '';
                var miniListViewsHistory = [];
                function onInit() {
                    open(scope.node);
                }
                function open(node) {
                    // convert legacy icon for node
                    if (node && node.icon) {
                        node.icon = iconHelper.convertFromLegacyIcon(node.icon);
                    }
                    var miniListView = {
                        node: node,
                        loading: true,
                        pagination: {
                            pageSize: 10,
                            pageNumber: 1,
                            filter: '',
                            orderDirection: 'Ascending',
                            orderBy: 'SortOrder',
                            orderBySystemField: true
                        }
                    };
                    // clear and push mini list view in dom so we only render 1 view
                    scope.miniListViews = [];
                    scope.listViewAnimation = 'in';
                    scope.miniListViews.push(miniListView);
                    // store in history so we quickly can navigate back
                    miniListViewsHistory.push(miniListView);
                    // get children
                    getChildrenForMiniListView(miniListView);
                    makeBreadcrumb();
                }
                function getChildrenForMiniListView(miniListView) {
                    // start loading animation list view
                    miniListView.loading = true;
                    entityResource.getPagedChildren(miniListView.node.id, scope.entityType, miniListView.pagination).then(function (data) {
                        // update children
                        miniListView.children = data.items;
                        _.each(miniListView.children, function (c) {
                            // child allowed by default
                            c.allowed = true;
                            // convert legacy icon for node
                            if (c.icon) {
                                c.icon = iconHelper.convertFromLegacyIcon(c.icon);
                            }
                            // set published state for content
                            if (c.metaData) {
                                c.hasChildren = c.metaData.hasChildren;
                                if (scope.entityType === 'Document') {
                                    c.published = c.metaData.IsPublished;
                                }
                            }
                            // filter items if there is a filter and it's not advanced
                            // ** ignores advanced filter at the moment
                            if (scope.entityTypeFilter && scope.entityTypeFilter.filter && !scope.entityTypeFilter.filterAdvanced) {
                                var a = scope.entityTypeFilter.filter.toLowerCase().replace(/\s/g, '').split(',');
                                var found = a.indexOf(c.metaData.ContentTypeAlias.toLowerCase()) >= 0;
                                if (!scope.entityTypeFilter.filterExclude && !found || scope.entityTypeFilter.filterExclude && found) {
                                    c.allowed = false;
                                }
                            }
                        });
                        // update pagination
                        miniListView.pagination.totalItems = data.totalItems;
                        miniListView.pagination.totalPages = data.totalPages;
                        // stop load indicator
                        miniListView.loading = false;
                    });
                }
                scope.openNode = function (event, node) {
                    open(node);
                    event.stopPropagation();
                };
                scope.selectNode = function (node) {
                    if (scope.onSelect && node.allowed) {
                        scope.onSelect({ 'node': node });
                    }
                };
                /* Pagination */
                scope.goToPage = function (pageNumber, miniListView) {
                    // set new page number
                    miniListView.pagination.pageNumber = pageNumber;
                    // get children
                    getChildrenForMiniListView(miniListView);
                };
                /* Breadcrumb */
                scope.clickBreadcrumb = function (ancestor) {
                    var found = false;
                    scope.listViewAnimation = 'out';
                    angular.forEach(miniListViewsHistory, function (historyItem, index) {
                        // We need to make sure we can compare the two id's. 
                        // Some id's are integers and others are strings.
                        // Members have string ids like "all-members".
                        if (historyItem.node.id.toString() === ancestor.id.toString()) {
                            // load the list view from history
                            scope.miniListViews = [];
                            scope.miniListViews.push(historyItem);
                            // clean up history - remove all children after
                            miniListViewsHistory.splice(index + 1, miniListViewsHistory.length);
                            found = true;
                        }
                    });
                    if (!found) {
                        // if we can't find the view in the history - close the list view
                        scope.exitMiniListView();
                    }
                    // update the breadcrumb
                    makeBreadcrumb();
                };
                scope.showBackButton = function () {
                    // don't show the back button if the start node is a list view
                    if (scope.node.metaData && scope.node.metaData.IsContainer || scope.node.isContainer) {
                        return false;
                    } else {
                        return true;
                    }
                };
                scope.exitMiniListView = function () {
                    miniListViewsHistory = [];
                    scope.miniListViews = [];
                    if (scope.onClose) {
                        scope.onClose();
                    }
                };
                function makeBreadcrumb() {
                    scope.breadcrumb = [];
                    angular.forEach(miniListViewsHistory, function (historyItem) {
                        scope.breadcrumb.push(historyItem.node);
                    });
                }
                /* Search */
                scope.searchMiniListView = function (search, miniListView) {
                    // set search value
                    miniListView.pagination.filter = search;
                    // reset pagination
                    miniListView.pagination.pageNumber = 1;
                    // start loading animation list view
                    miniListView.loading = true;
                    searchMiniListView(miniListView);
                };
                var searchMiniListView = _.debounce(function (miniListView) {
                    scope.$apply(function () {
                        getChildrenForMiniListView(miniListView);
                    });
                }, 500);
                onInit();
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-minilistview"><div class="umb-mini-list-view umb-animated" ng-class="{\'umb-mini-list-view--forward\': listViewAnimation === \'in\', \'umb-mini-list-view--backwards\': listViewAnimation === \'out\'}" ng-repeat="miniListView in miniListViews"><div class="umb-mini-list-view__title"><i class="umb-mini-list-view__title-icon {{ miniListView.node.icon }}"></i><h4 class="umb-mini-list-view__title-text">{{ miniListView.node.name }}</h4></div><div class="flex" style="margin-bottom: 10px;"><a ng-if="showBackButton()" class="umb-mini-list-view__back" ng-click="exitMiniListView()"><i class="icon-arrow-left umb-mini-list-view__back-icon"></i> <span class="umb-mini-list-view__back-text"><localize key="general_back">Back</localize></span> /</a><umb-breadcrumbs ng-if="breadcrumb && breadcrumb.length > 0" ancestors="breadcrumb" entity-type="content" on-open="clickBreadcrumb(ancestor)"></umb-breadcrumbs></div><div class="umb-table umb-table--condensed"><div class="umb-table-head"><div class="umb-table-row"><div class="umb-table-cell" style="display: none;"></div><div class="umb-table-cell" style="padding-top: 8px; padding-bottom: 8px;"><form class="form-search -no-margin-bottom" style="width: 100%; margin-right: 0;" novalidate><div class="inner-addon left-addon"><i class="icon icon-search" style="font-size: 14px;"></i> <input style="width: 100%;" class="form-control search-input" type="text" localize="placeholder" placeholder="@general_typeToSearch" ng-model="search" ng-change="searchMiniListView(search, miniListView)" prevent-enter-submit no-dirty-check></div></form></div></div></div><div class="umb-table-body"><div class="umb-table__loading-overlay" ng-if="miniListView.loading && miniListView.children.length > 0"><umb-load-indicator></umb-load-indicator></div><div class="umb-table-row" ng-repeat="child in miniListView.children" ng-click="selectNode(child)" ng-class="{\'-selected\':child.selected, \'not-allowed\':!child.allowed}"><div class="umb-table-cell umb-table-cell--auto-width" ng-class="{\'umb-table-cell--faded\':child.published === false}"><div class="flex items-center"><ins class="icon-navigation-right umb-table__row-expand" ng-click="openNode($event, child)" ng-class="{\'umb-table__row-expand--hidden\': child.metaData.hasChildren !== true}">&nbsp;</ins><i class="umb-table-body__icon umb-table-body__fileicon {{child.icon}}"></i> <i class="umb-table-body__icon umb-table-body__checkicon icon-check"></i></div></div><div class="umb-table-cell black" ng-class="{\'umb-table-cell--faded\':child.published === false}">{{ child.name }}</div></div><div ng-if="!miniListView.loading && !miniListView.children" class="umb-table-row umb-table-row--empty"><span ng-if="search === \'\'"><localize key="general_noItemsInList"></localize></span> <span ng-if="search !== \'\'"><localize key="general_searchNoResult"></localize></span></div><div ng-if="miniListView.loading && !miniListView.children" class="umb-table-row umb-table-row--empty"><umb-load-indicator></umb-load-indicator></div></div></div><div class="flex justify-center"><umb-pagination ng-if="miniListView.pagination.totalPages > 0 && !miniListView.loading" page-number="miniListView.pagination.pageNumber" total-pages="miniListView.pagination.totalPages" on-change="goToPage(pageNumber, miniListView)"></umb-pagination></div></div></div>',
                scope: {
                    node: '=',
                    entityType: '@',
                    startNodeId: '=',
                    onSelect: '&',
                    onClose: '&',
                    entityTypeFilter: '='
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbMiniListView', MiniListViewDirective);
    }());
    'use strict';
    angular.module('umbraco.directives').directive('umbNestedContentEditor', [function () {
            var link = function link($scope) {
                // Clone the model because some property editors
                // do weird things like updating and config values
                // so we want to ensure we start from a fresh every
                // time, we'll just sync the value back when we need to
                $scope.model = angular.copy($scope.ngModel);
                $scope.nodeContext = $scope.model;
                // Find the selected tab
                var selectedTab = $scope.model.variants[0].tabs[0];
                if ($scope.tabAlias) {
                    angular.forEach($scope.model.variants[0].tabs, function (tab) {
                        if (tab.alias.toLowerCase() === $scope.tabAlias.toLowerCase()) {
                            selectedTab = tab;
                            return;
                        }
                    });
                }
                $scope.tab = selectedTab;
                // Listen for sync request
                var unsubscribe = $scope.$on('ncSyncVal', function (ev, args) {
                    if (args.key === $scope.model.key) {
                        // Tell inner controls we are submitting
                        $scope.$broadcast('formSubmitting', { scope: $scope });
                        // Sync the values back
                        angular.forEach($scope.ngModel.variants[0].tabs, function (tab) {
                            if (tab.alias.toLowerCase() === selectedTab.alias.toLowerCase()) {
                                var localPropsMap = selectedTab.properties.reduce(function (map, obj) {
                                    map[obj.alias] = obj;
                                    return map;
                                }, {});
                                angular.forEach(tab.properties, function (prop) {
                                    if (localPropsMap.hasOwnProperty(prop.alias)) {
                                        prop.value = localPropsMap[prop.alias].value;
                                    }
                                });
                            }
                        });
                    }
                });
                $scope.$on('$destroy', function () {
                    unsubscribe();
                });
            };
            return {
                restrict: 'E',
                replace: true,
                templateUrl: Umbraco.Sys.ServerVariables.umbracoSettings.umbracoPath + '/views/propertyeditors/nestedcontent/nestedcontent.editor.html',
                scope: {
                    ngModel: '=',
                    tabAlias: '='
                },
                link: link
            };
        }]);
    //angular.module("umbraco.directives").directive('nestedContentSubmitWatcher', function () {
    //    var link = function (scope) {
    //        // call the load callback on scope to obtain the ID of this submit watcher
    //        var id = scope.loadCallback();
    //        scope.$on("formSubmitting", function (ev, args) {
    //            // on the "formSubmitting" event, call the submit callback on scope to notify the nestedContent controller to do it's magic
    //            if (id === scope.activeSubmitWatcher) {
    //                scope.submitCallback();
    //            }
    //        });
    //    }
    //    return {
    //        restrict: "E",
    //        replace: true,
    //        template: "",
    //        scope: {
    //            loadCallback: '=',
    //            submitCallback: '=',
    //            activeSubmitWatcher: '='
    //        },
    //        link: link
    //    }
    //});
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbNodePreview
@restrict E
@scope

@description
<strong>Added in Umbraco v. 7.6:</strong> Use this directive to render a node preview.

<h3>Markup example</h3>
<pre>
    <div ng-controller="My.NodePreviewController as vm">
        
        <div ui-sortable ng-model="vm.nodes">
            <umb-node-preview
                ng-repeat="node in vm.nodes"
                icon="node.icon"
                name="node.name"
                alias="node.alias"
                published="node.published"
                description="node.description"
                sortable="vm.sortable"
                allow-remove="vm.allowRemove"
                allow-open="vm.allowOpen"
                on-remove="vm.remove($index, vm.nodes)"
                on-open="vm.open(node)">
            </umb-node-preview>
        </div>
    
    </div>
</pre>

<h3>Controller example</h3>
<pre>
    (function () {
        "use strict";
    
        function Controller() {
    
            var vm = this;
    
            vm.allowRemove = true;
            vm.allowOpen = true;
            vm.sortable = true;
    
            vm.nodes = [
                {
                    "icon": "icon-document",
                    "name": "My node 1",
                    "published": true,
                    "description": "A short description of my node"
                },
                {
                    "icon": "icon-document",
                    "name": "My node 2",
                    "published": true,
                    "description": "A short description of my node"
                }
            ];
    
            vm.remove = remove;
            vm.open = open;
    
            function remove(index, nodes) {
                alert("remove node");
            }
    
            function open(node) {
                alert("open node");
            }
    
        }
    
        angular.module("umbraco").controller("My.NodePreviewController", Controller);
    
    })();
</pre>

@param {string} icon (<code>binding</code>): The node icon.
@param {string} name (<code>binding</code>): The node name.
@param {string} alias (<code>binding</code>): The node document type alias will be displayed on hover if in debug mode or logged in as admin
@param {boolean} published (<code>binding</code>): The node published state.
@param {string} description (<code>binding</code>): A short description.
@param {boolean} sortable (<code>binding</code>): Will add a move cursor on the node preview. Can used in combination with ui-sortable.
@param {boolean} allowRemove (<code>binding</code>): Show/Hide the remove button.
@param {boolean} allowOpen (<code>binding</code>): Show/Hide the open button.
@param {boolean} allowEdit (<code>binding</code>): Show/Hide the edit button (Added in version 7.7.0).
@param {function} onRemove (<code>expression</code>): Callback function when the remove button is clicked.
@param {function} onOpen (<code>expression</code>): Callback function when the open button is clicked.
@param {function} onEdit (<code>expression</code>): Callback function when the edit button is clicked (Added in version 7.7.0).
@param {string} openUrl (<code>binding</code>): Fallback URL for <code>onOpen</code> (Added in version 7.12.0).
@param {string} editUrl (<code>binding</code>): Fallback URL for <code>onEdit</code> (Added in version 7.12.0).
@param {string} removeUrl (<code>binding</code>): Fallback URL for <code>onRemove</code> (Added in version 7.12.0).
**/
    (function () {
        'use strict';
        function NodePreviewDirective(userService) {
            function link(scope, el, attr, ctrl) {
                if (!scope.editLabelKey) {
                    scope.editLabelKey = 'general_edit';
                }
                userService.getCurrentUser().then(function (u) {
                    var isAdmin = u.userGroups.indexOf('admin') !== -1;
                    scope.alias = Umbraco.Sys.ServerVariables.isDebuggingEnabled === true || isAdmin ? scope.alias : null;
                });
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-node-preview" ng-class="{\'umb-node-preview--sortable\': sortable, \'umb-node-preview--unpublished\': published === false }"><i ng-if="icon" class="umb-node-preview__icon {{ icon }}"></i><div class="umb-node-preview__content"><div class="umb-node-preview__name" ng-attr-title="{{alias}}">{{ name }}</div><div class="umb-node-preview__description" ng-if="description">{{ description }}</div><div class="umb-user-group-preview__permissions" ng-if="permissions"><span><span class="bold"><localize key="general_rights">Permissions</localize>:</span> <span ng-repeat="permission in permissions" class="umb-user-group-preview__permission">{{ permission.name }}</span></span></div></div><div class="umb-node-preview__actions"><a class="umb-node-preview__action" title="Edit" ng-href="{{editUrl}}" ng-if="allowEdit" ng-click="onEdit()"><localize key="general_edit">Edit</localize></a> <a class="umb-node-preview__action" title="Open" ng-href="{{openUrl}}" ng-if="allowOpen" ng-click="onOpen()"><localize key="general_open">Open</localize></a> <a class="umb-node-preview__action umb-node-preview__action--red" title="Remove" ng-href="{{removeUrl}}" ng-if="allowRemove" ng-click="onRemove()"><localize key="general_remove">Remove</localize></a></div></div>',
                scope: {
                    icon: '=?',
                    name: '=',
                    alias: '=?',
                    description: '=?',
                    permissions: '=?',
                    published: '=?',
                    sortable: '=?',
                    allowOpen: '=?',
                    allowRemove: '=?',
                    allowEdit: '=?',
                    onOpen: '&?',
                    onRemove: '&?',
                    onEdit: '&?',
                    openUrl: '=?',
                    editUrl: '=?',
                    removeUrl: '=?'
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbNodePreview', NodePreviewDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbPagination
@restrict E
@scope

@description
Use this directive to generate a pagination.

<h3>Markup example</h3>
<pre>
    <div ng-controller="My.Controller as vm">

        <umb-pagination
            page-number="vm.pagination.pageNumber"
            total-pages="vm.pagination.totalPages"
            on-next="vm.nextPage"
            on-prev="vm.prevPage"
            on-go-to-page="vm.goToPage">
        </umb-pagination>

    </div>
</pre>

<h3>Controller example</h3>
<pre>
    (function () {
        "use strict";

        function Controller() {

            var vm = this;

            vm.pagination = {
                pageNumber: 1,
                totalPages: 10
            }

            vm.nextPage = nextPage;
            vm.prevPage = prevPage;
            vm.goToPage = goToPage;

            function nextPage(pageNumber) {
                // do magic here
                console.log(pageNumber);
                alert("nextpage");
            }

            function prevPage(pageNumber) {
                // do magic here
                console.log(pageNumber);
                alert("prevpage");
            }

            function goToPage(pageNumber) {
                // do magic here
                console.log(pageNumber);
                alert("go to");
            }

        }

        angular.module("umbraco").controller("My.Controller", Controller);
    })();
</pre>

@param {number} pageNumber (<code>binding</code>): Current page number.
@param {number} totalPages (<code>binding</code>): The total number of pages.
@param {callback} onNext (<code>binding</code>): Callback method to go to the next page.
    <h3>The callback returns:</h3>
    <ul>
        <li><code>pageNumber</code>: The page number</li>
    </ul>
@param {callback=} onPrev (<code>binding</code>): Callback method to go to the previous page.
    <h3>The callback returns:</h3>
    <ul>
        <li><code>pageNumber</code>: The page number</li>
    </ul>
@param {callback=} onGoToPage (<code>binding</code>): Callback method to go to a specific page.
    <h3>The callback returns:</h3>
    <ul>
        <li><code>pageNumber</code>: The page number</li>
    </ul>
**/
    (function () {
        'use strict';
        function PaginationDirective(localizationService) {
            function link(scope, el, attr, ctrl) {
                function activate() {
                    // page number is sometimes a string - let's make sure it's an int before we do anything with it
                    if (scope.pageNumber) {
                        scope.pageNumber = parseInt(scope.pageNumber);
                    }
                    var tempPagination = [];
                    var i = 0;
                    if (scope.totalPages <= 10) {
                        for (i = 0; i < scope.totalPages; i++) {
                            tempPagination.push({
                                val: i + 1,
                                isActive: scope.pageNumber === i + 1
                            });
                        }
                    } else {
                        //if there is more than 10 pages, we need to do some fancy bits
                        //get the max index to start
                        var maxIndex = scope.totalPages - 10;
                        //set the start, but it can't be below zero
                        var start = Math.max(scope.pageNumber - 5, 0);
                        //ensure that it's not too far either
                        start = Math.min(maxIndex, start);
                        for (i = start; i < 10 + start; i++) {
                            tempPagination.push({
                                val: i + 1,
                                isActive: scope.pageNumber === i + 1
                            });
                        }
                        //now, if the start is greater than 0 then '1' will not be displayed, so do the elipses thing
                        if (start > 0) {
                            localizationService.localize('general_first').then(function (value) {
                                var firstLabel = value;
                                tempPagination.unshift({
                                    name: firstLabel,
                                    val: 1,
                                    isActive: false
                                }, {
                                    val: '...',
                                    isActive: false
                                });
                            });
                        }
                        //same for the end
                        if (start < maxIndex) {
                            localizationService.localize('general_last').then(function (value) {
                                var lastLabel = value;
                                tempPagination.push({
                                    val: '...',
                                    isActive: false
                                }, {
                                    name: lastLabel,
                                    val: scope.totalPages,
                                    isActive: false
                                });
                            });
                        }
                    }
                    scope.pagination = tempPagination;
                }
                scope.next = function () {
                    if (scope.pageNumber < scope.totalPages) {
                        scope.pageNumber++;
                        if (scope.onNext) {
                            scope.onNext(scope.pageNumber);
                        }
                        if (scope.onChange) {
                            scope.onChange({ 'pageNumber': scope.pageNumber });
                        }
                    }
                };
                scope.prev = function (pageNumber) {
                    if (scope.pageNumber > 1) {
                        scope.pageNumber--;
                        if (scope.onPrev) {
                            scope.onPrev(scope.pageNumber);
                        }
                        if (scope.onChange) {
                            scope.onChange({ 'pageNumber': scope.pageNumber });
                        }
                    }
                };
                scope.goToPage = function (pageNumber) {
                    scope.pageNumber = pageNumber + 1;
                    if (scope.onGoToPage) {
                        scope.onGoToPage(scope.pageNumber);
                    }
                    if (scope.onChange) {
                        if (scope.onChange) {
                            scope.onChange({ 'pageNumber': scope.pageNumber });
                        }
                    }
                };
                var unbindPageNumberWatcher = scope.$watchCollection('[pageNumber, totalPages]', function (newValues, oldValues) {
                    activate();
                });
                scope.$on('$destroy', function () {
                    unbindPageNumberWatcher();
                });
                activate();
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-pagination pagination"><div ng-show="pagination.length > 1"><ul><li ng-class="{disabled:pageNumber <= 1}"><a href="#" ng-click="prev()" prevent-default><localize key="general_previous">Previous</localize></a></li><li ng-repeat="pgn in pagination track by $index" ng-class="{active:pgn.isActive}"><a href="#" ng-click="goToPage(pgn.val - 1)" prevent-default ng-bind="pgn.name ? pgn.name : pgn.val" ng-if="pgn.val != \'...\'"></a> <span ng-bind="pgn.val" ng-if="pgn.val == \'...\'"></span></li><li ng-class="{disabled:pageNumber >= totalPages}"><a href="#" ng-click="next()" prevent-default><localize key="general_next">Next</localize></a></li></ul></div></div>',
                scope: {
                    pageNumber: '=',
                    totalPages: '=',
                    onNext: '=',
                    onPrev: '=',
                    onGoToPage: '=',
                    onChange: '&'
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbPagination', PaginationDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbPasswordToggle
@restrict E
@scope

@description
<strong>Added in Umbraco v. 7.7.4:</strong> Use this directive to render a password toggle.

**/
    (function () {
        'use strict';
        // comes from https://codepen.io/jakob-e/pen/eNBQaP
        // works fine with Angular 1.6.5 - alas not with 1.1.5 - binding issue
        function PasswordToggleDirective($compile) {
            var directive = {
                restrict: 'A',
                scope: {},
                link: function link(scope, elem, attrs) {
                    scope.tgl = function () {
                        elem.attr('type', elem.attr('type') === 'text' ? 'password' : 'text');
                    };
                    var lnk = angular.element('<a data-ng-click="tgl()">Toggle</a>');
                    $compile(lnk)(scope);
                    elem.wrap('<div class="password-toggle"/>').after(lnk);
                }
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbPasswordToggle', PasswordToggleDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbProgressBar
@restrict E
@scope

@description
Use this directive to generate a progress bar.

<h3>Markup example</h3>
<pre>
    <umb-progress-bar
        percentage="60">
    </umb-progress-bar>
</pre>

@param {number} percentage (<code>attribute</code>): The progress in percentage.
@param {string} size (<code>attribute</code>): The size (s, m).

**/
    (function () {
        'use strict';
        function ProgressBarDirective() {
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-progress-bar umb-progress-bar--{{size}}"><span class="umb-progress-bar__progress" style="width: {{percentage}}%"></span></div>',
                scope: {
                    percentage: '@',
                    size: '@?'
                }
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbProgressBar', ProgressBarDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbProgressCircle
@restrict E
@scope

@description
Use this directive to render a circular progressbar.

<h3>Markup example</h3>
<pre>
    <div>
    
        <umb-progress-circle
            percentage="80"
            size="60"
            color="secondary">
        </umb-progress-circle>

	</div>
</pre>

@param {string} size (<code>attribute</code>): This parameter defines the width and the height of the circle in pixels.
@param {string} percentage (<code>attribute</code>): Takes a number between 0 and 100 and applies it to the circle's highlight length.
@param {string} color (<code>attribute</code>): the color of the highlight (primary, secondary, success, warning, danger). Success by default. 
**/
    (function () {
        'use strict';
        function ProgressCircleDirective($http, $timeout) {
            function link(scope, element, $filter) {
                function onInit() {
                    // making sure we get the right numbers
                    var percent = scope.percentage;
                    if (percent > 100) {
                        percent = 100;
                    } else if (percent < 0) {
                        percent = 0;
                    }
                    // calculating the circle's highlight
                    var circle = element.find('.umb-progress-circle__highlight');
                    var r = circle.attr('r');
                    var strokeDashArray = r * Math.PI * 2;
                    // Full circle length
                    scope.strokeDashArray = strokeDashArray;
                    var strokeDashOffsetDifference = percent / 100 * strokeDashArray;
                    var strokeDashOffset = strokeDashArray - strokeDashOffsetDifference;
                    // Distance for the highlight dash's offset
                    scope.strokeDashOffset = strokeDashOffset;
                    // set font size
                    scope.percentageSize = scope.size * 0.3 + 'px';
                }
                onInit();
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-progress-circle" ng-style="{\'width\': size, \'height\': size, \'line-height\': size + \'px\' }"><svg class="umb-progress-circle__view-box" viewBox="0 0 100 100"><circle class="umb-progress-circle__bg" cx="50" cy="50" r="47" fill="none" stroke-width="6"></circle><circle class="umb-progress-circle__highlight umb-progress-circle__highlight--{{ color }}" cx="50" cy="50" r="47" fill="none" stroke-width="6" stroke-dasharray="{{ strokeDashArray }}" stroke-dashoffset="{{ strokeDashOffset }}"></circle></svg><div ng-style="{\'font-size\': percentageSize}" class="umb-progress-circle__percentage">{{ percentage }}%</div></div>',
                scope: {
                    size: '@?',
                    percentage: '@',
                    color: '@'
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbProgressCircle', ProgressCircleDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbRangeSlider
@restrict E
@scope

@description
<b>Added in Umbraco version 8.0</b>
This directive is a wrapper of the noUiSlider library. Use it to render a slider.
For extra details about options and events take a look here: https://refreshless.com/nouislider/

<h3>Markup example</h3>
<pre>
	<div ng-controller="My.Controller as vm">

        <umb-range-slider 
            ng-model="vm.value"
            on-end="vm.slideEnd(values)">
        </umb-range-slider>

	</div>
</pre>

<h3>Controller example</h3>
<pre>
	(function () {
		"use strict";

		function Controller() {

            var vm = this;

            vm.value = [10];

            vm.slideEnd = slideEnd;

            function slideEnd(values) {
            	// handle change
            }

        }

		angular.module("umbraco").controller("My.Controller", Controller);

	})();
</pre>

@param {object} ngModel (<code>binding</code>): Value for the slider.
@param {object} options (<code>binding</code>): Config object for the date picker.
@param {callback} onSetup (<code>callback</code>): onSetup gets triggered when the slider is initialized
@param {callback} onUpdate (<code>callback</code>): onUpdate fires every time the slider values are changed.
@param {callback} onSlide (<code>callback</code>): onSlide gets triggered when the handle is being dragged.
@param {callback} onSet (<code>callback</code>): onSet will trigger every time a slider stops changing.
@param {callback} onChange (<code>callback</code>): onChange fires when a user stops sliding, or when a slider value is changed by 'tap'.
@param {callback} onStart (<code>callback</code>): onStart fires when a handle is clicked (mousedown, or the equivalent touch events).
@param {callback} onEnd (<code>callback</code>): onEnd fires when a handle is released (mouseup etc), or when a slide is canceled due to other reasons.
**/
    (function () {
        'use strict';
        var umbRangeSlider = {
            template: '<div class="umb-range-slider"></div>',
            controller: UmbRangeSliderController,
            bindings: {
                ngModel: '<',
                options: '<',
                onSetup: '&?',
                onUpdate: '&?',
                onSlide: '&?',
                onSet: '&?',
                onChange: '&?',
                onStart: '&?',
                onEnd: '&?'
            }
        };
        function UmbRangeSliderController($element, $timeout, $scope, assetsService) {
            var ctrl = this;
            var sliderInstance = null;
            ctrl.$onInit = function () {
                // load css file for the date picker
                assetsService.loadCss('lib/nouislider/nouislider.min.css', $scope);
                // load the js file for the date picker
                assetsService.loadJs('lib/nouislider/nouislider.min.js', $scope).then(function () {
                    // init date picker
                    grabElementAndRun();
                });
            };
            function grabElementAndRun() {
                $timeout(function () {
                    var element = $element.find('.umb-range-slider')[0];
                    setSlider(element);
                }, 0, true);
            }
            function setSlider(element) {
                sliderInstance = element;
                var defaultOptions = {
                    'start': [0],
                    'step': 1,
                    'range': {
                        'min': [0],
                        'max': [100]
                    }
                };
                var options = ctrl.options ? ctrl.options : defaultOptions;
                // create new slider
                noUiSlider.create(sliderInstance, options);
                if (ctrl.onSetup) {
                    ctrl.onSetup({ slider: sliderInstance });
                }
                // If has ngModel set the date
                if (ctrl.ngModel) {
                    sliderInstance.noUiSlider.set(ctrl.ngModel);
                }
                // destroy the slider instance when the dom element is removed
                angular.element(element).on('$destroy', function () {
                    sliderInstance.noUiSlider.off();
                });
                setUpCallbacks();
                // Refresh the scope
                $scope.$applyAsync();
            }
            function setUpCallbacks() {
                if (sliderInstance) {
                    // bind hook for update
                    if (ctrl.onUpdate) {
                        sliderInstance.noUiSlider.on('update', function (values, handle, unencoded, tap, positions) {
                            $timeout(function () {
                                ctrl.onUpdate({
                                    values: values,
                                    handle: handle,
                                    unencoded: unencoded,
                                    tap: tap,
                                    positions: positions
                                });
                            });
                        });
                    }
                    // bind hook for slide
                    if (ctrl.onSlide) {
                        sliderInstance.noUiSlider.on('slide', function (values, handle, unencoded, tap, positions) {
                            $timeout(function () {
                                ctrl.onSlide({
                                    values: values,
                                    handle: handle,
                                    unencoded: unencoded,
                                    tap: tap,
                                    positions: positions
                                });
                            });
                        });
                    }
                    // bind hook for set
                    if (ctrl.onSet) {
                        sliderInstance.noUiSlider.on('set', function (values, handle, unencoded, tap, positions) {
                            $timeout(function () {
                                ctrl.onSet({
                                    values: values,
                                    handle: handle,
                                    unencoded: unencoded,
                                    tap: tap,
                                    positions: positions
                                });
                            });
                        });
                    }
                    // bind hook for change
                    if (ctrl.onChange) {
                        sliderInstance.noUiSlider.on('change', function (values, handle, unencoded, tap, positions) {
                            $timeout(function () {
                                ctrl.onChange({
                                    values: values,
                                    handle: handle,
                                    unencoded: unencoded,
                                    tap: tap,
                                    positions: positions
                                });
                            });
                        });
                    }
                    // bind hook for start
                    if (ctrl.onStart) {
                        sliderInstance.noUiSlider.on('start', function (values, handle, unencoded, tap, positions) {
                            $timeout(function () {
                                ctrl.onStart({
                                    values: values,
                                    handle: handle,
                                    unencoded: unencoded,
                                    tap: tap,
                                    positions: positions
                                });
                            });
                        });
                    }
                    // bind hook for end
                    if (ctrl.onEnd) {
                        sliderInstance.noUiSlider.on('end', function (values, handle, unencoded, tap, positions) {
                            $timeout(function () {
                                ctrl.onEnd({
                                    values: values,
                                    handle: handle,
                                    unencoded: unencoded,
                                    tap: tap,
                                    positions: positions
                                });
                            });
                        });
                    }
                }
            }
        }
        angular.module('umbraco.directives').component('umbRangeSlider', umbRangeSlider);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbStickyBar
@restrict A

@description
Use this directive make an element sticky and follow the page when scrolling.

<h3>Markup example</h3>
<pre>
    <div ng-controller="My.Controller as vm">

        <div
           class="my-sticky-bar"
           umb-sticky-bar
           scrollable-container=".container">
        </div>

    </div>
</pre>

<h3>CSS example</h3>
<pre>
    .my-sticky-bar {
        padding: 15px 0;
        background: #000000;
        position: relative;
        top: 0;
    }

    .my-sticky-bar.-umb-sticky-bar {
        top: 100px;
    }
</pre>

@param {string} scrollableContainer Set the class (".element") or the id ("#element") of the scrollable container element.
**/
    (function () {
        'use strict';
        function StickyBarDirective($rootScope) {
            function link(scope, el, attr, ctrl) {
                var bar = $(el);
                var scrollableContainer = null;
                var clonedBar = null;
                var cloneIsMade = false;
                function activate() {
                    if (bar.parents('.umb-property').length > 1) {
                        bar.addClass('nested');
                        return;
                    }
                    if (attr.scrollableContainer) {
                        scrollableContainer = bar.closest(attr.scrollableContainer);
                    } else {
                        scrollableContainer = $(window);
                    }
                    scrollableContainer.on('scroll.umbStickyBar', determineVisibility).trigger('scroll');
                    $(window).on('resize.umbStickyBar', determineVisibility);
                    scope.$on('$destroy', function () {
                        scrollableContainer.off('.umbStickyBar');
                        $(window).off('.umbStickyBar');
                    });
                }
                function determineVisibility() {
                    var barTop = bar[0].offsetTop;
                    var scrollTop = scrollableContainer.scrollTop();
                    if (scrollTop > barTop) {
                        if (!cloneIsMade) {
                            createClone();
                            clonedBar.css({ 'visibility': 'visible' });
                        } else {
                            calculateSize();
                        }
                    } else {
                        if (cloneIsMade) {
                            //remove cloned element (switched places with original on creation)
                            bar.remove();
                            bar = clonedBar;
                            clonedBar = null;
                            bar.removeClass('-umb-sticky-bar');
                            bar.css({
                                position: 'relative',
                                'width': 'auto',
                                'height': 'auto',
                                'z-index': 'auto',
                                'visibility': 'visible'
                            });
                            cloneIsMade = false;
                        }
                    }
                }
                function calculateSize() {
                    var width = bar.innerWidth();
                    clonedBar.css({
                        width: width + 10    // + 10 (5*2) because we need to add border to avoid seeing the shadow beneath. Look at the CSS.
                    });
                }
                function createClone() {
                    //switch place with cloned element, to keep binding intact
                    clonedBar = bar;
                    bar = clonedBar.clone();
                    clonedBar.after(bar);
                    clonedBar.addClass('-umb-sticky-bar');
                    clonedBar.css({
                        'position': 'fixed',
                        // if you change this z-index value, make sure the sticky editor sub headers do not 
                        // clash with umb-dropdown (e.g. the content actions dropdown in content list view)
                        'z-index': 99,
                        'visibility': 'hidden'
                    });
                    cloneIsMade = true;
                    calculateSize();
                }
                activate();
            }
            var directive = {
                restrict: 'A',
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbStickyBar', StickyBarDirective);
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbTable
@restrict E
@scope

@description
<strong>Added in Umbraco v. 7.4:</strong> Use this directive to render a data table.

<h3>Markup example</h3>
<pre>
    <div ng-controller="My.TableController as vm">
        
        <umb-table
            ng-if="items"
            items="vm.items"
            item-properties="vm.options.includeProperties"
            allow-select-all="vm.allowSelectAll"
            on-select="vm.selectItem"
            on-click="vm.clickItem"
            on-select-all="vm.selectAll"
            on-selected-all="vm.isSelectedAll"
            on-sorting-direction="vm.isSortDirection"
            on-sort="vm.sort">
        </umb-table>
    
    </div>
</pre>

<h3>Controller example</h3>
<pre>
    (function () {
        "use strict";
    
        function Controller() {
    
            var vm = this;
    
            vm.items = [
                {
                    "icon": "icon-document",
                    "name": "My node 1",
                    "published": true,
                    "description": "A short description of my node",
                    "author": "Author 1"
                },
                {
                    "icon": "icon-document",
                    "name": "My node 2",
                    "published": true,
                    "description": "A short description of my node",
                    "author": "Author 2"
                }
            ];

            vm.options = {
                includeProperties: [
                    { alias: "description", header: "Description" },
                    { alias: "author", header: "Author" }
                ]
            };
    
            vm.selectItem = selectItem;
            vm.clickItem = clickItem;
            vm.selectAll = selectAll;
            vm.isSelectedAll = isSelectedAll;
            vm.isSortDirection = isSortDirection;
            vm.sort = sort;

            function selectAll($event) {
                alert("select all");
            }

            function isSelectedAll() {
                
            }
    
            function clickItem(item) {
                alert("click node");
            }

            function selectItem(selectedItem, $index, $event) {
                alert("select node");
            }
            
            function isSortDirection(col, direction) {
                
            }
            
            function sort(field, allow, isSystem) {
                
            }
    
        }
    
        angular.module("umbraco").controller("My.TableController", Controller);
    
    })();
</pre>

@param {string} icon (<code>binding</code>): The node icon.
@param {string} name (<code>binding</code>): The node name.
@param {string} published (<code>binding</code>): The node published state.
@param {function} onSelect (<code>expression</code>): Callback function when the row is selected.
@param {function} onClick (<code>expression</code>): Callback function when the "Name" column link is clicked.
@param {function} onSelectAll (<code>expression</code>): Callback function when selecting all items.
@param {function} onSelectedAll (<code>expression</code>): Callback function when all items are selected.
@param {function} onSortingDirection (<code>expression</code>): Callback function when sorting direction is changed.
@param {function} onSort (<code>expression</code>): Callback function when sorting items.
**/
    (function () {
        'use strict';
        function TableController(iconHelper) {
            var vm = this;
            vm.clickItem = function (item, $event) {
                if (vm.onClick && !($event.metaKey || $event.ctrlKey)) {
                    vm.onClick({ item: item });
                    $event.preventDefault();
                }
                $event.stopPropagation();
            };
            vm.selectItem = function (item, $index, $event) {
                if (vm.onSelect) {
                    vm.onSelect({
                        item: item,
                        $index: $index,
                        $event: $event
                    });
                    $event.stopPropagation();
                }
            };
            vm.selectAll = function ($event) {
                if (vm.onSelectAll) {
                    vm.onSelectAll({ $event: $event });
                }
            };
            vm.isSelectedAll = function () {
                if (vm.onSelectedAll && vm.items && vm.items.length > 0) {
                    return vm.onSelectedAll();
                }
            };
            vm.isSortDirection = function (col, direction) {
                if (vm.onSortingDirection) {
                    return vm.onSortingDirection({
                        col: col,
                        direction: direction
                    });
                }
            };
            vm.sort = function (field, allow, isSystem) {
                if (vm.onSort) {
                    vm.onSort({
                        field: field,
                        allow: allow,
                        isSystem: isSystem
                    });
                }
            };
            vm.getIcon = function (entry) {
                return iconHelper.convertFromLegacyIcon(entry.icon);
            };
        }
        angular.module('umbraco.directives').component('umbTable', {
            template: '<div><div class="umb-table" ng-if="vm.items"><div class="umb-table-head"><div class="umb-table-row"><div class="umb-table-cell"><a style="text-decoration: none;" ng-show="vm.allowSelectAll" ng-click="vm.selectAll()"><umb-checkmark checked="vm.isSelectedAll()" size="xs"></umb-checkmark></a></div><div class="umb-table-cell umb-table__name"><a class="umb-table-head__link sortable" href="#" ng-click="vm.sort(\'Name\', true, true)" prevent-default><localize key="general_name">Name</localize><i class="umb-table-head__icon icon" ng-class="{\'icon-navigation-up\': vm.isSortDirection(\'Name\', \'asc\'), \'icon-navigation-down\': vm.isSortDirection(\'Name\', \'desc\')}"></i></a></div><div class="umb-table-cell" ng-show="vm.items[0].state"><localize key="general_status">Status</localize></div><div class="umb-table-cell" ng-repeat="column in vm.itemProperties track by column.alias"><a class="umb-table-head__link" href="#" ng-click="vm.sort(column.alias, column.allowSorting, column.isSystem)" ng-class="{\'sortable\':column.allowSorting}" prevent-default><span ng-bind="column.header"></span> <i class="umb-table-head__icon icon" ng-class="{\'icon-navigation-up\': vm.isSortDirection(column.alias, \'asc\'), \'icon-navigation-down\': vm.isSortDirection(column.alias, \'desc\')}"></i></a></div></div></div><div class="umb-table-body"><div class="umb-table-row -selectable" ng-repeat="item in vm.items track by $index" ng-class="{\'-selected\':item.selected, \'-light\':!item.published && item.updater != null}" ng-click="vm.selectItem(item, $index, $event)"><div class="umb-table-cell"><i class="umb-table-body__icon umb-table-body__fileicon {{item.icon}}" ng-class="vm.getIcon(item)"></i> <i class="umb-table-body__icon umb-table-body__checkicon icon-check"></i></div><div class="umb-table-cell umb-table__name"><a title="{{ item.name }}" class="umb-table-body__link" ng-href="{{\'#\' + item.editPath}}" ng-click="vm.clickItem(item, $event)" ng-bind="item.name"></a></div><div class="umb-table-cell" ng-show="item.state"><umb-variant-state variant="item"></umb-variant-state></div><div class="umb-table-cell" ng-repeat="column in vm.itemProperties track by column.alias"><span title="{{column.header}}: {{item[column.alias]}}"><div ng-if="!column.isSensitive">{{item[column.alias]}}</div><em ng-show="column.isSensitive" class="muted"><localize key="content_isSensitiveValue_short"></localize></em></span></div></div></div></div><umb-empty-state ng-hide="vm.items" position="center"><localize key="content_listViewNoItems">There are no items show in the list.</localize></umb-empty-state></div>',
            controller: TableController,
            controllerAs: 'vm',
            bindings: {
                items: '<',
                itemProperties: '<',
                allowSelectAll: '<',
                onSelect: '&',
                onClick: '&',
                onSelectAll: '&',
                onSelectedAll: '&',
                onSortingDirection: '&',
                onSort: '&'
            }
        });
    }());
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbTooltip
@restrict E
@scope

@description
Use this directive to render a tooltip.

<h3>Markup example</h3>
<pre>
    <div ng-controller="My.Controller as vm">

        <div
            ng-mouseover="vm.mouseOver($event)"
            ng-mouseleave="vm.mouseLeave()">
            Hover me
        </div>

        <umb-tooltip
           ng-if="vm.tooltip.show"
           event="vm.tooltip.event">
           // tooltip content here
        </umb-tooltip>

    </div>
</pre>

<h3>Controller example</h3>
<pre>
    (function () {
        "use strict";

        function Controller() {

            var vm = this;
            vm.tooltip = {
                show: false,
                event: null
            };

            vm.mouseOver = mouseOver;
            vm.mouseLeave = mouseLeave;

            function mouseOver($event) {
                vm.tooltip = {
                    show: true,
                    event: $event
                };
            }

            function mouseLeave() {
                vm.tooltip = {
                    show: false,
                    event: null
                };
            }

        }

        angular.module("umbraco").controller("My.Controller", Controller);

    })();
</pre>

@param {string} event Set the $event from the target element to position the tooltip relative to the mouse cursor.
**/
    (function () {
        'use strict';
        function TooltipDirective() {
            function link(scope, el, attr, ctrl) {
                scope.tooltipStyles = {};
                scope.tooltipStyles.left = 0;
                scope.tooltipStyles.top = 0;
                function setTooltipPosition(event) {
                    var container = $('#contentwrapper');
                    var containerLeft = container[0].offsetLeft;
                    var containerRight = containerLeft + container[0].offsetWidth;
                    var containerTop = container[0].offsetTop;
                    var containerBottom = containerTop + container[0].offsetHeight;
                    var elementHeight = null;
                    var elementWidth = null;
                    var position = {
                        right: 'inherit',
                        left: 'inherit',
                        top: 'inherit',
                        bottom: 'inherit'
                    };
                    // element size
                    elementHeight = el[0].clientHeight;
                    elementWidth = el[0].clientWidth;
                    position.left = event.pageX - elementWidth / 2;
                    position.top = event.pageY;
                    // check to see if element is outside screen
                    // outside right
                    if (position.left + elementWidth > containerRight) {
                        position.right = 10;
                        position.left = 'inherit';
                    }
                    // outside bottom
                    if (position.top + elementHeight > containerBottom) {
                        position.bottom = 10;
                        position.top = 'inherit';
                    }
                    // outside left
                    if (position.left < containerLeft) {
                        position.left = containerLeft + 10;
                        position.right = 'inherit';
                    }
                    // outside top
                    if (position.top < containerTop) {
                        position.top = 10;
                        position.bottom = 'inherit';
                    }
                    scope.tooltipStyles = position;
                    el.css(position);
                }
                setTooltipPosition(scope.event);
            }
            var directive = {
                restrict: 'E',
                transclude: true,
                replace: true,
                template: '<div class="umb-tooltip shadow-depth-2" ng-style="tooltipStyles" ng-transclude></div>',
                scope: { event: '=' },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbTooltip', TooltipDirective);
    }());
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:umbFileDropzone
* @restrict E
* @function
* @description
**/
    /*
TODO
.directive("umbFileDrop", function ($timeout, $upload, localizationService, umbRequestHelper){
    return{
        restrict: "A",
        link: function(scope, element, attrs){
            //load in the options model
        }
    }
})
*/
    angular.module('umbraco.directives').directive('umbFileDropzone', function ($timeout, Upload, localizationService, umbRequestHelper) {
        return {
            restrict: 'E',
            replace: true,
            template: '<div data-element="dropzone" class="umb-file-dropzone"><ng-form name="uploadForm" umb-isolate-form><div ngf-drop ng-hide="hideDropzone === \'true\'" ng-model="filesHolder" ngf-change="handleFiles($files, $event)" class="dropzone" ngf-drag-over-class="\'drag-over\'" ngf-multiple="true" ngf-allow-dir="true" ngf-pattern="{{ accept }}" ngf-max-size="{{ maxFileSize }}" ng-class="{\'is-small\': compact!==\'false\' || (done.length+queue.length) > 0 }"><div class="content"><img class="illustration" src="assets/img/uploader/upload-illustration.svg" draggable="false"><div data-element="button-uploadMedia" class="file-select" ngf-select ng-model="filesHolder" ngf-change="handleFiles($newFiles, $event)" ngf-multiple="true" ngf-pattern="{{ accept }}" ngf-max-size="{{ maxFileSize }}">-<localize key="media_orClickHereToUpload">or click here to choose files</localize></div></div></div><ul class="file-list" ng-show="done.length > 0 || queue.length > 0 || rejected.length > 0 || filesHolder.length > 0"><li class="file" ng-repeat="file in done"><div class="file-description">{{ file.name }}</div><div class="file-icon" ng-if="file.uploadStatus == \'done\'"><i class="icon icon-check color-green"></i></div></li><li class="file" ng-if="currentFile"><div class="file-name">{{ currentFile.name }}</div><div class="file-progress"><span class="file-progress-indicator" ng-style="{\'width\': currentFile.uploadProgress + \'%\'}"></span></div></li><li class="file" ng-repeat="queued in queue"><div class="file-name">{{ queued.name }}</div></li><li class="file" ng-repeat="file in rejected"><div class="file-description"><strong>{{ file.name }}</strong> <span class="file-error" ng-if="file.$error"><span ng-if="file.$error === \'pattern\'" class="errorMessage color-red"><localize key="media_disallowedFileType"></localize></span> <span ng-if="file.$error === \'maxSize\'" class="errorMessage color-red"><localize key="media_maxFileSize"></localize>"{{maxFileSize}}"</span></span> <span class="file-error" ng-if="file.serverErrorMessage"><span class="errorMessage color-red">{{file.serverErrorMessage}}</span></span></div><div class="file-icon"><i class="icon icon-delete color-red"></i></div></li></ul></ng-form><umb-overlay ng-if="mediatypepickerOverlay.show" model="mediatypepickerOverlay" view="mediatypepickerOverlay.view" position="right"></umb-overlay></div>',
            scope: {
                parentId: '@',
                contentTypeAlias: '@',
                propertyAlias: '@',
                accept: '@',
                maxFileSize: '@',
                compact: '@',
                hideDropzone: '@',
                acceptedMediatypes: '=',
                filesQueued: '=',
                handleFile: '=',
                filesUploaded: '='
            },
            link: function link(scope, element, attrs) {
                scope.queue = [];
                scope.done = [];
                scope.rejected = [];
                scope.currentFile = undefined;
                function _filterFile(file) {
                    var ignoreFileNames = ['Thumbs.db'];
                    var ignoreFileTypes = ['directory'];
                    // ignore files with names from the list
                    // ignore files with types from the list
                    // ignore files which starts with "."
                    if (ignoreFileNames.indexOf(file.name) === -1 && ignoreFileTypes.indexOf(file.type) === -1 && file.name.indexOf('.') !== 0) {
                        return true;
                    } else {
                        return false;
                    }
                }
                function _filesQueued(files, event) {
                    //Push into the queue
                    angular.forEach(files, function (file) {
                        if (_filterFile(file) === true) {
                            if (file.$error) {
                                scope.rejected.push(file);
                            } else {
                                scope.queue.push(file);
                            }
                        }
                    });
                    //when queue is done, kick the uploader
                    if (!scope.working) {
                        // Upload not allowed
                        if (!scope.acceptedMediatypes || !scope.acceptedMediatypes.length) {
                            files.map(function (file) {
                                file.uploadStatus = 'error';
                                file.serverErrorMessage = 'File type is not allowed here';
                                scope.rejected.push(file);
                            });
                            scope.queue = [];
                        }
                        // One allowed type
                        if (scope.acceptedMediatypes && scope.acceptedMediatypes.length === 1) {
                            // Standard setup - set alias to auto select to let the server best decide which media type to use
                            if (scope.acceptedMediatypes[0].alias === 'Image') {
                                scope.contentTypeAlias = 'umbracoAutoSelect';
                            } else {
                                scope.contentTypeAlias = scope.acceptedMediatypes[0].alias;
                            }
                            _processQueueItem();
                        }
                        // More than one, open dialog
                        if (scope.acceptedMediatypes && scope.acceptedMediatypes.length > 1) {
                            _chooseMediaType();
                        }
                    }
                }
                function _processQueueItem() {
                    if (scope.queue.length > 0) {
                        scope.currentFile = scope.queue.shift();
                        _upload(scope.currentFile);
                    } else if (scope.done.length > 0) {
                        if (scope.filesUploaded) {
                            //queue is empty, trigger the done action
                            scope.filesUploaded(scope.done);
                        }
                        //auto-clear the done queue after 3 secs
                        var currentLength = scope.done.length;
                        $timeout(function () {
                            scope.done.splice(0, currentLength);
                        }, 3000);
                    }
                }
                function _upload(file) {
                    scope.propertyAlias = scope.propertyAlias ? scope.propertyAlias : 'umbracoFile';
                    scope.contentTypeAlias = scope.contentTypeAlias ? scope.contentTypeAlias : 'Image';
                    Upload.upload({
                        url: umbRequestHelper.getApiUrl('mediaApiBaseUrl', 'PostAddFile'),
                        fields: {
                            'currentFolder': scope.parentId,
                            'contentTypeAlias': scope.contentTypeAlias,
                            'propertyAlias': scope.propertyAlias,
                            'path': file.path
                        },
                        file: file
                    }).progress(function (evt) {
                        if (file.uploadStat !== 'done' && file.uploadStat !== 'error') {
                            // calculate progress in percentage
                            var progressPercentage = parseInt(100 * evt.loaded / evt.total, 10);
                            // set percentage property on file
                            file.uploadProgress = progressPercentage;
                            // set uploading status on file
                            file.uploadStatus = 'uploading';
                        }
                    }).success(function (data, status, headers, config) {
                        if (data.notifications && data.notifications.length > 0) {
                            // set error status on file
                            file.uploadStatus = 'error';
                            // Throw message back to user with the cause of the error
                            file.serverErrorMessage = data.notifications[0].message;
                            // Put the file in the rejected pool
                            scope.rejected.push(file);
                        } else {
                            // set done status on file
                            file.uploadStatus = 'done';
                            file.uploadProgress = 100;
                            // set date/time for when done - used for sorting
                            file.doneDate = new Date();
                            // Put the file in the done pool
                            scope.done.push(file);
                        }
                        scope.currentFile = undefined;
                        //after processing, test if everthing is done
                        _processQueueItem();
                    }).error(function (evt, status, headers, config) {
                        // set status done
                        file.uploadStatus = 'error';
                        //if the service returns a detailed error
                        if (evt.InnerException) {
                            file.serverErrorMessage = evt.InnerException.ExceptionMessage;
                            //Check if its the common "too large file" exception
                            if (evt.InnerException.StackTrace && evt.InnerException.StackTrace.indexOf('ValidateRequestEntityLength') > 0) {
                                file.serverErrorMessage = 'File too large to upload';
                            }
                        } else if (evt.Message) {
                            file.serverErrorMessage = evt.Message;
                        }
                        // If file not found, server will return a 404 and display this message
                        if (status === 404) {
                            file.serverErrorMessage = 'File not found';
                        }
                        //after processing, test if everthing is done
                        scope.rejected.push(file);
                        scope.currentFile = undefined;
                        _processQueueItem();
                    });
                }
                function _chooseMediaType() {
                    scope.mediatypepickerOverlay = {
                        view: 'mediatypepicker',
                        title: 'Choose media type',
                        acceptedMediatypes: scope.acceptedMediatypes,
                        hideSubmitButton: true,
                        show: true,
                        submit: function submit(model) {
                            scope.contentTypeAlias = model.selectedType.alias;
                            scope.mediatypepickerOverlay.show = false;
                            scope.mediatypepickerOverlay = null;
                            _processQueueItem();
                        },
                        close: function close(oldModel) {
                            scope.queue.map(function (file) {
                                file.uploadStatus = 'error';
                                file.serverErrorMessage = 'Cannot upload this file, no mediatype selected';
                                scope.rejected.push(file);
                            });
                            scope.queue = [];
                            scope.mediatypepickerOverlay.show = false;
                            scope.mediatypepickerOverlay = null;
                        }
                    };
                }
                scope.handleFiles = function (files, event) {
                    if (scope.filesQueued) {
                        scope.filesQueued(files, event);
                    }
                    _filesQueued(files, event);
                };
            }
        };
    });
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:umbFileUpload
* @function
* @restrict A
* @scope
* @description
*  Listens for file input control changes and emits events when files are selected for use in other controllers.
**/
    function umbFileUpload() {
        return {
            restrict: 'A',
            scope: true,
            //create a new scope
            link: function link(scope, el, attrs) {
                el.on('change', function (event) {
                    var files = event.target.files;
                    //emit event upward
                    scope.$emit('filesSelected', { files: files });
                    //clear the element value - this allows us to pick the same file again and again
                    el.val('');
                });
            }
        };
    }
    angular.module('umbraco.directives').directive('umbFileUpload', umbFileUpload);
    'use strict';
    (function () {
        'use strict';
        /**
   * A component to manage file uploads for content properties
   * @param {any} $scope
   * @param {any} fileManager
   * @param {any} mediaHelper
   * @param {any} angularHelper
   */
        function umbPropertyFileUploadController($scope, $q, fileManager, mediaHelper, angularHelper) {
            //NOTE: this component supports multiple files, though currently the uploader does not but perhaps sometime in the future
            // we'd want it to, so i'll leave the multiple file support in place
            var vm = this;
            vm.$onInit = onInit;
            vm.$onChanges = onChanges;
            vm.$postLink = postLink;
            vm.clear = clearFiles;
            /** Clears the file collections when content is saving (if we need to clear) or after saved */
            function clearFiles() {
                //clear the files collection (we don't want to upload any!)
                fileManager.setFiles({
                    propertyAlias: vm.propertyAlias,
                    culture: vm.culture,
                    files: []
                });
                //clear the current files
                vm.files = [];
                //notify the callback
                notifyFilesSelected(null);
                notifyFilesChanged(null);
            }
            function notifyFilesSelected(val, files) {
                if (!val) {
                    val = null;
                }
                if (!files) {
                    files = null;
                }
                //notify the callback
                vm.onFilesSelected({
                    value: val,
                    files: files
                });
                //need to explicity setDirty here to track changes
                vm.fileUploadForm.$setDirty();
            }
            function notifyFilesChanged(files) {
                if (!files) {
                    files = null;
                }
                //notify the callback
                vm.onFilesChanged({ files: files });
            }
            function notifyInit(val, files) {
                if (!val) {
                    val = null;
                }
                if (!files) {
                    files = null;
                }
                if (vm.onInit) {
                    vm.onInit({
                        value: val,
                        files: files
                    });
                }
            }
            /** Called when the component initializes */
            function onInit() {
                $scope.$on('filesSelected', onFilesSelected);
                initialize();
            }
            /** Called when the component has linked all elements, this is when the form controller is available */
            function postLink() {
            }
            function initialize() {
                //normalize culture to null if it's not there
                if (!vm.culture) {
                    vm.culture = null;
                }
                // TODO: need to figure out what we can do for things like Nested Content
                var existingClientFiles = checkPendingClientFiles();
                //create the property to show the list of files currently saved
                if (existingClientFiles.length > 0) {
                    updateModelFromSelectedFiles(existingClientFiles).then(function (newVal) {
                        //notify the callback
                        notifyInit(newVal, vm.files);
                    });
                } else if (vm.value) {
                    var files = vm.value.split(',');
                    vm.files = _.map(files, function (file) {
                        var f = {
                            fileName: file,
                            isImage: mediaHelper.detectIfImageByExtension(file),
                            extension: getExtension(file)
                        };
                        f.fileSrc = getThumbnail(f);
                        return f;
                    });
                    //notify the callback
                    notifyInit();
                } else {
                    vm.files = [];
                    //notify the callback
                    notifyInit();
                }
            }
            function checkPendingClientFiles() {
                //normalize culture to null if it's not there
                if (!vm.culture) {
                    vm.culture = null;
                }
                //check the file manager to see if there's already local files pending for this editor
                var existingClientFiles = _.map(_.filter(fileManager.getFiles(), function (f) {
                    return f.alias === vm.propertyAlias && f.culture === vm.culture;
                }), function (f) {
                    return f.file;
                });
                return existingClientFiles;
            }
            /**
     * Watch for model changes
     * @param {any} changes
     */
            function onChanges(changes) {
                if (changes.value && !changes.value.isFirstChange() && changes.value.currentValue !== changes.value.previousValue) {
                    if (!changes.value.currentValue && changes.value.previousValue) {
                        //if the value has been cleared, clear the files (ignore if the previous value is also falsy)
                        vm.files = [];
                    } else if (changes.value.currentValue && !changes.value.previousValue && vm.files.length === 0) {
                        //if a new value has been added after being cleared
                        var existingClientFiles = checkPendingClientFiles();
                        //create the property to show the list of files currently saved
                        if (existingClientFiles.length > 0) {
                            updateModelFromSelectedFiles(existingClientFiles).then(function () {
                                //raise this event which means the files have changed but this wasn't the instance that
                                //added the file
                                notifyFilesChanged(vm.files);
                            });
                        }
                    }
                }
            }
            function getThumbnail(file) {
                if (!file.isImage) {
                    return null;
                }
                var thumbnailUrl = mediaHelper.getThumbnailFromPath(file.fileName);
                return thumbnailUrl;
            }
            function getExtension(fileName) {
                var extension = fileName.substring(fileName.lastIndexOf('.') + 1, fileName.length);
                return extension.toLowerCase();
            }
            /**
     * Updates the vm.files model from the selected files and returns a promise containing the csv of all file names selected
     * @param {any} files
     */
            function updateModelFromSelectedFiles(files) {
                //we return a promise because the FileReader api is async
                var promises = [];
                //clear the current files
                vm.files = [];
                var newVal = '';
                var reader = new FileReader();
                //for each file load in the contents from the file reader and set it as an fileSrc
                //property of the vm.files array item
                var fileCount = files.length;
                for (var i = 0; i < fileCount; i++) {
                    var index = i;
                    //capture
                    var isImage = mediaHelper.detectIfImageByExtension(files[i].name);
                    //save the file object to the files collection
                    vm.files.push({
                        isImage: isImage,
                        extension: getExtension(files[i].name),
                        fileName: files[i].name,
                        isClientSide: true
                    });
                    //special check for a comma in the name
                    newVal += files[i].name.split(',').join('-') + ',';
                    if (isImage) {
                        var deferred = $q.defer();
                        reader.onload = function (e) {
                            vm.files[index].fileSrc = e.target.result;
                            deferred.resolve(newVal);
                        };
                        promises.push(deferred.promise);
                        reader.readAsDataURL(files[i]);
                    } else {
                        promises.push($q.when(newVal));
                    }
                }
                return $q.all(promises).then(function (p) {
                    //return the last value in the list of promises which will be the final value
                    return $q.when(p[p.length - 1]);
                });
            }
            /**
     * listen for when a file is selected
     * @param {any} event
     * @param {any} args
     */
            function onFilesSelected(event, args) {
                if (args.files && args.files.length > 0) {
                    //set the files collection
                    fileManager.setFiles({
                        propertyAlias: vm.propertyAlias,
                        files: args.files,
                        culture: vm.culture
                    });
                    updateModelFromSelectedFiles(args.files).then(function (newVal) {
                        angularHelper.safeApply($scope, function () {
                            //pass in the file names and the model files
                            notifyFilesSelected(newVal, vm.files);
                            notifyFilesChanged(vm.files);
                        });
                    });
                } else {
                    angularHelper.safeApply($scope);
                }
            }
        }
        ;
        var umbPropertyFileUploadComponent = {
            template: '<div class="umb-property-file-upload"><ng-form name="vm.fileUploadForm"><div class="fileinput-button umb-upload-button-big" style="margin-bottom: 5px;" ng-hide="vm.files.length > 0"><i class="icon icon-page-up"></i><p><localize key="media_clickToUpload">Click to upload</localize></p><umb-single-file-upload></umb-single-file-upload></div><div ng-if="vm.files.length > 0"><div ng-if="!vm.hideSelection"><div class="umb-fileupload clearfix" ng-repeat="file in vm.files"><div ng-if="file.isImage || file.extension == \'svg\'"><div class="gravity-container"><div class="viewport"><img ng-if="file.isClientSide" ng-src="{{file.fileSrc}}" style="max-width: 100%; max-height: 100%" alt="{{file.fileName}}"> <a ng-if="!file.isClientSide" href="{{file.fileSrc}}" target="_blank"><img ng-src="{{file.fileSrc}}" style="max-width: 100%; max-height: 100%" alt="{{file.fileName}}"></a></div></div></div><div ng-if="!file.isImage && file.extension != \'svg\'"><a class="span6 thumbnail tc" ng-show="!file.isClientSide" ng-href="{{file.fileName}}" target="_blank"><span class="file-icon-wrap"><span class="file-icon"><i class="icon icon-document"></i> <span>.{{file.extension}}</span></span></span><div>{{file.fileName}}</div></a><div class="span6 thumbnail tc" ng-show="file.isClientSide"><span class="file-icon-wrap"><span class="file-icon"><i class="icon icon-document"></i> <span>.{{file.extension}}</span></span></span><div>{{file.fileName}}</div></div></div></div><div><a class="btn btn-link btn-crop-delete" ng-click="vm.clear()"><i class="icon-delete red"></i><localize key="content_uploadClear">Remove file</localize></a></div></div><div ng-if="vm.hideSelection"><div ng-transclude></div></div></div></ng-form></div>',
            bindings: {
                culture: '@?',
                propertyAlias: '@',
                value: '<',
                hideSelection: '<',
                /**
       * Called when a file is selected on this instance
       */
                onFilesSelected: '&',
                /**
       * Called when the file collection changes (i.e. a new file has been selected but maybe it wasn't this instance that caused the change)
       */
                onFilesChanged: '&',
                onInit: '&'
            },
            transclude: true,
            controllerAs: 'vm',
            controller: umbPropertyFileUploadController
        };
        angular.module('umbraco.directives').component('umbPropertyFileUpload', umbPropertyFileUploadComponent);
    }());
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:umbSingleFileUpload
* @function
* @restrict A
* @scope
* @description
*  A single file upload field that will reset itself based on the object passed in for the rebuild parameter. This
*  is required because the only way to reset an upload control is to replace it's html.
**/
    function umbSingleFileUpload($compile) {
        return {
            restrict: 'E',
            scope: { rebuild: '=' },
            replace: true,
            template: '<div><input type=\'file\' umb-file-upload /></div>',
            link: function link(scope, el, attrs) {
                scope.$watch('rebuild', function (newVal, oldVal) {
                    if (newVal && newVal !== oldVal) {
                        //recompile it!
                        el.html('<input type=\'file\' umb-file-upload />');
                        $compile(el.contents())(scope);
                    }
                });
            }
        };
    }
    angular.module('umbraco.directives').directive('umbSingleFileUpload', umbSingleFileUpload);
    'use strict';
    (function () {
        'use strict';
        function ChangePasswordController($scope) {
            function resetModel(isNew) {
                //the model config will contain an object, if it does not we'll create defaults
                //NOTE: We will not support doing the password regex on the client side because the regex on the server side
                //based on the membership provider cannot always be ported to js from .net directly.        
                /*
      {
          hasPassword: true/false,
          requiresQuestionAnswer: true/false,
          enableReset: true/false,
          enablePasswordRetrieval: true/false,
          minPasswordLength: 10
      }
      */
                $scope.showReset = false;
                //set defaults if they are not available
                if ($scope.config.disableToggle === undefined) {
                    $scope.config.disableToggle = false;
                }
                if ($scope.config.hasPassword === undefined) {
                    $scope.config.hasPassword = false;
                }
                if ($scope.config.enablePasswordRetrieval === undefined) {
                    $scope.config.enablePasswordRetrieval = true;
                }
                if ($scope.config.requiresQuestionAnswer === undefined) {
                    $scope.config.requiresQuestionAnswer = false;
                }
                //don't enable reset if it is new - that doesn't make sense
                if (isNew === 'true') {
                    $scope.config.enableReset = false;
                } else if ($scope.config.enableReset === undefined) {
                    $scope.config.enableReset = true;
                }
                if ($scope.config.minPasswordLength === undefined) {
                    $scope.config.minPasswordLength = 0;
                }
                //set the model defaults
                if (!angular.isObject($scope.passwordValues)) {
                    //if it's not an object then just create a new one
                    $scope.passwordValues = {
                        newPassword: null,
                        oldPassword: null,
                        reset: null,
                        answer: null
                    };
                } else {
                    //just reset the values
                    if (!isNew) {
                        //if it is new, then leave the generated pass displayed
                        $scope.passwordValues.newPassword = null;
                        $scope.passwordValues.oldPassword = null;
                    }
                    $scope.passwordValues.reset = null;
                    $scope.passwordValues.answer = null;
                }
                //the value to compare to match passwords
                if (!isNew) {
                    $scope.passwordValues.confirm = '';
                } else if ($scope.passwordValues.newPassword && $scope.passwordValues.newPassword.length > 0) {
                    //if it is new and a new password has been set, then set the confirm password too
                    $scope.passwordValues.confirm = $scope.passwordValues.newPassword;
                }
            }
            resetModel($scope.isNew);
            //if there is no password saved for this entity , it must be new so we do not allow toggling of the change password, it is always there
            //with validators turned on.
            $scope.changing = $scope.config.disableToggle === true || !$scope.config.hasPassword;
            //we're not currently changing so set the model to null
            if (!$scope.changing) {
                $scope.passwordValues = null;
            }
            $scope.doChange = function () {
                resetModel();
                $scope.changing = true;
                //if there was a previously generated password displaying, clear it
                $scope.passwordValues.generatedPassword = null;
                $scope.passwordValues.confirm = null;
            };
            $scope.cancelChange = function () {
                $scope.changing = false;
                //set model to null
                $scope.passwordValues = null;
            };
            var unsubscribe = [];
            //listen for the saved event, when that occurs we'll 
            //change to changing = false;
            unsubscribe.push($scope.$on('formSubmitted', function () {
                if ($scope.config.disableToggle === false) {
                    $scope.changing = false;
                }
            }));
            unsubscribe.push($scope.$on('formSubmitting', function () {
                //if there was a previously generated password displaying, clear it
                if ($scope.changing && $scope.passwordValues) {
                    $scope.passwordValues.generatedPassword = null;
                } else if (!$scope.changing) {
                    //we are not changing, so the model needs to be null
                    $scope.passwordValues = null;
                }
            }));
            //when the scope is destroyed we need to unsubscribe
            $scope.$on('$destroy', function () {
                for (var u in unsubscribe) {
                    unsubscribe[u]();
                }
            });
            $scope.showOldPass = function () {
                return $scope.config.hasPassword && !$scope.config.allowManuallyChangingPassword && !$scope.config.enablePasswordRetrieval && !$scope.showReset;
            };
            // TODO: I don't think we need this or the cancel button, this can be up to the editor rendering this directive
            $scope.showCancelBtn = function () {
                return $scope.config.disableToggle !== true && $scope.config.hasPassword;
            };
        }
        function ChangePasswordDirective() {
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div><div class="alert alert-success text-center" ng-hide="!passwordValues.generatedPassword"><small>Password has been reset to:</small><br><strong>{{passwordValues.generatedPassword}}</strong></div><div ng-switch="changing"><div ng-switch-when="false"><a ng-click="doChange()" class="btn btn-small"><localize key="general_changePassword">Change password</localize></a></div><div ng-switch-when="true"><ng-form name="passwordForm"><umb-control-group alias="resetPassword" label="@user_resetPassword" ng-show="config.enableReset"><input type="checkbox" ng-model="passwordValues.reset" id="Checkbox1" name="resetPassword" val-server-field="resetPassword" no-dirty-check ng-change="showReset = !showReset"> <span ng-messages="passwordForm.resetPassword.$error" show-validation-on-submit><span class="help-inline" ng-message="valServerField">{{passwordForm.resetPassword.errorMsg}}</span></span></umb-control-group><umb-control-group alias="oldPassword" label="@user_oldPassword" ng-if="showOldPass()" required="true"><input type="password" name="oldPassword" ng-model="passwordValues.oldPassword" class="input-block-level umb-textstring textstring" required val-server-field="oldPassword" no-dirty-check> <span ng-messages="passwordForm.oldPassword.$error" show-validation-on-submit><span class="help-inline" ng-message="required">Required</span> <span class="help-inline" ng-message="valServerField">{{passwordForm.oldPassword.errorMsg}}</span></span></umb-control-group><umb-control-group alias="password" label="@user_newPassword" ng-if="!showReset" required="true"><input type="password" name="password" ng-model="passwordValues.newPassword" class="input-block-level umb-textstring textstring" required val-server-field="password" ng-minlength="{{config.minPasswordLength}}" no-dirty-check> <span ng-messages="passwordForm.password.$error" show-validation-on-submit><span class="help-inline" ng-message="required">Required</span> <span class="help-inline" ng-message="minlength">Minimum {{config.minPasswordLength}} characters</span> <span class="help-inline" ng-message="valServerField">{{passwordForm.password.errorMsg}}</span></span></umb-control-group><umb-control-group alias="confirmpassword" label="@user_confirmNewPassword" ng-if="!showReset" required="true"><input type="password" name="confirmpassword" ng-model="passwordValues.confirm" class="input-block-level umb-textstring textstring" val-compare="password" no-dirty-check> <span ng-messages="passwordForm.confirmpassword.$error" show-validation-on-submit><span class="help-inline" ng-message="valCompare"><localize key="user_passwordMismatch">The confirmed password doesn\'t match the new password!</localize></span></span></umb-control-group><a ng-click="cancelChange()" ng-show="showCancelBtn()" class="btn btn-small"><localize key="general_cancel">Cancel</localize></a></ng-form></div></div></div>',
                controller: 'Umbraco.Editors.Users.ChangePasswordDirectiveController',
                scope: {
                    isNew: '=?',
                    passwordValues: '=',
                    config: '='
                }
            };
            return directive;
        }
        angular.module('umbraco.directives').controller('Umbraco.Editors.Users.ChangePasswordDirectiveController', ChangePasswordController);
        angular.module('umbraco.directives').directive('changePassword', ChangePasswordDirective);
    }());
    'use strict';
    /** 
@ngdoc directive
@name umbraco.directives.directive:umbUserGroupPreview
@restrict E
@scope

@description
Use this directive to render a user group preview, where you can see the permissions the user or group has in the back office.

<h3>Markup example</h3>
<pre>
    <div>
        <umb-user-group-preview
            ng-repeat="userGroup in vm.user.userGroups"
            icon="userGroup.icon"
            name="userGroup.name"
            sections="userGroup.sections"
            content-start-node="userGroup.contentStartNode"
            media-start-node="userGroup.mediaStartNode"
            allow-remove="!vm.user.isCurrentUser"
            on-remove="vm.removeSelectedItem($index, vm.user.userGroups)">
        </umb-user-group-preview>
    </div>
</pre>

@param {string} icon (<code>binding</code>): The user group icon.
@param {string} name (<code>binding</code>): The user group name.
@param {array} sections (<code>binding</code>) Lists out the sections where the user has authority to edit.
@param {string} contentStartNode (<code>binding</code>)
<ul>
    <li>The starting point in the tree of the content section.</li>
    <li>So the user has no authority to work on other branches, only on this branch in the content section.</li>
</ul>
@param {boolean} hideContentStartNode (<code>binding</code>) Hides the contentStartNode.
@param {string} mediaStartNode (<code>binding</code>)
<ul>
<li> The starting point in the tree of the media section.</li>
<li> So the user has no authority to work on other branches, only on this branch in the media section.</li>
</ul>
@param {boolean} hideMediaStartNode (<code>binding</code>) Hides the mediaStartNode.
@param {array} permissions (<code>binding<code>) A list of permissions, the user can have.
@param {boolean} allowRemove (<code>binding</code>): Shows or Hides the remove button.
@param {function} onRemove (<code>expression</code>): Callback function when the remove button is clicked.
@param {boolean} allowEdit (<code>binding</code>): Shows or Hides the edit button.
@param {function} onEdit (<code>expression</code>): Callback function when the edit button is clicked.
**/
    (function () {
        'use strict';
        function UserGroupPreviewDirective() {
            function link(scope, el, attr, ctrl) {
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-user-group-preview"><i ng-if="icon" class="umb-user-group-preview__icon {{ icon }}"></i><div class="umb-user-group-preview__content"><div class="umb-user-group-preview__name">{{ name }}</div><div class="umb-user-group-preview__permissions" ng-if="sections"><span><span class="bold"><localize key="main_sections">Sections</localize>:</span> <span ng-repeat="section in sections" class="umb-user-group-preview__permission">{{ section.name }}</span> <span ng-if="sections.length === 0">All sections</span></span></div><div class="umb-user-group-preview__permissions" ng-if="!hideContentStartNode"><span><span class="bold"><localize key="user_startnode">Content start node</localize>:</span> <span ng-if="!contentStartNode"><localize key="user_noStartNode">No start node selected</localize></span> <span ng-if="contentStartNode">{{ contentStartNode.name }}</span></span></div><div class="umb-user-group-preview__permissions" ng-if="!hideMediaStartNode"><span><span class="bold"><localize key="user_mediastartnode">Media start node</localize>:</span> <span ng-if="!mediaStartNode"><localize key="user_noStartNode">No start node selected</localize></span> <span ng-if="mediaStartNode">{{ mediaStartNode.name }}</span></span></div><div class="umb-user-group-preview__permissions" ng-if="permissions"><span><span class="bold"><localize key="general_rights">Permissions</localize>:</span> <span ng-repeat="permission in permissions" class="umb-user-group-preview__permission">{{ permission.name }}</span></span></div></div><div class="umb-user-group-preview__actions"><a class="umb-user-group-preview__action" title="Edit" ng-if="allowEdit" ng-click="onEdit()"><localize key="general_edit">Edit</localize></a> <a class="umb-user-group-preview__action umb-user-group-preview__action--red" title="Remove" ng-if="allowRemove" ng-click="onRemove()"><localize key="general_remove">Remove</localize></a></div></div>',
                scope: {
                    icon: '=?',
                    name: '=',
                    sections: '=?',
                    contentStartNode: '=?',
                    hideContentStartNode: '@?',
                    mediaStartNode: '=?',
                    hideMediaStartNode: '@?',
                    permissions: '=?',
                    allowRemove: '=?',
                    allowEdit: '=?',
                    onRemove: '&?',
                    onEdit: '&?'
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbUserGroupPreview', UserGroupPreviewDirective);
    }());
    'use strict';
    (function () {
        'use strict';
        function UserPreviewDirective() {
            function link(scope, el, attr, ctrl) {
            }
            var directive = {
                restrict: 'E',
                replace: true,
                template: '<div class="umb-user-preview"><div class="umb-user-preview__avatar"><umb-avatar size="xxs" color="secondary" name="{{name}}" img-src="{{avatars[0]}}" img-srcset="{{avatars[1]}} 2x, {{avatars[2]}} 3x"></umb-avatar></div><div class="umb-user-preview__content"><div class="umb-user-preview__name">{{ name }}</div></div><div class="umb-user-preview__actions"><a class="umb-user-preview__action umb-user-preview__action--red" title="Remove" ng-if="allowRemove" ng-click="onRemove()"><localize key="general_remove">Remove</localize></a><div></div></div></div>',
                scope: {
                    avatars: '=?',
                    name: '=',
                    allowRemove: '=?',
                    onRemove: '&?'
                },
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbUserPreview', UserPreviewDirective);
    }());
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:autoScale
* @element div
* @function
* @description
* Resize div's automatically to fit to the bottom of the screen, as an optional parameter an y-axis offset can be set
* So if you only want to scale the div to 70 pixels from the bottom you pass "70"

* @example
* <example module="umbraco.directives">
*    <file name="index.html">
*        <div auto-scale="70" class="input-block-level"></div>
*    </file>
* </example>
**/
    angular.module('umbraco.directives').directive('autoScale', function ($window, $timeout, windowResizeListener) {
        return function (scope, el, attrs) {
            var totalOffset = 0;
            var offsety = parseInt(attrs.autoScale, 10);
            var window = angular.element($window);
            if (offsety !== undefined) {
                totalOffset += offsety;
            }
            $timeout(function () {
                setElementSize();
            });
            function setElementSize() {
                el.height(window.height() - (el.offset().top + totalOffset));
            }
            var resizeCallback = function resizeCallback() {
                setElementSize();
            };
            windowResizeListener.register(resizeCallback);
            //ensure to unregister from all events and kill jquery plugins
            scope.$on('$destroy', function () {
                windowResizeListener.unregister(resizeCallback);
            });
        };
    });
    'use strict';
    angular.module('umbraco.directives').directive('disableTabindex', function (tabbableService) {
        return {
            restrict: 'A',
            //Can only be used as an attribute,
            scope: { 'disableTabindex': '<' },
            link: function link(scope, element, attrs) {
                if (scope.disableTabindex) {
                    var domChange = function domChange(mutationsList, observer) {
                        var _iteratorNormalCompletion = true;
                        var _didIteratorError = false;
                        var _iteratorError = undefined;
                        try {
                            for (var _iterator = mutationsList[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                var mutation = _step.value;
                                //DOM items have been added or removed
                                if (mutation.type == 'childList') {
                                    //Check if any child items in mutation.target contain an input
                                    var childInputs = tabbableService.tabbable(mutation.target);
                                    //For each item in childInputs - override or set HTML attribute tabindex="-1"
                                    angular.forEach(childInputs, function (element) {
                                        angular.element(element).attr('tabindex', '-1');
                                    });
                                }
                            }
                        } catch (err) {
                            _didIteratorError = true;
                            _iteratorError = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion && _iterator.return != null) {
                                    _iterator.return();
                                }
                            } finally {
                                if (_didIteratorError) {
                                    throw _iteratorError;
                                }
                            }
                        }
                    };
                    // Start observing the target node for configured mutations
                    //GO GO GO
                    //Select the node that will be observed for mutations (native DOM element not jQLite version)
                    var targetNode = element[0];
                    //Watch for DOM changes - so when the property editor subview loads in
                    //We can be notified its updated the child elements inside the DIV we are watching
                    var observer = new MutationObserver(domChange);
                    // Options for the observer (which mutations to observe)
                    var config = {
                        attributes: true,
                        childList: true,
                        subtree: false
                    };
                    observer.observe(targetNode, config);
                }
            }
        };
    });
    'use strict';
    angular.module('umbraco.directives').directive('retriveDomElement', function () {
        var directiveDefinitionObject = {
            restrict: 'A',
            selector: '[retriveDomElement]',
            scope: { 'retriveDomElement': '&' },
            link: {
                post: function post(scope, iElement, iAttrs, controller) {
                    scope.retriveDomElement({
                        element: iElement,
                        attributes: iAttrs
                    });
                }
            }
        };
        return directiveDefinitionObject;
    });
    'use strict';
    /**
 * Konami Code directive for AngularJS
 * @version v0.0.1
 * @license MIT License, https://www.opensource.org/licenses/MIT
 */
    angular.module('umbraco.directives').directive('konamiCode', [
        '$document',
        function ($document) {
            var konamiKeysDefault = [
                38,
                38,
                40,
                40,
                37,
                39,
                37,
                39,
                66,
                65
            ];
            return {
                restrict: 'A',
                link: function link(scope, element, attr) {
                    if (!attr.konamiCode) {
                        throw 'Konami directive must receive an expression as value.';
                    }
                    // Let user define a custom code.
                    var konamiKeys = attr.konamiKeys || konamiKeysDefault;
                    var keyIndex = 0;
                    /**
       * Fired when konami code is type.
       */
                    function activated() {
                        if ('konamiOnce' in attr) {
                            stopListening();
                        }
                        // Execute expression.
                        scope.$eval(attr.konamiCode);
                    }
                    /**
       * Handle keydown events.
       */
                    function keydown(e) {
                        if (e.keyCode === konamiKeys[keyIndex++]) {
                            if (keyIndex === konamiKeys.length) {
                                keyIndex = 0;
                                activated();
                            }
                        } else {
                            keyIndex = 0;
                        }
                    }
                    /**
       * Stop to listen typing.
       */
                    function stopListening() {
                        $document.off('keydown', keydown);
                    }
                    // Start listening to key typing.
                    $document.on('keydown', keydown);
                    // Stop listening when scope is destroyed.
                    scope.$on('$destroy', stopListening);
                }
            };
        }
    ]);
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:noPasswordManager
* @attribte
* @function
* @description
* Added attributes to block password manager elements should as LastPass

* @example
* <example module="umbraco.directives">
*    <file name="index.html">
*        <input type="text" no-password-manager />
*    </file>
* </example>
**/
    angular.module('umbraco.directives').directive('noPasswordManager', function () {
        return {
            restrict: 'A',
            link: function link(scope, element, attrs) {
                element.attr('data-lpignore', 'true');
            }
        };
    });
    'use strict';
    angular.module('umbraco.directives').directive('umbIsolateForm', function () {
        return {
            restrict: 'A',
            require: [
                'form',
                '^form'
            ],
            link: function link(scope, element, attrs, forms) {
                forms[1].$removeControl(forms[0]);
            }
        };
    });
    'use strict';
    /**
@ngdoc directive
@name umbraco.directives.directive:umbKeyboardList
@restrict E

@description
<b>Added in versions 7.7.0</b>: Use this directive to add arrow up and down keyboard shortcuts to a list. Use this together with the {@link umbraco.directives.directive:umbDropdown umbDropdown} component to make easy accessible dropdown menus.

<h3>Markup example</h3>
<pre>
    <div>
        <ul umb-keyboard-list>
            <li><a href="">Item 1</a></li>
            <li><a href="">Item 2</a></li>
            <li><a href="">Item 3</a></li>
            <li><a href="">Item 4</a></li>
            <li><a href="">Item 5</a></li>
            <li><a href="">Item 6</a></li>
        </ul>
    </div>
</pre>

<h3>Use in combination with</h3>
<ul>
    <li>{@link umbraco.directives.directive:umbDropdown umbDropdown}</li>
</ul>

**/
    angular.module('umbraco.directives').directive('umbKeyboardList', [
        '$document',
        '$timeout',
        function ($document, $timeout) {
            return {
                restrict: 'A',
                link: function link(scope, element, attr) {
                    var listItems = [];
                    var currentIndex = 0;
                    var focusSet = false;
                    $timeout(function () {
                        // get list of all links in the list
                        listItems = element.find('li :tabbable');
                    });
                    // Handle keydown events
                    function keydown(event) {
                        $timeout(function () {
                            checkFocus();
                            // arrow down
                            if (event.keyCode === 40) {
                                arrowDown();
                            }
                            // arrow up
                            if (event.keyCode === 38) {
                                arrowUp();
                            }
                        });
                    }
                    function checkFocus() {
                        var found = false;
                        // check if any element has focus
                        angular.forEach(listItems, function (item, index) {
                            if ($(item).is(':focus')) {
                                // if an element already has focus set the
                                // currentIndex so we navigate from that element
                                currentIndex = index;
                                focusSet = true;
                                found = true;
                            }
                        });
                        // If we don't find an element with focus we reset the currentIndex and the focusSet flag
                        // we do this because you can have navigated away from the list with tab and we want to reset it if you navigate back
                        if (!found) {
                            currentIndex = 0;
                            focusSet = false;
                        }
                    }
                    function arrowDown() {
                        if (currentIndex < listItems.length - 1) {
                            // only bump the current index if the focus is already 
                            // set else we just want to focus the first element
                            if (focusSet) {
                                currentIndex++;
                            }
                            listItems[currentIndex].trigger('focus');
                            focusSet = true;
                        }
                    }
                    function arrowUp() {
                        if (currentIndex > 0) {
                            currentIndex--;
                            listItems[currentIndex].trigger('focus');
                        }
                    }
                    // Stop to listen typing.
                    function stopListening() {
                        $document.off('keydown', keydown);
                    }
                    // Start listening to key typing.
                    $document.on('keydown', keydown);
                    // Stop listening when scope is destroyed.
                    scope.$on('$destroy', stopListening);
                }
            };
        }
    ]);
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:noDirtyCheck
* @restrict A
* @description Can be attached to form inputs to prevent them from setting the form as dirty (https://stackoverflow.com/questions/17089090/prevent-input-from-setting-form-dirty-angularjs)
**/
    function noDirtyCheck() {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function link(scope, elm, attrs, ctrl) {
                var alwaysFalse = {
                    get: function get() {
                        return false;
                    },
                    set: function set() {
                    }
                };
                Object.defineProperty(ctrl, '$pristine', alwaysFalse);
                Object.defineProperty(ctrl, '$dirty', alwaysFalse);
            }
        };
    }
    angular.module('umbraco.directives.validation').directive('noDirtyCheck', noDirtyCheck);
    'use strict';
    (function () {
        'use strict';
        function showValidationOnSubmit(serverValidationManager) {
            return {
                require: [
                    'ngMessages',
                    '^^?valFormManager'
                ],
                restrict: 'A',
                scope: { form: '=?' },
                link: function link(scope, element, attr, ctrl) {
                    var formMgr = ctrl.length > 1 ? ctrl[1] : null;
                    //We can either get the form submitted status by the parent directive valFormManager
                    //or we can check upwards in the DOM for the css class... lets try both :)
                    //The initial hidden state can't always be hidden because when we switch variants in the content editor we cannot
                    //reset the status.
                    var submitted = element.closest('.show-validation').length > 0 || formMgr && formMgr.showValidation;
                    if (!submitted) {
                        element.hide();
                    }
                    var unsubscribe = [];
                    unsubscribe.push(scope.$on('formSubmitting', function (ev, args) {
                        element.show();
                    }));
                    unsubscribe.push(scope.$on('formSubmitted', function (ev, args) {
                        element.hide();
                    }));
                    //no isolate scope to listen to element destroy
                    element.on('$destroy', function () {
                        for (var u in unsubscribe) {
                            unsubscribe[u]();
                        }
                    });
                }
            };
        }
        angular.module('umbraco.directives.validation').directive('showValidationOnSubmit', showValidationOnSubmit);
    }());
    'use strict';
    (function () {
        'use strict';
        function SetDirtyOnChange() {
            function link(scope, el, attr, ctrls) {
                var formCtrl = ctrls[0];
                if (ctrls.length > 1 && ctrls[1]) {
                    //if an ngModel is supplied, assign a render function which is called when the model is changed
                    var modelCtrl = ctrls[1];
                    var oldRender = modelCtrl.$render;
                    modelCtrl.$render = function () {
                        formCtrl.$setDirty();
                        //call any previously set render method
                        if (oldRender) {
                            oldRender();
                        }
                    };
                } else {
                    var initValue = attr.umbSetDirtyOnChange;
                    attr.$observe('umbSetDirtyOnChange', function (newValue) {
                        if (newValue !== initValue) {
                            formCtrl.$setDirty();
                        }
                    });
                }
            }
            var directive = {
                require: [
                    '^^form',
                    '?ngModel'
                ],
                restrict: 'A',
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('umbSetDirtyOnChange', SetDirtyOnChange);
    }());
    'use strict';
    angular.module('umbraco.directives.validation').directive('valCompare', function () {
        return {
            require: [
                'ngModel',
                '^^form'
            ],
            link: function link(scope, elem, attrs, ctrls) {
                var ctrl = ctrls[0];
                var formCtrl = ctrls[1];
                var otherInput = formCtrl[attrs.valCompare];
                //normal validator on the original source
                ctrl.$validators.valCompare = function (modelValue, viewValue) {
                    return viewValue === otherInput.$viewValue;
                };
                //custom parser on the destination source with custom validation applied to the original source
                otherInput.$parsers.push(function (value) {
                    ctrl.$setValidity('valCompare', value === ctrl.$viewValue);
                    return value;
                });
            }
        };
    });
    'use strict';
    /**
    * @ngdoc directive
    * @name umbraco.directives.directive:valEmail
    * @restrict A
    * @description A custom directive to validate an email address string, this is required because angular's default validator is incorrect.
    **/
    function valEmail(valEmailExpression) {
        return {
            require: 'ngModel',
            restrict: 'A',
            link: function link(scope, elm, attrs, ctrl) {
                function patternValidator(viewValue) {
                    //NOTE: we don't validate on empty values, use required validator for that
                    if (!viewValue || valEmailExpression.EMAIL_REGEXP.test(viewValue)) {
                        //assign a message to the validator
                        ctrl.errorMsg = '';
                        return true;
                    } else {
                        //assign a message to the validator
                        ctrl.errorMsg = 'Invalid email';
                        return false;
                    }
                }
                ;
                //if there is an attribute: type="email" then we need to remove the built in validator
                // this isn't totally required but it gives us the ability to completely control the validation syntax so we don't
                // run into old problems like http://issues.umbraco.org/issue/U4-8445
                if (attrs.type === 'email') {
                    ctrl.$validators = {};
                }
                ctrl.$validators.valEmail = function (modelValue, viewValue) {
                    return patternValidator(viewValue);
                };
            }
        };
    }
    angular.module('umbraco.directives.validation').directive('valEmail', valEmail).factory('valEmailExpression', function () {
        var emailRegex = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
        return { EMAIL_REGEXP: emailRegex };
    });
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:valFormManager
* @restrict A
* @require formController
* @description Used to broadcast an event to all elements inside this one to notify that form validation has
* changed. If we don't use this that means you have to put a watch for each directive on a form's validation
* changing which would result in much higher processing. We need to actually watch the whole $error collection of a form
* because just watching $valid or $invalid doesn't acurrately trigger form validation changing.
* This also sets the show-validation (or a custom) css class on the element when the form is invalid - this lets
* us css target elements to be displayed when the form is submitting/submitted.
* Another thing this directive does is to ensure that any .control-group that contains form elements that are invalid will
* be marked with the 'error' css class. This ensures that labels included in that control group are styled correctly.
**/
    function valFormManager(serverValidationManager, $rootScope, $timeout, $location, overlayService, eventsService, $routeParams, navigationService, editorService, localizationService) {
        var SHOW_VALIDATION_CLASS_NAME = 'show-validation';
        var SAVING_EVENT_NAME = 'formSubmitting';
        var SAVED_EVENT_NAME = 'formSubmitted';
        return {
            require: [
                'form',
                '^^?valFormManager',
                '^^?valSubView'
            ],
            restrict: 'A',
            controller: function controller($scope) {
                //This exposes an API for direct use with this directive
                var unsubscribe = [];
                var self = this;
                //This is basically the same as a directive subscribing to an event but maybe a little
                // nicer since the other directive can use this directive's API instead of a magical event
                this.onValidationStatusChanged = function (cb) {
                    unsubscribe.push($scope.$on('valStatusChanged', function (evt, args) {
                        cb.apply(self, [
                            evt,
                            args
                        ]);
                    }));
                };
                this.showValidation = $scope.showValidation === true;
                //Ensure to remove the event handlers when this instance is destroyted
                $scope.$on('$destroy', function () {
                    for (var u in unsubscribe) {
                        unsubscribe[u]();
                    }
                });
            },
            link: function link(scope, element, attr, ctrls) {
                function notifySubView() {
                    if (subView) {
                        subView.valStatusChanged({
                            form: formCtrl,
                            showValidation: scope.showValidation
                        });
                    }
                }
                var formCtrl = ctrls[0];
                var parentFormMgr = ctrls.length > 0 ? ctrls[1] : null;
                var subView = ctrls.length > 1 ? ctrls[2] : null;
                var labels = {};
                var labelKeys = [
                    'prompt_unsavedChanges',
                    'prompt_unsavedChangesWarning',
                    'prompt_discardChanges',
                    'prompt_stay'
                ];
                localizationService.localizeMany(labelKeys).then(function (values) {
                    labels.unsavedChangesTitle = values[0];
                    labels.unsavedChangesContent = values[1];
                    labels.discardChangesButton = values[2];
                    labels.stayButton = values[3];
                });
                //watch the list of validation errors to notify the application of any validation changes
                scope.$watch(function () {
                    //the validators are in the $error collection: https://docs.angularjs.org/api/ng/type/form.FormController#$error
                    //since each key is the validator name (i.e. 'required') we can't just watch the number of keys, we need to watch
                    //the sum of the items inside of each key
                    //get the lengths of each array for each key in the $error collection
                    var validatorLengths = _.map(formCtrl.$error, function (val, key) {
                        return val.length;
                    });
                    //sum up all numbers in the resulting array
                    var sum = _.reduce(validatorLengths, function (memo, num) {
                        return memo + num;
                    }, 0);
                    //this is the value we watch to notify of any validation changes on the form
                    return sum;
                }, function (e) {
                    scope.$broadcast('valStatusChanged', { form: formCtrl });
                    notifySubView();
                    //find all invalid elements' .control-group's and apply the error class
                    var inError = element.find('.control-group .ng-invalid').closest('.control-group');
                    inError.addClass('error');
                    //find all control group's that have no error and ensure the class is removed
                    var noInError = element.find('.control-group .ng-valid').closest('.control-group').not(inError);
                    noInError.removeClass('error');
                });
                //This tracks if the user is currently saving a new item, we use this to determine
                // if we should display the warning dialog that they are leaving the page - if a new item
                // is being saved we never want to display that dialog, this will also cause problems when there
                // are server side validation issues.
                var isSavingNewItem = false;
                //we should show validation if there are any msgs in the server validation collection
                if (serverValidationManager.items.length > 0 || parentFormMgr && parentFormMgr.showValidation) {
                    element.addClass(SHOW_VALIDATION_CLASS_NAME);
                    scope.showValidation = true;
                    notifySubView();
                }
                var unsubscribe = [];
                //listen for the forms saving event
                unsubscribe.push(scope.$on(SAVING_EVENT_NAME, function (ev, args) {
                    element.addClass(SHOW_VALIDATION_CLASS_NAME);
                    scope.showValidation = true;
                    notifySubView();
                    //set the flag so we can check to see if we should display the error.
                    isSavingNewItem = $routeParams.create;
                }));
                //listen for the forms saved event
                unsubscribe.push(scope.$on(SAVED_EVENT_NAME, function (ev, args) {
                    //remove validation class
                    element.removeClass(SHOW_VALIDATION_CLASS_NAME);
                    scope.showValidation = false;
                    notifySubView();
                    //clear form state as at this point we retrieve new data from the server
                    //and all validation will have cleared at this point
                    formCtrl.$setPristine();
                }));
                var confirmed = false;
                //This handles the 'unsaved changes' dialog which is triggered when a route is attempting to be changed but
                // the form has pending changes
                var locationEvent = $rootScope.$on('$locationChangeStart', function (event, nextLocation, currentLocation) {
                    var infiniteEditors = editorService.getEditors();
                    if (!formCtrl.$dirty && infiniteEditors.length === 0 || isSavingNewItem && infiniteEditors.length === 0) {
                        return;
                    }
                    var nextPath = nextLocation.split('#')[1];
                    if (nextPath && !confirmed) {
                        if (navigationService.isRouteChangingNavigation(currentLocation, nextLocation)) {
                            if (nextPath.indexOf('%253') || nextPath.indexOf('%252')) {
                                nextPath = decodeURIComponent(nextPath);
                            }
                            // Open discard changes overlay
                            var overlay = {
                                'view': 'default',
                                'title': labels.unsavedChangesTitle,
                                'content': labels.unsavedChangesContent,
                                'disableBackdropClick': true,
                                'disableEscKey': true,
                                'submitButtonLabel': labels.stayButton,
                                'closeButtonLabel': labels.discardChangesButton,
                                submit: function submit() {
                                    overlayService.close();
                                },
                                close: function close() {
                                    // close all editors
                                    editorService.closeAll();
                                    // allow redirection
                                    navigationService.clearSearch();
                                    //we need to break the path up into path and query
                                    var parts = nextPath.split('?');
                                    var query = {};
                                    if (parts.length > 1) {
                                        _.each(parts[1].split('&'), function (q) {
                                            var keyVal = q.split('=');
                                            query[keyVal[0]] = keyVal[1];
                                        });
                                    }
                                    $location.path(parts[0]).search(query);
                                    overlayService.close();
                                    confirmed = true;
                                }
                            };
                            overlayService.open(overlay);
                            //prevent the route!
                            event.preventDefault();
                            //raise an event
                            eventsService.emit('valFormManager.pendingChanges', true);
                        }
                    }
                });
                unsubscribe.push(locationEvent);
                //Ensure to remove the event handler when this instance is destroyted
                scope.$on('$destroy', function () {
                    for (var u in unsubscribe) {
                        unsubscribe[u]();
                    }
                });
                $timeout(function () {
                    formCtrl.$setPristine();
                }, 1000);
            }
        };
    }
    angular.module('umbraco.directives.validation').directive('valFormManager', valFormManager);
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:valHighlight
* @restrict A
* @description Used on input fields when you want to signal that they are in error, this will highlight the item for 1 second
**/
    function valHighlight($timeout) {
        return {
            restrict: 'A',
            link: function link(scope, element, attrs, ctrl) {
                attrs.$observe('valHighlight', function (newVal) {
                    if (newVal === 'true') {
                        element.addClass('highlight-error');
                        $timeout(function () {
                            //set the bound scope property to false
                            scope[attrs.valHighlight] = false;
                        }, 1000);
                    } else {
                        element.removeClass('highlight-error');
                    }
                });
            }
        };
    }
    angular.module('umbraco.directives.validation').directive('valHighlight', valHighlight);
    'use strict';
    (function () {
        /**
  * @ngdoc directive
  * @name umbraco.directives.directive:multi
  * @restrict A
  * @description Used on input fields when you want to validate multiple fields at once.
  **/
        function multi($parse, $rootScope) {
            return {
                restrict: 'A',
                require: 'ngModel',
                link: function link(scope, elem, attrs, ngModelCtrl) {
                    var validate = $parse(attrs.multi)(scope);
                    ngModelCtrl.$viewChangeListeners.push(function () {
                        // ngModelCtrl.$setValidity('multi', validate());
                        $rootScope.$broadcast('multi:valueChanged');
                    });
                    var deregisterListener = scope.$on('multi:valueChanged', function (event) {
                        ngModelCtrl.$setValidity('multi', validate());
                    });
                    scope.$on('$destroy', deregisterListener);    // optional, only required for $rootScope.$on
                }
            };
        }
        angular.module('umbraco.directives.validation').directive('multi', [
            '$parse',
            '$rootScope',
            multi
        ]);
    }());
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:valPropertyMsg
* @restrict A
* @element textarea
* @requires formController
* @description This directive is used to control the display of the property level validation message.
* We will listen for server side validation changes
* and when an error is detected for this property we'll show the error message.
* In order for this directive to work, the valFormManager directive must be placed on the containing form.
**/
    function valPropertyMsg(serverValidationManager) {
        return {
            require: [
                '^^form',
                '^^valFormManager',
                '^^umbProperty',
                '?^^umbVariantContent'
            ],
            replace: true,
            restrict: 'E',
            template: '<div ng-show="errorMsg != \'\'" class=\'alert alert-error property-error\' >{{errorMsg}}</div>',
            scope: {},
            link: function link(scope, element, attrs, ctrl) {
                var unsubscribe = [];
                var watcher = null;
                var hasError = false;
                //create properties on our custom scope so we can use it in our template
                scope.errorMsg = '';
                //the property form controller api
                var formCtrl = ctrl[0];
                //the valFormManager controller api
                var valFormManager = ctrl[1];
                //the property controller api
                var umbPropCtrl = ctrl[2];
                //the variants controller api
                var umbVariantCtrl = ctrl[3];
                var currentProperty = umbPropCtrl.property;
                scope.currentProperty = currentProperty;
                var currentCulture = currentProperty.culture;
                if (umbVariantCtrl) {
                    //if we are inside of an umbVariantContent directive
                    var currentVariant = umbVariantCtrl.editor.content;
                    // Lets check if we have variants and we are on the default language then ...
                    if (umbVariantCtrl.content.variants.length > 1 && !currentVariant.language.isDefault && !currentCulture && !currentProperty.unlockInvariantValue) {
                        //This property is locked cause its a invariant property shown on a non-default language.
                        //Therefor do not validate this field.
                        return;
                    }
                }
                // if we have reached this part, and there is no culture, then lets fallback to invariant. To get the validation feedback for invariant language.
                currentCulture = currentCulture || 'invariant';
                // Gets the error message to display
                function getErrorMsg() {
                    //this can be null if no property was assigned
                    if (scope.currentProperty) {
                        //first try to get the error msg from the server collection
                        var err = serverValidationManager.getPropertyError(scope.currentProperty.alias, null, '');
                        //if there's an error message use it
                        if (err && err.errorMsg) {
                            return err.errorMsg;
                        } else {
                            // TODO: localize
                            return scope.currentProperty.propertyErrorMessage ? scope.currentProperty.propertyErrorMessage : 'Property has errors';
                        }
                    }
                    // TODO: localize
                    return 'Property has errors';
                }
                // We need to subscribe to any changes to our model (based on user input)
                // This is required because when we have a server error we actually invalidate 
                // the form which means it cannot be resubmitted. 
                // So once a field is changed that has a server error assigned to it
                // we need to re-validate it for the server side validator so the user can resubmit
                // the form. Of course normal client-side validators will continue to execute. 
                function startWatch() {
                    //if there's not already a watch
                    if (!watcher) {
                        watcher = scope.$watch('currentProperty.value', function (newValue, oldValue) {
                            if (angular.equals(newValue, oldValue)) {
                                return;
                            }
                            var errCount = 0;
                            for (var e in formCtrl.$error) {
                                if (angular.isArray(formCtrl.$error[e])) {
                                    errCount++;
                                }
                            }
                            //we are explicitly checking for valServer errors here, since we shouldn't auto clear
                            // based on other errors. We'll also check if there's no other validation errors apart from valPropertyMsg, if valPropertyMsg
                            // is the only one, then we'll clear.
                            if (errCount === 0 || errCount === 1 && angular.isArray(formCtrl.$error.valPropertyMsg) || formCtrl.$invalid && angular.isArray(formCtrl.$error.valServer)) {
                                scope.errorMsg = '';
                                formCtrl.$setValidity('valPropertyMsg', true);
                            } else if (showValidation && scope.errorMsg === '') {
                                formCtrl.$setValidity('valPropertyMsg', false);
                                scope.errorMsg = getErrorMsg();
                            }
                        }, true);
                    }
                }
                //clear the watch when the property validator is valid again
                function stopWatch() {
                    if (watcher) {
                        watcher();
                        watcher = null;
                    }
                }
                function checkValidationStatus() {
                    if (formCtrl.$invalid) {
                        //first we need to check if the valPropertyMsg validity is invalid
                        if (formCtrl.$error.valPropertyMsg && formCtrl.$error.valPropertyMsg.length > 0) {
                            //since we already have an error we'll just return since this means we've already set the 
                            // hasError and errorMsg properties which occurs below in the serverValidationManager.subscribe
                            return;
                        }    //if there are any errors in the current property form that are not valPropertyMsg
                        else if (_.without(_.keys(formCtrl.$error), 'valPropertyMsg').length > 0) {
                            hasError = true;
                            //update the validation message if we don't already have one assigned.
                            if (showValidation && scope.errorMsg === '') {
                                scope.errorMsg = getErrorMsg();
                            }
                        } else {
                            hasError = false;
                            scope.errorMsg = '';
                        }
                    } else {
                        hasError = false;
                        scope.errorMsg = '';
                    }
                }
                //if there's any remaining errors in the server validation service then we should show them.
                var showValidation = serverValidationManager.items.length > 0;
                if (!showValidation) {
                    //We can either get the form submitted status by the parent directive valFormManager (if we add a property to it)
                    //or we can just check upwards in the DOM for the css class (easier for now).
                    //The initial hidden state can't always be hidden because when we switch variants in the content editor we cannot
                    //reset the status.
                    showValidation = element.closest('.show-validation').length > 0;
                }
                //listen for form validation changes.
                //The alternative is to add a watch to formCtrl.$invalid but that would lead to many more watches then
                // subscribing to this single watch.
                valFormManager.onValidationStatusChanged(function (evt, args) {
                    checkValidationStatus();
                });
                //listen for the forms saving event
                unsubscribe.push(scope.$on('formSubmitting', function (ev, args) {
                    showValidation = true;
                    if (hasError && scope.errorMsg === '') {
                        scope.errorMsg = getErrorMsg();
                        startWatch();
                    } else if (!hasError) {
                        scope.errorMsg = '';
                        stopWatch();
                    }
                }));
                //listen for the forms saved event
                unsubscribe.push(scope.$on('formSubmitted', function (ev, args) {
                    showValidation = false;
                    scope.errorMsg = '';
                    formCtrl.$setValidity('valPropertyMsg', true);
                    stopWatch();
                }));
                //listen for server validation changes
                // NOTE: we pass in "" in order to listen for all validation changes to the content property, not for
                // validation changes to fields in the property this is because some server side validators may not
                // return the field name for which the error belongs too, just the property for which it belongs.
                // It's important to note that we need to subscribe to server validation changes here because we always must
                // indicate that a content property is invalid at the property level since developers may not actually implement
                // the correct field validation in their property editors.
                if (scope.currentProperty) {
                    //this can be null if no property was assigned
                    unsubscribe.push(serverValidationManager.subscribe(scope.currentProperty.alias, currentCulture, '', function (isValid, propertyErrors, allErrors) {
                        hasError = !isValid;
                        if (hasError) {
                            //set the error message to the server message
                            scope.errorMsg = propertyErrors[0].errorMsg;
                            //flag that the current validator is invalid
                            formCtrl.$setValidity('valPropertyMsg', false);
                            startWatch();
                        } else {
                            scope.errorMsg = '';
                            //flag that the current validator is valid
                            formCtrl.$setValidity('valPropertyMsg', true);
                            stopWatch();
                        }
                    }));
                }
                //when the scope is disposed we need to unsubscribe
                scope.$on('$destroy', function () {
                    stopWatch();
                    for (var u in unsubscribe) {
                        unsubscribe[u]();
                    }
                });
            }
        };
    }
    angular.module('umbraco.directives.validation').directive('valPropertyMsg', valPropertyMsg);
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:valPropertyValidator
* @restrict A
* @description Performs any custom property value validation checks on the client side. This allows property editors to be highly flexible when it comes to validation
                on the client side. Typically if a property editor stores a primitive value (i.e. string) then the client side validation can easily be taken care of 
                with standard angular directives such as ng-required. However since some property editors store complex data such as JSON, a given property editor
                might require custom validation. This directive can be used to validate an Umbraco property in any way that a developer would like by specifying a
                callback method to perform the validation. The result of this method must return an object in the format of 
                {isValid: true, errorKey: 'required', errorMsg: 'Something went wrong' }
                The error message returned will also be displayed for the property level validation message.
                This directive should only be used when dealing with complex models, if custom validation needs to be performed with primitive values, use the simpler 
                angular validation directives instead since this will watch the entire model. 
**/
    function valPropertyValidator(serverValidationManager) {
        return {
            scope: { valPropertyValidator: '=' },
            // The element must have ng-model attribute and be inside an umbProperty directive
            require: [
                'ngModel',
                '?^umbProperty'
            ],
            restrict: 'A',
            link: function link(scope, element, attrs, ctrls) {
                var modelCtrl = ctrls[0];
                var propCtrl = ctrls.length > 1 ? ctrls[1] : null;
                // Check whether the scope has a valPropertyValidator method 
                if (!scope.valPropertyValidator || !angular.isFunction(scope.valPropertyValidator)) {
                    throw new Error('val-property-validator directive must specify a function to call');
                }
                // Validation method
                function validate(viewValue) {
                    // Calls the validation method
                    var result = scope.valPropertyValidator();
                    if (!result.errorKey || result.isValid === undefined || !result.errorMsg) {
                        throw 'The result object from valPropertyValidator does not contain required properties: isValid, errorKey, errorMsg';
                    }
                    if (result.isValid === true) {
                        // Tell the controller that the value is valid
                        modelCtrl.$setValidity(result.errorKey, true);
                        if (propCtrl) {
                            propCtrl.setPropertyError(null);
                        }
                    } else {
                        // Tell the controller that the value is invalid
                        modelCtrl.$setValidity(result.errorKey, false);
                        if (propCtrl) {
                            propCtrl.setPropertyError(result.errorMsg);
                        }
                    }
                    // parsers are expected to return a value
                    return result.isValid ? viewValue : undefined;
                }
                ;
                // Parsers are called as soon as the value in the form input is modified
                modelCtrl.$parsers.push(validate);
                //call on init
                validate();
            }
        };
    }
    angular.module('umbraco.directives.validation').directive('valPropertyValidator', valPropertyValidator);
    'use strict';
    /**
    * @ngdoc directive
    * @name umbraco.directives.directive:valRegex
    * @restrict A
    * @description A custom directive to allow for matching a value against a regex string.
    *               NOTE: there's already an ng-pattern but this requires that a regex expression is set, not a regex string
    **/
    function valRegex() {
        return {
            require: 'ngModel',
            restrict: 'A',
            link: function link(scope, elm, attrs, ctrl) {
                var flags = '';
                var regex;
                attrs.$observe('valRegexFlags', function (newVal) {
                    if (newVal) {
                        flags = newVal;
                    }
                });
                attrs.$observe('valRegex', function (newVal) {
                    if (newVal) {
                        try {
                            var resolved = newVal;
                            if (resolved) {
                                regex = new RegExp(resolved, flags);
                            } else {
                                regex = new RegExp(attrs.valRegex, flags);
                            }
                        } catch (e) {
                            regex = new RegExp(attrs.valRegex, flags);
                        }
                    }
                });
                //An ngModel is supplied, assign a render function which is called when the model is changed
                var oldRender = ctrl.$render;
                ctrl.$render = function () {
                    patternValidator(ctrl.$viewValue);
                    //call any previously set render method
                    if (oldRender) {
                        oldRender();
                    }
                };
                var patternValidator = function patternValidator(viewValue) {
                    if (regex) {
                        //NOTE: we don't validate on empty values, use required validator for that
                        if (!viewValue || regex.test(viewValue.toString())) {
                            // it is valid
                            ctrl.$setValidity('valRegex', true);
                            //assign a message to the validator
                            ctrl.errorMsg = '';
                            return viewValue;
                        } else {
                            // it is invalid, return undefined (no model update)
                            ctrl.$setValidity('valRegex', false);
                            //assign a message to the validator
                            ctrl.errorMsg = 'Value is invalid, it does not match the correct pattern';
                            return undefined;
                        }
                    }
                };
            }
        };
    }
    angular.module('umbraco.directives.validation').directive('valRegex', valRegex);
    'use strict';
    (function () {
        'use strict';
        function valRequireComponentDirective() {
            function link(scope, el, attr, ngModel) {
                var unbindModelWatcher = scope.$watch(function () {
                    return ngModel.$modelValue;
                }, function (newValue) {
                    if (newValue === undefined || newValue === null || newValue === '') {
                        ngModel.$setValidity('valRequiredComponent', false);
                    } else {
                        ngModel.$setValidity('valRequiredComponent', true);
                    }
                });
                // clean up
                scope.$on('$destroy', function () {
                    unbindModelWatcher();
                });
            }
            var directive = {
                require: 'ngModel',
                restrict: 'A',
                link: link
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('valRequireComponent', valRequireComponentDirective);
    }());
    'use strict';
    /**
    * @ngdoc directive
    * @name umbraco.directives.directive:valServer
    * @restrict A
    * @description This directive is used to associate a content property with a server-side validation response
    *               so that the validators in angular are updated based on server-side feedback.
    **/
    function valServer(serverValidationManager) {
        return {
            require: [
                'ngModel',
                '?^^umbProperty',
                '?^^umbVariantContent'
            ],
            restrict: 'A',
            scope: {},
            link: function link(scope, element, attr, ctrls) {
                var modelCtrl = ctrls[0];
                var umbPropCtrl = ctrls.length > 1 ? ctrls[1] : null;
                if (!umbPropCtrl) {
                    //we cannot proceed, this validator will be disabled
                    return;
                }
                // optional reference to the varaint-content-controller, needed to avoid validation when the field is invariant on non-default languages.
                var umbVariantCtrl = ctrls.length > 2 ? ctrls[2] : null;
                var currentProperty = umbPropCtrl.property;
                var currentCulture = currentProperty.culture;
                if (umbVariantCtrl) {
                    //if we are inside of an umbVariantContent directive
                    var currentVariant = umbVariantCtrl.editor.content;
                    // Lets check if we have variants and we are on the default language then ...
                    if (umbVariantCtrl.content.variants.length > 1 && !currentVariant.language.isDefault && !currentCulture && !currentProperty.unlockInvariantValue) {
                        //This property is locked cause its a invariant property shown on a non-default language.
                        //Therefor do not validate this field.
                        return;
                    }
                }
                // if we have reached this part, and there is no culture, then lets fallback to invariant. To get the validation feedback for invariant language.
                currentCulture = currentCulture || 'invariant';
                var watcher = null;
                var unsubscribe = [];
                //default to 'value' if nothing is set
                var fieldName = 'value';
                if (attr.valServer) {
                    fieldName = scope.$eval(attr.valServer);
                    if (!fieldName) {
                        //eval returned nothing so just use the string
                        fieldName = attr.valServer;
                    }
                }
                //Need to watch the value model for it to change, previously we had  subscribed to 
                //modelCtrl.$viewChangeListeners but this is not good enough if you have an editor that
                // doesn't specifically have a 2 way ng binding. This is required because when we
                // have a server error we actually invalidate the form which means it cannot be 
                // resubmitted. So once a field is changed that has a server error assigned to it
                // we need to re-validate it for the server side validator so the user can resubmit
                // the form. Of course normal client-side validators will continue to execute.
                function startWatch() {
                    //if there's not already a watch
                    if (!watcher) {
                        watcher = scope.$watch(function () {
                            return modelCtrl.$modelValue;
                        }, function (newValue, oldValue) {
                            if (!newValue || angular.equals(newValue, oldValue)) {
                                return;
                            }
                            if (modelCtrl.$invalid) {
                                modelCtrl.$setValidity('valServer', true);
                                //clear the server validation entry
                                serverValidationManager.removePropertyError(currentProperty.alias, currentCulture, fieldName);
                                stopWatch();
                            }
                        }, true);
                    }
                }
                function stopWatch() {
                    if (watcher) {
                        watcher();
                        watcher = null;
                    }
                }
                //subscribe to the server validation changes
                unsubscribe.push(serverValidationManager.subscribe(currentProperty.alias, currentCulture, fieldName, function (isValid, propertyErrors, allErrors) {
                    if (!isValid) {
                        modelCtrl.$setValidity('valServer', false);
                        //assign an error msg property to the current validator
                        modelCtrl.errorMsg = propertyErrors[0].errorMsg;
                        startWatch();
                    } else {
                        modelCtrl.$setValidity('valServer', true);
                        //reset the error message
                        modelCtrl.errorMsg = '';
                        stopWatch();
                    }
                }));
                scope.$on('$destroy', function () {
                    stopWatch();
                    for (var u in unsubscribe) {
                        unsubscribe[u]();
                    }
                });
            }
        };
    }
    angular.module('umbraco.directives.validation').directive('valServer', valServer);
    'use strict';
    /**
    * @ngdoc directive
    * @name umbraco.directives.directive:valServerField
    * @restrict A
    * @description This directive is used to associate a field with a server-side validation response
    *               so that the validators in angular are updated based on server-side feedback.
    *               (For validation of user defined content properties on content/media/members, the valServer directive is used)
    **/
    function valServerField(serverValidationManager) {
        return {
            require: 'ngModel',
            restrict: 'A',
            scope: {},
            link: function link(scope, element, attr, ngModel) {
                var fieldName = null;
                var unsubscribe = [];
                attr.$observe('valServerField', function (newVal) {
                    if (newVal && fieldName === null) {
                        fieldName = newVal;
                        //subscribe to the changed event of the view model. This is required because when we
                        // have a server error we actually invalidate the form which means it cannot be 
                        // resubmitted. So once a field is changed that has a server error assigned to it
                        // we need to re-validate it for the server side validator so the user can resubmit
                        // the form. Of course normal client-side validators will continue to execute.
                        unsubscribe.push(scope.$watch(function () {
                            return ngModel.$modelValue;
                        }, function (newValue) {
                            if (ngModel.$invalid) {
                                ngModel.$setValidity('valServerField', true);
                            }
                        }));
                        //subscribe to the server validation changes
                        unsubscribe.push(serverValidationManager.subscribe(null, null, fieldName, function (isValid, fieldErrors, allErrors) {
                            if (!isValid) {
                                ngModel.$setValidity('valServerField', false);
                                //assign an error msg property to the current validator
                                ngModel.errorMsg = fieldErrors[0].errorMsg;
                            } else {
                                ngModel.$setValidity('valServerField', true);
                                //reset the error message
                                ngModel.errorMsg = '';
                            }
                        }));
                    }
                });
                scope.$on('$destroy', function () {
                    // unbind watchers
                    for (var e in unsubscribe) {
                        unsubscribe[e]();
                    }
                });
            }
        };
    }
    angular.module('umbraco.directives.validation').directive('valServerField', valServerField);
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:valSubView
* @restrict A
* @description Used to show validation warnings for a editor sub view to indicate that the section content has validation errors in its data.
* In order for this directive to work, the valFormManager directive must be placed on the containing form.
**/
    (function () {
        'use strict';
        function valSubViewDirective() {
            function controller($scope, $element) {
                //expose api
                return {
                    valStatusChanged: function valStatusChanged(args) {
                        // TODO: Verify this is correct, does $scope.model ever exist?
                        if ($scope.model) {
                            if (!args.form.$valid) {
                                var subViewContent = $element.find('.ng-invalid');
                                if (subViewContent.length > 0) {
                                    $scope.model.hasError = true;
                                    $scope.model.errorClass = args.showValidation ? 'show-validation' : null;
                                } else {
                                    $scope.model.hasError = false;
                                    $scope.model.errorClass = null;
                                }
                            } else {
                                $scope.model.hasError = false;
                                $scope.model.errorClass = null;
                            }
                        }
                    }
                };
            }
            function link(scope, el, attr, ctrl) {
                //if there are no containing form or valFormManager controllers, then we do nothing
                if (!ctrl || !angular.isArray(ctrl) || ctrl.length !== 2 || !ctrl[0] || !ctrl[1]) {
                    return;
                }
                var valFormManager = ctrl[1];
                scope.model.hasError = false;
                //listen for form validation changes
                valFormManager.onValidationStatusChanged(function (evt, args) {
                    if (!args.form.$valid) {
                        var subViewContent = el.find('.ng-invalid');
                        if (subViewContent.length > 0) {
                            scope.model.hasError = true;
                        } else {
                            scope.model.hasError = false;
                        }
                    } else {
                        scope.model.hasError = false;
                    }
                });
            }
            var directive = {
                require: [
                    '?^^form',
                    '?^^valFormManager'
                ],
                restrict: 'A',
                link: link,
                controller: controller
            };
            return directive;
        }
        angular.module('umbraco.directives').directive('valSubView', valSubViewDirective);
    }());
    'use strict';
    /**
* @ngdoc directive
* @name umbraco.directives.directive:valTab
* @restrict A
* @description Used to show validation warnings for a tab to indicate that the tab content has validations errors in its data.
* In order for this directive to work, the valFormManager directive must be placed on the containing form.
**/
    function valTab() {
        return {
            require: [
                '^^form',
                '^^valFormManager'
            ],
            restrict: 'A',
            link: function link(scope, element, attr, ctrs) {
                var valFormManager = ctrs[1];
                var tabAlias = scope.tab.alias;
                scope.tabHasError = false;
                //listen for form validation changes
                valFormManager.onValidationStatusChanged(function (evt, args) {
                    if (!args.form.$valid) {
                        var tabContent = element.closest('.umb-editor').find('[data-element=\'tab-content-' + tabAlias + '\']');
                        //check if the validation messages are contained inside of this tabs 
                        if (tabContent.find('.ng-invalid').length > 0) {
                            scope.tabHasError = true;
                        } else {
                            scope.tabHasError = false;
                        }
                    } else {
                        scope.tabHasError = false;
                    }
                });
            }
        };
    }
    angular.module('umbraco.directives.validation').directive('valTab', valTab);
    'use strict';
    angular.module('umbraco.directives.validation').directive('valTriggerChange', function ($sniffer) {
        return {
            link: function link(scope, elem, attrs) {
                elem.on('click', function () {
                    $(attrs.valTriggerChange).trigger($sniffer.hasEvent('input') ? 'input' : 'change');
                });
            },
            priority: 1
        };
    });
}());