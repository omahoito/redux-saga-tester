'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.resetAction = undefined;

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _reduxSaga = require('redux-saga');

var _reduxSaga2 = _interopRequireDefault(_reduxSaga);

var _redux = require('redux');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var RESET_TESTER_ACTION_TYPE = '@@RESET_TESTER';
var SET_STATE_TYPE = '@@SET_TESTER_STATE';
var UPDATE_STATE_TYPE = '@@UPDATE_TESTER_STATE';

var resetAction = exports.resetAction = { type: RESET_TESTER_ACTION_TYPE };

var SagaIntegrationTester = function () {
    function SagaIntegrationTester(_ref) {
        var _this = this;

        var _ref$initialState = _ref.initialState,
            initialState = _ref$initialState === undefined ? {} : _ref$initialState,
            reducers = _ref.reducers,
            _ref$middlewares = _ref.middlewares,
            middlewares = _ref$middlewares === undefined ? [] : _ref$middlewares,
            _ref$combineReducers = _ref.combineReducers,
            combineReducers = _ref$combineReducers === undefined ? _redux.combineReducers : _ref$combineReducers,
            _ref$ignoreReduxActio = _ref.ignoreReduxActions,
            ignoreReduxActions = _ref$ignoreReduxActio === undefined ? true : _ref$ignoreReduxActio,
            _ref$options = _ref.options,
            options = _ref$options === undefined ? {} : _ref$options;
        (0, _classCallCheck3.default)(this, SagaIntegrationTester);

        this.calledActions = [];
        this.actionLookups = {};
        this.sagaMiddleware = (0, _reduxSaga2.default)(options);

        var reducerFn = (typeof reducers === 'undefined' ? 'undefined' : (0, _typeof3.default)(reducers)) === 'object' ? combineReducers(wrapReducers(reducers)) : reducers;

        var finalReducer = function finalReducer(state, action) {
            // reset state if requested
            if (action.type === RESET_TESTER_ACTION_TYPE) return initialState;

            // supply identity reducer as default
            if (!reducerFn) {
                var stateUpdate = {};

                if ([SET_STATE_TYPE, UPDATE_STATE_TYPE].indexOf(action.type) > -1) {
                    stateUpdate = action.payload;
                }

                // TODO: update this to use `.isImmutable()` as soon as v4 is released.
                // http://facebook.github.io/immutable-js/docs/#/isImmutable
                if (initialState.toJS) {
                    return initialState.mergeDeep(stateUpdate);
                }

                return (0, _assign2.default)({}, initialState, stateUpdate);
            }

            // otherwise use the provided reducer
            return reducerFn(state, action);
        };

        // Middleware to store the actions and create promises
        var testerMiddleware = function testerMiddleware() {
            return function (next) {
                return function (action) {
                    if (ignoreReduxActions && action.type.startsWith('@@redux/') || action.type === UPDATE_STATE_TYPE) {
                        // Don't monitor redux actions
                    } else {
                        _this.calledActions.push(action);
                        var actionObj = _this._addAction(action.type);
                        actionObj.count++;
                        actionObj.callback(action);
                    }
                    return next(action);
                };
            };
        };

        var allMiddlewares = [].concat((0, _toConsumableArray3.default)(middlewares), [testerMiddleware, this.sagaMiddleware]);
        this.store = (0, _redux.createStore)(finalReducer, initialState, _redux.applyMiddleware.apply(undefined, (0, _toConsumableArray3.default)(allMiddlewares)));
    }

    (0, _createClass3.default)(SagaIntegrationTester, [{
        key: '_handleRootSagaException',
        value: function _handleRootSagaException(e) {
            var _this2 = this;

            (0, _keys2.default)(this.actionLookups).forEach(function (key) {
                return _this2.actionLookups[key].reject(e);
            });
        }
    }, {
        key: '_addAction',
        value: function _addAction(actionType) {
            var futureOnly = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            var action = this.actionLookups[actionType];

            if (!action || futureOnly) {
                action = { count: 0 };
                action.promise = new _promise2.default(function (resolve, reject) {
                    action.callback = resolve;
                    action.reject = reject;
                });
                this.actionLookups[actionType] = action;
            }

            return action;
        }
    }, {
        key: '_verifyAwaitedActionsCalled',
        value: function _verifyAwaitedActionsCalled() {
            var _this3 = this;

            (0, _keys2.default)(this.actionLookups).forEach(function (actionType) {
                var action = _this3.actionLookups[actionType];
                if (action.count === 0 && action.reject) {
                    action.reject(new Error(actionType + ' was waited for but never called'));
                }
            });
        }
    }, {
        key: 'run',
        value: function run() {
            var sagas = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }

            var task = this.start.apply(this, [sagas].concat(args));
            if (task.done != null) {
                return task.done;
            } else {
                return task.toPromise();
            }
        }
    }, {
        key: 'start',
        value: function start() {
            var _sagaMiddleware,
                _this4 = this;

            var sagas = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

            for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                args[_key2 - 1] = arguments[_key2];
            }

            var task = (_sagaMiddleware = this.sagaMiddleware).run.apply(_sagaMiddleware, [sagas].concat(args));
            var onDone = function onDone() {
                return _this4._verifyAwaitedActionsCalled();
            };
            var onCatch = function onCatch(e) {
                return _this4._handleRootSagaException(e);
            };
            if (task.done != null) {
                task.done.then(onDone);
                task.done.catch(onCatch);
            } else {
                var taskPromise = task.toPromise();
                taskPromise.then(onDone);
                taskPromise.catch(onCatch);
            }
            return task;
        }
    }, {
        key: 'reset',
        value: function reset() {
            var _this5 = this;

            var clearActionList = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            this.store.dispatch(resetAction);
            if (clearActionList) {
                // Clear existing array in case there are other references to it
                this.calledActions.length = 0;
                // Delete object keys in case there are other references to it
                (0, _keys2.default)(this.actionLookups).forEach(function (key) {
                    return delete _this5.actionLookups[key];
                });
            }
        }
    }, {
        key: 'dispatch',
        value: function dispatch(action) {
            this.store.dispatch(action);
        }
    }, {
        key: 'getState',
        value: function getState() {
            return this.store.getState();
        }
    }, {
        key: 'setState',
        value: function setState(newState) {
            deprecate('setState has been deprecated. Please use updateState.');
            this.store.dispatch({ type: SET_STATE_TYPE, payload: newState });
        }
    }, {
        key: 'updateState',
        value: function updateState(newState) {
            this.store.dispatch({ type: UPDATE_STATE_TYPE, payload: newState });
        }
    }, {
        key: 'getCalledActions',
        value: function getCalledActions() {
            return this.calledActions;
        }
    }, {
        key: 'getLatestCalledAction',
        value: function getLatestCalledAction() {
            return this.calledActions[this.calledActions.length - 1];
        }
    }, {
        key: 'getLatestCalledActions',
        value: function getLatestCalledActions() {
            var num = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

            return this.calledActions.slice(-1 * num);
        }
    }, {
        key: 'wasCalled',
        value: function wasCalled(actionType) {
            var action = this.actionLookups[actionType];

            return action ? action.count > 0 : false;
        }
    }, {
        key: 'numCalled',
        value: function numCalled(actionType) {
            var action = this.actionLookups[actionType];

            return action && action.count || 0;
        }
    }, {
        key: 'waitFor',
        value: function waitFor(actionType) {
            var futureOnly = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            return this._addAction(actionType, futureOnly).promise;
        }
    }, {
        key: 'getActionsCalled',
        value: function getActionsCalled() {
            deprecate('getActionsCalled has been deprecated. Please use getCalledActions.');
            return this.calledActions;
        }
    }, {
        key: 'getLastActionCalled',
        value: function getLastActionCalled() {
            var num = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

            deprecate('getLastActionCalled has been deprecated. Please use getLatestCalledAction or getLatestCalledActions.');
            return this.calledActions.slice(-1 * num);
        }
    }]);
    return SagaIntegrationTester;
}();

exports.default = SagaIntegrationTester;


function wrapReducers(reducerList) {
    return (0, _keys2.default)(reducerList).reduce(function (result, name) {
        result[name] = function (state, action) {
            var reducer = reducerList[name];
            var payload = action.payload,
                type = action.type;

            var newState = reducer(state, action);

            if ([SET_STATE_TYPE, UPDATE_STATE_TYPE].indexOf(type) > -1 && payload[name]) {
                newState = (0, _assign2.default)({}, state, payload[name]);
            }

            return newState;
        };
        return result;
    }, {});
}

function deprecate() {
    var txt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    console.warn('[redux-saga-tester] Warning: ' + txt);
}