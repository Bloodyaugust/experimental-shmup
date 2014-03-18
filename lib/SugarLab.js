/**
 * IIFE for generating the sugarLab namespace, and all of the contained members
 */
(function (sugarLab) {
    sugarLab['TO_RADIANS'] = 0.0174532925;

    /**
     * Constructor for the basic Game object. Use with the new keyword to create a new basic Game structure object.
     * @param config
     * @param {HTMLElement} config.canvas
     * @constructor
     */
    sugarLab.Game = function (config) {
        var me = this;

        var handleKeyDown = function (event) {
            var keyCode = event.keyCode;
            var alreadyCaptured = false;

            for (var i = 0; i < me.keysDown.length; i++) {
                if (me.keysDown[i] === keyCode) {
                    alreadyCaptured = true;
                }
            }

            if (!alreadyCaptured) {
                me.keysDownLength.push(0);
                me.keysDown.push(keyCode);
            }
        };

        var handleKeyUp = function (event) {
            var keyCode = event.keyCode;

            me.keysUpThisFrame.push(keyCode);

            for (var i = 0; i < me.keysDown.length; i++) {
                if (me.keysDown[i] === keyCode) {
                    me.keysDownLength.splice(i, 1);
                    me.keysDown.splice(i, 1);
                }
            }
        };

        var handleMouseMove = function (event) {
            me.mouseLocation = new sugarLab.Vec2(event.clientX - me.canvas.offsetLeft, event.clientY - me.canvas.offsetTop);
        };

        var handleMouseDown = function (event) {
            me.mouseDownThisFrame += 2;

            me.mouseButton = event.button;
        };

        var handleMouseUp = function () {
            me.mouseUpThisFrame += 2;

            me.mouseButton = 3;
        };

        me.type = 'game';
        me.canvas = config.canvas;
        me.sctx = me.canvas.getContext("2d");
        me.screenSize = new sugarLab.Vec2(me.canvas.width, me.canvas.height);
        me.screenLocation = new sugarLab.Vec2(me.canvas.offsetLeft, me.canvas.offsetTop);
        me.startTime = new Date().getTime();
        me.lastFrameTime = new Date;
        me.deltaTime = 0;
        me.framesThisSecond = 0;
        me.lastFrameAggregation = new Date;
        me.deltaBuffer = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
        me.keysDown = [];
        me.keysUpThisFrame = [];
        me.keysDownLength = [];
        me.mouseLocation = new sugarLab.Vec2(0, 0);
        me.mouseButton = 3;
        me.mouseDownThisFrame = 0;
        me.mouseUpThisFrame = 0;
        me.browserData = null;
        me.imageSrc = [];
        me.images = [];
        me.imagesLoaded = 0;
        me.scenes = {};
        me.currentScene = {update: function () {}, unload: function () {}, draw: function () {}};
        me.queuedScene = null;
        me.queuedEntities = [];

        window.addEventListener("keydown", handleKeyDown.bind(me), false);
        window.addEventListener("keyup", handleKeyUp.bind(me), false);
        me.canvas.addEventListener("mousemove", handleMouseMove.bind(me), false);
        me.canvas.addEventListener("mousedown", handleMouseDown.bind(me), false);
        me.canvas.addEventListener("mouseup", handleMouseUp.bind(me), false);

        if (window.mozRequestAnimationFrame) {
            me.browserData = {name: 'mozilla'};
        } else if (window.webkitRequestAnimationFrame) {
            me.browserData = {name: 'webkit'};
        } else {
            me.browserData = {name: 'ie'};
        }

        var audio = new Audio();
        me.browserData.oggSupport = audio.canPlayType('audio/ogg; codecs="vorbis"');
        me.browserData.mp3Support = audio.canPlayType('audio/mpeg; codecs="mp3"');
        me.browserData.wavSupport = audio.canPlayType('audio/wav; codecs="wav"');
        me.preferredSoundType = '';
        if (me.browserData.oggSupport === 'probably') {
            me.preferredSoundType = '.ogg';
        }
        if (me.browserData.mp3Support === 'probably') {
            me.preferredSoundType = '.mp3';
        }
        if (me.browserData.wavSupport === 'probably') {
            me.preferredSoundType = '.wav';
        }

        me.browserData.webAudioAPISupport = false;
        if (window.webkitAudioContext !== undefined) {
            me.browserData.webAudioAPISupport = true;
            me.audioContext = new webkitAudioContext();
        }

        /**
         * Adds a scene to the game.
         * @param {sugarLab.Scene} scene Scene to be added
         * @returns {sugarLab.Scene} Scene that was added
         */
        me.addScene = function (scene) {
            me.scenes[scene.name] = scene;
            return scene;
        };

        /**
         * Gets a scene for this Game by name.
         * @param {String} sceneName
         * @returns {sugarLab.Scene}
         */
        me.getScene = function (sceneName) {
            return me.scenes[sceneName];
        };

        /**
         * Begins to transition to newScene, and adds entities to it immediately after creation.
         * @param {string} newScene
         * @param {Array} entities
         */
        me.transitionScene = function (newScene, entities) {
            me.queuedScene = me.getScene(newScene);
            entities ? me.queuedEntities = entities : null;
            if (me.currentScene) {
                me.currentScene.unload();
            }
        };

        /**
         * Gets boolean down state of specified key
         * @param {Number} keyCode
         * @returns {boolean}
         */
        me.isKeyDown = function (keyCode) {
            for (var i = 0; i < me.keysDown.length; i++) {
                if (me.keysDown[i] === keyCode)
                    return true;
            }

            return false;
        };

        /**
         * Gets boolean down state for this frame of specified key
         * @param {Number} keyCode
         * @returns {boolean}
         */
        me.onKeyDown = function (keyCode) {
            for (var i = 0; i < me.keysDown.length; i++) {
                if (me.keysDown[i] === keyCode)
                    if (me.keysDownLength[i] === 1)
                        return true;
            }

            return false;
        };

        /**
         * Returns true if the key was un-pressed this frame
         * @param {Number} keyCode
         * @returns {boolean}
         */
        me.onKeyUp = function (keyCode) {
            for (var i = 0; i < me.keysUpThisFrame.length; i++) {
                if (me.keysUpThisFrame[i] === keyCode) {
                    return true;
                }
            }

            return false;
        };

        /**
         * Gets boolean down state for mouse key
         * @param {String} mouseButton
         * @returns {boolean}
         */
        me.isMouseDown = function (mouseButton) {
            if (me.mouseButton === 0 && mouseButton === 'left') {
                return true;
            }

            if (me.mouseButton === 1 && mouseButton === 'middle') {
                return true;
            }

            return me.mouseButton === 2 && mouseButton === 'right';
        };

        /**
         * Gets boolean down state for current frame for mouse key
         * @param {String} mouseButton
         * @returns {boolean}
         */
        me.onMouseDown = function (mouseButton) {
            if (me.mouseDownThisFrame > 0) {
                if (me.mouseButton === 0 && mouseButton === 'left') {
                    return true;
                }

                if (me.mouseButton === 1 && mouseButton === 'middle') {
                    return true;
                }

                return me.mouseButton === 2 && mouseButton === 'right';
            }

            return false;
        };

        /**
         * Gets boolean up state for current frame for mouse
         * @returns {boolean}
         */
        me.onMouseUp = function () {
            return me.mouseUpThisFrame > 0;
        };

        /**
         * Starts the Game logic loop
         */
        me.start = function () {
            me.loop();
            if (me.browserData.name === 'ie') {
                window.setInterval(me.update, 1000/60);
            }
        };

        /**
         * Takes the rendering to full screen, updates screen tracking components
         */
        me.fullscreen = function () {
            me.canvas.width = document.width;
            me.canvas.height = document.height;
            me.screenSize = new sugarLab.Vec2(me.canvas.width, me.canvas.height);
            me.screenLocation = new sugarLab.Vec2(0, 0);
        };

        /**
         * Loops the game logic
         */
        me.loop = function () {
            if (me.browserData.name === 'mozilla') {
                window.mozRequestAnimationFrame(me.update);
            }

            if (me.browserData.name === 'webkit') {
                window.webkitRequestAnimationFrame(me.update);
            }
        };

        /**
         * The main update for the game. Updates all basic game logic, then updates the current Scene and handles
         * Scene transitioning.
         */
        me.update = function () {
            var now = new Date;
            me.deltaTime = (now - me.lastFrameTime) / 1000;
            me.lastFrameTime = now;

            me.deltaBuffer.shift();
            me.deltaBuffer.push(me.deltaTime);

            var avgDelta = 0;
            var dBufLength = me.deltaBuffer.length;
            for (var i = 0; i < dBufLength; i += 1) {
                avgDelta += me.deltaBuffer[i];
            }
            avgDelta = avgDelta / dBufLength;

            me.framesThisSecond++;
            if (now - me.lastFrameAggregation >= 1000) {
                me.fps = me.framesThisSecond;
                me.framesThisSecond = 0;
                me.lastFrameAggregation = now;
            }

            me.mouseDownThisFrame -= 1;
            me.mouseUpThisFrame -= 1;

            if (me.mouseDownThisFrame < 0)
                me.mouseDownThisFrame = 0;
            if (me.mouseUpThisFrame < 0)
                me.mouseUpThisFrame = 0;

            for (i = 0; i < me.keysDownLength.length; i++) {
                me.keysDownLength[i]++;
            }

            me.ConnectionHandler.parseMessages();

            me.currentScene.update();
            me.currentScene.draw(me.sctx);
            if (me.queuedScene) {
                me.currentScene = me.queuedScene;
                me.queuedScene = null;
                me.currentScene.ready(me.queuedEntities);
            }

            me.keysUpThisFrame = [];

            me.loop();
        };

        /**
         * DTOHandler controlls the registration, creation, and parsing of DataTransferObjects for this Game.
         * @singleton DTOHandler
         */
        me.DTOHandler = (function () {
            var that = {},
                dtoTypes = {};

            /**
             * Registers a DTO for later use in sending and receiving.
             * @param {String} typeName The type specific to this DTO.
             * @param {Function} callback The callback function for DTO's of this type.
             */
            that.registerDTOType = function (typeName, callback) {
                dtoTypes[typeName] = {
                    type: typeName,
                    callback: callback
                };
            };

            /**
             * Used automagically by the engine to create DTOs from messages received.
             * @param config
             * @returns {sugarLab.DTO}
             */
            that.createDTO = function (config) {
                return new sugarLab.DTO(config)
            };

            /**
             * Helper method that parses objects returned from messages.
             * @param json
             */
            that.parseDTO = function (json) {
                var dtoObject = JSON.parse(json);

                dtoTypes[dtoObject.type].callback(dtoObject);
            };

            return that;
        })();

        /**
         * ConnectionHandler handles all connections this client requires. It provides a method of creating connections,
         * receiving and parsing messages inline with game logic, and sending messages.
         * @singleton ConnectionHandler
         */
        me.ConnectionHandler = (function () {
            var that = {},
                messageQueue = [],
                connections = [];

            /**
             * Creates a connection to address.
             * @param {String} address The address to which you are connecting.
             * @returns {io.Connection} The socket.io connection object.
             */
            that.createConnection = function (address) {
                connections.push(io.connect(address));
                connections[connections.length - 1].on('data', that.receiveMessage);
                return connections[connections.length - 1];
            };

            /**
             * Handles incoming messages.
             * @param message
             */
            that.receiveMessage = function (message) {
                messageQueue.push(message);
            };

            /**
             * Parses incoming messages.
             */
            that.parseMessages = function () {
                for (var i = 0; i < messageQueue.length; i++) {
                    me.DTOHandler.parseDTO(messageQueue[i]);
                }
                messageQueue = [];
            };

            /**
             * Sends a specified message to the connection specified by index.
             * @param {Number} connectionIndex The index in ConnectionHandler's connections array.
             * @param {sugarLab.DTO} dto The DTO instance to send.
             */
            that.sendMessage = function (connectionIndex, dto) {
                connections[connectionIndex].emit('data', JSON.stringify(dto));
            };

            return that;
        })();
    };

    /**
     * A DataTransferObject for transmitting arbitrary data across a network. Handles some basic functionality like
     * timestamp.
     * @param {Object} config
     * @param {String} config.type The type string for this DTO. Used to identify for callback.
     * @param {String} config.origin They origin of this DTO.
     * @param {Function} config.handleCallback The callback function to be used after a DTO of this type has been
     * parsed and is ready to be used.
     * @returns {sugarLab.DTO}
     * @constructor
     */
    sugarLab.DTO = function (config) {
        config.type = config.type || '';
        config.timestamp = new Date;
        config.origin = config.origin || '';
        config.handlerCallback = config.callback || function () {};

        return config;
    };

    /**
     * Handles sets of games assets, such as images.
     * @param {String} filePath
     * @param {Game} game
     * @param {Function} loadCallback The callback for when the assetCollection is ready to use
     * @returns {*}
     * @constructor
     */
    sugarLab.AssetCollection = function (filePath, game, loadCallback) {
        var me = this;

        this.path = filePath;
        this.assets = {};
        this.assetLoadedCount = 0;
        this.assetCount = 0;
        this.images = [];
        this.sounds = [];

        /**
         * PRIVATE
         * Callback function for image loads.
         */
        var onImageLoad = function () {
            me.assetLoadedCount++;
        };

        /**
         * PRIVATE
         * Callback function for sound loads.
         */
        var onSoundLoad = function () {
            me.assetLoadedCount++;
        };

        /**
         * PRIVATE
         * Callback function for assetCollection file load, kicks off the asset loading process.
         */
        var assetsFileLoaded = function () {
            me.assetCount += me.assets.images.length;
            me.assetCount += me.assets.sounds.length;
            for (var i = 0; i < me.assets.images.length; i++) {
                me.images.push(new Image());
                me.images[me.images.length - 1].onload = onImageLoad;
                me.images[me.images.length - 1].src = 'res/' + me.assets.images[i];
            }
            for (i = 0; i < me.assets.sounds.length; i++) {
                me.sounds.push(new Audio());
                me.sounds[me.sounds.length - 1].addEventListener('loadeddata', onSoundLoad);
                me.sounds[me.sounds.length - 1].src = 'res/' + me.assets.sounds[i] + game.preferredSoundType;
            }
        };

        /**
         * Loads assets from a JSON-structured asset file.
         * @returns {AssetCollection}
         */
        this.load = function () {
            var me = this,
                xhr = new XMLHttpRequest();

            me.images = [];
            xhr.onload = function () {
                me.assets = JSON.parse(this.responseText);
                assetsFileLoaded();
                loadCallback();
            };
            xhr.open('get', me.path, true);
            xhr.send();

            return me;
        };

        /**
         * Gets the percentage of assets loaded out of total assets.
         * @returns {number}
         */
        this.getLoadedPercentage = function () {
            if (me.assetCount !== 0) {
                return (me.assetLoadedCount / me.assetCount) * 100;
            } else {
                return 100;
            }
        };

        /**
         * Queries the images array using the query param, returns first valid hit.
         * @param query
         * @returns {Image} Image
         */
        this.getImage = function (query) {
            for (var i = 0; i < me.images.length; i++) {
                if (me.images[i].src.indexOf(query) !== -1) {
                    return me.images[i];
                }
            }
            return null;
        };

        /**
         * Queries the sounds array using the query param, returns first valid hit.
         * @param query
         * @returns {Audio} Audio
         */
        this.getSound = function (query) {
            for (var i = 0; i < me.sounds.length; i++) {
                if (me.sounds[i].src.indexOf(query) !== -1) {
                    return me.sounds[i];
                }
            }
            return null;
        };

        return this.load();
    };

    /**
     * A 2D Vector, useful for 2D maths, drawing, etc.
     * @param {Number} x X component of the vector
     * @param {Number} y Y component of the vector
     * @constructor
     */
    sugarLab.Vec2 = function (x, y) {
        var me = this;

        me.x = x;
        me.y = y;
        me.type = 'vec2';

        /**
         * Randomizes the x and y components from range 0 to their current state
         * @returns {sugarLab.Vec2}
         */
        me.randomize = function () {
            me.x = Math.floor(Math.random() * me.x);
            me.y = Math.floor(Math.random() * me.y);
            return me;
        };

        /**
         * Randomizes the x component from range 0 to its current state
         * @returns {sugarLab.Vec2}
         */
        me.randomizeX = function () {
            me.x = Math.floor((Math.random() * me.x) + Math.random() * me.x);
            return me;
        };

        /**
         * Randomizes the y component from range 0 to its current state
         * @returns {sugarLab.Vec2}
         */
        me.randomizeY = function () {
            me.y = Math.floor((Math.random() * me.y) + Math.random() * me.y);
            return me;
        };

        /**
         * Enacts a 2D translation on the vector
         * @param {sugarLab.Vec2} translateBy
         * @returns {sugarLab.Vec2}
         */
        me.translate = function (translateBy) {
            me.x += translateBy.x;
            me.y += translateBy.y;
            return me;
        };

        /**
         * Enacts a negative translation on the vector
         * @param {sugarLab.Vec2} translateBy
         * @returns {sugarLab.Vec2}
         */
        me.subtract = function (translateBy) {
            me.x -= translateBy.x;
            me.y -= translateBy.y;
            return me;
        };

        /**
         * Enacts a negative translation on a new Vec2
         * @param {sugarLab.Vec2} translateBy
         * @returns {sugarLab.Vec2}
         */
        me.getSubtracted = function (translateBy) {
            var newX = me.x - translateBy.x;
            var newY = me.y - translateBy.y;

            return new sugarLab.Vec2(newX, newY);
        };

        /**
         * Performs a normalization action on the vector, bringing the magnitude to one
         * @returns {sugarLab.Vec2}
         */
        me.normalize = function () {
            var mag = me.magnitude();
            me.x /= mag;
            me.y /= mag;
            return me;
        };

        /**
         * Performs a normalization action on a copy of the vector, bringing the magnitude to one
         * @returns {sugarLab.Vec2}
         */
        me.getNormal = function () {
            var mag = me.magnitude();

            return mag !== 0 ? new sugarLab.Vec2(me.x / mag, me.y / mag) : new sugarLab.Vec2(0, 0);
        };

        /**
         * Multiplies both components of the vector by scalar
         * @param {Number} scalar
         * @returns {sugarLab.Vec2}
         */
        me.scale = function (scalar) {
            me.x *= scalar;
            me.y *= scalar;
            return me;
        };

        /**
         * Multiplies both components of a copy of the vector by scalar
         * @param {Number} scalar
         * @returns {sugarLab.Vec2}
         */
        me.getScaled = function (scalar) {
            return new sugarLab.Vec2(me.x * scalar, me.y * scalar);
        };

        /**
         * Enacts a translation of the vector along a specific rotation away from zero
         * @param {Number} translateBy
         * @param {Number} rotation In degrees
         * @returns {sugarLab.Vec2}
         */
        me.translateAlongRotation = function (translateBy, rotation) {
            var dX = translateBy * Math.cos(rotation * Math.PI / 180);
            var dY = translateBy * Math.sin(rotation * Math.PI / 180);
            me.x += dX;
            me.y += dY;
            return me;
        };

        /**
         * Rotates vector around origin, at angle away from zero
         * @param {sugarLab.Vec2} origin
         * @param {Number} angle In degrees
         * @returns {sugarLab.Vec2}
         */
        me.rotate = function (origin, angle) {
            var cos = Math.cos(angle * 0.0174532925);
            var sin = Math.sin(angle * 0.0174532925);

            var newX = me.x - origin.x;
            var newY = me.y - origin.y;

            var rotatedX = newX * cos - newY * sin;
            var rotatedY = newX * sin + newY * cos;

            var finalX = rotatedX + origin.x;
            var finalY = rotatedY + origin.y;

            me.x = finalX;
            me.y = finalY;

            return me;
        };

        /**
         * Gets a new vector rotated from the old one around origin, at angle away from zero
         * @param {sugarLab.Vec2} origin
         * @param {Number} angle In degrees
         * @returns {sugarLab.Vec2}
         */
        me.getRotated = function (origin, angle) {
            var cos = Math.cos(angle * 0.0174532925);
            var sin = Math.sin(angle * 0.0174532925);

            var newX = me.x - origin.x;
            var newY = me.y - origin.y;

            var rotatedX = newX * cos - newY * sin;
            var rotatedY = newX * sin + newY * cos;

            var finalX = rotatedX + origin.x;
            var finalY = rotatedY + origin.y;

            return new sugarLab.Vec2(finalX, finalY);
        };

        /**
         * Gets a translated copy of the vector
         * @param {sugarLab.Vec2} translateBy
         * @returns {sugarLab.Vec2}
         */
        me.getTranslated = function (translateBy) {
            var x = translateBy.x + me.x;
            var y = translateBy.y + me.y;
            return new sugarLab.Vec2(x, y);
        };

        /**
         * Gets a copy of the vector that has been translated along rotation away from zero
         * @param {Number} translateBy
         * @param {Number} rotation In degrees
         * @returns {sugarLab.Vec2}
         */
        me.getTranslatedAlongRotation = function (translateBy, rotation) {
            var dX = translateBy * Math.cos(rotation * Math.PI / 180);
            var dY = translateBy * Math.sin(rotation * Math.PI / 180);
            var x = dX + me.x;
            var y = dY + me.y;
            return new sugarLab.Vec2(x, y);
        };

        /**
         * Gets the direction vector between two points
         * @param v2
         * @returns {Vec2}
         */
        me.getDirectionVector = function (v2) {
            return new sugarLab.Vec2(v2.x - me.x, v2.y - me.y).normalize();
        };

        /**
         * Gets the distance between the vector and another vector
         * @param {sugarLab.Vec2} p2
         * @returns {number}
         */
        me.distance = function (p2) {
            return Math.sqrt(((p2.x - me.x) * (p2.x - me.x)) + ((p2.y - me.y) * (p2.y - me.y)));
        };

        /**
         * Determines equality between the vector and another vector
         * @param {sugarLab.Vec2} p2
         * @returns {boolean}
         */
        me.equals = function (p2) {
            return me.x === p2.x && me.y === p2.y;
        };

        /**
         * Gets the magnitude of the vector
         * @returns {number}
         */
        me.magnitude = function () {
            return Math.sqrt((me.x * me.x) + (me.y * me.y));
        };

        /**
         * Gets a clone of the vector
         * @returns {sugarLab.Vec2}
         */
        me.clone = function () {
            return new sugarLab.Vec2(me.x, me.y);
        };

        /**
         * Gets the angle between two vectors
         * @param {sugarLab.Vec2} p2
         * @returns {number}
         */
        me.angleBetween = function (p2) {
            var tempAngle = Math.atan2(me.y - p2.y, me.x - p2.x) * 180 / Math.PI;

            return sugarLab.wrapAngle(tempAngle);
        };
    };

    /**
     * Creates a Vec2 from polar coordinates
     * @param {Number} magnitude
     * @param {Number} angle In degrees
     * @returns {sugarLab.Vec2}
     */
    sugarLab.Vec2.fromPolar = function (magnitude, angle) {
        return new sugarLab.Vec2(magnitude * Math.cos(angle * sugarLab.TO_RADIANS), magnitude * Math.sin(angle * sugarLab.TO_RADIANS));
    };

    sugarLab.Line = function (p1, p2) {
        var me = this;

        me.type = 'line';
        me.p1 = p1;
        me.p2 = p2;

        me.intersects = function (L2) {
            var d = (L2.p2.y - L2.p1.y) * (me.p2.x - me.p1.x) - (L2.p2.x - L2.p1.x) * (me.p2.y - me.p1.y);

            if (d === 0)
                return false;

            var n_a = (L2.p2.x - L2.p1.x) * (me.p1.y - L2.p1.y) - (L2.p2.y - L2.p1.y) * (me.p1.x - L2.p1.x);

            var n_b = (me.p2.x - this.p1.x) * (me.p1.y - L2.p1.y) - (me.p2.y - me.p1.y) * (me.p1.x - L2.p1.x);

            var ua = n_a / d;
            var ub = n_b / d;

            if ((ua >= 0) && (ua <= 1) && (ub >= 0) && (ub <= 1)) {
                var x = me.p1.x + (ua * (me.p2.x - me.p1.x));
                var y = me.p1.y + (ua * (me.p2.y - me.p1.y));
                return new sugarLab.Vec2(x, y);
            }

            return false;
        };

        me.translate = function (translateBy) {
            me.p1.translate(translateBy);
            me.p2.translate(translateBy);
        };

        me.getTranslated = function (translateBy) {
            return new sugarLab.Line(me.p1.getTranslated(translateBy), me.p2.getTranslated(translateBy));
        };

        me.clone = function () {
            return new sugarLab.Line(me.p1.clone(), me.p2.clone());
        };

        me.draw = function (color, width, sctx) {
            sctx.save();
            sctx.lineWidth = width;
            sctx.strokeStyle = color;
            sctx.moveTo(me.p1.x + 0.5, me.p1.y + 0.5);
            sctx.lineTo(me.p2.x + 0.5, me.p2.y + 0.5);
            sctx.stroke();
            sctx.restore();
        };
    };

    /**
     * Constructor function for a new Rectangle. Takes Vec2 for both arguments, clones both. Location is top left,
     * @param location
     * @param size
     * @constructor
     */
    sugarLab.Rect = function(location, size) {
        var me = this;

        me.type = 'rect';
        me.location = location.clone();
        me.size = size.clone();
        me.color = 'black';
        me.vec2s = [
            new sugarLab.Vec2(location.x, location.y), new sugarLab.Vec2(location.x + size.x, location.y),
            new sugarLab.Vec2(location.x + size.x, location.y + size.y), new sugarLab.Vec2(location.x, location.y + size.y)
        ];
        me.lines = [
            new sugarLab.Line(me.vec2s[0], me.vec2s[1]), new sugarLab.Line(me.vec2s[1], me.vec2s[2]),
            new sugarLab.Line(me.vec2s[2], me.vec2s[3]), new sugarLab.Line(me.vec2s[3], me.vec2s[0])
        ];
        me.origin = new sugarLab.Vec2(me.location.x + me.size.x / 2, me.location.y + me.size.y / 2);
        me.localOrigin = me.size.getScaled(0.5);

        /**
         *
         * @param {Object} config
         * @param {String} config.fillColor Color to fill the rect with
         * @param {String} config.lineColor Color to draw the lines with
         * @param {Number} config.lineWidth Width to draw the lines at
         */
        me.draw = function (config) {
            var sctx = config.sctx,
                fillColor = config.fillColor || 'Black',
                lineColor = config.lineColor || 'Black',
                lineWidth = config.lineWidth || 1;

            sctx.save();
            sctx.beginPath();
            sctx.strokeStyle = lineColor;
            sctx.lineWidth = lineWidth;
            sctx.fillStyle = fillColor;
            sctx.fillRect(me.location.x, me.location.y, me.size.x, me.size.y);
            sctx.strokeRect(me.location.x, me.location.y, me.size.x, me.size.y);
            sctx.restore();
        };

        me.intersects = function (r2) {
            return !(me.location.x > r2.location.x + r2.size.x || me.location.x + me.size.x < r2.location.x ||
                me.location.y > r2.location.y + r2.size.y || me.location.y + me.size.y < r2.location.y);
        };

        me.translate = function (transform) {
            me.location.translate(transform);
            me.origin.translate(transform);
            me.vec2s = [
                new sugarLab.Vec2(me.location.x, me.location.y),
                new sugarLab.Vec2(me.location.x + me.size.x, me.location.y),
                new sugarLab.Vec2(me.location.x + me.size.x, me.location.y + me.size.y),
                new sugarLab.Vec2(me.location.x, me.location.y + me.size.y)
            ];
            me.lines = [
                new sugarLab.Line(me.vec2s[0], me.vec2s[1]), new sugarLab.Line(me.vec2s[1], me.vec2s[2]),
                new sugarLab.Line(me.vec2s[2], me.vec2s[3]), new sugarLab.Line(me.vec2s[3], me.vec2s[0])
            ];
        };

        me.setLocation = function (location) {
            me.location = location.clone();
            me.origin = new sugarLab.Vec2(me.location.x + me.size.x / 2, me.location.y + me.size.y / 2);
            me.vec2s = [
                new sugarLab.Vec2(me.location.x, me.location.y),
                new sugarLab.Vec2(me.location.x + me.size.x, me.location.y),
                new sugarLab.Vec2(me.location.x + me.size.x, me.location.y + me.size.y),
                new sugarLab.Vec2(me.location.x, me.location.y + me.size.y)
            ];
            me.lines = [
                new sugarLab.Line(me.vec2s[0], me.vec2s[1]),
                new sugarLab.Line(me.vec2s[1], me.vec2s[2]),
                new sugarLab.Line(me.vec2s[2], me.vec2s[3]),
                new sugarLab.Line(me.vec2s[3], me.vec2s[0])
            ];
        };

        me.setOrigin = function (location) {
            var translateBy = location.getTranslated(me.origin);

            me.translate(translateBy.scale(-1));
        };

        me.equals = function (r2) {
            for (var i = 0; i < me.vec2s.length; i++) {
                if (!me.vec2s[i].equals(r2.vec2s[i]))
                    return false;
            }

            return true;
        };

        me.clone = function () {
            return new sugarLab.Rect(me.location.clone(), me.size.clone());
        };
    };

    sugarLab.Polygon = function (location, origin, structure) {
        var me = this;

        me.type = 'polygon';
        me.location = location.clone();
        me.rotation = 0;
        me.origin = origin.clone();
        me.structureOrigin = origin.clone();
        me.color = "black";
        me.width = 2;
        me.structureVec2s = structure.slice();
        me.vec2s = me.structureVec2s.slice();
        me.update();

        me.update = function () {
            for (var i = 0; i < me.vec2s.length; i++) {
                var newVec2 = me.structureVec2s[i].getRotated(me.structureOrigin, me.rotation);
                newVec2.translate(me.location);
                me.vec2s[i] = newVec2.clone();
            }
            me.origin = me.structureOrigin.getTranslated(me.location);

            me.lines = [];
            for (i = 0; i < me.vec2s.length; i++) {
                if (i != me.vec2s.length - 1) {
                    me.lines.push(new sugarLab.Line(me.vec2s[i], me.vec2s[i + 1]));
                }

                else {
                    me.lines.push(new sugarLab.Line(me.vec2s[i], me.vec2s[0]));
                }
            }
        };

        me.draw = function (sctx) {
            sctx.save();
            sctx.strokeStyle = me.color;
            sctx.lineWidth = me.width;
            sctx.beginPath();
            sctx.moveTo(me.vec2s[0].x, me.vec2s[0].y);
            for (var i = 1; i < me.vec2s.length; i++) {
                sctx.lineTo(me.vec2s[i].x, me.vec2s[i].y);
            }
            sctx.closePath();
            sctx.stroke();
            sctx.restore();
        };

        me.translate = function (translateBy) {
            me.location.x += translateBy.x;
            me.location.y += translateBy.y;

            me.update();
        };

        me.translateTo = function (translateTo) {
            me.location = translateTo.clone();

            me.update();
        };

        me.rotate = function (rotateBy) {
            me.rotation += rotateBy;

            while (me.rotation > 360 || me.rotation < 0) {
                if (me.rotation > 360) {
                    me.rotation -= 360;
                }

                if (me.rotation < 0) {
                    me.rotation += 360;
                }
            }

            me.update();
        };

        me.rotateTo = function (rotateTo) {
            me.rotation = rotateTo;

            while (me.rotation > 360 || me.rotation < 0) {
                if (me.rotation > 360) {
                    me.rotation -= 360;
                }

                if (me.rotation < 0) {
                    me.rotation += 360;
                }
            }

            me.update();
        };

        me.intersects = function (poly2) {
            for (var i = 0; i < me.lines.length; i++) {
                for (i2 = 0; i2 < poly2.lines.length; i2++) {
                    var doesIntersect = me.lines[i].intersects(poly2.lines[i2]);

                    if (doesIntersect != false)
                        return doesIntersect;
                }
            }

            return false;
        };
    };

    sugarLab.Circle = function (origin, radius) {
        var me = this;

        me.type = 'circle';
        me.origin = origin.clone();
        me.radius = radius;
        me.diameter = me.radius * 2;
        me.area = Math.PI * (me.radius * me.radius);

        me.translate = function (vec2) {
            me.origin.translate(vec2);
        };

        me.translateAlongRotation = function (vec2) {
            me.origin.translateAlongRotation(vec2);
        };

        me.translateTo = function (vec2) {
            me.origin.translateTo(vec2);
        };

        me.intersects = function (circle) {
            var distance = me.origin.distance(circle.origin),
                radii = me.radius + circle.radius;

            return distance <= radii;
        };

        me.intersectsRectangle = function (rect) {
            var originDistance = new sugarLab.Vec2(Math.abs(me.origin.x - rect.origin.x),
                    Math.abs(me.origin.y - rect.origin.y)),
                cornerDistanceSquared = Math.pow((originDistance.x - rect.size.x / 2), 2) +
                    Math.pow((originDistance.y - rect.size.y / 2), 2);

            if (originDistance.x > (rect.size.x / 2 + me.radius)) {
                return false;
            }
            if (originDistance.y > (rect.size.y / 2 + me.radius)) {
                return false;
            }
            if (originDistance.x <= rect.size.x / 2) {
                return true;
            }
            if (originDistance.y <= rect.size.y / 2) {
                return true;
            }
            return (cornerDistanceSquared <= Math.pow(me.radius, 2));
        };

        me.draw = function (config) {
            var sctx = config.sctx,
                lineWidth = config.lineWidth || 1,
                fillColor = config.fillColor || 'Black',
                lineColor = config.lineColor || 'Black';

            sctx.save();
            sctx.beginPath();
            sctx.arc(me.origin.x, me.origin.y, me.radius, 0, 2 * Math.PI, false);
            sctx.strokeStyle = lineColor;
            sctx.lineWidth = lineWidth;
            sctx.fillStyle = fillColor;
            sctx.stroke();
            sctx.restore();
        };
    };

    sugarLab.Node = function (location, size) {
        var me = this;

        me.type = 'node';
        me.neighbors = [];
        me.rect = new sugarLab.Rect(location, new sugarLab.Vec2(size, size));
        me.pathable = true;

        me.heuristic = function (n2) {
            return me.rect.origin.distance(n2.rect.origin);
        };
    };

    sugarLab.NodeMap = function (gWidth, gHeight, cSize) {
        var me = this;

        me.nodes = [];
        me.tag = 'nodemap';
        me.type = 'nodemap';

        for (var y = 0; y < gHeight; y++) { //create grid
            for (var x = 0; x < gWidth; x++) {
                me.nodes.push(new sugarLab.Node(new sugarLab.Vec2(x * cSize, y * cSize), cSize));
            }
        }

        var nodes = this.nodes;
        for (var i = 0; i < nodes.length; i++) { //add four neighbor nodes in cardinal directions, check to make sure they exist first
            var curNode = nodes[i];
            if (this.getNode(curNode.rect.origin.getTranslated(new sugarLab.Vec2(0, cSize)))) //north
                curNode.neighbors.push(this.getNode(curNode.rect.origin.getTranslated(new sugarLab.Vec2(0, cSize))));
            if (this.getNode(curNode.rect.origin.getTranslated(new sugarLab.Vec2(0, -cSize)))) //south
                curNode.neighbors.push(this.getNode(curNode.rect.origin.getTranslated(new sugarLab.Vec2(0, -cSize))));
            if (this.getNode(curNode.rect.origin.getTranslated(new sugarLab.Vec2(cSize, 0)))) //east
                curNode.neighbors.push(this.getNode(curNode.rect.origin.getTranslated(new sugarLab.Vec2(cSize, 0))));
            if (this.getNode(curNode.rect.origin.getTranslated(new sugarLab.Vec2(-cSize, 0)))) //west
                curNode.neighbors.push(this.getNode(curNode.rect.origin.getTranslated(new sugarLab.Vec2(-cSize, 0))));
        }

        me.translate = function (translateBy) { //translate all nodes by amount
            var nodes = me.nodes;
            for (var i = 0; i < nodes.length; i++) {
                me.nodes[i].rect.origin.translate(translateBy);
            }
        };

        me.getNode = function (location) { //storage and helper methods for our nodes
            var locationRect = new sugarLab.Rect(location.clone(), new sugarLab.Vec2(1, 1));

            var nodes = me.nodes;
            for (var i = 0; i < nodes.length; i++) { //get rect based on 1x1 square, ie location of mouse
                if (nodes[i].rect.intersects(locationRect)) {
                    return nodes[i];
                }
            }

            return false;
        };

        me.findPath = function (start, end) {
            //Create start and destination as true nodes
            var startNode = me.getNode(start);
            startNode.parent_index = -1;
            var endNode = me.getNode(end);

            var open = []; //List of open nodes (nodes to be inspected)
            var closed = []; //List of closed nodes (nodes we've already inspected)

            for (var i = 0; i < me.nodes.length; i++) {
                if (me.nodes[i].pathable === false) {
                    closed.push(me.nodes[i]);
                }
            }

            var g = 0; //Cost from start to current node
            var h = startNode.rect.origin.distance(endNode.rect.origin); //Cost from current node to destination
            var f = g + h; //Cost from start to destination going through the current node

            //Push the start node onto the list of open nodes
            open.push(startNode);

            //Keep going while there's nodes in our open list
            while (open.length > 0) {
                //Find the best open node (lowest f value)

                //Alternately, you could simply keep the open list sorted by f value lowest to highest,
                //in which case you always use the first node
                var best_cost = open[0].f;
                var best_node = 0;

                for (i = 1; i < open.length; i++) {
                    if (open[i].f < best_cost) {
                        best_cost = open[i].f;
                        best_node = i;
                    }
                }

                //Set it as our current node
                var current_node = open[best_node];

                //Check if we've reached our destination
                if (current_node === endNode) {
                    var path = [endNode]; //Initialize the path with the destination node

                    //Go up the chain to recreate the path
                    while (current_node.parent_index !== -1) {
                        current_node = closed[current_node.parent_index];
                        path.unshift(current_node);
                    }

                    return path;
                }

                //Remove the current node from our open list
                open.splice(best_node, 1);

                //Push it onto the closed list
                closed.push(current_node);

                //Expand our current node (look in all 8 directions)
                for (i = 0; i < current_node.neighbors.length; i++) {
                    //See if the node is already in our closed list. If so, skip
                    if (closed.indexOf(current_node.neighbors[i]) !== -1)
                        continue;

                    if (open.indexOf(current_node.neighbors[i]) === -1) {
                        current_node.neighbors[i].g = current_node.g + Math.floor(Math.sqrt(Math.pow(current_node.neighbors[i].rect.origin.x - current_node.rect.origin.x, 2) + Math.pow(current_node.neighbors[i].rect.origin.y - current_node.rect.origin.y, 2)));
                        current_node.neighbors[i].h = current_node.neighbors[i].rect.origin.distance(endNode.rect.origin);
                        current_node.neighbors[i].f = current_node.neighbors[i].g + current_node.neighbors[i].h;
                        current_node.neighbors[i].parent_index = closed.length - 1;

                        open.push(current_node.neighbors[i]);
                    }
                }
            }

            return false;
        };
    };

    /**
     * Scenes are used to make modular functionality within a game. IE, a scene could tie together all objects
     * and their functionality for a main menu, or a game level.
     * @param name
     * @param entities
     * @param readyScript
     * @returns {Scene}
     * @constructor
     */
    sugarLab.Scene = function (name, entities, readyScript) {
        var me = this,

        /*
         Private functions
         */

            /**
             * Actual private function that removes references to entities through direct reference and tag array
             */
                actualUnload = function () {
                me.entities = [];
                me.tags = {};
                me.isBeingDestroyed = false;
                me.entityCount = 0;
            };

        me.type = 'scene';
        me.name = name;
        me.entities = [];
        me.ready = readyScript;
        me.tags = {};
        me.isBeingDestroyed = false;
        me.entityCount = 0;
        me.startTime = new Date;
        me.time = 0;

        for (var i = 0; i < entities.length; i++) {
            me.addEntity(entities[i]);
        }

        /**
         * Calls the draw function of every entity in the scene, passing the screen context of the game.
         * @param sctx
         */
        me.draw = function (sctx) {
            var entities = me.entities;
            for (var i = 0; i < entities.length; i++) {
                entities[i].draw(sctx);
            }
        };

        /**
         * Calls the script of this scene, then calls the update function of every entity in the scene. If the this.isBeingDestroyed flag is set to true, then the update loop is broken and actualUnload is called.
         */
        me.update = function () {
            var entities = me.entities;

            me.time = new Date - me.startTime;

            for (var i = 0; i < entities.length; i++) {
                if (me.isBeingDestroyed) {
                    actualUnload();
                    break;
                } else {
                    entities[i].update();
                }
            }
            if (me.isBeingDestroyed) {
                actualUnload();
            }
        };

        /**
         * Pushes the provided object onto the entity array, and checks for a tag. If one exists, it will either add the entity to an existing tag array or begin a new one. Returns the entity for chained calls.
         * @param entity
         * @return {*}
         */
        me.addEntity = function (entity) {
            var entities = me.entities;
            entities.push(entity);

            entity.entityID = entity.entityID ? entity.entityID : me.entityCount;
            me.entityCount++;

            var entityTag = entity.tag;
            if (entityTag !== undefined && entityTag !== null) {
                var tagArray = me.tags[entityTag];
                if (tagArray === null || tagArray === undefined) {
                    me.tags[entityTag] = [];
                    tagArray = me.tags[entityTag];
                }
                tagArray.push(entity);
            }
            !(entity.zIndex || entity.zIndex === 0) ? entity.zIndex = 0 : null;
            me.entities.sort(function (a, b) {
                if (a.zIndex === b.zIndex) {
                    return 0;
                } else if (a.zIndex > b.zIndex) {
                    return 1;
                }
                return -1;
            });
            return entity;
        };

        /**
         * Checks to see if the tag is known. Returns the tag array if true, an empty array if false.
         * @param tag
         * @return {*}
         */
        me.getEntitiesByTag = function (tag) {
            var tagArray = me.tags[tag];
            return tagArray !== undefined && tagArray !== null ? tagArray : [];
        };

        /**
         * Looks for entity by ID, returns false if one is not found
         * @param id
         * @return {Object}
         */
        me.getEntityByID = function (id) {
            var entities = me.entities,
                currentEntity = {};

            for (var i = 0; i < entities.length; i++) {
                currentEntity = entities[i];
                if (currentEntity.entityID === id) {
                    return currentEntity;
                }
            }
            return false;
        };

        /**
         * Removes the reference to the given entity from the entities array and its applicable tag, and nullifies all references in the object.
         * @param entity
         */
        me.removeEntity = function (entity) {
            var entities = me.entities;

            for (var i = 0; i < entities.length; i++) {
                if (entities[i].entityID === entity.entityID) {
                    entities.splice(i, 1);
                }
            }
            if (entity.tag) {
                var tagIndex = me.tags[entity.tag].indexOf(entity);
                me.tags[entity.tag].splice(tagIndex, 1);
            }
            for (var key in entity) {
                entity[key] = null;
            }
        };

        /**
         * Sets the isBeingDestroyed tag to true, which will eventually call actualUnload.
         */
        me.unload = function () {
            me.isBeingDestroyed = true;
        };

        return me;
    };

    sugarLab.Animation = function (config) {
        var me = this;

        me.type = 'animation';
        me.name = config.name;
        me.playTime = config.playTime;
        me.sourceImage = config.sourceImage;
        me.frameSize = config.frameSize.clone();
        me.sourceRect = config.sourceRect.clone();
        me.frameCount = config.frameCount;
        me.frames = [];
        me.frameStartTimes = [];
        me.curFrame = {};
        me.isPlaying = false;
        me.timePerFrame = 0;
        me.totalTimeRunning = 0;

        var xFrames = me.sourceRect.size.x / me.frameSize.x;
        var yFrames = me.sourceRect.size.y / me.frameSize.y;
            for (var x = 0; x < xFrames; x++) {
            for (var y = 0; y < yFrames; y++) {
                if (me.frames.length < me.frameCount) {
                    me.frames.push(new sugarLab.Rect(
                        new sugarLab.Vec2(x * me.frameSize.x, y * me.frameSize.y),
                        me.frameSize));
                }
            }
        }
        me.curFrame = me.frames[0];
        me.timePerFrame = me.playTime / me.frameCount;
        for (var i = 0; i < me.frameCount; i++) {
            me.frameStartTimes.push(i * me.timePerFrame);
        }

        me.play = function (doesOverride) {
            if (me.isPlaying) {
                if (doesOverride !== undefined && doesOverride) {
                    me.curFrame = me.frames[0];
                    me.totalTimeRunning = 0;
                }
            }
            else {
                me.curFrame = me.frames[0];
                me.totalTimeRunning = 0;
                me.isPlaying = true;
            }
        };

        me.update = function (deltaTime) {
            if (me.isPlaying) {
                me.totalTimeRunning += deltaTime;
                for (var i = 0; i < me.frameStartTimes.length; i++) {
                    if (me.totalTimeRunning >= me.frameStartTimes[i]) {
                        me.curFrame = me.frames[i];
                    }
                }
                if (me.totalTimeRunning >= me.playTime) {
                    me.isPlaying = false;
                }
            }
        };
    };

    sugarLab.Animator = function (game, animations) {
        var me = this;

        me.type = 'animator';
        me.animations = animations;
        me.game = game;
        me.currentAnimation = null;

        me.addAnimation = function (animation) {
            me.animations[animation.name] = animation;
        };

        me.playAnimation = function (animationName) {
            var playedAnimation = me.animations[animationName];

            if (me.currentAnimation) {
                if (animationName !== me.currentAnimation.name) {
                    playedAnimation.play(true);
                    me.currentAnimation = playedAnimation;
                } else if (animationName === me.currentAnimation.name && !playedAnimation.isPlaying) {
                    playedAnimation.play(true);
                    me.currentAnimation = playedAnimation;
                }
            } else {
                playedAnimation.play(true);
                me.currentAnimation = playedAnimation;
            }
        };

        me.getCurrentFrame = function () {
            if (me.currentAnimation !== undefined && me.currentAnimation !== null) {
                return me.currentAnimation.curFrame;
            }
            return null;
        };

        me.draw = function (location, angle) {
            var curAnimation = me.currentAnimation;
            if (curAnimation !== undefined && curAnimation !== null) {
                me.game.sctx.save();
                me.game.sctx.translate(location.x, location.y);
                me.game.sctx.rotate(angle * TO_RADIANS);
                me.game.sctx.drawImage(curAnimation.sourceImage, curAnimation.curFrame.location.x, curAnimation.curFrame.location.y,
                    curAnimation.frameSize, curAnimation.frameSize, -curAnimation.frameSize / 2, -curAnimation.frameSize / 2, curAnimation.frameSize, curAnimation.frameSize);
                me.game.sctx.restore();
                return true;
            }
            return false;
        };

        me.update = function () {
            me.currentAnimation.update(game.deltaTime);
        };
    };

    sugarLab.Particle = function (location, velocity, timeToLive, rotation, rotationVelocity) {
        var me = this;

        me.type = 'particle';
        me.location = location.clone();
        me.velocity = velocity.clone();
        me.ttl = timeToLive;
        me.initialTTL = timeToLive;
        me.rotation = rotation;
        me.rotationVelocity = rotationVelocity;
        me.alpha = 1;

        me.update = function (deltaTime) {
            me.location.translate(me.velocity.getScaled(deltaTime));
            me.rotation += me.rotationVelocity * deltaTime;
            me.ttl -= deltaTime;
            me.alpha = (me.ttl / me.initialTTL);
        };
    };

    sugarLab.ParticleGen = function (location, image, generationInterval, velocity, velocityVariance, timeToLive, ttlVariance, rotation, rotationVariance, rotationVelocity, rotationVelocityVariance, drag) {
        var me = this;

        me.type = 'particlegen';
        me.location = location.clone();
        me.genInterval = generationInterval;
        me.image = image;
        me.baseVelocity = velocity.clone();
        me.baseTTL = timeToLive;
        me.baseRotation = rotation;
        me.baseRotationVelocity = rotationVelocity;
        me.velocityVariance = velocityVariance.clone();
        me.ttlVariance = ttlVariance;
        me.rotationVariance = rotationVariance;
        me.rotationVelocityVariance = rotationVelocityVariance;
        me.drag = drag;
        me.particles = [];
        me.isGenerating = false;
        me.timeToParticle = 0;

        me.start = function () {
            me.isGenerating = true;
        };

        me.stop = function () {
            me.isGenerating = false;
        };

        me.update = function (deltaTime) {
            me.timeToParticle -= deltaTime;
            if (me.timeToParticle <= 0) {
                var actualVelocity = this.baseVelocity.getTranslated(
                    new sugarLab.Vec2(Math.random() * me.velocityVariance.x, Math.random() * me.velocityVariance.x));
                var actualTTL = me.baseTTL + (Math.random() * me.ttlVariance);
                var actualRotation = me.baseRotation + (Math.random() * me.rotationVariance);
                var actualRotationVelocity = me.baseRotationVelocity + (Math.random() * me.rotationVelocityVariance);
                me.particles.push(new sugarLab.Particle(me.location, actualVelocity, actualTTL, actualRotation, actualRotationVelocity));

                me.timeToParticle = me.genInterval;
            }

            var curParticle = null;
            for (var i = 0; i < me.particles.length; i++) {
                curParticle = me.particles[i];
                curParticle.update(deltaTime);
                if (curParticle.ttl <= 0) {
                    me.particles.splice(me.particles.indexOf(curParticle), 1);
                }
            }
        };

        me.draw = function (sctx) {
            var curParticle = null;
            for (var i = 0; i < me.particles.length; i++) {
                curParticle = me.particles[i];
                sugarLab.drawRotatedImage(me.image, curParticle.location, curParticle.rotation, curParticle.alpha, sctx);
            }
        };
    };

    /**
     * Entity for handling in-app text. Override the update function for dynamic changes in text.
     * @param text
     * @param location
     * @param color
     * @param font
     * @constructor
     */
    sugarLab.Label = function (text, location, color, font) {
        var me = this;

        me.type = 'label';
        me.text = text;
        me.location = location.clone();
        me.color = color;
        me.font = font;

        me.update = function () {

        };

        me.draw = function (sctx) {
            sugarLab.drawText(me.text, me.location, me.color, me.font, sctx);
        };
    };

    sugarLab.AlertMessage = function (message, location, ttl, moves, app) {
        var me = this;

        me.type = 'alertmessage';
        me.message = message;
        me.location = location.clone();
        me.ttl = ttl;
        me.initialTtl = ttl;
        me.moves = moves;

        me.update = function () {
            me.ttl -= app.deltaTime;

            if (me.ttl <= 0) {
                app.currentScene.removeEntity(me);
            }

            if (me.moves) {
                me.location.translate(new sugarLab.Vec2(0, -100 * app.deltaTime));
            }
        };

        me.draw = function (sctx) {
            sctx.save();
            sctx.globalAlpha = me.ttl / (me.initialTtl - (me.initialTtl - 0.5));
            sugarLab.drawText(me.message, me.location, 'red', '30px arial', sctx);
            sctx.restore();
        };
    };

    /**
     * Constructs an absolutely positioned modal with the supplied elements, css, location relative to the screen, size, and application reference.
     * @param {String} modalHTML
     * @param {String} cssClass
     * @param {Vec2} location
     * @param {Vec2} size
     * @param {Game} app
     * @constructor
     */
    sugarLab.DOMModal = function (modalHTML, cssClass, location, size, app) {
        var me = this,
            locationX = location.x + app.screenLocation.x,
            locationY = location.y + app.screenLocation.y,
            width = size.x,
            height = size.y;

        me.type = 'dommodal';
        me.id = 'gameModal';
        me.modal = document.createElement('div');

        me.modal.setAttribute('style', 'position: absolute; left: ' + locationX + 'px; top: ' + locationY + 'px; z-index: 1; width: ' + width + 'px; height: ' + height + 'px;');
        me.modal.setAttribute('id', me.id);
        me.modal.setAttribute('class', cssClass);
        me.modal.innerHTML = modalHTML;
        document.body.appendChild(me.modal);

        me.destroy = function () {
            document.body.removeChild(me.modal);
        };
    };

    /**
     * Camera uses a simple offset scheme to alter drawing. For instance, if drawing an object at (400, 300) with a
     * camera with offset (0, 0), the object will be drawn at canvas location (400, 300). With an offset of (400, 300),
     * the same object would draw at (800, 600).
     *
     * @param {Canvas2DContext} sctx
     * @param {Vec2} offset
     * @constructor
     */
    sugarLab.Camera = function (sctx, offset) {
        var me = this;

        me.sctx = sctx;
        me.offset = offset.clone();

        me.drawImage = function (config) {
            var sctx = me.sctx,
                offset = me.offset,
                image = config.image,
                location = config.location,
                alpha = config.alpha || 1,
                angle = config.angle || 0,
                drawOrigin = config.drawOrigin ? config.drawOrigin.clone() :
                    new sugarLab.Vec2(-image.width / 2, -image.height / 2),
                drawSource = config.drawSource ? config.drawSource.clone() :
                    new sugarLab.Rect(
                        new sugarLab.Vec2(0, 0),
                        new sugarLab.Vec2(image.width, image.height)
                    ),
                drawLocation = location.getTranslated(offset);

            sctx.save();
            sctx.globalAlpha = alpha;
            sctx.translate(drawLocation.x, drawLocation.y);
            sctx.rotate(angle * sugarLab.TO_RADIANS);
            sctx.drawImage(image, drawSource.location.x, drawSource.location.y, drawSource.size.x, drawSource.size.y,
                drawOrigin.x, drawOrigin.y, drawSource.size.x, drawSource.size.y);
            sctx.restore();
        };

        /**
         * Draws text with config options
         * @param config
         * @param {sugarLab.Vec2} config.location
         * @param {String} config.align
         * @param {String} config.font
         * @param {String} config.color
         * @param {String} config.text
         */
        me.drawText = function (config) {
            var sctx = me.sctx,
                offset = me.offset,
                location = config.location,
                drawLocation = location.getTranslated(offset),
                align = config.align || 'left',
                font = config.font || '12px Arial',
                color = config.color || 'red',
                text = config.text;

            sctx.save();
            sctx.textAlign = align;
            sctx.font = font;
            sctx.fillStyle = color;
            sctx.fillText(text, drawLocation.x, drawLocation.y);
            sctx.restore();
        };

        /**
         * Draws a circle with config options
         * @param config
         * @param {sugarLab.Vec2} config.origin
         * @param {Number} config.lineWidth
         * @param {String} config.fillColor
         * @param {String} config.lineColor
         * @param {Number} config.radius
         */
        me.drawCircle = function (config) {
            var sctx = me.sctx,
                offset = me.offset,
                lineWidth = config.lineWidth || 1,
                fillColor = config.fillColor || 'Black',
                lineColor = config.lineColor || 'Black';

            sctx.save();
            sctx.beginPath();
            sctx.arc(config.origin.x + offset.x, config.origin.y + offset.y, config.radius, 0, 2 * Math.PI, false);
            sctx.strokeStyle = lineColor;
            sctx.lineWidth = lineWidth;
            sctx.fillStyle = fillColor;
            sctx.stroke();
            sctx.restore();
        };
    };

    /**
    * A convenient object for displaying loading animations/screens between scenes
    *
    *
    */
    sugarLab.Loader = function (config) {
        var me = this;

        me.assetCollection = config.assetCollection;
        me.loadCallback = config.loadCallback;
        me.screenSize = config.screenSize.clone();
        me.textColor = config.textColor || 'red';
        me.font = config.font || '12px Arial';
        me.barColor = config.barColor || 'red';
        me.barHeight = config.barHeight || 20;
        me.padding = config.padding || 100;
        me.width = me.screenSize.x - (me.padding * 2);

        me.start = new sugarLab.Vec2(me.padding, me.screenSize.y / 2);

        me.update = function () {
            if (me.assetCollection.getLoadedPercentage() === 100) {
                me.loadCallback();
            }
        };

        me.draw = function (sctx) {
            sctx.clearRect(0, 0, me.screenSize.x, me.screenSize.y);

            sugarLab.drawText({
                sctx: sctx,
                text: me.assetCollection.getLoadedPercentage().toFixed() + '%',
                location: me.start.getTranslated(sugarLab.Tween.lerp(0, me.width, me.assetCollection.getLoadedPercentage() / 100), me.barHeight),
                color: me.textColor,
                font: me.font,
                align: 'center'
            });

            sugarLab.drawLine({
                sctx: sctx,
                start: me.start,
                end: me.start.getTranslated(sugarLab.Tween.lerp(0, me.width, me.assetCollection.getLoadedPercentage() / 100), 0),
                barColor: 'blue'
            });
        };
    };

    /**
     * Wrapper for the different tweening functions
     * @constructor
     */
    sugarLab.Tween = function () {

    };

    /**
     * Linear interpolation between two values
     *
     * @param {float} end
     * @param {float} start
     * @param {float} t From 0 to 1
     * @returns {Number}
     */
    sugarLab.Tween.lerp = function (start, end, t) {
        t = sugarLab.clamp(t, 0, 1);
        return start * (1 - t) + end * t;
    };

    /**
     * Quadratic interpolation from 0 to end
     *
     * @param end
     * @param t
     * @returns {number}
     */
    sugarLab.Tween.quadIn = function (end, t) {
        t = sugarLab.clamp(t, 0, 1);
        return end * (t * t);
    };

    /**
     * Quadratic in/out interpolation from 0 to end
     *
     * @param end
     * @param t
     * @returns {number}
     */
    sugarLab.Tween.quadInOut = function (end, t) {
        t = sugarLab.clamp(t, 0, 1);
        if ((t *= 2) < 1) return 0.5 * t * t * end;
        return (-0.5 * (--t * (t - 2) - 1)) * end;
    };

    /**
     * Quartic out interpolation from 0 to end
     *
     * @param end
     * @param t
     * @returns {number}
     */
    sugarLab.Tween.quartOut = function (end, t) {
        t = sugarLab.clamp(t, 0, 1);
        return (1 - (--t * t * t * t)) * end;
    };

    sugarLab.drawImage = function (config) {
        var sctx = config.sctx,
            location = config.location,
            image = config.image;

        sctx.save();
        sctx.translate(location.x, location.y);
        sctx.drawImage(image, -image.width / 2, -image.height / 2);
        sctx.restore();
    };

    sugarLab.drawRotatedImage = function (image, location, angle, alpha, sctx) {
        sctx.save();
        sctx.globalAlpha = alpha;
        sctx.translate(location.x, location.y);
        sctx.rotate(angle * TO_RADIANS);
        sctx.drawImage(image, -image.width / 2, -image.height / 2);
        sctx.restore();
    };

    sugarLab.randomVec2 = function (maxX, maxY) {
        return new Vec2(Math.floor(Math.random() * maxX), Math.floor(Math.random() * maxY));
    };

    sugarLab.drawText = function (config) {
            var sctx = config.sctx,
                location = config.location,
                align = config.align || 'left',
                font = config.font || '12px Arial',
                color = config.color || 'red',
                text = config.text;

            sctx.save();
            sctx.textAlign = align;
            sctx.font = font;
            sctx.fillStyle = color;
            sctx.fillText(text, location.x, location.y);
            sctx.restore();
    };

    sugarLab.drawTextCentered = function (text, location, color, font, sctx) {
        sctx.save();
        sctx.textAlign = 'center';
        sctx.font = font;
        sctx.fillStyle = color;
        sctx.fillText(text, location.x, location.y);
        sctx.restore();
    };

    sugarLab.drawLine = function (config) {
        var sctx = config.sctx,
            start = config.start,
            end = config.end,
            lineWidth = config.lineWidth || 2,
            color = config.color || 'red';

        sctx.save();
        sctx.strokeStyle = color;
        sctx.lineWidth = lineWidth;
        sctx.beginPath();
        sctx.moveTo(start.x + 0.5, start.y + 0.5);
        sctx.lineTo(end.x + 0.5, end.y + 0.5);
        sctx.stroke();
        sctx.restore();
    };

    sugarLab.getLines = function (Vec2s) {
        var lines = [];
        for (var i = 0; i < Vec2s.length; i++) {
            if (i != Vec2s.length - 1) {
                lines.push(new Line(Vec2s[i], Vec2s[i + 1]));
            }

            else {
                lines.push(new Line(Vec2s[i], Vec2s[0]));
            }
        }
        return lines;
    };

    sugarLab.getDirectionVector = function (rotation) {
        return new Vec2(Math.cos(rotation * Math.PI / 180), Math.sin(rotation * Math.PI / 180));
    };

    /**
     * Clamps a number between min and max
     *
     * @param value
     * @param min
     * @param max
     * @returns {Number}
     */
    sugarLab.clamp = function (value, min, max) {
        value = value < min ? min : value;
        value = value > max ? max : value;
        return value;
    };

    /**
     * Figures the fastest rotation direction
     *
     * @param currentRotation Rotation of object to rotate
     * @param targetRotation Target rotation
     * @returns {Number} Returns 1 or -1
     */
    sugarLab.rotateLeftRight = function (currentRotation, targetRotation) {
        return (currentRotation - targetRotation + 360) % 360 > 180 ? 1 : -1;
    };

    /**
     * Wraps an angle to be in 0 - 360 space
     *
     * @param angle Angle to wrap
     * @returns {Number}
     */
    sugarLab.wrapAngle = function (angle) {
        while (angle < 0 || angle > 360) {
            if (angle > 360) {
                angle -= 360;
            } else if (angle < 0) {
                angle += 360;
            }
        }
        return angle;
    };

    /**
     * Finds the signum of a number
     *
     * @param x
     * @returns {Number}
     */
    sugarLab.sign = function (x) {
        return typeof x === 'number' ? x ? x < 0 ? -1 : 1 : x === x ? 0 : NaN : NaN;
    };

    /**
     * Decays a positive or negative number to 0
     *
     * @param x
     * @param decayBy
     * @returns {Number}
     */
    sugarLab.decayToZero = function (x, decayBy) {
        if (x !== 0) {
            if (x > 0) {
                x = x - decayBy < 0 ? 0 : x - decayBy;
            } else {
                x = x + decayBy > 0 ? 0 : x + decayBy;
            }
        }
        return x;
    };
})(window.sugarLab = window.sugarLab || {});