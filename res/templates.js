/**
 * Created with JetBrains WebStorm.
 * User: Bloodyaugust
 * Date: 12/10/13
 * Time: 1:40 AM
 * To change this template use File | Settings | File Templates.
 */
(function () {
    templates = {
        modal: function () {
            div(
                {'class': 'modal'}
            )
        },
        menu: function () {
            div(
                {'class': 'menu'},
                div(
                    {'class': 'game-title'},
                    'Menu'
                ),
                div(
                    {'class': 'button', 'id': 'game', 'onClick': 'logPlay();'},
                    'Play'
                ),
                div(
                    {'class': 'button', 'id': 'settings'},
                    'Settings'
                ),
                div(
                    {'class': 'button', 'id': 'about'},
                    'About'
                )
            )
        },
        settings: function () {
            div(
                {'class': 'menu'},
                div(
                    {'class': 'game-title'},
                    'Settings'
                ),
                div(
                    {'class': 'button', 'id': 'sound'},
                    'Sound On',
                    h3(
                        {'class': 'sound-toggle'},
                        'TRUE'
                    )
                ),
                div(
                    {'class': 'button', 'id': 'difficulty'},
                    'Difficulty',
                    h3(
                        {'class': 'difficulty-toggle'},
                        'EASY'
                    )
                ),
                div(
                    {'class': 'button', 'id': 'menu'},
                    'Menu'
                )
            )
        },
        about: function () {
            div(
                {'class': 'about-content'},
                h1(
                    a(
                        {'href': 'http://synsugarstudio.com'},
                        'Made by Syntactic Sugar Studio for Ludum Dare 28'
                    )
                ),
                div(
                    {'class': 'menu'},
                    div(
                        {'class': 'button', 'id': 'menu'},
                        'Menu'
                    )
                )
            )
        },
        spawnTimer: function () {
            div(
                {'class': 'timer-wrapper'},
                input(
                    {'type': 'text', 'value': '10', 'class': 'dial timer'}
                )
            )
        }
    };
})();