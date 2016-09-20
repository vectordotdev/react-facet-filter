'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _immutable = require('immutable');

var _draftJs = require('draft-js');

var _FiltersDraft = require('./util/FiltersDraft');

var util = _interopRequireWildcard(_FiltersDraft);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var FiltersEditor = function (_Component) {
  (0, _inherits3.default)(FiltersEditor, _Component);

  function FiltersEditor() {
    var _ref;

    var _temp, _this, _ret;

    (0, _classCallCheck3.default)(this, FiltersEditor);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = (0, _possibleConstructorReturn3.default)(this, (_ref = FiltersEditor.__proto__ || (0, _getPrototypeOf2.default)(FiltersEditor)).call.apply(_ref, [this].concat(args))), _this), _this.handlePublishEditorStateToFilters = _this.publishEditorStateToFilters.bind(_this), _this.onChange = function (nextEditorState) {
      var isFilterEntityRemoved = void 0;
      _this.setState(function (state) {
        var editorStateResult = _this.getNextEditorState(state.editorState, nextEditorState);
        isFilterEntityRemoved = editorStateResult.isFilterEntityRemoved;
        return {
          editorState: editorStateResult.nextEditorState
        };
      }, function () {
        if (isFilterEntityRemoved) {
          _this.handlePublishEditorStateToFilters();
        }
      });
    }, _this.onRenderComponent = function (componentType, props) {
      var Component = _this.props.componentByTypeMap[componentType];
      return _react2.default.createElement(Component, props);
    }, _this.onUpdateSelectionState = function (prevEntityKey, textEntityType, text) {
      _this.setState(function (state) {
        return {
          editorState: _this.updateSelectionFromAutoComplete(state.editorState, prevEntityKey, textEntityType, text)
        };
      }, _this.handlePublishEditorStateToFilters);
    }, _temp), (0, _possibleConstructorReturn3.default)(_this, _ret);
  }

  (0, _createClass3.default)(FiltersEditor, [{
    key: 'getNextEditorState',
    value: function getNextEditorState(prevEditorState, nextEditorState) {
      var prevFirstBlock = prevEditorState.getCurrentContent().getFirstBlock();
      var nextFirstBlock = nextEditorState.getCurrentContent().getFirstBlock();
      //
      if (prevFirstBlock.getLength() >= nextFirstBlock.getLength()) {
        var isFilterEntityRemoved = util.getFilterEntitiesCount(prevFirstBlock) > util.getFilterEntitiesCount(nextFirstBlock);
        return {
          isFilterEntityRemoved: isFilterEntityRemoved,
          nextEditorState: nextEditorState
        };
      }
      var prevSelection = prevEditorState.getSelection();

      var _util$getFoundAndMatc = util.getFoundAndMatchedExpectingEntityType(prevFirstBlock, nextFirstBlock, prevSelection);

      var foundAndMatched = _util$getFoundAndMatc.foundAndMatched;
      var expectingEntityType = _util$getFoundAndMatc.expectingEntityType;

      if (foundAndMatched) {
        return {
          isFilterEntityRemoved: false,
          nextEditorState: nextEditorState
        };
      } else {
        var associateFilter = util.getAssociateFilter(prevFirstBlock, this.props.filters, prevSelection.getStartOffset());
        var nextSelection = nextEditorState.getSelection();
        //
        var nextEntityKey = _draftJs.Entity.create(expectingEntityType, 'MUTABLE', {
          filter: associateFilter,
          onRender: this.onRenderComponent,
          onUpdateSelection: this.onUpdateSelectionState
        });
        var nextContentState = _draftJs.Modifier.applyEntity(nextEditorState.getCurrentContent(), _draftJs.SelectionState.createEmpty(nextFirstBlock.getKey()).set('anchorOffset', prevSelection.getStartOffset()).set('focusOffset', nextSelection.getEndOffset()), nextEntityKey);
        return {
          isFilterEntityRemoved: false,
          nextEditorState: _draftJs.EditorState.forceSelection(_draftJs.EditorState.push(nextEditorState, nextContentState, 'apply-entity'), _draftJs.SelectionState.createEmpty(nextFirstBlock.getKey()).set('anchorOffset', nextSelection.getEndOffset()).set('focusOffset', nextSelection.getEndOffset()))
        };
      }
    }
  }, {
    key: 'updateSelectionFromAutoComplete',
    value: function updateSelectionFromAutoComplete(prevEditorState, prevEntityKey, textEntityType, text) {
      var prevContentState = prevEditorState.getCurrentContent();
      var prevFirstBlock = prevContentState.getFirstBlock();
      var rangeToReplace = void 0;
      //
      prevFirstBlock.findEntityRanges(function (character) {
        return character.getEntity() === prevEntityKey;
      }, function (start, end) {
        rangeToReplace = _draftJs.SelectionState.createEmpty(prevFirstBlock.getKey()).set('anchorOffset', start).set('focusOffset', end);
      });
      var nextEntityKey = _draftJs.Entity.create(textEntityType, 'IMMUTABLE', {
        onRender: this.onRenderComponent,
        text: text
      });
      var nextContentState = _draftJs.Modifier.replaceText(prevContentState, rangeToReplace, text, null, nextEntityKey);
      return _draftJs.EditorState.push(prevEditorState, nextContentState, 'apply-entity');
    }
  }, {
    key: 'publishEditorStateToFilters',
    value: function publishEditorStateToFilters() {
      var filters = util.getFiltersFromEditorState(this.state.editorState).toJS();
      this.props.onFiltersChange(filters);
    }
  }, {
    key: 'componentWillMount',
    value: function componentWillMount() {
      this.setState({
        editorState: util.createEditorStateFromFilters(this.props.filters, this.onRenderComponent)
      });
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      var nextFiltersFromProps = (0, _immutable.fromJS)(nextProps.filters);
      var nextFiltersFromState = util.getFiltersFromEditorState(this.state.editorState);

      var isFiltersMatch = nextFiltersFromProps.equals(nextFiltersFromState);
      if (!isFiltersMatch) {
        this.setState({
          editorState: util.createEditorStateFromFilters(nextProps.filters, this.onRenderComponent)
        });
      }
    }
  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      var editorProps = (0, _immutable.Map)(this.props).withMutations(function (map) {
        return map.delete('filters').delete('onFiltersChange').delete('componentByTypeMap').set('editorState', _this2.state.editorState).set('onChange', _this2.onChange);
      }).toObject();

      return _react2.default.createElement(_draftJs.Editor, editorProps);
    }
  }]);
  return FiltersEditor;
}(_react.Component);

FiltersEditor.propTypes = {
  filters: _react.PropTypes.arrayOf(util.filterPropTypesShape).isRequired,
  onFiltersChange: _react.PropTypes.func.isRequired,
  componentByTypeMap: util.componentByTypeMap.isRequired
};
exports.default = FiltersEditor;